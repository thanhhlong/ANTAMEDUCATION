// Tier styling used to award a medal based on a lesson's position (order) within its
// subject — mirrors src/data/seedData.ts LEVELS and is seeded into the `levels` table.
export const LEVELS = [
  { id: 1, name: 'Nhập môn', medal: null as string | null, color: '#94a3b8', grad: 'from-slate-400 to-slate-500' },
  { id: 2, name: 'Sơ cấp', medal: 'Đồng', color: '#b45309', grad: 'from-amber-600 to-amber-700' },
  { id: 3, name: 'Trung cấp', medal: 'Bạc', color: '#64748b', grad: 'from-slate-400 to-slate-600' },
  { id: 4, name: 'Siêu cấp', medal: 'Vàng', color: '#ca8a04', grad: 'from-yellow-400 to-yellow-600' },
  { id: 5, name: 'Chuyên gia', medal: 'Kim cương', color: '#0ea5e9', grad: 'from-sky-400 to-blue-600' },
];

export const MAX_SUB_LEVEL = 3;

export function tierForOrder(order: number) {
  const idx = Math.min(Math.max(order - 1, 0), LEVELS.length - 1);
  return LEVELS[idx];
}
