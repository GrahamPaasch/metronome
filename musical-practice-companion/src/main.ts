/**
 * Musical Practice Companion - Main Entry Point
 */

import './styles/main.css';
import { PracticeCompanionUI } from './components/PracticeCompanionUI';

// Initialize the application
async function initApp() {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    throw new Error('App container not found');
  }

  try {
    // Create and initialize the UI
    const ui = new PracticeCompanionUI(appContainer);
    await ui.init();

    console.log('Musical Practice Companion initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    appContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #dc2626;">
        <h1>Error</h1>
        <p>Failed to initialize the Musical Practice Companion.</p>
        <p>Please ensure your browser supports Web Audio API and try refreshing the page.</p>
        <details style="margin-top: 1rem; text-align: left;">
          <summary>Error Details</summary>
          <pre style="background: #f3f4f6; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">${error}</pre>
        </details>
      </div>
    `;
  }
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
