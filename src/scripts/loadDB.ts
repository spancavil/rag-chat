//Scrap internet for some information

import { DataAPIClient } from '@datastax/astra-db-ts'
import { PuppeteerWebBaseLoader } from 'langchain/document_loaders/web/puppeteer'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

//Métodos matemáticos que determinan cuán similares son 2 vectores entre sí
type SimilarityMetrics = 'dot_product' | 'cosine' | 'euclidean'

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APP_TOKEN,
  GEMINI_API_KEY,
} = process.env

const EMBEDDING_DIMENSION = 1536
const GOOGLE_RATE_REQUEST_PER_MINUTE = 5

console.log(GEMINI_API_KEY)

const googleGenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

//Puede ser un array de cualquier tipo de datos de interés. Con este array se hará un scraping para obtener las palabras
const f1Data = [
  'https://es.wikipedia.org/wiki/F%C3%B3rmula_1',
  'https://www.statsf1.com/es/pilotes.aspx',
  'https://www.espn.com.ar/deporte-motor/f1/posiciones',
]

const client = new DataAPIClient(ASTRA_DB_APP_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

//El splitter genera chunks de por ejemplo párrafos, que luego son los que se traducirán en embedding vectors.
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
})

//Tenemos que hacer una funcion de espera porque somos pobres y google acepta 10 request per minute, es decir 6 por segundo
const wait = async (delayMS) => {
  return new Promise((res) => setTimeout(res, delayMS))
}

//Crea una collection de vectores en AstraDB, espeficando las dimensiones y las métricas de comparación del vector.
const createCollection = async (
  similarityMetric: SimilarityMetrics = 'dot_product'
) => {
  //Por default chequea que exista primero. Si existe
  try {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: EMBEDDING_DIMENSION,
        metric: similarityMetric,
      },
    })
    console.info(res)
  } catch (error) {
    console.info(error)
    return
  }
}

//El método para realizar el scrapping de una página
const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: 'new',
    },
    gotoOptions: {
      waitUntil: 'domcontentloaded',
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML)
      await browser.close()
      return result
    },
  })
  //Remplaza todas las etiquetas HTML por nada, dejando sólo el contenido
  return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

//Funcion principal que a partir del scrapping, realiza los chunks, los traduce en embedding vector y los inserta en la db.
const loadSampleData = async () => {
  const collection = db.collection(ASTRA_DB_COLLECTION)
  for (const f1url of f1Data) {
    const content = await scrapePage(f1url)
    const chunks = await splitter.splitText(content)
    for (const chunk of chunks) {
      await wait((60 / (GOOGLE_RATE_REQUEST_PER_MINUTE - 2)) * 1000)
      const result = await googleGenAI.models.embedContent({
        model: 'gemini-embedding-exp-03-07',
        contents: chunk,
        config: {
          outputDimensionality: EMBEDDING_DIMENSION,
        },
      })
      const vector = result.embeddings[0].values
      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
      })

      console.info(res)
    }
  }
}

createCollection().then(async () => {
  await loadSampleData()
})
