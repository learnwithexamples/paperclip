// Static reference data: categories, colors and the booth layout.
// Vendor/event content is NOT here — it lives in public/data/site.json.

export const CATEGORIES = [
  { name: 'Misc',            icon: '📦' },
  { name: 'School Uniforms', icon: '👕' },
  { name: 'Books',           icon: '📚' },
  { name: 'Toys',            icon: '🧸' },
  { name: 'Costumes',        icon: '🎭' },
  { name: 'Handcrafted',     icon: '🎨' },
  { name: 'Games',           icon: '🎮' },
  { name: 'Sports',          icon: '⚽' },
  { name: 'Art Supplies',    icon: '✏️' },
];

export const CAT_COLORS = {
  'Misc':            { bg: '#F1F5F9', color: '#475569' },
  'School Uniforms': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Books':           { bg: '#FEF9C3', color: '#92400E' },
  'Toys':            { bg: '#FCE7F3', color: '#9D174D' },
  'Costumes':        { bg: '#EDE9FE', color: '#6D28D9' },
  'Handcrafted':     { bg: '#D1FAE5', color: '#065F46' },
  'Games':           { bg: '#FFEDD5', color: '#9A3412' },
  'Sports':          { bg: '#DCFCE7', color: '#166534' },
  'Art Supplies':    { bg: '#FEF3C7', color: '#92400E' },
};

export const PASTEL_BGS = [
  '#FFF0EB', '#F0FDFB', '#FEF9C3', '#EDE9FE', '#D1FAE5', '#DBEAFE', '#FCE7F3',
];

export const BANNER_COLORS = [
  'linear-gradient(135deg,#3D883D,#84BCF3)',
  'linear-gradient(135deg,#84BCF3,#F5C945)',
  'linear-gradient(135deg,#3D883D,#F5C945)',
  'linear-gradient(135deg,#F5C945,#84BCF3)',
  'linear-gradient(135deg,#84BCF3,#3D883D)',
  'linear-gradient(135deg,#F5C945,#3D883D)',
];

export function getCatIcon(name) {
  return CATEGORIES.find(c => c.name === name)?.icon ?? '📦';
}

export function catTagStyle(cat) {
  const c = CAT_COLORS[cat] ?? CAT_COLORS.Misc;
  return { background: c.bg, color: c.color };
}

/** Stable pastel per key — the same item always gets the same tile color. */
export function pastelFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PASTEL_BGS[h % PASTEL_BGS.length];
}

// Booth numbering scheme: A01–A09, B01–B22, C01–C26, D01–D26.
// Each section has its own accent color, matching the printed market map.
function makeSection(letter, count, color) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${letter}${String(i + 1).padStart(2, '0')}`,
    section: letter,
    color,
  }));
}

export const BOOTH_DEFS = [
  ...makeSection('A', 9,  '#A855F7'),
  ...makeSection('B', 22, '#22C55E'),
  ...makeSection('C', 26, '#EAB308'),
  ...makeSection('D', 26, '#F97316'),
];

export function buildBooths(vendors) {
  return BOOTH_DEFS.map(b => ({
    ...b,
    vendors: vendors.filter(v => v.boothId === b.id),
  }));
}
