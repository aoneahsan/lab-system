import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debug-firebase');
  import('./utils/test-firebase-permissions');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
