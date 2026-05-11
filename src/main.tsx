import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register the service worker for PWA capabilities in production only.
// In Vite dev, an old worker can serve stale modules and hide current code changes.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(registrationError => {
        console.error('Service Worker registration failed:', registrationError);
      });
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      return Promise.all(registrations.map((registration) => registration.unregister()));
    })
    .then(() => {
      if ('caches' in window) {
        return caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))));
      }
      return [];
    })
    .then(() => {
      if (navigator.serviceWorker.controller && !sessionStorage.getItem('dev-sw-cleaned')) {
        sessionStorage.setItem('dev-sw-cleaned', 'true');
        window.location.reload();
      }
    })
    .catch((error) => {
      console.warn('Service Worker unregister failed:', error);
    });
}

// Global error logging for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
