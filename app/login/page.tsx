'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/staff';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      }
      router.replace(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div className="h-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <div className="h-eyebrow">UNIVERSITY HOTEL</div>
        <h1 className="h-serif" style={{ fontSize: 28, margin: '4px 0 24px' }}>
          {mode === 'login' ? 'ເຂົ້າສູ່ລະບົບ' : 'ສ້າງບັນຊີ'}
        </h1>

        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          {mode === 'signup' && (
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>ຊື່</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          )}
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>EMAIL</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>ລະຫັດຜ່ານ</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {err && (
            <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-soft)', padding: '8px 10px', borderRadius: 6 }}>
              {err}
            </div>
          )}

          <button type="submit" className="h-btn h-btn--accent" style={{ height: 42, marginTop: 4 }} disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'ເຂົ້າສູ່ລະບົບ' : 'ສ້າງບັນຊີ'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
          {mode === 'login' ? (
            <>ບໍ່ມີບັນຊີ? <button onClick={() => setMode('signup')} style={linkBtn}>ສ້າງບັນຊີ</button></>
          ) : (
            <>ມີບັນຊີຢູ່ແລ້ວ? <button onClick={() => setMode('login')} style={linkBtn}>ເຂົ້າສູ່ລະບົບ</button></>
          )}
        </div>
      </div>
    </main>
  );
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
  font: 'inherit', padding: 0, textDecoration: 'underline',
};
