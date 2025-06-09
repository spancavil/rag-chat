import { GoogleGenAI } from '@google/genai'
import { DataAPIClient } from '@datastax/astra-db-ts'
import { NextResponse } from 'next/server'

const EMBEDDING_DIMENSION = 1536

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APP_TOKEN,
  GEMINI_API_KEY,
} = process.env

const googleGenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const client = new DataAPIClient(ASTRA_DB_APP_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request, res: Response) {
  try {
    const { messages } = await req.json()
    console.info({ messages })
    const latestMessage = messages.pop() //messages queda con el historial menos el último
    console.info({ latestMessage })
    let docContext = ''

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
      //Vamos a encontrar en nuestra collection los 10 primeros vectores que más se asemejan
      const cursor = collection.find(null, {
        sort: { $vector: vector },
        limit: 10,
      })
      const docs = await cursor.toArray()
      const docsMap = docs?.map((doc) => doc.text)

      console.log({ docsMap })

      //Encontrados esos vectores se lo damos como context
      docContext = JSON.stringify(docsMap)
    } catch (error) {
      console.info('Error finding vectors...')
      console.info(error)
      docContext = ''
    }

    const augmentedPrompt = {
      role: 'system',
      content: `Sos un asistente IA que sabe mucho de Formula 1. 
        Usa el contexto que te envío a continuación para aumentar lo que sabes actualmente de F1. 
        El contexto te proveerá los datos más recientes de wikipedia y otros sitios.
        Si el contexto no incluye información que necesitas para responder, responde simplemente basado en tu actual conocimiento
        y no menciones la fuente de información ni tampoco si el contexto está o no incluido.
        Formatea las respuestas usando markdown donde aplique y no retornes imágenes.
        --------------------
        COMIENZA CONTEXTO
        ${docContext}
        FIN CONTEXTO
        --------------------
        PREGUNTA: ${latestMessage}
        `,
    }

    //Creamos el chat y le damos el contexto
    const chat = googleGenAI.chats.create({
      model: 'gemini-2.0-flash',
      history: [...messages],
    })
    //Enviamos el prompt
    const response = await chat.sendMessage({
      message: augmentedPrompt.content,
    })
    console.log('Chat response:', response.text)
    return NextResponse.json(response.text, { status: 200 })
  } catch (error) {
    console.info(error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
