import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'

Sentry.init({
  dsn: "https://041bc5213e8dcb94e879d5907ce1c3b0@o4511300658003968.ingest.us.sentry.io/4511300663902208",
  environment: import.meta.env.MODE, // "development" ou "production"
  enabled: import.meta.env.PROD,     // só envia erros em produção
  beforeSend(event) {
    // Firebase permission-denied é esperado em páginas públicas sem auth
    const msg = event.exception?.values?.[0]?.value || "";
    if (msg.includes("Missing or insufficient permissions")) return null;
    if (msg.includes("text/html") && msg.includes("MIME")) return null;
    return event;
  },
})

// Chunk antigo após deploy → reload automático (evita tela branca)
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
})

// MIME type error (Safari/iOS) — chunk retorna HTML após deploy
window.addEventListener("error", (ev) => {
  const msg = ev.message || "";
  if (msg.includes("text/html") && msg.includes("MIME")) {
    const reloaded = sessionStorage.getItem("chunk_reload");
    if (!reloaded) {
      sessionStorage.setItem("chunk_reload", "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem("chunk_reload");
    }
  }
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
