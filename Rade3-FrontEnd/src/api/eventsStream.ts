import { API_BASE_URL, TOKEN_KEY } from './httpClient';
import { Event } from '../types';

export interface SSEEnvelope {
  type: 'created' | 'statusChanged';
  event: Event;
}

export interface EventsStreamHandlers {
  onEvent: (envelope: SSEEnvelope) => void;
  onOpen?: () => void;
  onError?: () => void;
}

export interface EventsStreamController {
  close: () => void;
}

const RECONNECT_DELAY_MS = 5000;

export const createEventsStream = (siteId: string, handlers: EventsStreamHandlers): EventsStreamController | null => {
  if (!localStorage.getItem(TOKEN_KEY)) return null;

  let source: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || closed) return;

    source = new EventSource(`${API_BASE_URL}/sites/${siteId}/events/stream?token=${encodeURIComponent(token)}`);
    source.onopen = () => handlers.onOpen?.();
    source.onmessage = (e: MessageEvent) => {
      try {
        handlers.onEvent(JSON.parse(e.data) as SSEEnvelope);
      } catch {
        // ignore malformed/heartbeat frames
      }
    };
    // EventSource retries on its own by default, as fast as the browser allows —
    // that hammers the server on an expired/invalid token. Close it ourselves and
    // reconnect on a fixed delay instead, and stop entirely once the token is gone.
    source.onerror = () => {
      handlers.onError?.();
      source?.close();
      if (!closed) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  };

  connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    }
  };
};
