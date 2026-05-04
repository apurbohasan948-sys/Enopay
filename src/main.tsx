import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to catch "white screen" crashes
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #0f1115; color: #ff4444; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; text-align: center; flex-direction: column;">
        <h2 style="margin-bottom: 10px;">Application Error</h2>
        <p style="color: #666; font-size: 14px; max-width: 400px;">${message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; background: #ec4899; color: white; border: none; padding: 10px 20px; rounded: 8px; cursor: pointer; font-weight: bold;">Reload Page</button>
      </div>
    `;
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
