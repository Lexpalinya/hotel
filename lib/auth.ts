import { createClient } from '@/lib/supabase-server';
import type { UserRole } from '@/lib/types';

export async function getRequestActor() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, active, full_name, email')
    .eq('id', user.id)
    .single();
  if (!profile?.active) return null;
  return { supabase, user, profile: profile as typeof profile & { role: UserRole } };
}

export async function requireStaff() {
  const actor = await getRequestActor();
  if (!actor || !['staff', 'admin'].includes(actor.profile.role)) return null;
  return actor;
}

export async function requireAdmin() {
  const actor = await getRequestActor();
  return actor?.profile.role === 'admin' ? actor : null;
}

