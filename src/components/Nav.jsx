import { href } from '../router';
import { asset } from '../site';

const TABS = [
  { page: 'shop',    emoji: '🔍', label: 'Shop' },
  { page: 'map',     emoji: '🗺️', label: 'Map' },
  { page: 'vendors', emoji: '🏪', label: 'Vendors' },
];

export default function Nav({ page, brand }) {
  return (
    <nav>
      <div className="nav-inner">
        <a className="nav-logo" href={href('home')}>
          <div className="nav-logo-icon">
            <img src={asset('image/paperclip.png')} alt="" />
          </div>
          <span className="nav-logo-text">{brand}</span>
        </a>
        <div className="nav-tabs">
          {TABS.map(t => {
            const active = page === t.page || (t.page === 'vendors' && page === 'vendor');
            return (
              <a key={t.page} className={`nav-tab${active ? ' active' : ''}`} href={href(t.page)}>
                <span className="nav-tab-emoji">{t.emoji}</span>
                <span className="nav-tab-label"> {t.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
