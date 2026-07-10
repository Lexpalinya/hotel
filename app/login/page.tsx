'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <main className="login-page">
      <div className="h-card login-card" aria-busy="true">
        <div className="h-eyebrow">SUNANTHA HOTEL</div>
        <div className="login-skeleton login-skeleton--title" />
        <div className="login-skeleton" />
        <div className="login-skeleton" />
        <div className="login-skeleton login-skeleton--button" />
      </div>
    </main>
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
    try {
      // Remove expired Supabase cookies before creating the browser client.
      // Otherwise the client may try a stale refresh token before login.
      const reset = await fetch('/api/auth/reset', {
        method: 'POST',
        cache: 'no-store',
      });
      if (!reset.ok) throw new Error('Unable to reset the previous session.');

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ mode, email, password, fullName }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || 'Authentication failed.');

      router.replace(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="h-card login-card">
        <div className="h-eyebrow">SUNANTHA HOTEL</div>
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
              {friendlyAuthError(err)}
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

function friendlyAuthError(message: string) {
  if (message.includes('timed out') || message.includes('Failed to fetch')) {
    return 'ຕິດຕໍ່ Supabase ບໍ່ໄດ້ ກະລຸນາລອງໃໝ່';
  }
  if (message.includes('Invalid login credentials')) {
    return 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ';
  }
  if (message.includes('rate limit') || message.includes('Too many requests')) {
    return 'ລອງຫຼາຍເທື່ອເກີນໄປ ກະລຸນາລໍຖ້າແລ້ວລອງໃໝ່';
  }
  return message;
}
