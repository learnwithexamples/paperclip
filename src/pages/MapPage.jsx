import { useEffect, useRef } from 'react';
import { href, navigate } from '../router';
import { asset, photoSrc } from '../site';
import { useSite } from '../context/site-context';

// Booth layout matching the printed market map.
// Each section lists its columns left → right, top → bottom.
const SECTIONS = [
  {
    label: 'A',
    footer: 'Check-in Desk',
    columns: [
      ['A09', 'A08', 'A07', 'A06', 'A05', 'A04', 'A03', 'A02', 'A01'],
    ],
  },
  {
    label: 'B',
    columns: [
      ['B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22'],
      ['B11', 'B10', 'B09', 'B08', 'B07', 'B06', 'B05', 'B04', 'B03', 'B02', 'B01'],
    ],
  },
  {
    label: 'C',
    columns: [
      ['C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23', 'C24', 'C25', 'C26'],
      ['C13', 'C12', 'C11', 'C10', 'C09', 'C08', 'C07', 'C06', 'C05', 'C04', 'C03', 'C02', 'C01'],
    ],
  },
  {
    label: 'D',
    columns: [
      ['D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21', 'D22', 'D23', 'D24', 'D25', 'D26'],
      ['D13', 'D12', 'D11', 'D10', 'D09', 'D08', 'D07', 'D06', 'D05', 'D04', 'D03', 'D02', 'D01'],
    ],
  },
];

function BoothCell({ booth, selected, cellRef }) {
  const taken = booth.vendors.length > 0;
  const featured = booth.vendors.some(v => v.featured);
  const first = booth.vendors[0];
  const avatar = first ? photoSrc(first.avatar) : null;

  const classes = ['booth-cell'];
  if (featured) classes.push('featured');
  classes.push(taken ? 'active' : 'available');
  if (selected) classes.push('highlight');

  return (
    <div
      ref={cellRef}
      className={classes.join(' ')}
      style={!taken && !featured ? { background: '#E2E8F0', borderColor: '#CBD5E1', opacity: 1 } : undefined}
      onClick={() => navigate('map', selected ? undefined : booth.id)}
    >
      <div className="booth-icon">
        {taken ? (avatar ? <img src={avatar} alt="" /> : first.avatar) : '🚪'}
      </div>
      <div className="booth-num">{booth.id}</div>
      {taken && <div className="booth-name">{booth.vendors.map(v => v.storeName).join(' / ')}</div>}
    </div>
  );
}

export default function MapPage({ boothId }) {
  const { booths, map } = useSite();
  const selectedRef = useRef(null);

  const boothMap = Object.fromEntries(booths.map(b => [b.id, b]));
  const selected = boothId ? boothMap[boothId] : null;

  // Bring a deep-linked / just-clicked booth into view.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [boothId]);

  return (
    <div className="section container fade-enter">
      <div className="section-header">
        <h2>🗺️ Booth Map</h2>
        <p>Find your way around the market! Tap any booth to see its vendors.</p>
      </div>

      {map.image && (
        <figure style={{ borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 32, background: '#fff' }}>
          <img src={asset(map.image)} alt={map.caption ?? 'Market map'} style={{ width: '100%', display: 'block' }} />
          {map.caption && (
            <figcaption style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
              {map.caption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="map-container">
        <div className="map-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--brand-blue)' }} /> Active Booth</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--brand-yellow)' }} /> Featured</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#E2E8F0' }} /> Empty Booth</div>
        </div>

        {selected && (
          <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
            <div className="booth-popup-head">
              <span>📌 Booth {selected.id}</span>
              <button className="icon-btn" onClick={() => navigate('map')} aria-label="Close">✕</button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {selected.vendors.length > 0 ? selected.vendors.map(v => {
                const avatar = photoSrc(v.avatar);
                return (
                  <div key={v.id} className="booth-popup-row">
                    <div style={{ flexShrink: 0, fontSize: '1.8rem', lineHeight: 1 }}>
                      {avatar ? <img src={avatar} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : v.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{v.storeName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                        {v.items.length} items{v.categories.length ? ` · ${v.categories.slice(0, 2).join(', ')}` : ''}
                      </div>
                    </div>
                    <a className="btn btn-sm btn-secondary" href={href('vendor', v.id)}>Visit</a>
                  </div>
                );
              }) : (
                <div style={{ padding: 14, color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center' }}>
                  This booth is currently empty.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="booth-map">
          {SECTIONS.map(section => (
            <div key={section.label} className="booth-section">
              <div className="booth-row">
                {section.columns.map((col, ci) => (
                  <div key={ci} className="booth-col">
                    {col.map(id => {
                      const booth = boothMap[id];
                      if (!booth) return null;
                      const isSelected = booth.id === boothId;
                      return (
                        <BoothCell
                          key={id}
                          booth={booth}
                          selected={isSelected}
                          cellRef={isSelected ? selectedRef : undefined}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              {section.footer && <div className="booth-checkin">{section.footer}</div>}
              <div className="booth-section-label">{section.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
