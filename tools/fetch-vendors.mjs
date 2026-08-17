/*
 * Pulls the vendor list out of the swapmarket Firestore database and writes it to
 * data/vendors.js, which the static site loads. Run it whenever the market data
 * changes; the site itself never talks to Firebase.
 *
 *   node tools/fetch-vendors.mjs [options]
 *
 * Credentials come from FIREBASE_PROJECT_ID / FIREBASE_API_KEY, or from a Vite
 * .env file — by default ../swapmarket/.env. They are only used to read; nothing
 * is written back to Firebase, and no credential is copied into the output.
 *
 * Options:
 *   --env=PATH        .env file to read credentials from
 *   --out=PATH        output file (default data/vendors.js)
 *   --dry-run         print a summary, write nothing
 *   --no-photos       keep remote photo URLs instead of downloading them
 *   --force-photos    re-download photos that are already in image/vendors/
 *   --mask-names      replace generated placeholder store names ("ni**08@gmail.com",
 *                     "Hu**an") with "Booth A06". Off by default: the site mirrors
 *                     what the original swapmarket vendor list shows.
 *
 * Reads Firestore over its public REST API, which is exactly what the browser SDK
 * did: the `vendors` collection is world-readable, so no service account is needed.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes('--' + name);
const option = (name, fallback) => {
  const hit = argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const OUT_FILE = path.resolve(ROOT, option('out', 'data/vendors.js'));
const ENV_FILE = path.resolve(ROOT, option('env', '../swapmarket/.env'));
const PHOTO_DIR = path.join(ROOT, 'image', 'vendors');
const DRY_RUN = flag('dry-run');

// ── credentials ────────────────────────────────────────────────────────────

async function readCredentials() {
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let apiKey = process.env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    let text;
    try {
      text = await readFile(ENV_FILE, 'utf8');
    } catch {
      throw new Error(
        `No credentials. Set FIREBASE_PROJECT_ID and FIREBASE_API_KEY, or point --env at a .env file (tried ${ENV_FILE}).`
      );
    }
    const env = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    projectId = projectId || env.VITE_FIREBASE_PROJECT_ID;
    apiKey = apiKey || env.VITE_FIREBASE_API_KEY;
  }

  if (!projectId || !apiKey) throw new Error(`Missing project id or API key in ${ENV_FILE}.`);
  return { projectId, apiKey };
}

// ── Firestore REST ─────────────────────────────────────────────────────────

/** Turn Firestore's typed JSON ({stringValue: "x"}) back into plain values. */
function decode(value) {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue) return decodeFields(value.mapValue.fields);
  return undefined;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) out[key] = decode(value);
  return out;
}

async function fetchCollection({ projectId, apiKey }, collection) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const docs = [];
  let pageToken;

  do {
    const url = new URL(base);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Firestore returned ${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`);
    }
    const body = await res.json();
    for (const doc of body.documents || []) {
      docs.push({ id: doc.name.split('/').pop(), ...decodeFields(doc.fields) });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);

  return docs;
}

// ── shaping ────────────────────────────────────────────────────────────────

/**
 * Accounts that never named their store carry a generated placeholder: swapmarket's
 * backfill script masked the e-mail's local part as `first2 ** last2`, giving names
 * like "ni**08@gmail.com" or "Hu**an". Neither belongs on a public page.
 */
const isPlaceholderName = (name) => {
  const value = String(name || '').trim();
  return value.includes('**') || /^[^\s@]*@[^\s@]+\.[^\s@]+$/.test(value);
};

function shapeVendor(doc) {
  const items = (doc.items || []).map((item) => ({
    id: item.id,
    name: item.name || 'Item',
    category: item.category || 'Misc',
    price: Number(item.price) || 0,
    icon: item.icon || '',
    bgColor: item.bgColor || undefined,
  }));

  let storeName = String(doc.storeName || '').trim();
  const generated = !storeName || isPlaceholderName(storeName);
  if (generated && flag('mask-names')) {
    storeName = doc.boothId ? `Booth ${doc.boothId}` : 'Unnamed store';
  }

  // NOTE: the `email` field, the sales log and the `backfilled` marker are dropped —
  // they are personal or internal data and this file is published on a public
  // website. Everything the original vendor list displayed is kept as-is.
  //
  // `disabled` is admin bookkeeping and does NOT hide a vendor: swapmarket only
  // used it to grey out a row in the admin table, and those vendors still appear
  // on its public vendor list. `hidden` stays a manual switch, set by hand.
  return {
    id: doc.id,
    storeName,
    avatar: doc.avatar || '🏪',
    boothId: doc.boothId || '',
    featured: Boolean(doc.featured),
    disabled: Boolean(doc.disabled),
    bannerColor: doc.bannerColor || undefined,
    description: doc.description || '',
    categories: doc.categories || [],
    items,
    // Marks a vendor whose store name was generated rather than chosen, so the
    // site can optionally skip them (options.hideUnnamedStores in data/site.js).
    placeholder: generated,
  };
}

// ── photos ─────────────────────────────────────────────────────────────────

const EXTENSIONS = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/avif': '.avif',
};

const exists = (file) => access(file).then(() => true, () => false);

/**
 * Copy a remotely hosted photo into image/vendors/ and return its local path, so
 * the published site does not depend on anyone else's server staying up.
 */
async function localisePhoto(url, name, report) {
  if (!/^https?:/.test(url)) return url;

  const res = await fetch(url);
  if (!res.ok) {
    report.failed.push(`${name}: HTTP ${res.status}`);
    return url; // keep the remote URL rather than losing the picture
  }
  const ext = EXTENSIONS[(res.headers.get('content-type') || '').split(';')[0]] || '.jpg';
  const file = `${name}${ext}`;
  const target = path.join(PHOTO_DIR, file);

  if (!flag('force-photos') && (await exists(target))) {
    report.skipped.push(file);
  } else if (!DRY_RUN) {
    await mkdir(PHOTO_DIR, { recursive: true });
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    report.saved.push(file);
  } else {
    report.saved.push(file);
  }

  return `image/vendors/${file}`;
}

async function localisePhotos(vendors) {
  const report = { saved: [], skipped: [], failed: [] };
  if (flag('no-photos')) return report;

  for (const vendor of vendors) {
    if (/^https?:/.test(vendor.avatar)) {
      vendor.avatar = await localisePhoto(vendor.avatar, `${vendor.id}-avatar`, report);
    }
    for (const [index, item] of vendor.items.entries()) {
      if (/^https?:/.test(item.icon)) {
        item.icon = await localisePhoto(item.icon, `${vendor.id}-${item.id || index}`, report);
      }
    }
  }
  return report;
}

// ── output ─────────────────────────────────────────────────────────────────

function render(vendors, projectId) {
  const clean = vendors.map((vendor) => {
    const v = { ...vendor };
    if (!v.placeholder) delete v.placeholder;
    if (!v.disabled) delete v.disabled;
    if (!v.bannerColor) delete v.bannerColor;
    v.items = v.items.map((item) => {
      if (!item.bgColor) delete item.bgColor;
      if (!item.id) delete item.id;
      return item;
    });
    return v;
  });

  return `/*
 * GENERATED FILE — do not edit by hand; your changes will be overwritten.
 *
 * Source: Firestore \`vendors\` collection of the "${projectId}" project.
 * Regenerate with:  node tools/fetch-vendors.mjs
 *
 * Personal data (e-mail addresses) and internal bookkeeping (sales log) are
 * intentionally not included — this file is served publicly.
 */

window.SITE_VENDORS = ${JSON.stringify(clean, null, 2)};
`;
}

// ── main ───────────────────────────────────────────────────────────────────

const credentials = await readCredentials();
console.log(`Reading vendors from Firestore project "${credentials.projectId}"…`);

// Document order is left untouched, so the vendor list reads the same as the
// original swapmarket site's.
const docs = await fetchCollection(credentials, 'vendors');
const vendors = docs.map(shapeVendor);

const photos = await localisePhotos(vendors);

const stats = {
  vendors: vendors.length,
  featured: vendors.filter((v) => v.featured).length,
  disabled: vendors.filter((v) => v.disabled).length,
  withItems: vendors.filter((v) => v.items.length).length,
  items: vendors.reduce((n, v) => n + v.items.length, 0),
  unnamed: vendors.filter((v) => v.placeholder).length,
};

console.log(
  `  ${stats.vendors} vendors, all listed (${stats.featured} featured, ` +
  `${stats.disabled} flagged disabled in admin), ${stats.items} items across ${stats.withItems} stores`
);
if (stats.unnamed) {
  console.log(`  ${stats.unnamed} store names are backfill placeholders, kept as-is (--mask-names replaces them with "Booth <id>")`);
}
if (photos.saved.length)   console.log(`  photos saved:   ${photos.saved.join(', ')}`);
if (photos.skipped.length) console.log(`  photos already local: ${photos.skipped.length}`);
if (photos.failed.length)  console.log(`  photos FAILED:  ${photos.failed.join(', ')}`);

if (DRY_RUN) {
  console.log('\n--dry-run: nothing written.');
} else {
  await writeFile(OUT_FILE, render(vendors, credentials.projectId));
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
}
