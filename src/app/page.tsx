'use client'
import Image from 'next/image'

import ProgmammingLogo from './assets/programmingnews.png'
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
  } = useChat()
  const loading = status !== 'ready'
  const noMessages = !messages || messages.length === 0

  console.log(status)

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
      <Image src={ProgmammingLogo} width={150} alt='programmingLogo' />
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
            {status === 'error' && <span>Error: {error.message}</span>}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className='question-box'
          onChange={handleInputChange}
          value={input}
          placeholder='Ask me something'
        />
        <input type='submit' />
      </form>
    </main>
  )
}

export default Home
