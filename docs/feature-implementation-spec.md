# Sunantha Hotel Feature Implementation Plan & Specification

## 1. เป้าหมาย

พัฒนาระบบโรงแรมให้ใช้งานได้จริงแบบ end-to-end โดยแบ่งเป็น 2 ส่วนเท่านั้น:

1. **Customer Portal** สำหรับลูกค้าค้นหาห้อง จอง ชำระเงิน และรับใบเสร็จของตนเอง
2. **Staff Portal** สำหรับพนักงานจัดการการจอง งานบริการ ข้อมูลพื้นฐาน และรายงาน

ทุก feature ต้องจบ flow ของงาน ไม่ใช่เพียงแสดงข้อมูล ต้องมี action, validation, authorization, loading, error, success state และผลลัพธ์ที่ตรวจสอบย้อนหลังได้

> คำสั่งล่าสุดกำหนดให้นำ `ค้นหา` ออกจาก Staff จึงไม่รวม Staff global search ใน implementation นี้

## 2. ขอบเขต Feature

### Customer Portal

- ກວດສອບຫ້ອງພັກ
- ບັນທຶກການຈອງ
- ຊໍາລະເງິນ
- ພິມໃບບິນ

### Staff Portal

- ຈອງຫ້ອງພັກ
  - ກວດສອບຫ້ອງພັກ
  - ບັນທຶກການຈອງ
  - ພິມໃບບິນ
- ບໍລິການ
  - ກວດສອບຫ້ອງ
  - ແຈ້ງເຂົ້າ
  - ແຈ້ງອອກ
  - ຊໍາລະເງິນ
- ຈັດການຂໍ້ມູນພື້ນຖານ
  - ຈັດການຂໍ້ມູນຫ້ອງ
  - ຈັດການຂໍ້ມູນພະນັກງານ
  - ຈັດການຂໍ້ມູນປະເພດຫ້ອງ
  - ຈັດການຂໍ້ມູນລູກຄ້າ
- ລາຍງານ
  - ລາຍງານການຈອງພັກ
  - ລາຍງານການບໍລິການ
  - ລາຍງານຂໍ້ມູນລູກຄ້າ

## 3. Role และ Permission

ระบบมี 3 database roles แต่มีเพียง 2 portals:

| Role | Portal | สิทธิ์ |
|---|---|---|
| `guest` | Customer | จัดการ booking, payment และ receipt ของตนเองเท่านั้น |
| `staff` | Staff | ทำงาน reservation, check-in/out, payment, customer และ room operation |
| `admin` | Staff | สิทธิ์ Staff ทั้งหมด รวมจัดการพนักงานและข้อมูลตั้งค่าหลัก |

ข้อบังคับ:

- Guest เปิด `/staff/*` ไม่ได้
- Staff/Admin เปิดข้อมูล booking และลูกค้าเพื่อปฏิบัติงานได้
- เฉพาะ Admin สร้าง ปิดบัญชี หรือเปลี่ยน role พนักงานได้
- ทุก API ต้องตรวจ session และ role ฝั่ง server ห้ามเชื่อ UI อย่างเดียว
- Customer receipt/payment ต้องตรวจ `booking.guest_id = auth.uid()`

## 4. State Model

### Booking Status

```text
pending -> confirmed -> checked_in -> checked_out
pending -> cancelled
confirmed -> cancelled
confirmed -> no_show
```

กฎ:

- `pending`: สร้าง booking แล้ว แต่ยังไม่ยืนยันการชำระ
- `confirmed`: การจองได้รับการยืนยัน
- `checked_in`: ลูกค้าเข้าพักแล้ว
- `checked_out`: ปิดการเข้าพักแล้ว
- `cancelled`: ยกเลิกแล้วและคืนห้อง
- `no_show`: ไม่มาเข้าพัก
- ห้ามย้อนสถานะโดยตรง ต้องใช้ corrective action พร้อม audit log

### Room Status

```text
available -> reserved -> occupied -> inspection -> available
available -> out_of_order -> available
```

ปรับ enum เดิม:

- เปลี่ยน `dirty` เป็น `inspection` หรือเพิ่ม label UI ว่า “รอตรวจสอบ”
- ไม่ใช้ `cleaning` เพราะ feature แม่บ้านอยู่นอกขอบเขต
- สถานะห้องต้องสัมพันธ์กับ active booking

### Payment Status

```text
pending -> paid
pending -> failed
paid -> refunded
```

ห้ามลบ payment ที่สำเร็จ ให้ refund หรือ void พร้อมเหตุผลแทน

## 5. Data Model

### ตารางที่ใช้ต่อ

- `users`
- `floors`
- `rooms`
- `room_types`
- `bookings`
- `payments`
- `booking_charges`

### ตาราง/คอลัมน์ที่ต้องเพิ่ม

#### `users`

- `active boolean default true`
- `updated_at timestamptz`
- `identity_no text` สำหรับข้อมูลลูกค้า (optional)
- `address text` (optional)

#### `rooms`

- `room_type_id uuid references room_types(id)`
- `active boolean default true`
- ใช้ `type` เดิมชั่วคราวระหว่าง migration แล้วเลิกใช้หลัง backfill

#### `bookings`

- `source text`: customer, staff, walk_in
- `cancelled_at timestamptz`
- `cancel_reason text`
- `created_by uuid references users(id)`
- unique/constraint ป้องกัน booking ห้องเดียวกันซ้อนช่วงเวลา

#### `payments`

- `created_by uuid references users(id)`
- `verified_by uuid references users(id)`
- `verified_at timestamptz`
- `note text`
- `refunded_at timestamptz`
- `refund_reason text`

#### `booking_charges`

- ใช้เป็นรายการบริการที่เกิดขึ้นจริง
- เพิ่ม `quantity numeric default 1`
- เพิ่ม `unit_price int`
- เพิ่ม `voided_at timestamptz`
- เพิ่ม `void_reason text`

#### `audit_logs` (ใหม่)

- `id uuid`
- `actor_id uuid`
- `action text`
- `entity_type text`
- `entity_id uuid`
- `before jsonb`
- `after jsonb`
- `created_at timestamptz`

ใช้บันทึกการเปลี่ยน booking status, room status, payment, employee role และการปิดข้อมูลหลัก

## 6. Customer Portal Specification

### 6.1 ກວດສອບຫ້ອງພັກ

#### Input

- Check-in date
- Check-out date
- จำนวนผู้เข้าพัก
- ประเภทห้อง (optional)

#### Logic

- `check_out > check_in`
- Check-in ห้ามเป็นอดีต
- ความจุห้องต้องมากกว่าหรือเท่าจำนวนผู้เข้าพัก
- ห้องต้อง `active = true`
- ห้องต้องไม่ `out_of_order`
- ไม่มี booking สถานะ pending/confirmed/checked_in ที่ทับช่วงวัน

#### Output

- รูปห้อง
- หมายเลขห้อง
- ประเภทห้อง
- ความจุและเตียง
- ราคา/คืน
- จำนวนคืนและราคารวม

#### Acceptance Criteria

- ค้นหาวันต่างกันต้องให้ผลตาม inventory จริง
- ห้องที่ถูกจองซ้อนต้องไม่ปรากฏ
- กดห้องแล้วไปหน้ารายละเอียดและจองต่อได้
- ไม่มีผลลัพธ์ต้องแสดง empty state และแก้วันที่ได้

### 6.2 ບັນທຶກການຈອງ

#### Create Flow

1. ลูกค้าเลือกห้องจาก availability result
2. ระบบตรวจ availability ซ้ำฝั่ง server
3. คำนวณจำนวนคืนและราคาใหม่ฝั่ง server
4. สร้าง booking `pending`
5. ล็อกห้องตามเวลาที่กำหนด หรือปล่อย booking pending หมดอายุ
6. ไปหน้าชำระเงิน

#### Read

- ดู booking ปัจจุบัน
- ดูประวัติ booking ของตนเอง
- ดูรายละเอียด booking

#### Update

- แก้วัน/จำนวนคนได้ก่อน confirmed โดยต้องตรวจ availability ซ้ำ
- หลัง confirmed ต้องส่งคำขอ Staff หรือยกเลิกตาม policy

#### Cancel

- ใช้ soft cancellation
- บันทึกเวลาและเหตุผล
- คืนสถานะห้องเมื่อไม่มี booking อื่น

#### Acceptance Criteria

- Double-click ไม่สร้าง booking ซ้ำ
- Booking code ต้อง unique
- ราคาใน booking มาจาก server ไม่ใช่ค่าที่ browser ส่งมา
- ลูกค้าเปิดหรือแก้ booking คนอื่นไม่ได้

### 6.3 ຊໍາລະເງິນ

#### Flow

1. แสดงค่าห้อง ค่าบริการ ยอดจ่ายแล้ว และยอดค้าง
2. สร้าง payment intent/reference ฝั่ง server
3. ลูกค้าชำระผ่าน gateway/QR
4. Gateway webhook ยืนยันผล
5. บันทึก payment `paid`
6. เปลี่ยน booking `pending -> confirmed`
7. สร้าง receipt

#### ข้อห้าม

- ห้ามใช้ปุ่ม “จ่ายแล้ว” เพื่อสร้าง paid payment โดยตรงใน production
- ห้ามเชื่อ amount จาก client
- Webhook ต้องตรวจ signature และ idempotency key

#### Failure Cases

- Payment failed: booking ยัง pending และชำระใหม่ได้
- Webhook ซ้ำ: ไม่สร้าง payment ซ้ำ
- ยอดไม่ตรง: เก็บเป็น exception ให้ Staff ตรวจ

### 6.4 ພິມໃບບິນ

#### Read

- ใบแจ้งยอด: เปิดได้เมื่อ booking มีอยู่
- ใบเสร็จ: เปิดได้เมื่อมี paid payment

#### Output

- โรงแรมและเลขที่เอกสาร
- ลูกค้า
- Booking code
- ห้องและช่วงเข้าพัก
- ค่าห้องและค่าบริการ
- รายการชำระ
- ยอดรวม จ่ายแล้ว และยอดค้าง

#### Action

- Print
- Save as PDF ผ่าน browser print

#### Authorization

- Customer เปิดได้เฉพาะ booking ของตนเอง
- Staff เปิดได้ทุก booking ตามสิทธิ์

## 7. Staff Portal Specification

### 7.1 ກວດສອບຫ້ອງພັກ

ใช้สำหรับสร้าง reservation ไม่ใช่ดู operational room status

- Input และ availability logic เหมือน Customer
- แสดงข้อมูลลูกค้าเดิมหรือสร้างลูกค้าใหม่ได้
- แสดงราคาและจำนวนคืนก่อนสร้าง booking
- Staff เลือก source: phone, walk-in, counter

### 7.2 ບັນທຶກການຈອງ

#### CRUD

| Operation | Requirement |
|---|---|
| Create | เลือกลูกค้า/สร้างใหม่ เลือกห้อง วันที่ จำนวนคน ราคา หมายเหตุ |
| Read | List, filter ตามวัน/สถานะ, detail, payment และ charges |
| Update | วัน ห้อง จำนวนคน หมายเหตุ ก่อน check-in พร้อมตรวจ conflict |
| Cancel | Soft cancel พร้อมเหตุผล คืนห้อง และ audit |

#### Walk-in

- ต้องสร้าง customer record จริง ไม่เก็บชื่อไว้ใน `notes` อย่างเดียว
- Email optional แต่ต้องมีชื่อ และควรมีเบอร์โทรหรือเลขเอกสาร

### 7.3 ພິມໃບບິນ

- เปิดจาก booking detail
- พิมพ์ใบแจ้งยอดได้ก่อนชำระ
- พิมพ์ใบเสร็จเมื่อชำระแล้ว
- แสดงประเภทเอกสารชัดเจน
- หมายเลข receipt ต้องไม่ใช้ booking code อย่างเดียว ควรมี running document number

### 7.4 ກວດສອບຫ້ອງ

หน้า operational room board:

- Filter ตามชั้น ประเภท และสถานะ
- แสดงสถานะปัจจุบัน
- เปิด room detail
- เปลี่ยน `inspection -> available` หลังตรวจห้อง
- เปลี่ยน `available <-> out_of_order` พร้อมเหตุผล
- ห้ามเปลี่ยน `occupied` เป็น available โดยไม่ check-out booking
- แสดง booking ที่ผูกกับ reserved/occupied room

### 7.5 ແຈ້ງເຂົ້າ

#### Precondition

- Booking เป็น confirmed
- วันที่เข้าพักถูกต้อง หรือ Staff ยืนยัน early/late check-in
- ห้องยังพร้อมใช้งาน
- ยอดชำระเป็นไปตาม policy

#### Transaction

1. Lock booking และ room
2. เปลี่ยน booking เป็น checked_in
3. บันทึก checked_in_at
4. เปลี่ยน room เป็น occupied
5. บันทึก audit log

Transaction ต้องสำเร็จหรือ rollback ทั้งหมด

### 7.6 ແຈ້ງອອກ

#### Precondition

- Booking เป็น checked_in
- คำนวณค่าห้องและบริการล่าสุด
- แสดงยอดค้าง

#### Transaction

1. ถ้ามียอดค้าง ให้ชำระหรือ Staff ยืนยัน outstanding policy
2. เปลี่ยน booking เป็น checked_out
3. บันทึก checked_out_at
4. เปลี่ยน room เป็น inspection
5. สร้าง final receipt
6. บันทึก audit log

### 7.7 ຊໍາລະເງິນ

#### Create

- เลือก method: cash, transfer, card, QR
- Amount ต้องมากกว่า 0
- ค่า default เป็นยอดค้าง
- บันทึก reference และ note
- Staff payment สามารถ mark paid ได้เพราะเป็นการรับเงินหน้าเคาน์เตอร์

#### Read

- แสดง payment history
- ผู้บันทึก วันเวลา method reference และ amount

#### Update/Delete

- ห้ามแก้หรือลบ paid payment
- ใช้ refund/void action พร้อมเหตุผลและสิทธิ์ Admin

### 7.8 ຈັດການຂໍ້ມູນຫ້ອງ

| Operation | Requirement |
|---|---|
| Create | เลขห้อง unique, ชั้น, room type, ราคา override, amenities, รูป |
| Read | List/grid, detail, filter ชั้น/ประเภท/active |
| Update | แก้ข้อมูลและรูป พร้อม validation |
| Deactivate | ปิดใช้งานเมื่อไม่มี active booking |
| Delete | ไม่อนุญาตถ้ามี booking history; ใช้ deactivate |

Wasabi upload:

- Staff/Admin เท่านั้น
- JPG/PNG/WebP/GIF ไม่เกิน 5 MB
- Resize client และตรวจ MIME server
- เปลี่ยนรูปต้องลบไฟล์เดิมแบบ best-effort
- Database update ต้องเกิดหลัง upload สำเร็จ

### 7.9 ຈັດການຂໍ້ມູນພະນັກງານ

Admin only

| Operation | Requirement |
|---|---|
| Create | สร้าง Auth account + profile ใน transaction/compensating flow |
| Read | รายชื่อ role สถานะ และข้อมูลติดต่อ |
| Update | ชื่อ โทรศัพท์ role และ active |
| Deactivate | ปิด login โดยไม่ลบ audit/history |
| Reset Password | ส่ง reset flow หรือ Admin reset ตาม policy |
| Delete | ไม่ลบจริง ใช้ deactivate |

ข้อบังคับ:

- Admin ห้ามลดสิทธิ์หรือลบบัญชี Admin คนสุดท้าย
- Staff แก้ role ตนเองไม่ได้
- Secret/service role key อยู่ server เท่านั้น

### 7.10 ຈັດການຂໍ້ມູນປະເພດຫ້ອງ

| Operation | Requirement |
|---|---|
| Create | ชื่อ unique, เตียง, ความจุ, ราคาพื้นฐาน, รายละเอียด |
| Read | แสดง active/inactive และจำนวนห้องที่ใช้ประเภทนั้น |
| Update | แก้ข้อมูลและค่าพื้นฐาน |
| Deactivate | ปิดไม่ให้ใช้กับห้อง/booking ใหม่ |
| Delete | ห้ามลบเมื่อมี room อ้างอิง |

การแก้ราคาพื้นฐานไม่เปลี่ยนราคาของ booking เก่า

### 7.11 ຈັດການຂໍ້ມູນລູກຄ້າ

| Operation | Requirement |
|---|---|
| Create | ชื่อ และข้อมูลติดต่อขั้นต่ำ |
| Read | List, detail, booking history, payment summary |
| Update | ชื่อ โทรศัพท์ email ประเภท ที่อยู่ เลขเอกสาร |
| Merge | รวม duplicate customer โดย Admin |
| Deactivate | ปิดบัญชีโดยเก็บประวัติ |
| Delete | ไม่ลบเมื่อมี booking history |

ห้ามแก้ email ใน profile โดยไม่ sync กับ Auth account

## 8. รายงาน

รายงานทุกชุดต้องมี:

- Date range filter
- Filter เฉพาะรายงาน
- Apply และ Clear filter
- Loading/error/empty state
- Pagination หรือจำกัดข้อมูลอย่างชัดเจน
- Summary totals ที่คำนวณจาก query เดียวกับรายการ
- Print layout
- CSV export ด้วยข้อมูลตาม filter

### 8.1 ລາຍງານການຈອງພັກ

Filters:

- วันที่สร้าง booking
- วันที่เข้าพัก
- Booking status
- Room type

Columns:

- Booking code
- Customer
- Room/type
- Check-in/out
- Status
- Room amount
- Paid amount
- Balance

Summary:

- จำนวน booking
- Confirmed/cancelled/no-show
- Room revenue
- Occupancy ตามช่วงวัน

### 8.2 ລາຍງານການບໍລິການ

แหล่งข้อมูล: `booking_charges` ที่ไม่ถูก void

Filters:

- วันที่บันทึก
- ชื่อบริการ
- ห้อง

Columns:

- วันที่
- Service label
- Quantity
- Unit price
- Total
- Booking code
- Room
- ผู้บันทึก

Summary:

- จำนวนรายการบริการ
- รายได้รวม
- Breakdown ตามบริการ

### 8.3 ລາຍງານຂໍ້ມູນລູກຄ້າ

Filters:

- วันที่สมัคร
- วันที่เข้าพัก
- Customer type
- Active/inactive

Columns:

- Customer
- ติดต่อ
- ประเภท
- จำนวน booking
- จำนวนคืนรวม
- ยอดใช้จ่ายรวม
- เข้าพักล่าสุด

Summary:

- ลูกค้าทั้งหมด
- ลูกค้าใหม่ในช่วงวัน
- Returning customers
- Top customers ตามจำนวนครั้ง/ยอดใช้จ่าย

## 9. API และ Server Actions

งานเขียนข้อมูลต้องผ่าน server route/action เพื่อรวม authorization, transaction และ validation

API groups ที่ต้องมี:

```text
/api/customer/availability
/api/customer/bookings
/api/customer/bookings/:id/cancel
/api/customer/payments
/api/customer/receipts/:id

/api/staff/availability
/api/staff/bookings
/api/staff/bookings/:id
/api/staff/bookings/:id/check-in
/api/staff/bookings/:id/check-out
/api/staff/bookings/:id/cancel
/api/staff/bookings/:id/payments
/api/staff/bookings/:id/charges
/api/staff/bookings/:id/receipt
/api/staff/rooms
/api/staff/room-types
/api/staff/customers
/api/admin/employees
/api/staff/reports/bookings
/api/staff/reports/services
/api/staff/reports/customers
```

ทุก mutation response ใช้รูปแบบ:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Error ต้องมี status ที่ถูกต้อง: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 invalid transition, 500 unexpected

## 10. UI Behavior

ทุกหน้าที่มี CRUD ต้องมี:

- ปุ่ม action ชัดเจน
- Form validation ก่อน submit และจาก server
- Disable submit ระหว่างทำงาน
- ป้องกัน double submit
- Success feedback
- Error ที่ผู้ใช้แก้ต่อได้
- Confirm dialog สำหรับ cancel, deactivate, refund
- Refresh state หลังสำเร็จ
- Responsive mobile/tablet/desktop
- Table บน mobile ใช้ stacked rows หรือ horizontal scroll ที่ชัดเจน

ห้ามมี:

- Placeholder “phase 2”
- ปุ่มที่กดแล้วไม่ทำงาน
- ข้อมูล mock ใน production flow
- Action ที่ update หลายตารางโดยไม่ใช้ transaction
- Delete จริงสำหรับข้อมูลที่มีประวัติทางธุรกิจ

## 11. Implementation Phases

### Phase 1: Security และ Data Integrity

1. เพิ่ม Staff role gate ฝั่ง server
2. เพิ่ม ownership check สำหรับ Customer
3. เพิ่ม schema migration และ audit log
4. เพิ่ม booking overlap constraint/function
5. ย้าย mutation จาก browser Supabase client ไป server APIs

### Phase 2: Booking Core

1. Availability engine
2. Customer booking CRUD ตามข้อจำกัด
3. Staff reservation CRUD
4. Walk-in customer record
5. Cancel/no-show flow

### Phase 3: Operation และ Payment

1. Room operational board
2. Check-in transaction
3. Service charge CRUD/void
4. Staff payment/refund
5. Check-out transaction
6. Receipt generation

### Phase 4: Master Data CRUD

1. Room CRUD/deactivate + Wasabi image
2. Room type CRUD/deactivate
3. Customer CRUD/history/deactivate
4. Employee account CRUD/deactivate/reset password

### Phase 5: Reports

1. Booking report + filters + CSV + print
2. Service report + filters + CSV + print
3. Customer report + filters + CSV + print

### Phase 6: End-to-End Verification

1. Customer flow: availability -> booking -> payment -> receipt
2. Staff flow: reservation -> check-in -> charge -> payment -> check-out -> receipt
3. CRUD tests ทุก master data
4. Role/ownership tests
5. Conflict/idempotency tests
6. Responsive and PWA tests
7. Backup/restore test ก่อน production release

## 12. Definition of Done

Feature ถือว่าเสร็จเมื่อครบทุกข้อ:

- UI action ใช้งานได้จริง
- Server authorization ถูกต้อง
- Validation ทั้ง client และ server
- Database constraint ป้องกันข้อมูลผิด
- Flow สำเร็จและ failure flow ทำงาน
- Loading, error, empty และ success state ครบ
- Audit log สำหรับ action สำคัญ
- Unit/integration test สำหรับ business rules
- E2E test ตาม role
- Responsive desktop/mobile
- ไม่มี console error, 404 asset หรือ hydration error
- Production health check ผ่านหลัง deploy
- มี rollback และ database backup

## 13. Acceptance Scenarios หลัก

### Customer Scenario

```text
สมัคร/เข้าสู่ระบบ
-> เลือกวันที่และจำนวนคน
-> พบเฉพาะห้องว่าง
-> เลือกห้อง
-> ยืนยัน booking
-> ชำระผ่าน verified payment flow
-> booking confirmed
-> ดูและพิมพ์ใบเสร็จของตนเอง
```

### Staff Scenario

```text
Staff เข้าระบบ
-> ตรวจ availability
-> สร้าง/เลือกลูกค้า
-> สร้าง reservation
-> รับชำระ
-> check-in
-> เพิ่มค่าบริการ
-> รับยอดค้าง
-> check-out
-> ห้องเข้าสถานะ inspection
-> ตรวจห้องและเปิด available
-> พิมพ์ final receipt
```

### Admin Scenario ภายใน Staff Portal

```text
Admin เข้าระบบ Staff
-> เพิ่ม/แก้/ปิดบัญชีพนักงาน
-> จัดการห้องและประเภทห้อง
-> จัดการข้อมูลลูกค้า
-> เปิดรายงานพร้อม filter
-> export/print ผลลัพธ์
```

