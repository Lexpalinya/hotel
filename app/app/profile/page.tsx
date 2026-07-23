import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: customer }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user!.id).single(),
    supabase.from('customers').select('phone,customer_type,identity_no,address').eq('auth_user_id', user!.id).single(),
  ]);

  return (
    <div>
      <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--line-2)' }}>
        <div className="h-serif" style={{ fontSize: 22 }}>ໂປຣໄຟລ໌</div>
      </div>
      <div style={{ padding: 18 }}>
        <div className="h-card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28, background: 'var(--accent-soft)',
            color: 'var(--accent-ink)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 600,
          }}>{(profile?.full_name ?? user!.email ?? '?').charAt(0).toUpperCase()}</div>
          <div>
            <div className="h-serif" style={{ fontSize: 18 }}>{profile?.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{user!.email}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              ສະມາຊິກຕັ້ງແຕ່ {new Date(profile?.created_at ?? '').toLocaleDateString('lo-LA')}
            </div>
          </div>
        </div>

        <div className="h-card" style={{padding:22,marginTop:14,display:'grid',gap:12,fontSize:13}}>
          <ProfileRow label="ເບີໂທ" value={customer?.phone}/>
          <ProfileRow label="ປະເພດລູກຄ້າ" value={customer?.customer_type}/>
          <ProfileRow label="ເລກບັດ / PASSPORT" value={customer?.identity_no}/>
          <ProfileRow label="ທີ່ຢູ່" value={customer?.address}/>
        </div>

        <a href="/api/logout" className="h-btn" style={{ width: '100%', height: 42, marginTop: 18, display: 'flex' }}>
          ອອກຈາກລະບົບ
        </a>
      </div>
    </div>
  );
}

function ProfileRow({label,value}:{label:string;value:string|null|undefined}) {
  return <div style={{display:'grid',gridTemplateColumns:'minmax(120px,1fr) 2fr',gap:12,borderBottom:'1px solid var(--line-2)',paddingBottom:10}}><span style={{color:'var(--ink-3)'}}>{label}</span><span>{value||'—'}</span></div>;
}
