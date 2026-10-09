import { createRoot } from 'react-dom/client'
import { App } from './App'
import '@genoffice/ui/tokens.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)
