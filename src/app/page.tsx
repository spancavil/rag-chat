'use client'
import Image from 'next/image'

import f1Logo from './assets/formula1.png'
import { useChat } from '@ai-sdk/react'
import PromptSuggestion from './components/PromptSuggestion'
import LoadingBubble from './components/LoadingBubble'
import Bubble from './components/Bubble'
import { Message } from 'ai'

const Home = () => {
  const {
    append,
    input,
    handleInputChange,
    handleSubmit,
    status,
    messages,
    error,
  } = useChat({})
  const loading = !['ready', 'error'].includes(status)
  const noMessages = !messages || messages.length === 0

  console.info(status)
  console.info(error)
  console.info(loading)
  console.info(messages)

  const handlePrompt = (prompt: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: prompt,
      role: 'user',
    }
    append(msg)
  }

  return (
    <main>
      <Image src={f1Logo} width={150} alt='f1Logo' />
      <section className={noMessages ? '' : 'populated'}>
        {noMessages ? (
          <>
            <p className='starter-text'>
              {' '}
              Excelente sitio para saber lo último del tópico que elijas
            </p>{' '}
            <br />
            <PromptSuggestion onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message}></Bubble>
            ))}
            {loading && <LoadingBubble />}
            {status === 'error' && (
              <Bubble message={{ error: error.message }} />
            )}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className='question-box'
          onChange={handleInputChange}
          value={input}
          placeholder='Preguntame algo de F1'
        />
        <input type='submit' />
      </form>
    </main>
  )
}

export default Home
