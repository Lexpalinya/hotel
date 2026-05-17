import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div className="h-eyebrow" style={{ marginBottom: 8 }}>MVP · v1.0</div>
        <h1 className="h-serif" style={{ fontSize: 44, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
          ລະບົບ Check-in / Check-out<br />
          <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>ໂຮງແຮມໃນມະຫາວິທະຍາໄລ</span>
        </h1>
        <p style={{ marginTop: 18, color: 'var(--ink-2)', lineHeight: 1.6, fontSize: 15 }}>
          ເລືອກປະຕູເຂົ້າ — ລູກຄ້າຈອງຫ້ອງ ແລະ self check-in ຜ່ານມືຖື · ພະນັກງານຈັດການຈາກ web console
        </p>

        <div style={{ display: 'grid', gap: 14, marginTop: 32 }}>
          <Link href="/app" className="h-card" style={cardStyle}>
            <div>
              <div className="h-eyebrow">FOR GUESTS · ມືຖື</div>
              <div className="h-serif" style={{ fontSize: 22, marginTop: 4 }}>ຈອງຫ້ອງ + self check-in</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
                ສ້າງບັນຊີ · ເລືອກຫ້ອງ · ຈ່າຍ · ສະແກນ QR ທີ່ລ໋ອບບີ້
              </div>
            </div>
            <span style={{ fontSize: 22, color: 'var(--accent)' }}>→</span>
          </Link>

          <Link href="/staff" className="h-card" style={cardStyle}>
            <div>
              <div className="h-eyebrow">FOR STAFF · ເວັບ</div>
              <div className="h-serif" style={{ fontSize: 22, marginTop: 4 }}>Staff console</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
                Dashboard · room grid · bookings · ແຂກ · ຊັ້ນ · ລາຍງານ
              </div>
            </div>
            <span style={{ fontSize: 22, color: 'var(--accent)' }}>→</span>
          </Link>
        </div>

        <div style={{ marginTop: 28, fontSize: 12, color: 'var(--ink-3)' }}>
          ບໍ່ມີບັນຊີ? <Link href="/login" style={{ color: 'var(--accent)' }}>ສ້າງບັນຊີ →</Link>
        </div>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '18px 22px', cursor: 'pointer', textDecoration: 'none', color: 'var(--ink)',
};
