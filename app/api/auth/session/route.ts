import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

type AuthBody = {
  mode?: 'login' | 'signup';
  email?: string;
  password?: string;
  fullName?: string;
};

export async function POST(request: Request) {
  let body: AuthBody;

  try {
    body = await request.json() as AuthBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';
  const mode = body.mode === 'signup' ? 'signup' : 'login';

  if (!email || !email.includes('@') || password.length < 6) {
    return NextResponse.json(
      { error: 'Email or password is invalid.' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();
    const result = mode === 'signup'
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: body.fullName?.trim() || null } },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status || 400 }
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[auth/session] Supabase request failed');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Supabase is unavailable.' },
      { status: 502 }
    );
  }
}
