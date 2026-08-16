import { useState } from 'react';
import { CATEGORIES, getCatIcon } from '../data';
import { href, navigate } from '../router';
import { photoSrc } from '../site';
import { useSite } from '../context/site-context';
import Zoomable from '../components/Zoomable';

export default function ShopPage({ category }) {
  const { allProducts } = useSite();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = allProducts.filter(p => {
    const matchesCat = !category || p.category === category;
    const matchesQuery = !q
      || p.name.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || (p.storeName ?? '').toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="section container fade-enter">
      <div className="section-header">
        <h2>🔍 Find Something Awesome</h2>
        <p>Search everything on sale at the market</p>
      </div>

      <form className="search-box" onSubmit={e => e.preventDefault()}>
        <input
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search items, categories, stores…"
          aria-label="Search items"
        />
        {query && (
          <button type="button" className="btn btn-ghost" onClick={() => setQuery('')}>Clear</button>
        )}
      </form>

      <div className="filter-chips">
        <button className={`chip${!category ? ' active' : ''}`} onClick={() => navigate('shop')}>All</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.name}
            className={`chip${category === cat.name ? ' active' : ''}`}
            onClick={() => navigate('shop', cat.name)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {results.length > 0 ? (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            {results.length} item{results.length === 1 ? '' : 's'} found
          </p>
          <div className="results-grid">
            {results.map(item => {
              const photo = photoSrc(item.icon);
              return (
                <div key={`${item.vendorId}-${item.id}`} className="product-card">
                  <Zoomable className="product-card-img" style={{ background: item.bgColor }} src={photo} alt={item.name}>
                    {photo ? <img src={photo} alt={item.name} /> : item.icon}
                  </Zoomable>
                  <div className="product-card-body">
                    <div className="product-card-booth">
                      <span>{item.storeName}</span>
                      {item.boothId && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · 📍 Booth {item.boothId}</span>}
                    </div>
                    <div className="product-card-name">{item.name}</div>
                    <div className="product-card-cat">{getCatIcon(item.category)} {item.category}</div>
                    <div className="product-card-footer">
                      <span className="product-card-price">${item.price.toFixed(2)}</span>
                      <span style={{ display: 'flex', gap: 6 }}>
                        {item.boothId && (
                          <a className="btn btn-sm btn-ghost" href={href('map', item.boothId)}>🗺️ {item.boothId}</a>
                        )}
                        <a className="btn btn-sm btn-secondary" href={href('vendor', item.vendorId)}>
                          {photoSrc(item.vendorAvatar)
                            ? <img src={photoSrc(item.vendorAvatar)} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{item.vendorAvatar || '🏪'}</span>}
                          {item.storeName}
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🧐</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>No items found</p>
          <p style={{ marginTop: 6 }}>Try a different keyword or category!</p>
        </div>
      )}
    </div>
  );
}
