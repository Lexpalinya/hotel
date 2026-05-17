import './globals.css';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegister from '@/components/sw-register';

export const metadata: Metadata = {
  title: 'University Hotel',
  description: 'ລະບົບ Check-in / Check-out ໂຮງແຮມໃນມະຫາວິທະຍາໄລ',
  applicationName: 'University Hotel',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UniHotel',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0eee9' },
    { media: '(prefers-color-scheme: dark)',  color: '#3a2c20' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,wght@0,400;0,500;1,500&family=Noto+Sans+Lao:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
