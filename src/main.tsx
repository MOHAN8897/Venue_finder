import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { toast } from '@/components/ui/sonner'; // Import the toast system

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA Service Worker registration and update prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('[VenueFinder] Service worker registered:', registration);

      // Listen for updates
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              toast(
                'A new version of VenueFinder is available.',
                {
                  description: 'Click to update and reload.',
                  action: {
                    label: 'Update',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  },
                  variant: 'info',
                  duration: 10000
                }
              );
            }
          };
        }
      };

      // Listen for controlling service worker change (when SKIP_WAITING is called)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }).catch(error => {
      console.error('[VenueFinder] Service worker registration failed:', error);
    });
  });
}
