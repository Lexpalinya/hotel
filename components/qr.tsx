'use client';

// Deterministic, visually-convincing QR rendered from a string seed.
// Not a real QR — this is for the MVP self-check-in screen where the staff
// scans a server-validated booking code; production should replace with a
// real QR library (e.g. qrcode) once SMS/scanner integration lands.

export function QRish({ seed, size = 200 }: { seed: string; size?: number }) {
  const cells = 25;
  const cellSize = size / cells;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;

  const cellsArr: boolean[][] = [];
  for (let y = 0; y < cells; y++) {
    cellsArr[y] = [];
    for (let x = 0; x < cells; x++) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      cellsArr[y][x] = ((hash >> 16) & 1) === 1;
    }
  }
  const corner = (x0: number, y0: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      const border = x === 0 || x === 6 || y === 0 || y === 6;
      cellsArr[y0 + y][x0 + x] = border || inner;
    }
  };
  corner(0, 0); corner(cells - 7, 0); corner(0, cells - 7);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
         style={{ background: 'white', borderRadius: 12, padding: 8, boxSizing: 'content-box' }}>
      {cellsArr.flatMap((row, y) => row.map((on, x) => on && (
        <rect key={`${x}-${y}`} x={x * cellSize} y={y * cellSize} width={cellSize} height={cellSize} fill="#000" />
      )))}
    </svg>
  );
}
