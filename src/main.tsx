import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { initWebVitals } from './lib/analytics';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);

if (typeof window !== 'undefined') {
  initWebVitals();
}
