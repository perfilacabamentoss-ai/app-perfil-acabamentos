
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { dataSync } from './src/services/dataSync';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize data sync in the background
dataSync.init().catch(err => console.error('Data sync init failed:', err));

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
