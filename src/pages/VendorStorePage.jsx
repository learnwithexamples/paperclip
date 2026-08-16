import { catTagStyle, getCatIcon } from '../data';
import { href } from '../router';
import { photoSrc } from '../site';
import { useSite } from '../context/site-context';
import Zoomable from '../components/Zoomable';

export default function VendorStorePage({ vendorId }) {
  const { vendors } = useSite();
  const vendor = vendors.find(v => v.id === vendorId);

  if (!vendor) {
    return (
      <div className="section container empty-state fade-enter">
        <div className="empty-state-icon">🤔</div>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>That store doesn&apos;t exist.</p>
        <a className="btn btn-primary" href={href('vendors')}>← All vendors</a>
      </div>
    );
  }

  const avatar = photoSrc(vendor.avatar);

  return (
    <div className="fade-enter">
      <div className="store-banner" style={{ background: vendor.bannerColor }}>
        <a className="btn btn-ghost btn-sm store-back" href={href('vendors')}>← Back</a>
        <Zoomable className="store-banner-avatar" src={avatar} alt={vendor.storeName}>
          {avatar ? <img src={avatar} alt={vendor.storeName} /> : vendor.avatar}
        </Zoomable>
        <h1>{vendor.storeName}</h1>
        {vendor.boothId && (
          <div className="store-banner-booth">
            📍 <a href={href('map', vendor.boothId)} style={{ color: '#fff' }}>Booth {vendor.boothId}</a>
          </div>
        )}
      </div>

      <div className="container" style={{ marginTop: 24, paddingBottom: 40 }}>
        {vendor.description && (
          <div className="card" style={{ marginBottom: 16, color: 'var(--muted)' }}>{vendor.description}</div>
        )}

        {vendor.categories.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted)' }}>SELLS:</span>
              {vendor.categories.map(cat => (
                <a key={cat} className="tag" style={{ ...catTagStyle(cat), fontSize: '0.85rem', textDecoration: 'none' }} href={href('shop', cat)}>
                  {getCatIcon(cat)} {cat}
                </a>
              ))}
            </div>
          </div>
        )}

        <h2>Items For Sale ({vendor.items.length})</h2>
        {vendor.items.length > 0 ? (
          <div className="store-grid">
            {vendor.items.map(item => {
              const photo = photoSrc(item.icon);
              return (
                <div key={item.id} className="store-item">
                  <Zoomable className="store-item-img" style={{ background: item.bgColor }} src={photo} alt={item.name}>
                    {photo ? <img src={photo} alt={item.name} /> : item.icon}
                  </Zoomable>
                  <div className="store-item-body">
                    <div className="store-item-name">{item.name}</div>
                    <div className="store-item-cat">{getCatIcon(item.category)} {item.category}</div>
                    <div className="store-item-price">${item.price.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No items listed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
