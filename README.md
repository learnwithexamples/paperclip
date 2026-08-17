# Paperclip Kids Market — static site

A simplified, **static** version of [swapmarket](../swapmarket): the public-facing
market site as plain HTML, CSS and JavaScript. No build step, no framework, no npm,
no server — GitHub Pages serves these files exactly as they are, for free.

**What it does:** home page (event details, photo carousel, flyers, featured vendors),
a searchable item listing, an interactive booth map, a vendor directory, and a page
per vendor store.

**What was removed** compared to swapmarket: login, sign-up/onboarding, the vendor
portal (item editor, photo upload, POS/sales log), the `/admax` admin dashboard, and
Firebase Auth/Firestore/Storage. Nothing is written at runtime, so there is nothing
to secure and nothing to pay for.

```
index.html            the page shell (nav, main, footer)
css/styles.css        all styling
data/site.js          ← event details, photos, options (hand-edited)
data/vendors.js       ← vendors and their items (generated from Firestore)
js/data.js            categories, colors, booth layout
js/app.js             routing + rendering (~460 lines, plain browser JS)
image/                all photos
tools/fetch-vendors.mjs   refreshes data/vendors.js — run by hand, never by the site
```

To preview it, just double-click `index.html` — it runs straight from disk, no
server needed.

---

## Refreshing the vendor list

The vendors, their booths and their items come from the swapmarket Firestore
database. They are fetched **once, by hand** and saved into
[`data/vendors.js`](data/vendors.js) — the published site never talks to Firebase,
has no API key in it, and keeps working if the database goes away.

```bash
node tools/fetch-vendors.mjs            # refresh data/vendors.js
node tools/fetch-vendors.mjs --dry-run  # just show what would change
```

Needs Node 18+ and nothing else — no npm install. Credentials are read from
`../swapmarket/.env` (or from `FIREBASE_PROJECT_ID` / `FIREBASE_API_KEY`, or
`--env=PATH`); the `vendors` collection is world-readable, so this is a plain
read over Firestore's REST API and no service account is involved.

The Vendors page is a faithful mirror of the original swapmarket vendor list:
**every vendor, in the same order, with the store names exactly as they are in
Firestore** — including the `first2**last2` placeholder names the backfill script
generated for people who signed up but never named a store, and the vendors an
admin flagged `disabled` (that flag only greyed out a row in the admin table; the
public list always showed them).

What the tool changes on the way through:

- **Drops personal and internal data.** The `email` field, the sales log and the
  `backfilled` marker are never written to `data/vendors.js`, because that file is
  published on a public website. Nothing that was on display is removed.
- **Copies photos into `image/vendors/`** and rewrites the links, so no picture
  depends on the DigitalOcean Spaces bucket staying online. `--no-photos` keeps
  the remote URLs instead.

Current snapshot: 89 vendors, 29 items across 7 stores, 81 of 83 booths taken,
7 featured.

Two optional switches, both off by default:

- `node tools/fetch-vendors.mjs --mask-names` writes the placeholder names as
  "Booth A06" instead of `ni**08@gmail.com`.
- `options.hideUnnamedStores: true` in `data/site.js` leaves those vendors off the
  Vendors page entirely (the map still shows their booths as taken).

You can also just edit `data/vendors.js` by hand; the next fetch overwrites it.

## Everyday use: edit the content

The event details, photos and display options live in
[`data/site.js`](data/site.js). Edit it (the GitHub web editor is fine), commit,
and the site is updated. It is plain JavaScript: keep the quotes, keep the commas
between entries, and don't leave a comma after the last one in a list.

```js
window.SITE = {

  event: {
    brand:        'PaperclipNetwork',            // name in the nav bar
    name:         'Paperclip Kids Market',       // big heading + browser tab
    tagline:      'Shop smart, sell what you love…',
    when:         'Sunday, Aug 02, 2026 · 10 AM – 2 PM',
    where:        'West Valley College Parking Lot 2, Saratoga, CA 95070',
    mapsUrl:      'https://maps.app.goo.gl/…',   // location badge + map click-through
    mapsEmbed:    'https://www.google.com/maps/embed?pb=…',  // '' hides the embed
    about:        'Join our Paperclip Kids Market — …',
    contactEmail: '',                            // '' hides the footer mailto link
    footer:       '© 2026 EvoaFuture. All rights reserved.'
  },

  carousel: [                                    // home page slideshow, in order
    { type: 'image',   src: 'image/pic1.png' },
    { type: 'youtube', src: 'https://www.youtube.com/embed/VIDEO_ID' }
  ],

  flyers: [                                      // "Get Involved" posters; [] hides it
    { src: 'image/flyer_vendor_white.JPG', alt: 'Vendor flyer' }
  ],

  map: {
    image:   'image/map_wvc.png',                // photo of the printed lot map; '' hides it
    caption: 'West Valley College Parking Lot 2 — booth layout'
  },

  options: {
    hideUnnamedStores: false   // true = leave "Booth A06" vendors off the Vendors
                               // page (the map still shows their booths as taken)
  },

  vendors: [ /* fallback only — the real list is data/vendors.js */ ]

};
```

A vendor record, in either file, looks like this:

```js
{
  id:          'toy-box',        // permanent — it is the URL (#/vendor/toy-box)
  storeName:   'The Toy Box',
  avatar:      '🧸',             // emoji, or an image path like 'image/toybox.jpg'
  boothId:     'A03',            // must exist on the map: A01–A09, B01–B22, C01–C26, D01–D26
  featured:    true,             // also show on the home page
  hidden:      false,            // true = hide this vendor everywhere (set by hand)
  disabled:    false,            // admin flag copied from Firestore; display-neutral
  placeholder: false,            // true = store name was auto-generated, never chosen
  bannerColor: 'linear-gradient(135deg,#3D883D,#84BCF3)',
  description: 'Gently loved toys and games.',
  items: [
    { name: 'Lego City Set', category: 'Toys', price: 5.00, icon: '🧱' }
  ]
}
```

Notes:

- **Categories** are fixed in [`js/data.js`](js/data.js): Misc, School Uniforms, Books,
  Toys, Costumes, Handcrafted, Games, Sports, Art Supplies. A vendor's category tags
  are worked out from their items automatically.
- **`icon` / `avatar`** may be an emoji, a file under `image/`, or a full `https://…`
  URL. Anything that looks like a picture is rendered as one and enlarges when tapped;
  anything else is shown as text.
- **Photos** go in `image/` and are referenced as `'image/my-photo.jpg'`. Please resize
  them first — the ones inherited from swapmarket are 1–3 MB each, which is slow on
  phones.
- Empty sections hide themselves — no flyers, no "Get Involved"; no featured vendors,
  no featured strip.
- All text from these files is HTML-escaped before display, so apostrophes, `&` and
  anything that looks like a tag are shown as written, never treated as markup.

## Links you can share

The current view is kept in the URL hash, so every page is a shareable link and the
back button works — and because it's all one file, GitHub Pages needs no special
configuration:

| URL | Page |
| --- | --- |
| `#/` | Home |
| `#/shop` | All items |
| `#/shop/Books` | Items in one category |
| `#/map` | Booth map |
| `#/map/A03` | Booth map with booth A03 selected |
| `#/vendors` | Vendor directory |
| `#/vendor/toy-box` | One vendor's store |

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: _Deploy from a branch_**,
   branch `main`, folder `/ (root)`. Save.

That's it — no Actions workflow, no build. The site appears at
`https://<user>.github.io/<repo>/` and every later push updates it within a minute.
All paths are relative, so it works just as well at a custom domain or in a subfolder.

## Editing the code

Open the files in any editor; reload the browser to see changes. There is nothing to
install and nothing to compile.

- `js/app.js` builds each page as an HTML string and writes it into `<main id="app">`
  whenever the URL hash changes. Navigation is ordinary `<a href="#/…">` links.
- `js/data.js` holds the category list, the color palette and the booth grid
  (sections A–D, matching the printed map).
- `css/styles.css` is organised in the same order as the pages.
