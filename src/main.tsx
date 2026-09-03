import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Automatic recovery when Vercel deploys a new build while an active browser tab is open
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// Suppress external browser extension / Edge telemetry errors (e.g. reportAllChanges / reading 'startTime')
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('reportAllChanges') || e.message.includes("reading 'startTime'"))) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }
  if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
