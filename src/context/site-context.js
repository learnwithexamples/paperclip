import { createContext, useContext } from 'react';

export const SiteContext = createContext(null);

/** Event content, vendors, derived booths and the flat product list. */
export const useSite = () => useContext(SiteContext);
