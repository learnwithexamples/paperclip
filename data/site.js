/*
 * EVENT CONTENT LIVES HERE.
 *
 * Edit this file, commit, and the site is updated — there is nothing to build.
 * It is plain JavaScript: keep the quotes and the commas as they are, and don't
 * leave a comma after the last entry in a list.
 *
 * The vendors and their items are NOT here — they are fetched from Firestore
 * into data/vendors.js by `node tools/fetch-vendors.mjs`. The `vendors` list at
 * the bottom of this file is only used if data/vendors.js is missing or empty.
 *
 * See README.md for what every field does.
 */

window.SITE = {

  event: {
    brand:     'PaperclipNetwork',
    name:      'Paperclip Kids Market',
    tagline:   'Shop smart, sell what you love, and make new friends! Find awesome deals at every booth.',
    when:      'Sunday, Aug 02, 2026 · 10 AM – 2 PM',
    where:     'West Valley College Parking Lot 2, Saratoga, CA 95070',
    mapsUrl:   'https://maps.app.goo.gl/no9Uk22ryZS3a31J8',
    mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1587.599513384516!2d-122.01155457980596!3d37.26670728698954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808e4abe78fc5f93%3A0xd27d3697987f97f0!2sParking%20Lot%202%2C%20N%20College%20Cir%2C%20Saratoga%2C%20CA%2095070!5e0!3m2!1sen!2sus!4v1784869360442!5m2!1sen!2sus',
    about:     'Join our Paperclip Kids Market — a fun community event where families can swap gently used kids\' clothes, toys, books, and gear! Save money, reduce waste, and discover "new-to-you" treasures while meeting other local families. Bring what you no longer need and take home something your kids will love!',
    contactEmail: '',
    footer:    '© 2026 EvoaFuture. All rights reserved.'
  },

  // Home page slideshow. type: 'image', 'youtube' or 'video'.
  carousel: [
    { type: 'image',   src: 'image/pic1.png' },
    { type: 'image',   src: 'image/pic2.png' },
    { type: 'image',   src: 'image/pic3.png' },
    { type: 'image',   src: 'image/pic4.png' },
    { type: 'image',   src: 'image/pic5.png' },
    { type: 'image',   src: 'image/pic6.png' },
    { type: 'youtube', src: 'https://www.youtube.com/embed/urswsru5rFc' }
  ],

  // "Get Involved" posters. Use [] to hide the whole section.
  flyers: [
    { src: 'image/flyer_vendor_white.JPG',  alt: 'Paperclip Kids Market vendor flyer' },
    { src: 'image/flyer_sponsor_en_2.PNG',  alt: 'Paperclip Kids Market sponsor flyer' }
  ],

  // Photo of the printed lot map, shown above the booth grid.
  map: {
    image:   'image/map_wvc.png',
    caption: 'West Valley College Parking Lot 2 — booth layout'
  },

  options: {
    // 70 of the 89 vendors never named their store, so they are listed under the
    // placeholder name the sign-up generated ("ni**08@gmail.com", "Hu**an") —
    // exactly as the original swapmarket vendor list showed them. Set this to
    // true to leave them off the Vendors page instead; the booth map still shows
    // their booths as taken either way.
    hideUnnamedStores: false
  },

  // FALLBACK ONLY — the real vendors come from data/vendors.js. These sample
  // stores are used if that file is missing, so the site is never blank.
  vendors: [
    {
      id:          'toy-box',
      storeName:   'The Toy Box',
      avatar:      '🧸',
      boothId:     'A03',
      featured:    true,
      bannerColor: 'linear-gradient(135deg,#3D883D,#84BCF3)',
      description: 'Gently loved toys and games looking for a new home.',
      items: [
        { name: 'Lego City Set',  category: 'Toys',  price: 5.00, icon: '🧱' },
        { name: 'Stuffed Bear',   category: 'Toys',  price: 2.50, icon: '🧸' },
        { name: 'UNO Card Game',  category: 'Games', price: 3.00, icon: '🃏' },
        { name: 'Puzzle 100pcs',  category: 'Toys',  price: 4.00, icon: '🧩' }
      ]
    },
    {
      id:          'book-nook',
      storeName:   'Book Nook',
      avatar:      '📚',
      boothId:     'B04',
      featured:    false,
      bannerColor: 'linear-gradient(135deg,#84BCF3,#F5C945)',
      description: 'Chapter books, picture books and art supplies.',
      items: [
        { name: 'Harry Potter #1',  category: 'Books',        price: 4.00, icon: '📖' },
        { name: 'Roald Dahl Set',   category: 'Books',        price: 6.00, icon: '📗' },
        { name: 'Colored Pencils',  category: 'Art Supplies', price: 3.50, icon: '✏️' },
        { name: 'Sketchbook',       category: 'Art Supplies', price: 2.00, icon: '📒' }
      ]
    },
    {
      id:          'costume-kingdom',
      storeName:   'Costume Kingdom',
      avatar:      '🎭',
      boothId:     'B05',
      featured:    true,
      bannerColor: 'linear-gradient(135deg,#3D883D,#F5C945)',
      description: 'Dress-up, capes and handmade accessories.',
      items: [
        { name: 'Witch Costume',   category: 'Costumes',    price:  8.00, icon: '🧙' },
        { name: 'Superhero Cape',  category: 'Costumes',    price:  5.00, icon: '🦸' },
        { name: 'DIY Bracelet',    category: 'Handcrafted', price:  2.00, icon: '📿' },
        { name: 'Princess Dress',  category: 'Costumes',    price: 10.00, icon: '👗' }
      ]
    },
    {
      id:          'jamies-closet',
      storeName:   "Jamie's Closet",
      avatar:      '👕',
      boothId:     'C07',
      featured:    false,
      bannerColor: 'linear-gradient(135deg,#F5C945,#84BCF3)',
      description: 'School uniforms and sports gear, sizes 6–12.',
      items: [
        { name: 'Polo Shirt Size 8', category: 'School Uniforms', price: 3.00, icon: '👔' },
        { name: 'PE Shorts',         category: 'Sports',          price: 2.50, icon: '🩳' },
        { name: 'School Blazer',     category: 'School Uniforms', price: 8.00, icon: '🧥' },
        { name: 'Soccer Ball',       category: 'Sports',          price: 5.00, icon: '⚽' }
      ]
    },
    {
      id:          'crafty-hands',
      storeName:   'Crafty Hands',
      avatar:      '🎨',
      boothId:     'D11',
      featured:    false,
      bannerColor: 'linear-gradient(135deg,#84BCF3,#3D883D)',
      description: 'Everything handmade by kids, for kids.',
      items: [
        { name: 'Painted Rock',     category: 'Handcrafted',  price: 1.50, icon: '🪨' },
        { name: 'Beaded Keychain',  category: 'Handcrafted',  price: 2.00, icon: '🔑' },
        { name: 'Watercolor Set',   category: 'Art Supplies', price: 4.00, icon: '🎨' }
      ]
    }
  ]

};
