import PromptSuggestionButton from './PromptSuggestionButton'

const PromptSuggestion = ({ onPromptClick }) => {
  const examplePrompts = [
    'Quién es el conductor de f1 mejor pago?',
    'Quién será el nuevo conductor de Ferrari?',
    'Quién es el campeón de Fórmula 1 actual?',
  ]
  return (
    <div className='prompt-suggestion'>
      {examplePrompts.map((exPrompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={exPrompt}
          onClick={() => onPromptClick(exPrompt)}
        />
      ))}
    </div>
  )
}

export default PromptSuggestion
