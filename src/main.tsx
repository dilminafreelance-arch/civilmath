import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './utils/analytics';
import { Analytics } from '@vercel/analytics/react';

initAnalytics();

function Root() {
  useEffect(() => {
    const splash = document.getElementById('cm-splash');
    if (splash) {
      // Allow the progress animation to complete smoothly before fading out
      const timeout = setTimeout(() => {
        splash.classList.add('hiding');
        setTimeout(() => splash.remove(), 450);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);

