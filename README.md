## 🚀 App RAG: Búsqueda y Generación de Información Contextualizada
Bienvenido a app RAG (Retrieval Augmented Generation), una potencial herramienta diseñada para generar respuestas precisas y contextualmente relevantes a partir de información proveniente de fuentes de datos confiables. Esta aplicación combina la solidez de una base de datos vectorial con la capacidad de los modelos de lenguaje para ofrecer una experiencia de búsqueda y respuesta superior.

#### ¿Cómo funciona?
La arquitectura de la app se basa en tres pilares fundamentales que garantizan su eficacia:

1. <b>Recopilación de Datos (Scraping)</b>
La información es el corazón de cualquier sistema RAG. Nuestra aplicación inicia su ciclo de vida extrayendo datos valiosos mediante técnicas de web scraping de fuentes de nuestra elección. Esto asegura que el contenido utilizado para generar respuestas sea pertinente.

2. <b>Almacenamiento Vectorial con Astra DB (Seeding) </b>
Una vez recopilados, los datos se transforman en vector embeddings. Estos embeddings son representaciones numéricas que capturan el significado semántico de la información. Luego, se almacenan de manera eficiente en Astra DB, la base de datos vectorial líder de DataStax.
Astra DB, construida sobre Apache Cassandra, asegura que nuestra base de conocimiento sea escalable, altamente disponible y capaz de manejar grandes volúmenes de datos sin sacrificar el rendimiento.

### Generación de Respuestas Contextualizadas (RAG Core)
Cuando un usuario envía una consulta (prompt), la magia del RAG entra en acción:

- <i>Búsqueda de Similitud</i>: La consulta del usuario también se convierte en un vector. Este vector se utiliza para realizar una búsqueda de similitud vectorial en tiempo real en Astra DB.
- <i>Recuperación de Contexto</i>: Astra DB identifica y recupera los fragmentos de información almacenados que son semánticamente más cercanos a la consulta del usuario. Esto significa que obtenemos el contexto más relevante, no solo palabras clave coincidentes.
- <i>Generación Aumentada</i>: La información recuperada de Astra DB se envía como contexto adicional al modelo de lenguaje generativo (LLM). El LLM utiliza este contexto específico para formular una respuesta coherente, precisa y fundamentada, minimizando así las "alucinaciones" y mejorando la calidad general de la respuesta.

#### Beneficios Clave del RAG
- Precisión Mejorada: Las respuestas se basan en datos verificados y contextualmente relevantes.
- Reducción de Alucinaciones: Al proporcionar contexto específico, el LLM es menos propenso a generar información incorrecta o inventada.
- Actualización Dinámica: La base de conocimientos puede actualizarse y expandirse continuamente con nuevos datos.

#### ¿Para quién es esta App?
Esta aplicación es ideal para cualquiera que necesite obtener respuestas fiables y detalladas de una base de conocimiento específica, como:

Sistemas de atención al cliente (chatbots inteligentes)
Herramientas de investigación y análisis de datos
Plataformas de gestión del conocimiento interno
Aplicaciones que requieran información actualizada de la web

## Instalando el proyecto
Navega hasta el directorio raíz de tu proyecto en la terminal e instala todas las dependencias necesarias.
```bash
npm install
```

Crea un archivo .env en la raíz de tu proyecto y añade tus variables de entorno allí:
```
ASTRA_DB_NAMESPACE=namespace
ASTRA_DB_COLLECTION=collectionName
ASTRA_DB_API_ENDPOINT=dbEndpoint
ASTRA_DB_APP_TOKEN=appToken
GEMINI_API_KEY=geminiApiKey
```

Para desarrollar y probar la aplicación, puedes ejecutarla en modo desarrollo:

```bash
npm run dev
```

Una vez que el servidor esté en funcionamiento, podrás acceder a la aplicación en tu navegador desde http://localhost:3000.

Espero que esta aplicación te sea de gran utilidad para acceder a información de manera más inteligente y eficiente.