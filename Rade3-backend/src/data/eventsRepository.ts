import { v4 as uuidv4 } from 'uuid';
import { getDb, persist } from '../db/database';
import { Event, FilterParams, Statistics } from '../types';
import wadiAlAsfarEventsRaw from './seed/wadiAlAsfarEvents.json';

const WADI_ALASFAR_SITE_ID = 'site-wadi-alasfar';

const SEED_EVENTS: Omit<Event, 'id' | 'timestamp' | 'status' | 'acknowledgedBy' | 'acknowledgedAt' | 'resolvedBy' | 'resolvedAt' | 'assignedTo' | 'siteId'>[] = [
  {
    sensorId: 'SENSOR_001', eventType: 'vehicle', riskLevel: 'high',
    zone: 'بوابة الدخول الشمالية', description: 'مركبة غير مصرح بها قرب المدخل الشمالي',
    latitude: 25.9000, longitude: 45.6500, suggestedAction: 'إرسال دورية أمنية فوراً + تفعيل الكاميرات'
  },
  {
    sensorId: 'SENSOR_003', eventType: 'animal', riskLevel: 'low',
    zone: 'روضة التنهات', description: 'غزال عربي في المنطقة المحمية',
    latitude: 25.8389, longitude: 45.6667, suggestedAction: 'مراقبة مستمرة فقط'
  },
  {
    sensorId: 'SENSOR_004', eventType: 'human', riskLevel: 'medium',
    zone: 'روضة الخفس', description: 'حركة إنسان مريبة في روضة الخفس',
    latitude: 25.8000, longitude: 45.7000, suggestedAction: 'تنبيه الدوريات القريبة + توجيه الكاميرا'
  },
  {
    sensorId: 'SENSOR_002', eventType: 'noise', riskLevel: 'low',
    zone: 'بوابة الدخول الجنوبية', description: 'ضوضاء طبيعية - حيوانات برية',
    latitude: 25.7500, longitude: 45.6500, suggestedAction: 'مراقبة مستمرة فقط'
  },
  {
    sensorId: 'SENSOR_005', eventType: 'vehicle', riskLevel: 'high',
    zone: 'الزاوية الشمالية الغربية', description: 'محاولة دخول غير مصرح بها',
    latitude: 25.9000, longitude: 45.5500, suggestedAction: 'إرسال دورية أمنية فوراً + تفعيل الكاميرات'
  },
  {
    sensorId: 'SENSOR_006', eventType: 'animal', riskLevel: 'low',
    zone: 'الزاوية الشمالية الشرقية', description: 'نعام في موطنها الطبيعي',
    latitude: 25.9000, longitude: 45.7500, suggestedAction: 'مراقبة مستمرة فقط'
  }
];

export const seedIfEmpty = (): void => {
  const db = getDb();
  const result = db.exec('SELECT COUNT(*) as count FROM events');
  const count = result[0]?.values[0]?.[0] as number ?? 0;
  if (count > 0) return;

  SEED_EVENTS.forEach((config, index) => {
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date(Date.now() - (index * 5 + i) * 60 * 1000).toISOString();
      addEvent({
        id: uuidv4(),
        timestamp,
        sensorId: config.sensorId,
        eventType: config.eventType,
        riskLevel: config.riskLevel,
        latitude: config.latitude + (Math.random() - 0.5) * 0.01,
        longitude: config.longitude + (Math.random() - 0.5) * 0.01,
        zone: config.zone,
        description: config.description,
        suggestedAction: config.suggestedAction,
        status: 'new',
        acknowledgedBy: null,
        acknowledgedAt: null,
        resolvedBy: null,
        resolvedAt: null,
        assignedTo: null,
        siteId: 'site-reserve-kaa'
      });
    }
  });

  console.log('🌱 Seeded database with initial demo events');
};

// Historical, experimental AI-model-classified seismic events (Wadi Al Asfar
// survey, weak_labels_v1 -- see RadeaeAIModel/scripts/export_wadi_alasfar_dashboard_events.py
// for the sampling/geolocation methodology and its caveats). Checked
// per-site so it seeds correctly even into an existing dev database that
// already has events for site-reserve-kaa.
export const seedWadiAlAsfarEventsIfMissing = (): void => {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE siteId = ?');
  stmt.bind([WADI_ALASFAR_SITE_ID]);
  stmt.step();
  const count = (stmt.getAsObject().count as number) ?? 0;
  stmt.free();
  if (count > 0) return;

  const events = wadiAlAsfarEventsRaw as unknown as Event[];
  events.forEach(event => addEvent(event));

  console.log(`🌱 Seeded ${events.length} historical events for site-wadi-alasfar (experimental AI-model output, not live detections)`);
};

// Was 500 -- too low for site-wadi-alasfar's 1,515 seeded historical events:
// the frontend doesn't pass an explicit limit, so requests were silently
// truncated to the most recent 500 by timestamp, which broke the
// time-stratified sampling the export script deliberately did (see
// RadeaeAIModel/scripts/export_wadi_alasfar_dashboard_events.py). 2000
// comfortably covers that site while still being a sane cap for live sites.
const DEFAULT_LIMIT = 2000;

export const getEvents = (siteId: string, filters: FilterParams = {}): Event[] => {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  conditions.push('siteId = ?');
  params.push(siteId);

  if (filters.eventType) {
    conditions.push('eventType = ?');
    params.push(filters.eventType);
  }
  if (filters.riskLevel) {
    conditions.push('riskLevel = ?');
    params.push(filters.riskLevel);
  }
  if (filters.timeRange && filters.timeRange !== 'all') {
    const hoursMap: Record<string, number> = { hour: 1, day: 24, week: 168 };
    const hours = hoursMap[filters.timeRange];
    if (hours) {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      conditions.push('timestamp >= ?');
      params.push(cutoff);
    }
  }
  if (filters.assignedToUsername) {
    conditions.push('assignedTo = ?');
    params.push(filters.assignedToUsername);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit ?? DEFAULT_LIMIT;
  const offset = filters.offset ?? 0;

  const stmt = db.prepare(
    `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...params, limit, offset]);

  const events: Event[] = [];
  while (stmt.step()) {
    events.push(stmt.getAsObject() as unknown as Event);
  }
  stmt.free();

  return events;
};

export const getEventById = (siteId: string, id: string): Event | undefined => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM events WHERE id = ? AND siteId = ?');
  stmt.bind([id, siteId]);
  const found = stmt.step();
  const event = found ? (stmt.getAsObject() as unknown as Event) : undefined;
  stmt.free();
  return event;
};

export const addEvent = (event: Event): Event => {
  const db = getDb();
  if (!event.id) event.id = uuidv4();
  if (!event.timestamp) event.timestamp = new Date().toISOString();

  db.run(
    `INSERT INTO events (id, timestamp, sensorId, siteId, eventType, riskLevel, latitude, longitude, zone, suggestedAction, description, status, acknowledgedBy, acknowledgedAt, resolvedBy, resolvedAt, assignedTo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NULL, NULL, NULL, NULL, NULL)`,
    [
      event.id, event.timestamp, event.sensorId, event.siteId, event.eventType, event.riskLevel,
      event.latitude, event.longitude, event.zone, event.suggestedAction, event.description
    ]
  );
  persist();

  // return what was actually persisted (status/acknowledgedBy/etc are DB-assigned
  // defaults, not present on the caller's input object — returning `event` as-is
  // would ship status:undefined to callers and SSE subscribers instead of 'new')
  return getEventById(event.siteId, event.id) as Event;
};

export const updateEventStatus = (
  siteId: string,
  id: string,
  status: 'acknowledged' | 'resolved',
  username: string,
  assignedTo?: string
): Event | undefined => {
  const db = getDb();
  const now = new Date().toISOString();

  if (status === 'acknowledged') {
    db.run(
      `UPDATE events SET status = ?, acknowledgedBy = ?, acknowledgedAt = ?, assignedTo = ? WHERE id = ? AND siteId = ?`,
      [status, username, now, assignedTo ?? null, id, siteId]
    );
  } else {
    db.run(
      `UPDATE events
       SET status = ?, resolvedBy = ?, resolvedAt = ?,
           acknowledgedBy = COALESCE(acknowledgedBy, ?),
           acknowledgedAt = COALESCE(acknowledgedAt, ?)
       WHERE id = ? AND siteId = ?`,
      [status, username, now, username, now, id, siteId]
    );
  }
  persist();
  return getEventById(siteId, id);
};

const scalar = (sql: string, params: (string | number)[] = []): number => {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  return (row.count as number) ?? 0;
};

export const getStatistics = (siteId: string): Statistics => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalEvents: scalar('SELECT COUNT(*) as count FROM events WHERE siteId = ?', [siteId]),
    highRiskEvents: scalar("SELECT COUNT(*) as count FROM events WHERE riskLevel = 'high' AND siteId = ?", [siteId]),
    mediumRiskEvents: scalar("SELECT COUNT(*) as count FROM events WHERE riskLevel = 'medium' AND siteId = ?", [siteId]),
    lowRiskEvents: scalar("SELECT COUNT(*) as count FROM events WHERE riskLevel = 'low' AND siteId = ?", [siteId]),
    eventsByType: {
      human: scalar("SELECT COUNT(*) as count FROM events WHERE eventType = 'human' AND siteId = ?", [siteId]),
      vehicle: scalar("SELECT COUNT(*) as count FROM events WHERE eventType = 'vehicle' AND siteId = ?", [siteId]),
      animal: scalar("SELECT COUNT(*) as count FROM events WHERE eventType = 'animal' AND siteId = ?", [siteId]),
      noise: scalar("SELECT COUNT(*) as count FROM events WHERE eventType = 'noise' AND siteId = ?", [siteId])
    },
    eventsToday: scalar('SELECT COUNT(*) as count FROM events WHERE timestamp >= ? AND siteId = ?', [todayStart.toISOString(), siteId])
  };
};

export const resetEvents = (siteId: string): void => {
  const db = getDb();
  db.run('DELETE FROM events WHERE siteId = ?', [siteId]);
  persist();
  console.log('🔄 eventsRepository - all events cleared');
};
