// ── Formatters & helpers ─────────────────────────────
export const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n ?? 0);

export const pct = (part, whole) =>
  whole === 0 ? 0 : Math.min(Math.round((part / whole) * 100), 100);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

export const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const CATEGORY_COLORS = [
  '#3a9fff', '#5cc9a7', '#ff7b7b', '#ffb347',
  '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#60a5fa', '#f87171', '#818cf8', '#94a3b8',
];
