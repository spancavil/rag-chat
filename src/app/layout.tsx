import './global.css'

export const metadata = {
  title: 'f1gpt',
  description: 'The place to go for all F1 questions',
}

const RootLayout = ({ children }) => {
  return (
    <html lang='es'>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout
