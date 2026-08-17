/*
 * Reference data: categories, colors and the booth layout.
 * Market content (vendors, dates, photos) lives in data/site.js.
 */

var CATEGORIES = [
  { name: 'Misc',            icon: '📦' },
  { name: 'School Uniforms', icon: '👕' },
  { name: 'Books',           icon: '📚' },
  { name: 'Toys',            icon: '🧸' },
  { name: 'Costumes',        icon: '🎭' },
  { name: 'Handcrafted',     icon: '🎨' },
  { name: 'Games',           icon: '🎮' },
  { name: 'Sports',          icon: '⚽' },
  { name: 'Art Supplies',    icon: '✏️' }
];

var CAT_COLORS = {
  'Misc':            { bg: '#F1F5F9', color: '#475569' },
  'School Uniforms': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Books':           { bg: '#FEF9C3', color: '#92400E' },
  'Toys':            { bg: '#FCE7F3', color: '#9D174D' },
  'Costumes':        { bg: '#EDE9FE', color: '#6D28D9' },
  'Handcrafted':     { bg: '#D1FAE5', color: '#065F46' },
  'Games':           { bg: '#FFEDD5', color: '#9A3412' },
  'Sports':          { bg: '#DCFCE7', color: '#166534' },
  'Art Supplies':    { bg: '#FEF3C7', color: '#92400E' }
};

var PASTEL_BGS = [
  '#FFF0EB', '#F0FDFB', '#FEF9C3', '#EDE9FE', '#D1FAE5', '#DBEAFE', '#FCE7F3'
];

var BANNER_COLORS = [
  'linear-gradient(135deg,#3D883D,#84BCF3)',
  'linear-gradient(135deg,#84BCF3,#F5C945)',
  'linear-gradient(135deg,#3D883D,#F5C945)',
  'linear-gradient(135deg,#F5C945,#84BCF3)',
  'linear-gradient(135deg,#84BCF3,#3D883D)',
  'linear-gradient(135deg,#F5C945,#3D883D)'
];

/* Booth grid, matching the printed market map.
   Each section lists its columns left → right, top → bottom. */
var MAP_SECTIONS = [
  {
    label: 'A',
    footer: 'Check-in Desk',
    columns: [
      ['A09', 'A08', 'A07', 'A06', 'A05', 'A04', 'A03', 'A02', 'A01']
    ]
  },
  {
    label: 'B',
    columns: [
      ['B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22'],
      ['B11', 'B10', 'B09', 'B08', 'B07', 'B06', 'B05', 'B04', 'B03', 'B02', 'B01']
    ]
  },
  {
    label: 'C',
    columns: [
      ['C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25', 'C26'],
      ['C13', 'C12', 'C11', 'C10', 'C09', 'C08', 'C07', 'C06', 'C05', 'C04', 'C03', 'C02', 'C01']
    ]
  },
  {
    label: 'D',
    columns: [
      ['D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21', 'D22', 'D23', 'D24', 'D25', 'D26'],
      ['D13', 'D12', 'D11', 'D10', 'D09', 'D08', 'D07', 'D06', 'D05', 'D04', 'D03', 'D02', 'D01']
    ]
  }
];

/* Every booth id that exists, in map order: A01–A09, B01–B22, C01–C26, D01–D26. */
var BOOTH_IDS = MAP_SECTIONS.reduce(function (all, section) {
  section.columns.forEach(function (col) { all = all.concat(col); });
  return all;
}, []);

function getCatIcon(name) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].name === name) return CATEGORIES[i].icon;
  }
  return '📦';
}

function catTagStyle(cat) {
  var c = CAT_COLORS[cat] || CAT_COLORS.Misc;
  return 'background:' + c.bg + ';color:' + c.color;
}

/* Stable pastel per key, so an item always gets the same tile color. */
function pastelFor(key) {
  var h = 0;
  for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PASTEL_BGS[h % PASTEL_BGS.length];
}
