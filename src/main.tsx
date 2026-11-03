import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EDITOR_PATH, isEditorPath } from './routes'

const isEditor = isEditorPath(window.location.pathname)

// Share links used to point at the site root (https://…/#z.…): keep them opening the editor
const redirectToEditor = !isEditor && window.location.hash.length > 1
if (redirectToEditor) {
  window.location.replace(`${EDITOR_PATH}${window.location.search}${window.location.hash}`)
}

// Each page only downloads its own code: the landing never loads the editor (or Monaco)
const Page = isEditor ? lazy(() => import('./App.tsx')) : lazy(() => import('./landing/Landing.tsx'))

// The editor is a full-screen app; the landing is a normal scrolling page
document.body.classList.toggle('app-shell', isEditor)

if (!redirectToEditor) createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </ErrorBoundary>
    {/* Shared links carry the user's whole schema in the hash: never send it to analytics */}
    <Analytics beforeSend={(event) => ({ ...event, url: event.url.split('#')[0] })} />
  </StrictMode>,
)
