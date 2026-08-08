import { Response } from 'express';
import { Event } from '../types';

interface Client {
  res: Response;
  siteId: string;
  role: 'operator' | 'admin';
  username: string;
}

const clients = new Set<Client>();

const safeWrite = (res: Response, payload: string): void => {
  try {
    res.write(payload);
  } catch {
    removeClient(res);
  }
};

export const addClient = (res: Response, siteId: string, role: 'operator' | 'admin', username: string): void => {
  const client: Client = { res, siteId, role, username };
  clients.add(client);
  // an SSE response can emit 'error' (e.g. client network drop) without ever firing
  // the request's 'close' event — without this handler that's an unhandled
  // EventEmitter error, which crashes the whole Node process.
  res.on('error', () => {
    clients.delete(client);
  });
};

export const removeClient = (res: Response): void => {
  for (const client of clients) {
    if (client.res === res) {
      clients.delete(client);
      break;
    }
  }
};

export interface SSEEnvelope {
  type: 'created' | 'statusChanged';
  event: Event;
}

const send = (siteId: string, envelope: SSEEnvelope): void => {
  const payload = `data: ${JSON.stringify(envelope)}\n\n`;
  for (const client of clients) {
    if (client.siteId !== siteId) continue;
    // Mirrors the REST getAllEvents/getEventById restriction: non-admins only
    // receive live pushes for events assigned to them, so the SSE stream
    // can't be used to see events the list view already hides.
    if (client.role !== 'admin' && envelope.event.assignedTo !== client.username) continue;
    safeWrite(client.res, payload);
  }
};

export const broadcastEvent = (event: Event): void => {
  send(event.siteId, { type: 'created', event });
};

export const broadcastStatusChange = (event: Event): void => {
  send(event.siteId, { type: 'statusChanged', event });
};

// keep intermediary proxies (Railway, browsers) from timing out the idle connection
setInterval(() => {
  for (const client of clients) {
    safeWrite(client.res, ': heartbeat\n\n');
  }
}, 30000).unref();
