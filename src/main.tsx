import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SvgSprite } from './components/SvgSprite';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SvgSprite />
    <App />
  </StrictMode>,
)
