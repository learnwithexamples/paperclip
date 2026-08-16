import { useEffect, useRef, useState } from 'react';

// Hash routing keeps every deep link a single static file request, which is all
// GitHub Pages can serve (no rewrites, no 404 fallback needed).
//
//   #/            home
//   #/shop        shop, optionally #/shop/Books to preselect a category
//   #/map         booth map, optionally #/map/A03 to preselect a booth
//   #/vendors     all vendors
//   #/vendor/<id> one vendor's store

const PAGES = ['home', 'shop', 'map', 'vendors', 'vendor'];

function parse(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const page = parts[0] ?? '';
  if (!page) return { page: 'home', param: '' };
  if (!PAGES.includes(page)) return { page: 'home', param: '' };
  return { page, param: parts[1] ?? '' };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  const pageRef = useRef(route.page);

  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash);
      setRoute(next);
      // Start a new page at the top, but stay put when only the parameter
      // changes (picking a booth on the map, a category in the shop).
      if (next.page !== pageRef.current) window.scrollTo(0, 0);
      pageRef.current = next.page;
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

/** Build an href for a route, e.g. href('shop', 'Art Supplies'). */
export function href(page, param) {
  if (page === 'home') return '#/';
  return param ? `#/${page}/${encodeURIComponent(param)}` : `#/${page}`;
}

export function navigate(page, param) {
  window.location.hash = href(page, param);
}
