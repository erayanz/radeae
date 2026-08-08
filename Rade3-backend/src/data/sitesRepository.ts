import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/database';
import { Site } from '../types';
import wadiAlAsfarSite from './seed/wadiAlAsfarSite.json';

// نفس نقاط حدود المحمية المستخدمة في Rade3-FrontEnd/src/components/GoogleMapView.tsx
const RESERVE_BOUNDARY: { lat: number; lng: number }[] = [
  { lat: 27.20, lng: 44.80 },
  { lat: 27.50, lng: 45.20 },
  { lat: 27.60, lng: 45.80 },
  { lat: 27.50, lng: 46.50 },
  { lat: 27.20, lng: 47.00 },
  { lat: 26.80, lng: 47.20 },
  { lat: 26.40, lng: 47.30 },
  { lat: 26.00, lng: 47.20 },
  { lat: 25.60, lng: 47.00 },
  { lat: 25.30, lng: 46.70 },
  { lat: 25.00, lng: 46.40 },
  { lat: 24.90, lng: 46.00 },
  { lat: 25.00, lng: 45.50 },
  { lat: 25.20, lng: 45.10 },
  { lat: 25.50, lng: 44.80 },
  { lat: 25.90, lng: 44.60 },
  { lat: 26.30, lng: 44.50 },
  { lat: 26.70, lng: 44.60 }
];

export const getAllSites = (): Site[] => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sites ORDER BY name');
  const sites: Site[] = [];
  while (stmt.step()) {
    sites.push(stmt.getAsObject() as unknown as Site);
  }
  stmt.free();
  return sites;
};

export const getSiteById = (id: string): Site | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sites WHERE id = ?');
  stmt.bind([id]);
  const found = stmt.step();
  const site = found ? (stmt.getAsObject() as unknown as Site) : undefined;
  stmt.free();
  return site;
};

export const createSite = (site: Omit<Site, 'id'> & { id?: string }): Site => {
  const db = getDb();
  const newSite: Site = { ...site, id: site.id ?? uuidv4() };

  db.run(
    `INSERT INTO sites (id, name, nameAr, centerLatitude, centerLongitude, boundaryPolygon, protectionRadiusMeters)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      newSite.id, newSite.name, newSite.nameAr, newSite.centerLatitude, newSite.centerLongitude,
      newSite.boundaryPolygon, newSite.protectionRadiusMeters
    ]
  );
  persist();

  return newSite;
};

const UPDATABLE_SITE_COLUMNS = [
  'name', 'nameAr', 'centerLatitude', 'centerLongitude', 'boundaryPolygon', 'protectionRadiusMeters'
] as const;

export const updateSite = (id: string, patch: Partial<Omit<Site, 'id'>>): Site | undefined => {
  const db = getDb();
  const keys = (Object.keys(patch) as (keyof Omit<Site, 'id'>)[])
    .filter(key => (UPDATABLE_SITE_COLUMNS as readonly string[]).includes(key));
  if (keys.length === 0) return getSiteById(id);

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const params = keys.map(key => patch[key]);

  db.run(`UPDATE sites SET ${setClause} WHERE id = ?`, [...params, id] as (string | number | null)[]);
  persist();

  return getSiteById(id);
};

export const deleteSite = (id: string): { success: boolean; reason?: string } => {
  const db = getDb();

  const sensorsStmt = db.prepare('SELECT COUNT(*) as count FROM sensors WHERE siteId = ?');
  sensorsStmt.bind([id]);
  sensorsStmt.step();
  const sensorsCount = (sensorsStmt.getAsObject().count as number) ?? 0;
  sensorsStmt.free();

  const zonesStmt = db.prepare('SELECT COUNT(*) as count FROM zones WHERE siteId = ?');
  zonesStmt.bind([id]);
  zonesStmt.step();
  const zonesCount = (zonesStmt.getAsObject().count as number) ?? 0;
  zonesStmt.free();

  if (sensorsCount > 0 || zonesCount > 0) {
    return { success: false, reason: 'يوجد مجسات أو مناطق مرتبطة بهذا الموقع' };
  }

  db.run('DELETE FROM sites WHERE id = ?', [id]);
  persist();

  return { success: true };
};

export const seedSitesIfEmpty = (): void => {
  const db = getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM sites');
  const count = (result[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  createSite({
    id: 'site-reserve-kaa',
    name: 'King Abdulaziz Royal Reserve',
    nameAr: 'محمية الملك عبدالعزيز الملكية',
    centerLatitude: 26.25,
    centerLongitude: 45.90,
    boundaryPolygon: JSON.stringify(RESERVE_BOUNDARY),
    protectionRadiusMeters: 50000
  });

  console.log('🌱 Seeded default site: محمية الملك عبدالعزيز الملكية');
};

// Separate from seedSitesIfEmpty (which only runs once, when the whole
// sites table is empty) so this new site gets added even to an existing
// dev database that already has site-reserve-kaa seeded. Checked by id,
// not global count.
export const seedWadiAlAsfarSiteIfMissing = (): void => {
  if (getSiteById(wadiAlAsfarSite.id)) return;

  createSite({
    id: wadiAlAsfarSite.id,
    name: wadiAlAsfarSite.name,
    nameAr: wadiAlAsfarSite.nameAr,
    centerLatitude: wadiAlAsfarSite.centerLatitude,
    centerLongitude: wadiAlAsfarSite.centerLongitude,
    boundaryPolygon: wadiAlAsfarSite.boundaryPolygon,
    protectionRadiusMeters: wadiAlAsfarSite.protectionRadiusMeters
  });

  console.log('🌱 Seeded site: وادي الأصفر - مسح زلزالي (experimental AI-model historical data)');
};
