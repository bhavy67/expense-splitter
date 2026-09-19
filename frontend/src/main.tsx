import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { setStorageErrorHandler } from '@/lib/storage'
import { toast } from '@/components/common/Toast'

setStorageErrorHandler(() => toast.error('Storage full — free up space to save data'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
