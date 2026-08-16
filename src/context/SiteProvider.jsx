import { useMemo } from 'react';
import { buildBooths } from '../data';
import { SiteContext } from './site-context';

export default function SiteProvider({ data, children }) {
  const value = useMemo(() => {
    const { vendors } = data;
    return {
      ...data,
      booths: buildBooths(vendors),
      allProducts: vendors.flatMap(v =>
        v.items.map(item => ({
          ...item,
          boothId: v.boothId,
          vendorId: v.id,
          storeName: v.storeName,
          vendorAvatar: v.avatar,
        }))
      ),
    };
  }, [data]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
