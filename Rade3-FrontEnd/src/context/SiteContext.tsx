import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sitesApi } from '../api/sitesApi';
import { useAuth } from './AuthContext';
import { Site } from '../types';

const SITE_ID_KEY = 'radeae_site_id';

interface SiteContextValue {
  sites: Site[];
  currentSite: Site | null;
  setCurrentSiteId: (id: string) => void;
  loading: boolean;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(() => localStorage.getItem(SITE_ID_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    sitesApi.getSites()
      .then(fetchedSites => {
        setSites(fetchedSites);
        setCurrentSiteIdState(prev => {
          if (prev && fetchedSites.some(s => s.id === prev)) return prev;
          return fetchedSites[0]?.id ?? null;
        });
      })
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, [user]);

  const setCurrentSiteId = (id: string) => {
    setCurrentSiteIdState(id);
    localStorage.setItem(SITE_ID_KEY, id);
  };

  const currentSite = sites.find(s => s.id === currentSiteId) ?? null;

  return (
    <SiteContext.Provider value={{ sites, currentSite, setCurrentSiteId, loading }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = (): SiteContextValue => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
};
