'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    const reg = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        await registration.update();
      } catch (err) {
        console.warn('[sw] register failed', err);
      }
    };
    if (document.readyState === 'complete') reg();
    else window.addEventListener('load', reg, { once: true });
  }, []);
  return null;
}
