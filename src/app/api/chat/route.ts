import { GoogleGenAI } from '@google/genai'
import { DataAPIClient } from '@datastax/astra-db-ts'
import { NextResponse } from 'next/server'
import { Message, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const EMBEDDING_DIMENSION = 1536

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APP_TOKEN,
  GEMINI_API_KEY,
} = process.env

const google = createGoogleGenerativeAI({
  // custom settings
  apiKey: GEMINI_API_KEY,
})

const googleGenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const client = new DataAPIClient(ASTRA_DB_APP_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

//Es llamado cuando se realiza un POST a /api/chat (utilizado por el hook useChat)
export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const latestMessage = messages[messages.length - 1] //messages queda con el historial menos el último
    let docContext = ''

    //1. Obtención del contexto

    //Generación del embedding vector a comparar
    const { embeddings } = await googleGenAI.models.embedContent({
      model: 'gemini-embedding-exp-03-07',
      contents: latestMessage.content,
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    })
    const vector = embeddings[0].values

    try {
      const collection = db.collection(ASTRA_DB_COLLECTION)
      //Vamos a encontrar en nuestra collection los 10 primeros vectores que más se asemejen al vector de búsqueda
      const cursor = collection.find(null, {
        sort: { $vector: vector },
        limit: 10,
      })
      const docs = await cursor.toArray()
      const docsMap = docs?.map((doc) => doc.text)

      console.info({ docsMap })

      //Encontrados esos vectores se lo damos como context
      docContext = JSON.stringify(docsMap)
    } catch (error) {
      console.info('Error finding vectors...')
      console.info(error)
      docContext = ''
    }

    //2. Generación del aumento del último mensaje
    const augmentedMessages = messages
      .map((m: Message) => {
        if (m.role === 'user') {
          // Si es el último mensaje del usuario, construimos el prompt aumentado con el contexto.
          // Usamos m.id para asegurar que es el mensaje actual que envió el usuario.
          if (m.id === messages[messages.length - 1].id) {
            return {
              role: 'user',
              content: `Sos un asistente IA que sabe mucho de Formula 1.
                Usa el contexto que te envío a continuación para aumentar lo que sabes actualmente de F1.
                El contexto te proveerá los datos más recientes de wikipedia y otros sitios.
                Si el contexto no incluye información que necesitas para responder, responde simplemente basado en tu actual conocimiento
                y no menciones la fuente de información ni tampoco si el contexto está o no incluido.
                Formatea las respuestas usando markdown donde aplique y no retornes imágenes.
                --------------------
                COMIENZA CONTEXTO
                ${docContext || 'No hay contexto disponible.'}
                FIN CONTEXTO
                --------------------
                PREGUNTA: ${m.content}`, // El contenido original de la pregunta del usuario
            }
          } else {
            // Mensajes anteriores del usuario, se incluyen tal cual.
            return {
              role: 'user',
              content: m.content,
            }
          }
        } else if (m.role === 'assistant') {
          // Mapea el rol 'assistant' para el historial del modelo.
          return {
            role: 'assistant',
            content: m.content,
          }
        }
        return null // Filtrar otros roles no esperados
      })
      .filter(Boolean) as Message[] // Asegura que solo haya mensajes válidos

    //3. Realizamos un stream con la respuesta que se van obteniendo.
    //NOTA: Stream text genera respuestas que se van concatenando en el tiempo, para mejorar la fluidez del chat.
    console.info('API Route: Llamando a streamText...')
    const result = streamText({
      model: google('gemini-2.0-flash'), // Instancia el modelo de Google.
      messages: augmentedMessages, // Pasa el historial y el prompt aumentado.
    })
    console.info('API Route: streamText completado. Objeto result obtenido.')

    return result.toDataStreamResponse()
  } catch (error) {
    console.info(error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
