const Bubble = ({ message }) => {
  const { content, role, error } = message

  return <div className={`bubble ${role ? role : error}`}>{content}</div>
}

export default Bubble
