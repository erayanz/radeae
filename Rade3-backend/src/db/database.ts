import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/radeae.db');
const WASM_DIR = path.dirname(require.resolve('sql.js/dist/sql-wasm.js'));

// The data/ directory isn't tracked by git (only *.db inside it is
// gitignored, but git doesn't track empty directories at all) and nothing
// else ever creates it -- this worked in local dev only because that
// directory happened to already exist on disk from earlier manual setup. A
// fresh checkout, container, or mounted volume starts with no such
// directory, and fs.writeFileSync in persist() throws ENOENT rather than
// creating it. Ensure it exists before anything tries to read/write it.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db: Database;

const columnExists = (table: string, column: string): boolean => {
  const result = db.exec(`PRAGMA table_info(${table})`);
  if (!result.length) return false;
  const nameIdx = result[0].columns.indexOf('name');
  return result[0].values.some(row => row[nameIdx] === column);
};

const migrateEventsStatusColumns = (): void => {
  const columns: [string, string][] = [
    ['status', "TEXT NOT NULL DEFAULT 'new'"],
    ['acknowledgedBy', 'TEXT'],
    ['acknowledgedAt', 'TEXT'],
    ['resolvedBy', 'TEXT'],
    ['resolvedAt', 'TEXT'],
    ['assignedTo', 'TEXT']
  ];
  for (const [name, def] of columns) {
    if (!columnExists('events', name)) {
      db.run(`ALTER TABLE events ADD COLUMN ${name} ${def}`);
    }
  }
};

const migrateEventsSiteColumn = (): void => {
  if (!columnExists('events', 'siteId')) {
    db.run(`ALTER TABLE events ADD COLUMN siteId TEXT NOT NULL DEFAULT 'site-reserve-kaa' REFERENCES sites(id)`);
  }
};

const migrateUsersActiveColumn = (): void => {
  if (!columnExists('users', 'active')) {
    db.run(`ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1`);
  }
};

export const initDatabase = async (): Promise<void> => {
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(WASM_DIR, file)
  });

  const existing = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : undefined;
  db = new SQL.Database(existing);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      sensorId TEXT NOT NULL,
      eventType TEXT NOT NULL,
      riskLevel TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      zone TEXT NOT NULL,
      suggestedAction TEXT NOT NULL,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_riskLevel ON events(riskLevel);
    CREATE INDEX IF NOT EXISTS idx_events_eventType ON events(eventType);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('operator', 'admin')),
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      centerLatitude REAL NOT NULL,
      centerLongitude REAL NOT NULL,
      boundaryPolygon TEXT,
      protectionRadiusMeters REAL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      siteId TEXT NOT NULL REFERENCES sites(id),
      sensorLabel TEXT NOT NULL,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sensors_siteId ON sensors(siteId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sensors_siteId_label ON sensors(siteId, sensorLabel);

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      siteId TEXT NOT NULL REFERENCES sites(id),
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_zones_siteId ON zones(siteId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_zones_siteId_name ON zones(siteId, name);

    CREATE TABLE IF NOT EXISTS user_sites (
      userId TEXT NOT NULL REFERENCES users(id),
      siteId TEXT NOT NULL REFERENCES sites(id),
      PRIMARY KEY (userId, siteId)
    );
    CREATE INDEX IF NOT EXISTS idx_user_sites_userId ON user_sites(userId);
  `);

  migrateEventsStatusColumns();
  migrateEventsSiteColumn();
  migrateUsersActiveColumn();
  db.run('CREATE INDEX IF NOT EXISTS idx_events_siteId ON events(siteId)');

  persist();
};

export const getDb = (): Database => {
  if (!db) {
    throw new Error('Database not initialized — call initDatabase() first');
  }
  return db;
};

export const persist = (): void => {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};
