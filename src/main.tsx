import '@fontsource/young-serif/400.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import './styles.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { LogoGallery } from './components/LogoGallery'

const queryClient = new QueryClient({
  defaultOptions: {
    // Los datos vienen de tu propia PC: se refrescan en segundo plano sin parpadeos
    queries: { staleTime: 30_000, refetchInterval: 60_000, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* #logos, solo en desarrollo: galería con los estados del logo */}
      {import.meta.env.DEV && window.location.hash === '#logos' ? <LogoGallery /> : <App />}
    </QueryClientProvider>
  </StrictMode>,
)
