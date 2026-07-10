'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_TIMEOUT_MS = 15_000;

const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  const upstreamSignal = init.signal;
  const abort = () => controller.abort();

  if (upstreamSignal?.aborted) controller.abort();
  else upstreamSignal?.addEventListener('abort', abort, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !upstreamSignal?.aborted) {
      throw new Error('Supabase request timed out. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    upstreamSignal?.removeEventListener('abort', abort);
  }
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: fetchWithTimeout } }
  );
}
