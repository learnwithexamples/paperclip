import { useRoute } from './router';
import { useSiteData } from './site';
import SiteProvider from './context/SiteProvider';
import Nav from './components/Nav';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import MapPage from './pages/MapPage';
import VendorsPage from './pages/VendorsPage';
import VendorStorePage from './pages/VendorStorePage';

function Page({ route }) {
  switch (route.page) {
    case 'shop':    return <ShopPage category={route.param} />;
    case 'map':     return <MapPage boothId={route.param} />;
    case 'vendors': return <VendorsPage />;
    case 'vendor':  return <VendorStorePage vendorId={route.param} />;
    default:        return <HomePage />;
  }
}

export default function App() {
  const { status, data, error } = useSiteData();
  const route = useRoute();

  if (status === 'loading') {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;
  }

  if (status === 'error') {
    return (
      <div className="section container empty-state">
        <div className="empty-state-icon">😵</div>
        <p style={{ fontWeight: 700 }}>Couldn&apos;t load the market data.</p>
        <p style={{ marginTop: 6, fontSize: '0.85rem' }}>data/site.json — {String(error?.message ?? error)}</p>
      </div>
    );
  }

  return (
    <SiteProvider data={data}>
      <Nav page={route.page} brand={data.event.brand ?? data.event.name} />
      <main className="page">
        <Page route={route} />
      </main>
      <footer className="site-footer">
        {data.event.contactEmail && (
          <>
            <a href={`mailto:${data.event.contactEmail}`}>{data.event.contactEmail}</a>
            {' · '}
          </>
        )}
        {data.event.footer}
      </footer>
    </SiteProvider>
  );
}
