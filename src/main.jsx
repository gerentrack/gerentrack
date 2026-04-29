import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'

Sentry.init({
  dsn: "https://041bc5213e8dcb94e879d5907ce1c3b0@o4511300658003968.ingest.us.sentry.io/4511300663902208",
  environment: import.meta.env.MODE, // "development" ou "production"
  enabled: import.meta.env.PROD,     // só envia erros em produção
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
