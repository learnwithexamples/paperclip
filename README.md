# Paperclip Kids Market — static site

A simplified, **static** version of [swapmarket](../swapmarket): the public-facing
market site with no backend, no accounts and no running costs. It builds to plain
HTML/CSS/JS and is hosted free on GitHub Pages.

**What it does:** home page (event details, photo carousel, flyers, featured vendors),
a searchable item listing, an interactive booth map, a vendor directory, and a page
per vendor store.

**What was removed** compared to swapmarket: login, sign-up/onboarding, the vendor
portal (item editor, photo upload, POS/sales log), the `/admax` admin dashboard,
Firebase Auth/Firestore/Storage, and the DigitalOcean Spaces migration scripts.
Nothing is written at runtime, so there is nothing to secure and nothing to pay for.

---

## Everyday use: edit the content

All content lives in one file — [`public/data/site.json`](public/data/site.json).
Edit it (in the GitHub web UI is fine), commit, and the site redeploys itself.
No code changes needed.

```jsonc
{
  "event": {
    "brand":     "PaperclipNetwork",              // nav bar name
    "name":      "Paperclip Kids Market",         // hero heading
    "tagline":   "Shop smart, sell what you love…",
    "when":      "Sunday, Aug 02, 2026 · 10 AM – 2 PM",
    "where":     "West Valley College Parking Lot 2, Saratoga, CA 95070",
    "mapsUrl":   "https://maps.app.goo.gl/…",     // location badge + map click-through
    "mapsEmbed": "https://www.google.com/maps/embed?pb=…",  // "" hides the embed
    "about":     "Join our Paperclip Kids Market — …",
    "contactEmail": "",                            // "" hides the footer mailto link
    "footer":    "© 2026 EvoaFuture. All rights reserved."
  },

  "carousel": [                        // home page slideshow, in order
    { "type": "image",   "src": "image/pic1.png" },
    { "type": "youtube", "src": "https://www.youtube.com/embed/VIDEO_ID" }
  ],

  "flyers": [                          // "Get Involved" section; [] hides it
    { "src": "image/flyer_vendor_white.JPG", "alt": "Vendor flyer" }
  ],

  "map": {
    "image":   "image/map_wvc.png",    // photo of the printed lot map; "" hides it
    "caption": "West Valley College Parking Lot 2 — booth layout"
  },

  "vendors": [
    {
      "id":          "toy-box",        // permanent — it is the URL (#/vendor/toy-box)
      "storeName":   "The Toy Box",
      "avatar":      "🧸",             // emoji, or an image path like "image/stores/toybox.jpg"
      "boothId":     "A03",            // must match the map: A01–A09, B01–B22, C01–C26, D01–D26
      "featured":    true,             // shows on the home page
      "hidden":      false,            // true = hide this vendor everywhere
      "bannerColor": "linear-gradient(135deg,#3D883D,#84BCF3)",
      "description": "Gently loved toys and games.",
      "items": [
        { "name": "Lego City Set", "category": "Toys", "price": 5, "icon": "🧱" }
      ]
    }
  ]
}
```

Notes:

- **Categories** are fixed in [`src/data.js`](src/data.js): Misc, School Uniforms, Books,
  Toys, Costumes, Handcrafted, Games, Sports, Art Supplies. A vendor's category tags are
  derived from their items automatically.
- **`icon` / `avatar`** may be an emoji, a path under `public/` (`image/…`), or a full
  `https://…` URL. Anything that looks like a picture is rendered as one and can be
  clicked to enlarge; anything else is shown as text.
- **Photos** go in `public/image/` and are referenced without the leading `public/`
  (`"image/my-photo.jpg"`). Please resize them before committing — the images inherited
  from swapmarket are 1–3 MB each, which is slow on phones.
- **Deleting the sample vendors** is fine; empty sections hide themselves.

## Links you can share

Routing is hash-based, so every view has a stable URL that works on GitHub Pages
without any server configuration:

| URL | Page |
| --- | --- |
| `#/` | Home |
| `#/shop` | All items |
| `#/shop/Books` | Items filtered to one category |
| `#/map` | Booth map |
| `#/map/A03` | Booth map with booth A03 selected |
| `#/vendors` | Vendor directory |
| `#/vendor/toy-box` | One vendor's store |

## Deploy to GitHub Pages

One-time setup:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Every push to `main` then builds and publishes automatically via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The site lands at
`https://<user>.github.io/<repo>/`.

The build uses `base: './'` (relative asset URLs), so the same output also works at a
custom domain root or in a subfolder — the repo name is not hard-coded anywhere.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
npm run preview    # serve the production build
npm run lint
```

Stack: React 19 + Vite, no other runtime dependencies.

```
public/data/site.json   ← all content
public/image/           ← all photos
src/
  App.jsx               page shell + routing switch
  router.js             hash router (#/shop, #/vendor/<id>, …)
  site.js               loads + normalizes site.json, asset()/photoSrc() helpers
  data.js               categories, colors, booth layout (A/B/C/D sections)
  context/              site data provider (vendors, booths, product list)
  components/           Nav, VendorCard, Zoomable (image preview)
  pages/                Home, Shop, Map, Vendors, VendorStore
```
