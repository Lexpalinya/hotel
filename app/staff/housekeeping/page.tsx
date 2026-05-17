import { createClient } from '@/lib/supabase-server';
import { WTopBar, Stat } from '@/components/staff-bits';
import Kanban from './kanban';
import NewTaskButton from './new-task-button';

export const dynamic = 'force-dynamic';

export default async function HousekeepingPage() {
  const supabase = createClient();
  const [{ data: tasks }, { data: rooms }, { data: staff }] = await Promise.all([
    supabase.from('tasks').select('*, rooms(number, type), assignee:assigned_to(full_name)').order('created_at', { ascending: false }),
    supabase.from('rooms').select('id, number, type').order('number'),
    supabase.from('users').select('id, full_name').in('role', ['staff', 'admin']),
  ]);

  const open = (tasks ?? []).filter((t) => t.status === 'open').length;
  const inProgress = (tasks ?? []).filter((t) => t.status === 'in_progress').length;
  const done = (tasks ?? []).filter((t) => t.status === 'done').length;

  return (
    <>
      <WTopBar
        title="ແມ່ບ້ານ"
        sub={`${(tasks ?? []).filter((t) => t.status !== 'done').length} ງານທີ່ຍັງຄ້າງ · ${tasks?.length ?? 0} ທັງໝົດ`}
        actions={<NewTaskButton rooms={rooms ?? []} staff={staff ?? []} />}
      />
      <div style={{ padding: 'clamp(14px, 3vw, 28px)', display: 'grid', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <Stat label="ງານທັງໝົດ" value={tasks?.length ?? 0} hint="ມື້ນີ້" />
          <Stat label="ຍັງບໍ່ເລີ່ມ" value={open} hint="ລໍຖ້າມອບໝາຍ" />
          <Stat label="ກຳລັງເຮັດ" value={inProgress} hint="in progress" />
          <Stat label="ສຳເລັດ" value={done} hint="ປິດງານແລ້ວ" />
        </div>
        <Kanban tasks={tasks ?? []} />
      </div>
    </>
  );
}
