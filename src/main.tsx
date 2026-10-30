import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Shared links carry the user's whole schema in the hash: never send it to analytics */}
    <Analytics beforeSend={(event) => ({ ...event, url: event.url.split('#')[0] })} />
  </StrictMode>,
)
