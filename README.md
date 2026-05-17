# ໂຮງແຮມສຸນັນທາ — Sunantha Hotel · MVP

ระบบ check-in / check-out โรงแรม Sunantha — **MVP ใช้งานได้จริง**: รับ booking, รับ payment (mock), self check-in, staff console พร้อม dashboard และ CRUD

Stack: Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + RLS) · Vercel (deploy)

---

## ✅ Setup ครั้งแรก (10-15 นาที)

### 1. สร้าง Supabase project

1. ไปที่ <https://supabase.com> → **New project**
2. ตั้งชื่อ (เช่น `university-hotel`), เลือก region ใกล้ที่สุด (Singapore), ตั้ง password
3. รอ ~2 นาที ให้ project provision เสร็จ
4. ไป **Settings → API** copy ค่า 2 ตัว:
   - `Project URL` (เช่น `https://abcdefg.supabase.co`)
   - `anon` `public` key (เริ่มต้นด้วย `eyJ...`)

### 2. รัน schema migration

1. ใน Supabase → **SQL Editor** → **New query**
2. เปิดไฟล์ [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
3. Copy เนื้อหาทั้งหมด ไปวางใน SQL Editor → **Run**
4. รอจนเขียนว่า `Success. No rows returned` ตอนนี้คุณมี: 9 ตาราง, RLS policies, seed data (5 ชั้น + 7 ห้องตัวอย่าง + 6 รายการสินค้า)

### 3. ตั้ง environment variables (local)

```bash
cd app
cp .env.local.example .env.local
```

แก้ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. รัน local

```bash
npm install
npm run dev
```

เปิด <http://localhost:3000>

### 5. สร้างบัญชี staff คนแรก

1. ไป `/login` → สมัครใหม่ (email + password)
2. ระบบจะ **auto-promote คนแรกเป็น `admin`** (ดูที่ `app/staff/layout.tsx`)
3. ไป `/staff` เพื่อใช้ console — Dashboard, Rooms, Bookings ฯลฯ

ถ้าจะสมัครคนต่อๆ ไป (เป็น guest), เปิดอีก browser หรือ incognito แล้วสมัครอีก email — คนนั้นจะอยู่ role `guest` ใช้ `/app` ได้

---

## 🚀 Deploy ขึ้น Vercel

### 1. Push ขึ้น GitHub

```bash
cd app
git init
git add .
git commit -m "MVP v1.0"
gh repo create university-hotel --public --source=. --push
# หรือสร้าง repo ใน GitHub UI แล้ว push เอง
```

### 2. Import ที่ Vercel

1. ไป <https://vercel.com/new>
2. เลือก repo → Import
3. ในหน้า config:
   - **Framework**: Next.js (auto detect)
   - **Environment Variables**: เพิ่ม 2 ตัว
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — รอ ~2 นาที

### 3. แก้ Site URL ใน Supabase

1. Supabase → **Authentication → URL Configuration**
2. **Site URL** = `https://your-project.vercel.app`
3. **Redirect URLs** เพิ่ม `https://your-project.vercel.app/**`

เสร็จ — เปิด URL ที่ Vercel ให้ได้เลย

---

## 🗂 โครงสร้างไฟล์

```
app/
├── app/
│   ├── page.tsx                  # หน้าเลือก guest / staff
│   ├── login/                    # email + password
│   ├── staff/                    # staff console (auth required)
│   │   ├── layout.tsx            # sidebar + auth gate
│   │   ├── page.tsx              # dashboard
│   │   ├── rooms/                # ตาราง room ทั้งหมด, สถานะ
│   │   ├── bookings/             # การจองล่าสุด
│   │   ├── guests/               # บัญชีลูกค้า
│   │   ├── floors/               # โครงสร้างชั้น
│   │   └── reports/              # KPI
│   ├── app/                      # mobile (guest, auth required)
│   │   ├── layout.tsx            # bottom tab bar
│   │   ├── page.tsx              # home (active booking + rooms ว่าง)
│   │   ├── room/[id]/            # room detail + book form
│   │   ├── pay/[id]/             # PromptPay QR (mock)
│   │   ├── checkin/[id]/         # self check-in QR + simulate
│   │   ├── stay/                 # ดูค่าใช้จ่ายระหว่างเข้าพัก
│   │   ├── history/              # ประวัติการจอง
│   │   └── profile/              # โปรไฟล์ + logout
│   └── api/
│       ├── checkout/[id]/        # POST: เช็คเอาท์ + สร้าง task แม่บ้าน
│       └── logout/               # POST/GET: signOut
├── components/
│   ├── qr.tsx                    # QR-ish renderer (deterministic)
│   └── staff-bits.tsx            # WTopBar, Stat, status pills
├── lib/
│   ├── supabase-client.ts        # browser client
│   ├── supabase-server.ts        # server client (RSC + middleware)
│   ├── types.ts                  # DB types
│   └── format.ts                 # currency / date helpers
├── middleware.ts                 # protect /staff and /app routes
└── supabase/migrations/
    └── 0001_init.sql             # full schema + RLS + seed (รันใน Supabase SQL Editor)
```

---

## 🧪 ทดสอบ end-to-end (guest flow)

หลัง deploy แล้ว เปิด site ใน incognito:

1. `/login` → สมัคร email + password ใหม่ (จะเป็น guest)
2. `/app` → เห็นห้องว่าง (จาก seed data)
3. กดห้องใดห้องหนึ่ง → กรอกวันที่ → กด "ຈອງ ແລະ ໄປຈ່າຍເງິນ"
4. หน้า payment → กด "ຂ້ອຍຈ່າຍແລ້ວ — ຢືນຢັນ" (mock)
5. กลับ `/app` → เห็น booking สถานะ "Confirmed" → กด "ສະແດງ QR"
6. หน้า check-in → กด "(ຈຳລອງ) ພະນັກງານສະແກນ"
7. ไปหน้า `/app/stay` → ดูค่าใช้จ่าย → check out

ส่วน staff (เปิดอีก browser / incognito):
- `/login` → สมัคร email อื่น (คนแรกจะเป็น admin)
- `/staff` → เห็น booking ที่ลูกค้าจองมาแล้ว, สถานะห้อง ฯลฯ

---

## 🛠 ที่ยัง **ไม่** ครบ (phase 2+)

- **PromptPay จริง** — ตอนนี้ payment เป็น mock (กดยืนยันเอง) ต้องต่อกับ provider เช่น [Beam](https://www.beampayments.com) หรือ [Omise](https://omise.co) + webhook
- **SMS OTP** — login เป็น email/password ล้วน ถ้าอยากใช้ phone ต้องเปิด Twilio/Vonage ใน Supabase Auth
- **Email ยืนยัน** — Supabase ตั้งต้นบังคับ verify email ถ้าจะปิด: Auth → Providers → Email → ปิด "Confirm email"
- **Real-time updates** — ตอนนี้ staff dashboard ต้อง refresh ถ้าอยากเรียลไทม์ ใช้ Supabase Realtime channels
- **Inventory tracking, housekeeping kanban, walk-in booking, room CRUD UI** — schema มีแล้ว แต่ UI ยังไม่ได้เขียน
- **i18n** — ตอนนี้ hard-code ภาษาลาวเป็นหลัก ถ้าจะ multi-language ใช้ `next-intl`
- **PDF receipt** — checkout ยังไม่ออกใบเสร็จ
- **Rate limiting / spam protection** — production ควรเพิ่ม Supabase rate limit + captcha

---

## 🔐 Security notes

- Anon key ใส่ใน frontend ได้ (publicly exposed) เพราะ RLS เป็นตัวกั้นจริง
- **อย่า** push `service_role` key ขึ้น git/Vercel public env ใช้ใน server-only ถ้าจำเป็น
- RLS policies ใน `0001_init.sql` ตั้งไว้ว่า:
  - Guest อ่าน/เขียน booking ของตัวเอง เท่านั้น
  - Staff/admin อ่านทุกอย่าง
  - Rooms/floors อ่านได้สาธารณะ (browsing) แต่เขียนได้เฉพาะ staff
- ถ้าจะปิด guest signup: Auth → Providers → Email → ปิด "Enable signup"

---

## 📋 Commands

```bash
npm run dev       # local dev server (port 3000)
npm run build     # production build
npm run start     # run production build locally
npm run lint      # next lint
npm run typecheck # tsc --noEmit
```
