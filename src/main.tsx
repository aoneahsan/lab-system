import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { runStorageMigration } from './utils/storage-migration';
import { unifiedStorage } from './services/unified-storage.service';
// Initialize logger first
import './config/logger.config';
import { logger } from './services/logger.service';

// Initialize unified storage and run migration
async function initializeApp() {
  try {
    // Initialize unified storage
    await unifiedStorage.initialize();
    
    // Run storage migration
    await runStorageMigration();
  } catch (error) {
    logger.error('Failed to initialize app:', error);
  }
}

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debug-firebase');
  import('./utils/test-firebase-permissions');
}

// Initialize app before rendering
initializeApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
