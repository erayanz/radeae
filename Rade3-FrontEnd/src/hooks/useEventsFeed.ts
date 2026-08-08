import { useState, useEffect, useRef, useCallback } from 'react';
import { eventsApi } from '../api/eventsApi';
import { createEventsStream } from '../api/eventsStream';
import { Event } from '../types';

interface FeedFilters {
  eventType?: string;
  riskLevel?: string;
  timeRange?: string;
}

const TIME_RANGE_HOURS: Record<string, number> = { hour: 1, day: 24, week: 168 };

export function useEventsFeed(siteId: string, filters?: FeedFilters) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const liveConnectedRef = useRef(false);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters?.eventType, filters?.riskLevel, filters?.timeRange]);

  // keeps live-pushed events consistent with the same filters the initial REST
  // fetch applied — otherwise a pushed event outside the active filters would
  // inflate the raw count/stats while staying invisible in the filtered list/map.
  const matchesActiveFilters = useCallback((event: Event): boolean => {
    const f = filtersRef.current;
    if (f?.eventType && event.eventType !== f.eventType) return false;
    if (f?.riskLevel && event.riskLevel !== f.riskLevel) return false;
    if (f?.timeRange) {
      const hours = TIME_RANGE_HOURS[f.timeRange];
      if (hours) {
        const diffInHours = (Date.now() - new Date(event.timestamp).getTime()) / (1000 * 60 * 60);
        if (diffInHours > hours) return false;
      }
    }
    return true;
  }, []);

  const fetchEvents = useCallback(async () => {
    // siteId is '' for the brief window before SiteContext's initial fetch
    // resolves (pages call this hook before their own !currentSite guard can
    // run, since hooks can't follow a conditional return) — skip rather than
    // hit /sites//events with an empty path segment.
    if (!siteId) return;
    setLoading(true);
    try {
      const data = await eventsApi.getEvents(siteId, filters);
      setEvents(data);
      setApiConnected(true);
      setLastUpdate(new Date());
    } catch {
      // No mock-data fallback: on failure we keep whatever events were last
      // successfully fetched (or empty, on a first-load failure) rather than
      // showing fabricated events that don't correspond to real sensors/sites.
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, [siteId, filters?.eventType, filters?.riskLevel, filters?.timeRange]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!siteId) return;
    const stream = createEventsStream(siteId, {
      onOpen: () => { liveConnectedRef.current = true; setLiveConnected(true); },
      onError: () => { liveConnectedRef.current = false; setLiveConnected(false); },
      onEvent: (envelope) => {
        const { type, event } = envelope;
        if (type === 'created') {
          if (!matchesActiveFilters(event)) return;
          setEvents(prev => prev.some(e => e.id === event.id) ? prev : [event, ...prev]);
          setLastUpdate(new Date());
        } else if (type === 'statusChanged') {
          setEvents(prev => prev.map(e => (e.id === event.id ? event : e)));
          setLastUpdate(new Date());
        }
      }
    });
    return () => stream?.close();
  }, [siteId, matchesActiveFilters]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!liveConnectedRef.current) fetchEvents();
    }, 30000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return { events, setEvents, loading, apiConnected, liveConnected, lastUpdate, refetch: fetchEvents };
}
