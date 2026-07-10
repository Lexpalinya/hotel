import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { publicS3Url, s3, s3Bucket } from '@/lib/s3';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CONTENT_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

async function requireStaff() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'staff' || profile?.role === 'admin' ? user : null;
}

export async function POST(request: Request) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') || 'rooms').replace(/[^a-z0-9_-]/gi, '');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 });
  }

  const extension = CONTENT_TYPES.get(file.type);
  if (!extension || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WebP, or GIF up to 5 MB.' }, { status: 400 });
  }

  const key = `${folder || 'rooms'}/${Date.now()}-${randomUUID()}.${extension}`;
  await s3.send(new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return NextResponse.json({ url: publicS3Url(key) });
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key?.startsWith('rooms/') || key.includes('..')) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: s3Bucket, Key: key }));
    if (!object.Body) throw new Error('Object body is empty.');
    return new NextResponse(Buffer.from(await object.Body.transformToByteArray()), {
      headers: {
        'Content-Type': object.ContentType || 'application/octet-stream',
        'Cache-Control': object.CacheControl || 'public, max-age=31536000, immutable',
        ...(object.ETag ? { ETag: object.ETag } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url } = await request.json() as { url?: string };
  if (!url) {
    return NextResponse.json({ ok: true });
  }

  const parsed = new URL(url, 'http://localhost');
  const key = parsed.pathname === '/api/uploads' ? parsed.searchParams.get('key') : null;
  if (!key?.startsWith('rooms/') || key.includes('..')) {
    return NextResponse.json({ error: 'Invalid object key.' }, { status: 400 });
  }

  await s3.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: key }));
  return NextResponse.json({ ok: true });
}
