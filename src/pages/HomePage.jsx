import { useEffect, useState } from 'react';
import { CATEGORIES } from '../data';
import { href } from '../router';
import { asset } from '../site';
import { useSite } from '../context/site-context';
import VendorCard from '../components/VendorCard';

function Carousel({ items }) {
  const [slide, setSlide] = useState(0);

  // Auto-advance, but pause while a video slide is showing.
  useEffect(() => {
    if (items.length < 2) return;
    if (items[slide]?.type === 'youtube' || items[slide]?.type === 'video') return;
    const t = setInterval(() => setSlide(s => (s + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [slide, items]);

  if (items.length === 0) return null;
  const item = items[slide] ?? items[0];

  return (
    <div className="carousel">
      <div className="carousel-stage">
        {item.type === 'youtube' ? (
          <iframe
            src={item.src}
            title={`Video slide ${slide + 1}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : item.type === 'video' ? (
          <video src={asset(item.src)} autoPlay muted loop playsInline />
        ) : (
          <img src={asset(item.src)} alt={item.alt ?? `Market photo ${slide + 1}`} />
        )}

        {items.length > 1 && (
          <>
            <button className="carousel-arrow prev" aria-label="Previous"
              onClick={() => setSlide(s => (s - 1 + items.length) % items.length)}>‹</button>
            <button className="carousel-arrow next" aria-label="Next"
              onClick={() => setSlide(s => (s + 1) % items.length)}>›</button>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div className="carousel-dots">
          {items.map((_, i) => (
            <button key={i} className={`carousel-dot${i === slide ? ' active' : ''}`}
              aria-label={`Go to slide ${i + 1}`} onClick={() => setSlide(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { event, carousel, flyers, vendors, booths, allProducts } = useSite();
  const featured = vendors.filter(v => v.featured);

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <img src={asset('image/banner.png')} alt={`${event.name} banner`} className="hero-banner" />
        <h1>🎉 {event.name}</h1>
        {event.tagline && <p>{event.tagline}</p>}

        <div className="hero-badges">
          {event.when && <span className="hero-badge">📅 {event.when}</span>}
          {event.where && (
            event.mapsUrl
              ? <a className="hero-badge" href={event.mapsUrl} target="_blank" rel="noopener noreferrer">📍 {event.where}</a>
              : <span className="hero-badge">📍 {event.where}</span>
          )}
        </div>

        <div className="hero-btns">
          <a className="btn home-cta-btn home-cta-blue" href={href('shop')}>🔍 Start Shopping</a>
          <a className="btn home-cta-btn home-cta-green" href={href('map')}>🗺️ Booth Map</a>
          <a className="btn home-cta-btn home-cta-yellow" href={href('vendors')}>🏪 Meet the Vendors</a>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">{booths.filter(b => b.vendors.length > 0).length}</div>
            <div className="hero-stat-label">Active Booths</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{vendors.length}</div>
            <div className="hero-stat-label">Vendors</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{allProducts.length}</div>
            <div className="hero-stat-label">Items For Sale</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{CATEGORIES.length}</div>
            <div className="hero-stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* About + carousel */}
      <div className="section section-white">
        <div className="container">
          <div className="home-about-grid">
            <div>
              <h2 style={{ marginBottom: 14 }}>About the Market</h2>
              <p style={{ color: 'var(--muted)', lineHeight: 1.75, fontSize: '0.97rem', marginBottom: 22 }}>
                {event.about}
              </p>
              {event.mapsEmbed && (
                <>
                  <div className="map-embed">
                    <iframe
                      src={event.mapsEmbed}
                      title="Event location"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                    {event.mapsUrl && (
                      <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open in Google Maps" />
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                    Tap map to open in Google Maps ↗
                  </p>
                </>
              )}
            </div>
            <Carousel items={carousel} />
          </div>
        </div>
      </div>

      {/* Flyers */}
      {flyers.length > 0 && (
        <section className="section flyers-section">
          <div className="container">
            <div className="section-header">
              <h2>Get Involved</h2>
              <p>Join us as a vendor or support the market as a sponsor.</p>
            </div>
            <div className="flyers-grid">
              {flyers.map(f => (
                <a key={f.src} href={asset(f.src)} target="_blank" rel="noopener noreferrer">
                  <img src={asset(f.src)} alt={f.alt ?? 'Market flyer'} />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured vendors */}
      {featured.length > 0 && (
        <div className="section section-white featured-vendors-section">
          <div className="container">
            <div className="section-header">
              <h2>⭐ Featured Vendors</h2>
              <p>Check out some of our amazing young entrepreneurs!</p>
            </div>
            <div className="vendors-grid">
              {featured.map(v => <VendorCard key={v.id} vendor={v} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
