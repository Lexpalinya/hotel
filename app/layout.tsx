import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'University Hotel',
  description: 'ລະບົບ Check-in / Check-out ໂຮງແຮມໃນມະຫາວິທະຍາໄລ',
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
      <body>{children}</body>
    </html>
  );
}
