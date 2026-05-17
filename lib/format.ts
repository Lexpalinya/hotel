// Currency + date helpers.

export const formatKip = (n: number) =>
  '₭' + n.toLocaleString('en-US');

const monthLao = ['ມ.ກ.','ກ.ພ.','ມ.ນ.','ມ.ສ.','ພ.ພ.','ມິ.ຖ.','ກ.ລ.','ສ.ຫ.','ກ.ຍ.','ຕ.ລ.','ພ.ຈ.','ທ.ວ.'];

export const formatDateLao = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${monthLao[d.getMonth()]}`;
};

export const formatDateRange = (a: string, b: string) =>
  `${formatDateLao(a)} – ${formatDateLao(b)}`;

export const nightsBetween = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000));
};

export const bookingCode = () => {
  const year = new Date().getFullYear();
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `BK-${year}-${n}`;
};
