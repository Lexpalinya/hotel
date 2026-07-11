import { createClient } from '@/lib/supabase-server';
import { WTopBar, RoomStatusPill } from '@/components/staff-bits';
import type { Room, Floor } from '@/lib/types';
import AddRoomButton from './add-room-button';
import RoomStatusMenu from './room-status-menu';

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  available: 'var(--ok-soft)',
  reserved: 'var(--info-soft)',
  occupied: 'var(--ink)',
  inspection: 'var(--warn-soft)',
  out_of_order: 'var(--danger-soft)',
};

export default async function RoomsPage() {
  const supabase = createClient();
  const [{ data: rooms }, { data: floors }, { data: roomTypes }] = await Promise.all([
    supabase.from('rooms').select('*').eq('active',true).order('number'),
    supabase.from('floors').select('*').order('number'),
    supabase.from('room_types').select('*').eq('active', true).order('name'),
  ]);

  const byFloor = new Map<string | null, Room[]>();
  (rooms ?? []).forEach((r: Room) => {
    const arr = byFloor.get(r.floor_id) ?? [];
    arr.push(r); byFloor.set(r.floor_id, arr);
  });

  const sortedFloors = [...(floors ?? [])].sort((a: Floor, b: Floor) => b.number - a.number);

  return (
    <>
      <WTopBar
        title="ຕາລາງຫ້ອງ"
        sub={`${rooms?.length ?? 0} ຫ້ອງ · ${floors?.length ?? 0} ຊັ້ນ`}
        actions={<AddRoomButton floors={floors ?? []} roomTypes={roomTypes ?? []} />}
      />
      <div style={{ padding: 'clamp(14px, 3vw, 28px)', display: 'grid', gap: 14 }}>
        {sortedFloors.map((f) => {
          const rs = byFloor.get(f.id) ?? [];
          return (
            <div key={f.id} className="h-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div className="h-mono" style={{
                  width: 38, height: 38, borderRadius: 8, background: 'var(--ink)', color: 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                }}>F{f.number}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {f.purposes.join(', ') || '—'} · {rs.length} ຫ້ອງ
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))', gap: 8 }}>
                {rs.map((r) => (
                  <RoomStatusMenu key={r.id} room={r} bg={STATUS_COLORS[r.status]} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
