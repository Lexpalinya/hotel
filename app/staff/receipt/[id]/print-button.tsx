'use client';
export default function PrintButton() {
  return (
    <button className="h-btn h-btn--primary" onClick={() => window.print()}>
      🖨 Print / Save as PDF
    </button>
  );
}
