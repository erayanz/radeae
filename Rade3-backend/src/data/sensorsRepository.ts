import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/database';
import { Sensor } from '../types';
import { getSiteById } from './sitesRepository';
import wadiAlAsfarSensors from './seed/wadiAlAsfarSensors.json';

const WADI_ALASFAR_SITE_ID = 'site-wadi-alasfar';

const SEED_SENSORS: Omit<Sensor, 'id' | 'siteId'>[] = [
  { sensorLabel: 'SENSOR_001', name: 'بوابة الدخول الشمالية (North Entrance Gate)', latitude: 25.90, longitude: 45.65, status: 'active' },
  { sensorLabel: 'SENSOR_002', name: 'بوابة الدخول الجنوبية (South Entrance Gate)', latitude: 25.75, longitude: 45.65, status: 'active' },
  { sensorLabel: 'SENSOR_003', name: 'مركز روضة التنهات (Rawdat Al-Tanhat Center)', latitude: 25.8389, longitude: 45.6667, status: 'active' },
  { sensorLabel: 'SENSOR_004', name: 'روضة الخفس (Rawdat Al-Khafs)', latitude: 25.80, longitude: 45.70, status: 'active' },
  { sensorLabel: 'SENSOR_005', name: 'الزاوية الشمالية الغربية (NW Corner)', latitude: 25.90, longitude: 45.55, status: 'active' },
  { sensorLabel: 'SENSOR_006', name: 'الزاوية الشمالية الشرقية (NE Corner)', latitude: 25.90, longitude: 45.75, status: 'active' },
  { sensorLabel: 'SENSOR_007', name: 'الزاوية الجنوبية الشرقية (SE Corner)', latitude: 25.70, longitude: 45.75, status: 'active' },
  { sensorLabel: 'SENSOR_008', name: 'الزاوية الجنوبية الغربية (SW Corner)', latitude: 25.70, longitude: 45.55, status: 'active' }
];

export const getSensorsBySite = (siteId: string): Sensor[] => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sensors WHERE siteId = ? ORDER BY sensorLabel');
  stmt.bind([siteId]);
  const sensors: Sensor[] = [];
  while (stmt.step()) {
    sensors.push(stmt.getAsObject() as unknown as Sensor);
  }
  stmt.free();
  return sensors;
};

const UPDATABLE_SENSOR_COLUMNS = ['sensorLabel', 'name', 'latitude', 'longitude', 'status'] as const;

export const createSensor = (siteId: string, sensor: Omit<Sensor, 'id' | 'siteId'>): Sensor | undefined => {
  if (!getSiteById(siteId)) return undefined;

  const db = getDb();
  const newSensor: Sensor = { ...sensor, id: uuidv4(), siteId };

  db.run(
    `INSERT INTO sensors (id, siteId, sensorLabel, name, latitude, longitude, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newSensor.id, newSensor.siteId, newSensor.sensorLabel, newSensor.name, newSensor.latitude, newSensor.longitude, newSensor.status]
  );
  persist();

  return newSensor;
};

export const updateSensor = (siteId: string, id: string, patch: Partial<Omit<Sensor, 'id' | 'siteId'>>): Sensor | undefined => {
  const db = getDb();
  const keys = (Object.keys(patch) as (keyof Omit<Sensor, 'id' | 'siteId'>)[])
    .filter(key => (UPDATABLE_SENSOR_COLUMNS as readonly string[]).includes(key));

  if (keys.length > 0) {
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const params = keys.map(key => patch[key]);
    db.run(`UPDATE sensors SET ${setClause} WHERE id = ? AND siteId = ?`, [...params, id, siteId] as (string | number | null)[]);
    persist();
  }

  const stmt = db.prepare('SELECT * FROM sensors WHERE id = ? AND siteId = ?');
  stmt.bind([id, siteId]);
  const found = stmt.step();
  const sensor = found ? (stmt.getAsObject() as unknown as Sensor) : undefined;
  stmt.free();
  return sensor;
};

export const deleteSensor = (siteId: string, id: string): void => {
  const db = getDb();
  db.run('DELETE FROM sensors WHERE id = ? AND siteId = ?', [id, siteId]);
  persist();
};

export const seedSensorsIfEmpty = (): void => {
  const db = getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM sensors');
  const count = (result[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  SEED_SENSORS.forEach(sensor => createSensor('site-reserve-kaa', sensor));

  console.log('🌱 Seeded default sensors for site-reserve-kaa');
};

// Checked per-site (not the global "if any sensors exist" guard above) so
// this seeds correctly even into an existing dev database that already has
// site-reserve-kaa's sensors.
export const seedWadiAlAsfarSensorsIfMissing = (): void => {
  const existing = getSensorsBySite(WADI_ALASFAR_SITE_ID);
  if (existing.length > 0) return;

  wadiAlAsfarSensors.forEach(sensor =>
    createSensor(WADI_ALASFAR_SITE_ID, sensor as Omit<Sensor, 'id' | 'siteId'>)
  );

  console.log(`🌱 Seeded ${wadiAlAsfarSensors.length} geophone sensors for site-wadi-alasfar (approximate positions -- see export script for caveats)`);
};
