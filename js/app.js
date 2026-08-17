/*
 * Paperclip Kids Market — the whole app.
 *
 * Plain browser JavaScript, no build step and no framework. It reads the content
 * from window.SITE (data/site.js), keeps the current view in the URL hash, and
 * rewrites the <main id="app"> element whenever that hash changes.
 *
 *   #/              home
 *   #/shop          all items      #/shop/Books   filtered to a category
 *   #/map           booth map      #/map/A03      with a booth selected
 *   #/vendors       vendor list
 *   #/vendor/toy-box  one store
 */
(function () {
  'use strict';

  // ────────────────────────────────────────────────────────── helpers

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Escape anything coming from site.js before putting it into HTML. */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, function (c) { return ESCAPES[c]; });
  }

  /** An icon/avatar is either an emoji (shown as text) or a picture (shown as <img>). */
  function photoSrc(icon) {
    if (!icon) return null;
    if (/^(https?:|data:)/.test(icon)) return icon;
    if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(icon)) return icon;
    return null;
  }

  function money(n) {
    return '$' + (Number(n) || 0).toFixed(2);
  }

  function href(page, param) {
    if (page === 'home') return '#/';
    return param ? '#/' + page + '/' + encodeURIComponent(param) : '#/' + page;
  }

  /** Renders an emoji-or-photo icon inside a tile. */
  function iconHtml(icon, alt) {
    var src = photoSrc(icon);
    return src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '">' : esc(icon);
  }

  // ────────────────────────────────────────────── content from site.js

  function normalizeVendor(raw, index) {
    var id = String(raw.id !== undefined ? raw.id : index);
    var items = (raw.items || []).map(function (item, j) {
      var category = item.category || 'Misc';
      var key = id + '-' + (item.id || item.name || j);
      return {
        id: String(item.id || key),
        name: item.name || 'Item',
        category: category,
        price: Number(item.price) || 0,
        icon: item.icon || getCatIcon(category),
        bgColor: item.bgColor || pastelFor(key)
      };
    });
    var categories = raw.categories && raw.categories.length
      ? raw.categories
      : items.map(function (i) { return i.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; });

    return {
      id: id,
      storeName: raw.storeName || 'Unnamed store',
      avatar: raw.avatar || '🏪',
      boothId: raw.boothId || '',
      featured: Boolean(raw.featured),
      placeholder: Boolean(raw.placeholder),
      bannerColor: raw.bannerColor || BANNER_COLORS[index % BANNER_COLORS.length],
      description: raw.description || '',
      categories: categories,
      items: items
    };
  }

  var SITE = window.SITE || {};
  var EVENT = SITE.event || {};
  var CAROUSEL = SITE.carousel || [];
  var FLYERS = SITE.flyers || [];
  var MAP = SITE.map || {};
  var OPTIONS = SITE.options || {};

  // Vendors come from data/vendors.js (fetched from Firestore); anything listed
  // in site.js is a fallback for when that file is missing.
  var VENDOR_SOURCE = (window.SITE_VENDORS && window.SITE_VENDORS.length)
    ? window.SITE_VENDORS
    : (SITE.vendors || []);

  var VENDORS = VENDOR_SOURCE
    .filter(function (v) { return !v.hidden; })
    .map(normalizeVendor);

  /** Every booth in the layout, with the vendors sitting at it. */
  var BOOTHS = BOOTH_IDS.map(function (boothId) {
    return {
      id: boothId,
      vendors: VENDORS.filter(function (v) { return v.boothId === boothId; })
    };
  });

  var BOOTH_BY_ID = {};
  BOOTHS.forEach(function (b) { BOOTH_BY_ID[b.id] = b; });

  /** Flat list of every item, carrying its vendor along. */
  var PRODUCTS = VENDORS.reduce(function (all, v) {
    return all.concat(v.items.map(function (item) {
      return {
        id: item.id, name: item.name, category: item.category, price: item.price,
        icon: item.icon, bgColor: item.bgColor,
        boothId: v.boothId, vendorId: v.id, storeName: v.storeName, vendorAvatar: v.avatar
      };
    }));
  }, []);

  // ────────────────────────────────────────────────────────────  state

  var state = { page: 'home', param: '', query: '', slide: 0 };
  var carouselTimer = null;

  var PAGES = ['home', 'shop', 'map', 'vendors', 'vendor'];

  function parseHash() {
    var parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    var page = parts[0] || 'home';
    if (PAGES.indexOf(page) === -1) page = 'home';
    return { page: page, param: parts[1] || '' };
  }

  // ─────────────────────────────────────────────────── shared fragments

  function vendorCardHtml(v) {
    var tags = v.categories.slice(0, 3).map(function (cat) {
      return '<span class="tag" style="' + esc(catTagStyle(cat)) + '">' + esc(getCatIcon(cat) + ' ' + cat) + '</span>';
    }).join('');

    return '' +
      '<a class="vendor-card" href="' + href('vendor', v.id) + '">' +
        '<div class="vendor-card-banner" style="background:' + esc(v.bannerColor) + '">' +
          iconHtml(v.avatar, v.storeName) +
        '</div>' +
        '<div class="vendor-card-body">' +
          '<div class="vendor-card-name">' + esc(v.storeName) + '</div>' +
          '<div class="vendor-card-meta">' +
            (v.boothId ? 'Booth ' + esc(v.boothId) + ' • ' : '') + v.items.length + ' items' +
          '</div>' +
          '<div class="vendor-card-cats">' + tags + '</div>' +
        '</div>' +
      '</a>';
  }

  /** A tile that pops a bigger preview when the icon is a photo. */
  function tileHtml(className, item) {
    var src = photoSrc(item.icon);
    return '<div class="' + className + (src ? ' zoomable' : '') + '"' +
      ' style="background:' + esc(item.bgColor) + '"' +
      (src ? ' data-zoom="' + esc(src) + '"' : '') + '>' +
      iconHtml(item.icon, item.name) +
      '</div>';
  }

  function emptyStateHtml(icon, text) {
    return '<div class="empty-state"><div class="empty-state-icon">' + icon + '</div><p>' + esc(text) + '</p></div>';
  }

  // ──────────────────────────────────────────────────────────── home

  function carouselInnerHtml() {
    var item = CAROUSEL[state.slide] || CAROUSEL[0];
    var stage;

    if (item.type === 'youtube') {
      stage = '<iframe src="' + esc(item.src) + '" title="Video slide" allowfullscreen ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>';
    } else if (item.type === 'video') {
      stage = '<video src="' + esc(item.src) + '" autoplay muted loop playsinline></video>';
    } else {
      stage = '<img src="' + esc(item.src) + '" alt="' + esc(item.alt || 'Market photo') + '">';
    }

    var arrows = CAROUSEL.length > 1
      ? '<button class="carousel-arrow prev" data-slide="prev" aria-label="Previous">‹</button>' +
        '<button class="carousel-arrow next" data-slide="next" aria-label="Next">›</button>'
      : '';

    var dots = CAROUSEL.length > 1
      ? '<div class="carousel-dots">' + CAROUSEL.map(function (_, i) {
          return '<button class="carousel-dot' + (i === state.slide ? ' active' : '') + '"' +
            ' data-slide="' + i + '" aria-label="Go to slide ' + (i + 1) + '"></button>';
        }).join('') + '</div>'
      : '';

    return '<div class="carousel-stage">' + stage + arrows + '</div>' + dots;
  }

  function homeHtml() {
    var activeBooths = BOOTHS.filter(function (b) { return b.vendors.length > 0; }).length;
    var featured = VENDORS.filter(function (v) { return v.featured; });

    var badges = '';
    if (EVENT.when) badges += '<span class="hero-badge">📅 ' + esc(EVENT.when) + '</span>';
    if (EVENT.where) {
      badges += EVENT.mapsUrl
        ? '<a class="hero-badge" href="' + esc(EVENT.mapsUrl) + '" target="_blank" rel="noopener noreferrer">📍 ' + esc(EVENT.where) + '</a>'
        : '<span class="hero-badge">📍 ' + esc(EVENT.where) + '</span>';
    }

    var stats = [
      [activeBooths, 'Active Booths'],
      [VENDORS.length, 'Vendors'],
      [PRODUCTS.length, 'Items For Sale'],
      [CATEGORIES.length, 'Categories']
    ].map(function (s) {
      return '<div class="hero-stat"><div class="hero-stat-num">' + s[0] + '</div>' +
             '<div class="hero-stat-label">' + s[1] + '</div></div>';
    }).join('');

    var mapEmbed = EVENT.mapsEmbed
      ? '<div class="map-embed">' +
          '<iframe src="' + esc(EVENT.mapsEmbed) + '" title="Event location" loading="lazy" allowfullscreen ' +
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
          (EVENT.mapsUrl ? '<a href="' + esc(EVENT.mapsUrl) + '" target="_blank" rel="noopener noreferrer" aria-label="Open in Google Maps"></a>' : '') +
        '</div>' +
        '<p class="map-embed-note">Tap map to open in Google Maps ↗</p>'
      : '';

    var flyers = FLYERS.length
      ? '<section class="section flyers-section"><div class="container">' +
          '<div class="section-header"><h2>Get Involved</h2>' +
          '<p>Join us as a vendor or support the market as a sponsor.</p></div>' +
          '<div class="flyers-grid">' + FLYERS.map(function (f) {
            return '<a href="' + esc(f.src) + '" target="_blank" rel="noopener noreferrer">' +
                   '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || 'Market flyer') + '"></a>';
          }).join('') + '</div>' +
        '</div></section>'
      : '';

    var featuredSection = featured.length
      ? '<div class="section section-white featured-vendors-section"><div class="container">' +
          '<div class="section-header"><h2>⭐ Featured Vendors</h2>' +
          '<p>Check out some of our amazing young entrepreneurs!</p></div>' +
          '<div class="vendors-grid">' + featured.map(vendorCardHtml).join('') + '</div>' +
        '</div></div>'
      : '';

    return '' +
      '<div class="home-page">' +
        '<div class="hero">' +
          '<img src="image/banner.png" alt="' + esc(EVENT.name) + ' banner" class="hero-banner">' +
          '<h1>🎉 ' + esc(EVENT.name) + '</h1>' +
          (EVENT.tagline ? '<p>' + esc(EVENT.tagline) + '</p>' : '') +
          '<div class="hero-badges">' + badges + '</div>' +
          '<div class="hero-btns">' +
            '<a class="btn home-cta-btn home-cta-blue" href="#/shop">🔍 Start Shopping</a>' +
            '<a class="btn home-cta-btn home-cta-green" href="#/map">🗺️ Booth Map</a>' +
            '<a class="btn home-cta-btn home-cta-yellow" href="#/vendors">🏪 Meet the Vendors</a>' +
          '</div>' +
          '<div class="hero-stats">' + stats + '</div>' +
        '</div>' +

        '<div class="section section-white"><div class="container"><div class="home-about-grid">' +
          '<div>' +
            '<h2 class="about-heading">About the Market</h2>' +
            '<p class="about-text">' + esc(EVENT.about) + '</p>' +
            mapEmbed +
          '</div>' +
          (CAROUSEL.length ? '<div class="carousel" id="carousel">' + carouselInnerHtml() + '</div>' : '<div></div>') +
        '</div></div></div>' +

        flyers +
        featuredSection +
      '</div>';
  }

  // ──────────────────────────────────────────────────────────── shop

  function shopResultsHtml() {
    var q = state.query.trim().toLowerCase();
    var results = PRODUCTS.filter(function (p) {
      if (state.param && p.category !== state.param) return false;
      if (!q) return true;
      return p.name.toLowerCase().indexOf(q) !== -1 ||
             p.category.toLowerCase().indexOf(q) !== -1 ||
             p.storeName.toLowerCase().indexOf(q) !== -1;
    });

    if (!results.length) {
      return '<div class="no-results"><div class="no-results-icon">🧐</div>' +
             '<p class="no-results-title">No items found</p>' +
             '<p>Try a different keyword or category!</p></div>';
    }

    var cards = results.map(function (item) {
      var avatar = photoSrc(item.vendorAvatar);
      var storeBtn =
        '<a class="btn btn-sm btn-secondary" href="' + href('vendor', item.vendorId) + '">' +
          (avatar
            ? '<img class="mini-avatar" src="' + esc(avatar) + '" alt="">'
            : '<span class="mini-avatar-emoji">' + esc(item.vendorAvatar || '🏪') + '</span>') +
          esc(item.storeName) +
        '</a>';

      var mapBtn = item.boothId
        ? '<a class="btn btn-sm btn-ghost" href="' + href('map', item.boothId) + '">🗺️ ' + esc(item.boothId) + '</a>'
        : '';

      return '<div class="product-card">' +
          tileHtml('product-card-img', item) +
          '<div class="product-card-body">' +
            '<div class="product-card-booth"><span>' + esc(item.storeName) + '</span>' +
              (item.boothId ? '<span class="muted-inline"> · 📍 Booth ' + esc(item.boothId) + '</span>' : '') +
            '</div>' +
            '<div class="product-card-name">' + esc(item.name) + '</div>' +
            '<div class="product-card-cat">' + esc(getCatIcon(item.category) + ' ' + item.category) + '</div>' +
            '<div class="product-card-footer">' +
              '<span class="product-card-price">' + money(item.price) + '</span>' +
              '<span class="product-card-actions">' + mapBtn + storeBtn + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');

    return '<p class="result-count">' + results.length + ' item' + (results.length === 1 ? '' : 's') + ' found</p>' +
           '<div class="results-grid">' + cards + '</div>';
  }

  function shopHtml() {
    var chips = '<a class="chip' + (state.param ? '' : ' active') + '" href="#/shop">All</a>' +
      CATEGORIES.map(function (cat) {
        return '<a class="chip' + (state.param === cat.name ? ' active' : '') + '"' +
          ' href="' + href('shop', cat.name) + '">' + esc(cat.icon + ' ' + cat.name) + '</a>';
      }).join('');

    return '<div class="section container fade-enter">' +
        '<div class="section-header"><h2>🔍 Find Something Awesome</h2>' +
        '<p>Search everything on sale at the market</p></div>' +
        '<div class="search-box">' +
          '<input class="search-input" id="search" type="search" autocomplete="off"' +
          ' placeholder="Search items, categories, stores…" aria-label="Search items"' +
          ' value="' + esc(state.query) + '">' +
        '</div>' +
        '<div class="filter-chips">' + chips + '</div>' +
        '<div id="results">' + shopResultsHtml() + '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────── map

  function boothCellHtml(booth) {
    var taken = booth.vendors.length > 0;
    var featured = booth.vendors.some(function (v) { return v.featured; });
    var selected = booth.id === state.param;

    var classes = ['booth-cell', taken ? 'active' : 'available'];
    if (featured) classes.push('featured');
    if (selected) classes.push('highlight');
    if (!taken && !featured) classes.push('empty');

    var names = booth.vendors.map(function (v) { return v.storeName; }).join(' / ');

    return '<a class="' + classes.join(' ') + '" href="' + (selected ? '#/map' : href('map', booth.id)) + '"' +
        (selected ? ' id="selected-booth"' : '') + '>' +
        '<div class="booth-icon">' + (taken ? iconHtml(booth.vendors[0].avatar, '') : '🚪') + '</div>' +
        '<div class="booth-num">' + esc(booth.id) + '</div>' +
        (taken ? '<div class="booth-name">' + esc(names) + '</div>' : '') +
      '</a>';
  }

  function boothPanelHtml(booth) {
    var rows = booth.vendors.length
      ? booth.vendors.map(function (v) {
          return '<div class="booth-popup-row">' +
              '<div class="booth-popup-avatar">' + iconHtml(v.avatar, v.storeName) + '</div>' +
              '<div class="booth-popup-info">' +
                '<div class="booth-popup-name">' + esc(v.storeName) + '</div>' +
                '<div class="booth-popup-meta">' + v.items.length + ' items' +
                  (v.categories.length ? esc(' · ' + v.categories.slice(0, 2).join(', ')) : '') +
                '</div>' +
              '</div>' +
              '<a class="btn btn-sm btn-secondary" href="' + href('vendor', v.id) + '">Visit</a>' +
            '</div>';
        }).join('')
      : '<div class="booth-popup-empty">This booth is currently empty.</div>';

    return '<div class="card booth-panel">' +
        '<div class="booth-popup-head"><span>📌 Booth ' + esc(booth.id) + '</span>' +
        '<a class="icon-btn" href="#/map" aria-label="Close">✕</a></div>' +
        '<div class="booth-popup-body">' + rows + '</div>' +
      '</div>';
  }

  function mapHtml() {
    var selected = BOOTH_BY_ID[state.param];

    var picture = MAP.image
      ? '<figure class="map-photo">' +
          '<img src="' + esc(MAP.image) + '" alt="' + esc(MAP.caption || 'Market map') + '">' +
          (MAP.caption ? '<figcaption>' + esc(MAP.caption) + '</figcaption>' : '') +
        '</figure>'
      : '';

    var grid = MAP_SECTIONS.map(function (section) {
      var cols = section.columns.map(function (col) {
        return '<div class="booth-col">' + col.map(function (id) {
          return BOOTH_BY_ID[id] ? boothCellHtml(BOOTH_BY_ID[id]) : '';
        }).join('') + '</div>';
      }).join('');

      return '<div class="booth-section">' +
          '<div class="booth-row">' + cols + '</div>' +
          (section.footer ? '<div class="booth-checkin">' + esc(section.footer) + '</div>' : '') +
          '<div class="booth-section-label">' + esc(section.label) + '</div>' +
        '</div>';
    }).join('');

    return '<div class="section container fade-enter">' +
        '<div class="section-header"><h2>🗺️ Booth Map</h2>' +
        '<p>Find your way around the market! Tap any booth to see its vendors.</p></div>' +
        picture +
        '<div class="map-container">' +
          '<div class="map-legend">' +
            '<div class="legend-item"><div class="legend-dot dot-active"></div> Active Booth</div>' +
            '<div class="legend-item"><div class="legend-dot dot-featured"></div> Featured</div>' +
            '<div class="legend-item"><div class="legend-dot dot-empty"></div> Empty Booth</div>' +
          '</div>' +
          (selected ? boothPanelHtml(selected) : '') +
          '<div class="booth-map">' + grid + '</div>' +
        '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────── vendors & store

  function vendorsHtml() {
    // Vendors who never set up a store can be left off this page; they still
    // show as taken on the map. Switch it in data/site.js.
    var listed = OPTIONS.hideUnnamedStores
      ? VENDORS.filter(function (v) { return !v.placeholder; })
      : VENDORS;

    return '<div class="section container fade-enter">' +
        '<div class="section-header"><h2>🏪 All Vendors</h2>' +
        '<p>Meet all the amazing young entrepreneurs at the market!</p></div>' +
        (listed.length
          ? '<div class="vendors-grid">' + listed.map(vendorCardHtml).join('') + '</div>'
          : emptyStateHtml('🏪', 'No vendors listed yet — check back soon!')) +
      '</div>';
  }

  function vendorHtml() {
    var vendor = null;
    for (var i = 0; i < VENDORS.length; i++) {
      if (VENDORS[i].id === state.param) { vendor = VENDORS[i]; break; }
    }

    if (!vendor) {
      return '<div class="section container empty-state fade-enter">' +
          '<div class="empty-state-icon">🤔</div>' +
          '<p class="empty-state-title">That store doesn’t exist.</p>' +
          '<a class="btn btn-primary" href="#/vendors">← All vendors</a>' +
        '</div>';
    }

    var avatarSrc = photoSrc(vendor.avatar);
    var tags = vendor.categories.map(function (cat) {
      return '<a class="tag tag-link" style="' + esc(catTagStyle(cat)) + '" href="' + href('shop', cat) + '">' +
        esc(getCatIcon(cat) + ' ' + cat) + '</a>';
    }).join('');

    var items = vendor.items.length
      ? '<div class="store-grid">' + vendor.items.map(function (item) {
          return '<div class="store-item">' +
              tileHtml('store-item-img', item) +
              '<div class="store-item-body">' +
                '<div class="store-item-name">' + esc(item.name) + '</div>' +
                '<div class="store-item-cat">' + esc(getCatIcon(item.category) + ' ' + item.category) + '</div>' +
                '<div class="store-item-price">' + money(item.price) + '</div>' +
              '</div>' +
            '</div>';
        }).join('') + '</div>'
      : emptyStateHtml('📦', 'No items listed yet.');

    return '<div class="fade-enter">' +
        '<div class="store-banner" style="background:' + esc(vendor.bannerColor) + '">' +
          '<a class="btn btn-ghost btn-sm store-back" href="#/vendors">← Back</a>' +
          '<div class="store-banner-avatar' + (avatarSrc ? ' zoomable' : '') + '"' +
            (avatarSrc ? ' data-zoom="' + esc(avatarSrc) + '"' : '') + '>' +
            iconHtml(vendor.avatar, vendor.storeName) +
          '</div>' +
          '<h1>' + esc(vendor.storeName) + '</h1>' +
          (vendor.boothId
            ? '<div class="store-banner-booth">📍 <a href="' + href('map', vendor.boothId) + '">Booth ' + esc(vendor.boothId) + '</a></div>'
            : '') +
        '</div>' +
        '<div class="container store-body">' +
          (vendor.description ? '<div class="card store-desc">' + esc(vendor.description) + '</div>' : '') +
          (vendor.categories.length
            ? '<div class="card store-cats"><span class="store-cats-label">SELLS:</span>' + tags + '</div>'
            : '') +
          '<h2>Items For Sale (' + vendor.items.length + ')</h2>' +
          items +
        '</div>' +
      '</div>';
  }

  // ──────────────────────────────────────────────── image preview box

  var zoomBox = null;
  var zoomSrc = null;

  function closeZoom() {
    if (zoomBox) zoomBox.hidden = true;
    zoomSrc = null;
  }

  function openZoom(tile, src) {
    if (zoomSrc === src) { closeZoom(); return; }

    if (!zoomBox) {
      zoomBox = document.createElement('div');
      zoomBox.className = 'lightbox';
      zoomBox.hidden = true;
      document.body.appendChild(zoomBox);
    }

    var rect = tile.getBoundingClientRect();
    var size = Math.min(window.innerWidth - 24, window.innerHeight - 24, 400);
    var above = rect.top - size - 10;
    var raw = above >= 8 ? above : rect.bottom + 10;

    zoomBox.innerHTML =
      '<button class="lightbox-close" aria-label="Close preview">✕</button>' +
      '<img src="' + esc(src) + '" alt="" style="max-height:' + (size - 16) + 'px">';
    zoomBox.style.width = size + 'px';
    zoomBox.style.top = Math.max(8, Math.min(raw, window.innerHeight - size - 8)) + 'px';
    zoomBox.style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - size / 2, window.innerWidth - size - 8)) + 'px';
    zoomBox.hidden = false;
    zoomSrc = src;
  }

  // ───────────────────────────────────────────────────────── rendering

  var app = document.getElementById('app');

  function scheduleCarousel() {
    clearTimeout(carouselTimer);
    if (state.page !== 'home' || CAROUSEL.length < 2) return;
    var current = CAROUSEL[state.slide];
    // Hold on video slides so they can be watched.
    if (current && (current.type === 'youtube' || current.type === 'video')) return;
    carouselTimer = setTimeout(function () { showSlide(state.slide + 1); }, 4000);
  }

  function showSlide(index) {
    var box = document.getElementById('carousel');
    if (!box) return;
    state.slide = ((index % CAROUSEL.length) + CAROUSEL.length) % CAROUSEL.length;
    box.innerHTML = carouselInnerHtml();
    scheduleCarousel();
  }

  function render() {
    var route = parseHash();
    if (route.page !== state.page) {
      state.query = '';
      if (route.page !== 'home') state.slide = 0;
    }
    state.page = route.page;
    state.param = route.param;

    closeZoom();
    clearTimeout(carouselTimer);

    if (state.page === 'shop') app.innerHTML = shopHtml();
    else if (state.page === 'map') app.innerHTML = mapHtml();
    else if (state.page === 'vendors') app.innerHTML = vendorsHtml();
    else if (state.page === 'vendor') app.innerHTML = vendorHtml();
    else app.innerHTML = homeHtml();

    // Nav highlight — the store page keeps the Vendors tab lit.
    var current = state.page === 'vendor' ? 'vendors' : state.page;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === current);
    });

    if (state.page === 'shop') {
      var input = document.getElementById('search');
      input.addEventListener('input', function () {
        state.query = input.value;
        document.getElementById('results').innerHTML = shopResultsHtml();
      });
    }

    if (state.page === 'map') {
      var cell = document.getElementById('selected-booth');
      if (cell) cell.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    scheduleCarousel();
  }

  // ────────────────────────────────────────────────────────── wiring

  document.addEventListener('click', function (e) {
    var slideBtn = e.target.closest('[data-slide]');
    if (slideBtn) {
      var which = slideBtn.getAttribute('data-slide');
      if (which === 'prev') showSlide(state.slide - 1);
      else if (which === 'next') showSlide(state.slide + 1);
      else showSlide(Number(which));
      return;
    }

    if (e.target.closest('.lightbox-close')) { closeZoom(); return; }

    var tile = e.target.closest('[data-zoom]');
    if (tile) { openZoom(tile, tile.getAttribute('data-zoom')); return; }

    if (zoomBox && !zoomBox.hidden && !e.target.closest('.lightbox')) closeZoom();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeZoom();
  });

  var lastPage = null;
  window.addEventListener('hashchange', function () {
    var next = parseHash();
    render();
    // Start a new page at the top, but stay put when only the parameter changes
    // (picking a booth on the map, a category in the shop).
    if (next.page !== lastPage) window.scrollTo(0, 0);
    lastPage = next.page;
  });

  // ───────────────────────────────────────────────────────────── boot

  document.getElementById('brand').textContent = EVENT.brand || EVENT.name || 'Market';
  if (EVENT.name) document.title = EVENT.name;

  document.getElementById('footer').innerHTML =
    (EVENT.contactEmail
      ? '<a href="mailto:' + esc(EVENT.contactEmail) + '">' + esc(EVENT.contactEmail) + '</a> · '
      : '') + esc(EVENT.footer || '');

  lastPage = parseHash().page;
  render();
})();
