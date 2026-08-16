import { useEffect, useState } from 'react';
import { BANNER_COLORS, getCatIcon, pastelFor } from './data';

/**
 * Resolve a path from public/ against the deployment base.
 * With `base: './'` this yields a relative URL, so the build works under
 * /<repo>/ on GitHub Pages as well as at a domain root.
 */
export function asset(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return import.meta.env.BASE_URL.replace(/\/?$/, '/') + path.replace(/^\/+/, '');
}

/** An item/avatar "icon" is either an emoji or a picture. Returns a src, or null for emoji. */
export function photoSrc(icon) {
  if (!icon) return null;
  if (/^(https?:|data:)/.test(icon)) return icon;
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(icon)) return asset(icon);
  return null;
}

const EMPTY = { event: {}, carousel: [], flyers: [], map: {}, vendors: [] };

function normalizeVendor(raw, index) {
  const id = String(raw.id ?? index);
  const items = (raw.items ?? []).map((item, j) => {
    const category = item.category ?? 'Misc';
    const key = `${id}-${item.id ?? item.name ?? j}`;
    return {
      id: String(item.id ?? key),
      name: item.name ?? 'Item',
      category,
      price: Number(item.price) || 0,
      icon: item.icon || getCatIcon(category),
      bgColor: item.bgColor ?? pastelFor(key),
    };
  });
  return {
    ...raw,
    id,
    storeName: raw.storeName ?? 'Unnamed store',
    avatar: raw.avatar ?? '🏪',
    boothId: raw.boothId ?? null,
    featured: Boolean(raw.featured),
    bannerColor: raw.bannerColor ?? BANNER_COLORS[index % BANNER_COLORS.length],
    description: raw.description ?? '',
    categories: raw.categories?.length ? raw.categories : [...new Set(items.map(i => i.category))],
    items,
  };
}

/** Fill in defaults so pages can rely on every field existing. */
export function normalize(json) {
  return {
    ...EMPTY,
    ...json,
    event: { ...EMPTY.event, ...json.event },
    carousel: json.carousel ?? [],
    flyers: json.flyers ?? [],
    map: json.map ?? {},
    vendors: (json.vendors ?? [])
      .filter(v => !v.hidden)
      .map(normalizeVendor),
  };
}

/** Loads public/data/site.json once, at runtime, so content edits need no code change. */
export function useSiteData() {
  const [state, setState] = useState({ status: 'loading', data: EMPTY, error: null });

  useEffect(() => {
    let cancelled = false;
    fetch(asset('data/site.json'), { cache: 'no-cache' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (!cancelled) setState({ status: 'ready', data: normalize(json), error: null });
      })
      .catch(err => {
        if (!cancelled) setState({ status: 'error', data: EMPTY, error: err });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
