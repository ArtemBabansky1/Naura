import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'            // initialise i18next before rendering
import './styles/index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
