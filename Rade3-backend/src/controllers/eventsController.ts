import { Request, Response } from 'express';
import { getEvents, addEvent, getEventById as findEventById, resetEvents, getStatistics as computeStatistics, updateEventStatus } from '../data/eventsRepository';
import { findByUsername } from '../data/usersRepository';
import { getSiteById } from '../data/sitesRepository';
import { Event, FilterParams, UpdateStatusPayload } from '../types';
import { broadcastEvent, broadcastStatusChange, addClient, removeClient } from '../services/sseBroadcaster';

export const getAllEvents = (req: Request, res: Response): void => {
  try {
    const { siteId } = req.params;
    const { eventType, riskLevel, timeRange, limit, offset } = req.query;

    const filters: FilterParams = {
      eventType: typeof eventType === 'string' ? eventType : undefined,
      riskLevel: typeof riskLevel === 'string' ? riskLevel : undefined,
      timeRange: typeof timeRange === 'string' ? (timeRange as FilterParams['timeRange']) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      // Non-admins only ever see events assigned to them -- admins see
      // everything (including unassigned 'new' events, so they have
      // something to triage/assign in the first place).
      assignedToUsername: req.user?.role === 'admin' ? undefined : req.user?.username
    };

    const events = getEvents(siteId, filters);

    res.json({
      success: true,
      data: events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Backend - Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
};

export const getEventById = (req: Request, res: Response): void => {
  try {
    const { id, siteId } = req.params;
    const event = findEventById(siteId, id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الحدث',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Non-admins can only view events assigned to them -- mirrors the
    // getAllEvents restriction so this endpoint can't be used to look up an
    // event's details by ID that the list view already hides.
    if (req.user?.role !== 'admin' && event.assignedTo !== req.user?.username) {
      res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الحدث',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب الحدث بنجاح',
      data: event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الحدث',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const createEvent = (req: Request, res: Response): void => {
  try {
    const { siteId } = req.params;
    if (!getSiteById(siteId)) {
      res.status(404).json({
        success: false,
        message: 'الموقع غير موجود',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const newEvent = req.body as Event;
    newEvent.siteId = siteId;
    const event = addEvent(newEvent);
    broadcastEvent(event);

    console.log('✅ Backend - Event created:', {
      id: event.id,
      type: event.eventType,
      risk: event.riskLevel
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحدث بنجاح',
      data: event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Error in createEvent:', err);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الحدث',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

export const getStatistics = (req: Request, res: Response): void => {
  try {
    const { siteId } = req.params;
    const stats = computeStatistics(siteId);

    res.status(200).json({
      success: true,
      message: 'تم جلب الإحصائيات بنجاح',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

const VALID_TRANSITIONS: Record<Event['status'], Event['status'][]> = {
  new: ['acknowledged', 'resolved'],
  acknowledged: ['resolved'],
  resolved: []
};

export const updateEventStatusHandler = (req: Request, res: Response): void => {
  try {
    const { id, siteId } = req.params;
    const { status, assignedTo } = req.body as UpdateStatusPayload;

    if (status !== 'acknowledged' && status !== 'resolved') {
      res.status(400).json({ success: false, message: 'قيمة حالة غير صالحة' });
      return;
    }

    const existing = findEventById(siteId, id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'لم يتم العثور على الحدث' });
      return;
    }

    // Assignment is an admin-only action -- operators can resolve events
    // assigned to them but cannot assign/reassign events themselves.
    if (status === 'acknowledged' && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'إسناد الأحداث متاح للمدير فقط' });
      return;
    }

    // Resolving is allowed for admins, or for the operator the event is
    // currently assigned to -- not for an arbitrary authenticated operator,
    // since non-admins can't see (and shouldn't be able to act on) events
    // that aren't assigned to them.
    if (status === 'resolved' && req.user?.role !== 'admin' && existing.assignedTo !== req.user?.username) {
      res.status(403).json({ success: false, message: 'لا يمكنك حل حدث غير مسند إليك' });
      return;
    }

    // Reassignment: an already-acknowledged event can be re-submitted with
    // status:'acknowledged' and a different assignedTo to change who it's
    // assigned to, without needing to pass through 'new' again. This is the
    // one allowed status "self-transition" -- everything else still follows
    // VALID_TRANSITIONS below (in particular, a resolved event can never be
    // reassigned or reopened this way).
    const isReassignment = status === 'acknowledged' && existing.status === 'acknowledged';

    if (!isReassignment && !VALID_TRANSITIONS[existing.status].includes(status)) {
      res.status(409).json({ success: false, message: 'لا يمكن تغيير الحالة من الحالة الحالية' });
      return;
    }

    if (status === 'acknowledged') {
      if (!assignedTo || typeof assignedTo !== 'string') {
        res.status(400).json({ success: false, message: 'يجب تحديد المستخدم المسند إليه الحدث' });
        return;
      }
      if (!findByUsername(assignedTo)) {
        res.status(400).json({ success: false, message: 'المستخدم المحدد غير موجود' });
        return;
      }
    }

    const username = req.user!.username;
    const updated = updateEventStatus(siteId, id, status, username, status === 'acknowledged' ? assignedTo : undefined);
    broadcastStatusChange(updated!);

    res.status(200).json({
      success: true,
      message: status === 'acknowledged' ? 'تم إسناد الحدث' : 'تم حل الحدث',
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: 'خطأ في تحديث حالة الحدث', error: err.message, timestamp: new Date().toISOString() });
  }
};

export const streamEvents = (req: Request, res: Response): void => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  req.socket.setTimeout(0);
  res.write('retry: 3000\n\n');

  addClient(res, req.params.siteId, req.user!.role, req.user!.username);
  req.on('close', () => removeClient(res));
};

export const clearAllEvents = (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    resetEvents(siteId);

    console.log('🗑️ All events cleared');

    res.json({
      success: true,
      message: 'تم مسح جميع الأحداث بنجاح',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear events'
    });
  }
};
