import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/database';
import { Zone } from '../types';
import { getSiteById } from './sitesRepository';
import wadiAlAsfarSite from './seed/wadiAlAsfarSite.json';

const WADI_ALASFAR_SITE_ID = 'site-wadi-alasfar';

const SEED_ZONE_NAMES: string[] = [
  'بوابة الدخول الشمالية',
  'بوابة الدخول الجنوبية',
  'روضة التنهات',
  'روضة الخفس',
  'الزاوية الشمالية الغربية',
  'الزاوية الشمالية الشرقية'
];

export const getZonesBySite = (siteId: string): Zone[] => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM zones WHERE siteId = ? ORDER BY name');
  stmt.bind([siteId]);
  const zones: Zone[] = [];
  while (stmt.step()) {
    zones.push(stmt.getAsObject() as unknown as Zone);
  }
  stmt.free();
  return zones;
};

const UPDATABLE_ZONE_COLUMNS = ['name'] as const;

export const createZone = (siteId: string, zone: Omit<Zone, 'id' | 'siteId'>): Zone | undefined => {
  if (!getSiteById(siteId)) return undefined;

  const db = getDb();
  const newZone: Zone = { ...zone, id: uuidv4(), siteId };

  db.run(
    `INSERT INTO zones (id, siteId, name) VALUES (?, ?, ?)`,
    [newZone.id, newZone.siteId, newZone.name]
  );
  persist();

  return newZone;
};

export const updateZone = (siteId: string, id: string, patch: Partial<Omit<Zone, 'id' | 'siteId'>>): Zone | undefined => {
  const db = getDb();
  const keys = (Object.keys(patch) as (keyof Omit<Zone, 'id' | 'siteId'>)[])
    .filter(key => (UPDATABLE_ZONE_COLUMNS as readonly string[]).includes(key));

  if (keys.length > 0) {
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const params = keys.map(key => patch[key]);
    db.run(`UPDATE zones SET ${setClause} WHERE id = ? AND siteId = ?`, [...params, id, siteId] as (string | number | null)[]);
    persist();
  }

  const stmt = db.prepare('SELECT * FROM zones WHERE id = ? AND siteId = ?');
  stmt.bind([id, siteId]);
  const found = stmt.step();
  const zone = found ? (stmt.getAsObject() as unknown as Zone) : undefined;
  stmt.free();
  return zone;
};

export const deleteZone = (siteId: string, id: string): void => {
  const db = getDb();
  db.run('DELETE FROM zones WHERE id = ? AND siteId = ?', [id, siteId]);
  persist();
};

export const seedZonesIfEmpty = (): void => {
  const db = getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM zones');
  const count = (result[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  SEED_ZONE_NAMES.forEach(name => createZone('site-reserve-kaa', { name }));

  console.log('🌱 Seeded default zones for site-reserve-kaa');
};

// Checked per-site, same reasoning as seedWadiAlAsfarSensorsIfMissing.
export const seedWadiAlAsfarZoneIfMissing = (): void => {
  const existing = getZonesBySite(WADI_ALASFAR_SITE_ID);
  if (existing.length > 0) return;

  createZone(WADI_ALASFAR_SITE_ID, { name: wadiAlAsfarSite.zoneName });

  console.log('🌱 Seeded zone for site-wadi-alasfar');
};
