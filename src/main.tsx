import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import NexusApp from './NexusApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NexusApp />
  </StrictMode>,
)
