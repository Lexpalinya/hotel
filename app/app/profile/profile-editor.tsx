'use client';

import { useState } from 'react';
import { Modal, Field } from '@/components/modal';

type Values = {
  fullName: string;
  phone: string;
  customerType: string;
  identityNo: string;
  address: string;
};

export default function ProfileEditor({ initial }: { initial: Values }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const show = () => {
    setForm(initial);
    setError('');
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error || 'ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ');
        return;
      }

      // A full reload guarantees every server-rendered profile summary uses
      // the updated users and customers rows immediately.
      window.location.reload();
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === 'AbortError'
          ? 'ການເຊື່ອມຕໍ່ໝົດເວລາ ກະລຸນາລອງໃໝ່'
          : 'ຕິດຕໍ່ Server ບໍ່ໄດ້ ກະລຸນາລອງໃໝ່'
      );
    } finally {
      window.clearTimeout(timeout);
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="h-btn h-btn--accent" style={{ width: '100%', marginTop: 14 }} onClick={show}>
        ແກ້ໄຂຂໍ້ມູນ
      </button>
      <Modal
        open={open}
        onClose={() => { if (!saving) setOpen(false); }}
        title="ແກ້ໄຂຂໍ້ມູນລູກຄ້າ"
        footer={(
          <>
            <button type="button" className="h-btn" disabled={saving} onClick={() => setOpen(false)}>ຍົກເລີກ</button>
            <button type="submit" form="profile-form" className="h-btn h-btn--accent" disabled={saving}>
              {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
            </button>
          </>
        )}
      >
        <form id="profile-form" onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <Field label="ຊື່ ແລະ ນາມສະກຸນ">
            <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          </Field>
          <Field label="ເບີໂທ">
            <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="ປະເພດລູກຄ້າ">
            <select value={form.customerType} onChange={(event) => setForm({ ...form, customerType: event.target.value })}>
              <option value="visitor">ບຸກຄົນທົ່ວໄປ</option>
              <option value="faculty">ອາຈານ / ພະນັກງານ</option>
              <option value="student">ນັກສຶກສາ</option>
              <option value="alumni">ສິດເກົ່າ</option>
              <option value="organization">ອົງກອນ</option>
            </select>
          </Field>
          <Field label="ເລກບັດ / PASSPORT">
            <input value={form.identityNo} onChange={(event) => setForm({ ...form, identityNo: event.target.value })} />
          </Field>
          <Field label="ທີ່ຢູ່">
            <textarea rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </Field>
          {error && <div role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
        </form>
      </Modal>
    </>
  );
}
