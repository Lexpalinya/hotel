'use client';

export function WTopBar({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="w-topbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)',
      gap: 12,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 className="h-serif" style={{ fontSize: 'clamp(20px, 4vw, 28px)', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.2 }}>{title}</h1>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div className="w-topbar-actions" style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="h-card" style={{ padding: '18px 20px' }}>
      <div className="h-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div className="h-mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

import type { RoomStatus, BookingStatus } from '@/lib/types';

const ROOM_STATUS: Record<RoomStatus, { label: string; cls: string }> = {
  available:    { label: 'ວ່າງ',                cls: 'h-pill--ok' },
  reserved:     { label: 'ຖືກຈອງ',              cls: 'h-pill--info' },
  occupied:     { label: 'ມີຜູ້ພັກ',             cls: 'h-pill--dark' },
  dirty:        { label: 'ລໍຖ້າທຳຄວາມສະອາດ',  cls: 'h-pill--warn' },
  cleaning:     { label: 'ກຳລັງເຮັດ',           cls: 'h-pill--accent' },
  out_of_order: { label: 'ປິດສ້ອມ',             cls: 'h-pill--danger' },
};

export function RoomStatusPill({ status }: { status: RoomStatus }) {
  const m = ROOM_STATUS[status];
  return <span className={`h-pill ${m.cls}`}><span className="dot" />{m.label}</span>;
}

const BOOKING_STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  pending:     { label: 'ລໍຖ້າຈ່າຍ',  cls: 'h-pill--warn' },
  confirmed:   { label: 'ຈ່າຍແລ້ວ',  cls: 'h-pill--ok' },
  checked_in:  { label: 'ມາແລ້ວ',   cls: 'h-pill--accent' },
  checked_out: { label: 'ອອກແລ້ວ',  cls: 'h-pill--info' },
  cancelled:   { label: 'ຍົກເລີກ',   cls: 'h-pill--danger' },
  no_show:     { label: 'no-show',  cls: 'h-pill--danger' },
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  const m = BOOKING_STATUS[status];
  return <span className={`h-pill ${m.cls}`}><span className="dot" />{m.label}</span>;
}
