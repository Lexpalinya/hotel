'use client';

import { useEffect } from 'react';

// Adds `app-body` class to <body> while a /app/* route is mounted, which
// the global stylesheet uses to swap the desktop background to a soft
// gradient (so the phone-frame container has something nice to sit on).
export default function GuestBodyClass() {
  useEffect(() => {
    document.body.classList.add('app-body');
    return () => document.body.classList.remove('app-body');
  }, []);
  return null;
}
