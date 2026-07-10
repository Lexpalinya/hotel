'use client';

import { useState, useRef } from 'react';

// Resize image client-side before upload — keeps storage costs low and pages
// snappy. Max edge 1600px, JPEG q=82, falls back to original if anything in
// the canvas pipeline fails (HEIC, animated GIF, etc.).
async function compress(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    bitmap.close?.();
    return blob ?? file;
  } catch { return file; }
}

export default function ImageUpload({
  value, onChange, label = 'ຮູບ', folder = 'rooms',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    setUploading(true);
    try {
      const blob = await compress(file);
      const form = new FormData();
      form.set('file', blob, file.name);
      form.set('folder', folder);
      const response = await fetch('/api/uploads', { method: 'POST', body: form });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || 'Upload failed.');
      onChange(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!value) return;
    try {
      await fetch('/api/uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
    } catch { /* ignore — orphan files are fine */ }
    onChange(null);
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>{label}</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        style={{ display: 'none' }}
      />
      {value ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block', background: 'var(--paper-2)' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="h-btn" style={{ height: 28, fontSize: 11 }}>
              {uploading ? '...' : 'ປ່ຽນ'}
            </button>
            <button type="button" onClick={remove} disabled={uploading} className="h-btn" style={{ height: 28, fontSize: 11, color: 'var(--danger)' }}>
              ລົບ
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '32px 16px', borderRadius: 10,
            border: '1px dashed var(--line)', background: 'var(--paper-2)',
            color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            textAlign: 'center',
          }}>
          {uploading ? 'ກຳລັງອັບໂຫລດ...' : '📷  ກົດເພື່ອອັບໂຫລດຮູບ'}
          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>JPG / PNG / WebP · resize ອັດຕະໂນມັດ</div>
        </button>
      )}
      {err && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</div>}
    </div>
  );
}
