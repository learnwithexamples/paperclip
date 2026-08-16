import { catTagStyle, getCatIcon } from '../data';
import { href } from '../router';
import { photoSrc } from '../site';

export default function VendorCard({ vendor }) {
  const avatar = photoSrc(vendor.avatar);
  return (
    <a className="vendor-card" href={href('vendor', vendor.id)}>
      <div className="vendor-card-banner" style={{ background: vendor.bannerColor }}>
        {avatar ? <img src={avatar} alt="" /> : vendor.avatar}
      </div>
      <div className="vendor-card-body">
        <div className="vendor-card-name">{vendor.storeName}</div>
        <div className="vendor-card-meta">
          {vendor.boothId ? `Booth ${vendor.boothId} • ` : ''}{vendor.items.length} items
        </div>
        <div className="vendor-card-cats">
          {vendor.categories.slice(0, 3).map(cat => (
            <span key={cat} className="tag" style={catTagStyle(cat)}>
              {getCatIcon(cat)} {cat}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
