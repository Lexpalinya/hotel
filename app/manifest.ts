import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ໂຮງແຮມສຸນັນທາ — Sunantha Hotel',
    short_name: 'Sunantha',
    description: 'ລະບົບ Check-in / Check-out ໂຮງແຮມສຸນັນທາ',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f0eee9',
    theme_color: '#c96442',
    lang: 'lo',
    categories: ['business', 'productivity', 'travel'],
    icons: [
      { src: '/icon.svg',        type: 'image/svg+xml', sizes: 'any',     purpose: 'any' },
      { src: '/icon-192.png',    type: 'image/png',     sizes: '192x192', purpose: 'any' },
      { src: '/icon-512.png',    type: 'image/png',     sizes: '512x512', purpose: 'any' },
      { src: '/icon-mask.png',   type: 'image/png',     sizes: '512x512', purpose: 'maskable' },
      { src: '/apple-icon.png',  type: 'image/png',     sizes: '180x180' },
    ],
    shortcuts: [
      { name: 'Staff Console',  short_name: 'Staff',  url: '/staff',  description: 'จัดการโรงแรม' },
      { name: 'Guest App',      short_name: 'จองห้อง', url: '/app',    description: 'จองห้อง + เช็คอิน' },
    ],
  };
}
