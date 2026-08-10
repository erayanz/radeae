import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb, persist } from '../db/database';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'operator' | 'admin';
  active: boolean;
}

// sql.js returns SQLite's INTEGER 0/1 as a plain JS number, not a boolean --
// every read path needs this conversion, not just findByUsername, or a
// deactivated user's `active` would be the truthy number 0 is falsy but
// stored as inconsistent types across callers.
const rowToUser = (row: Record<string, unknown>): User => ({
  ...(row as unknown as Omit<User, 'active'>),
  active: Boolean(row.active)
});

export const findByUsername = (username: string): User | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);
  const found = stmt.step();
  const user = found ? rowToUser(stmt.getAsObject()) : undefined;
  stmt.free();
  return user;
};

export const createUser = (username: string, password: string, role: 'operator' | 'admin', siteIds?: string[]): User => {
  const db = getDb();
  const user: User = {
    id: uuidv4(),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    active: true
  };
  db.run(
    'INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)',
    [user.id, user.username, user.passwordHash, user.role]
  );
  persist();
  if (siteIds && siteIds.length > 0) {
    setSiteIdsForUser(user.id, siteIds);
  }
  return user;
};

// Deliberately excludes siteIds: this list is fetched by any authenticated
// user (e.g. to populate the event-assignment dropdown), and site scoping is
// more sensitive than username/role in a multi-site deployment — exposing it
// here would let any operator enumerate every user's site access. Site
// scoping is only ever read internally (login, canAccessSite) via
// getSiteIdsForUser, never returned from this general-purpose list.
export const listUsers = (): Pick<User, 'id' | 'username' | 'role' | 'active'>[] => {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, role, active FROM users ORDER BY username');
  const users: Pick<User, 'id' | 'username' | 'role' | 'active'>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    users.push({
      id: row.id as string,
      username: row.username as string,
      role: row.role as 'operator' | 'admin',
      active: Boolean(row.active)
    });
  }
  stmt.free();
  return users;
};

export const setUserActive = (id: string, active: boolean): User | undefined => {
  const db = getDb();
  db.run('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  persist();

  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  const found = stmt.step();
  const user = found ? rowToUser(stmt.getAsObject()) : undefined;
  stmt.free();
  return user;
};

export const getUserById = (id: string): User | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  const found = stmt.step();
  const user = found ? rowToUser(stmt.getAsObject()) : undefined;
  stmt.free();
  return user;
};

export const getSiteIdsForUser = (userId: string): string[] => {
  const db = getDb();
  const stmt = db.prepare('SELECT siteId FROM user_sites WHERE userId = ?');
  stmt.bind([userId]);
  const ids: string[] = [];
  while (stmt.step()) {
    ids.push(stmt.getAsObject().siteId as string);
  }
  stmt.free();
  return ids;
};

export const setSiteIdsForUser = (userId: string, siteIds: string[]): void => {
  const db = getDb();
  db.run('DELETE FROM user_sites WHERE userId = ?', [userId]);
  for (const siteId of siteIds) {
    db.run('INSERT INTO user_sites (userId, siteId) VALUES (?, ?)', [userId, siteId]);
  }
  persist();
};

export const countUsers = (): number => {
  const db = getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  return (result[0]?.values[0]?.[0] as number) ?? 0;
};

export const seedDefaultAdmin = (): void => {
  if (countUsers() > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(-10);

  createUser(username, password, 'admin');

  console.log('\n👤 ═══════════════════════════════════════════════════');
  console.log('   تم إنشاء حساب المدير الافتراضي (Default admin account created)');
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('   ⚠️  Set ADMIN_USERNAME/ADMIN_PASSWORD in .env to control this — this password is random and only shown once.');
  }
  console.log('   ═══════════════════════════════════════════════════\n');
};
