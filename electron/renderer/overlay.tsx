import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CaptionOverlayApp } from './CaptionOverlayApp';
import './desktop.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaptionOverlayApp />
  </StrictMode>,
);
