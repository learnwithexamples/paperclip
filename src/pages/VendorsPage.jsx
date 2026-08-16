import { useSite } from '../context/site-context';
import VendorCard from '../components/VendorCard';

export default function VendorsPage() {
  const { vendors } = useSite();

  return (
    <div className="section container fade-enter">
      <div className="section-header">
        <h2>🏪 All Vendors</h2>
        <p>Meet all the amazing young entrepreneurs at the market!</p>
      </div>

      {vendors.length > 0 ? (
        <div className="vendors-grid">
          {vendors.map(v => <VendorCard key={v.id} vendor={v} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏪</div>
          <p>No vendors listed yet — check back soon!</p>
        </div>
      )}
    </div>
  );
}
