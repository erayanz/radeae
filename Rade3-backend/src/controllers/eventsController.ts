import { Request, Response } from 'express';
import { getEvents, addEvent } from '../data/mockData';
import { ApiResponse, Event, FilterParams, Statistics } from '../types';

export const getAllEvents = (req: Request, res: Response): void => {
  try {
    const events = getEvents();
    
    console.log('📊 Backend - getAllEvents:', {
      total: events.length,
      high: events.filter(e => e.riskLevel === 'high').length,
      medium: events.filter(e => e.riskLevel === 'medium').length,
      low: events.filter(e => e.riskLevel === 'low').length
    });

    // ✅ إرجاع البيانات بالتنسيق الصحيح
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
    const { id } = req.params;
    const events = getEvents();
    const event = events.find(e => e.id === id);
    
    if (!event) {
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
    const newEvent = req.body as Event;
    const event = addEvent(newEvent);
    
    console.log('✅ Backend - Event created:', {
      id: event.id,
      type: event.eventType,
      risk: event.riskLevel,
      totalNow: getEvents().length
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
    const events = getEvents();
    
    const stats: Statistics = {
      totalEvents: events.length,
      highRiskEvents: events.filter(e => e.riskLevel === 'high').length,
      mediumRiskEvents: events.filter(e => e.riskLevel === 'medium').length,
      lowRiskEvents: events.filter(e => e.riskLevel === 'low').length,
      eventsByType: {
        human: events.filter(e => e.eventType === 'human').length,
        vehicle: events.filter(e => e.eventType === 'vehicle').length,
        animal: events.filter(e => e.eventType === 'animal').length,
        noise: events.filter(e => e.eventType === 'noise').length
      },
      eventsToday: events.filter(e => {
        const eventDate = new Date(e.timestamp).toDateString();
        const today = new Date().toDateString();
        return eventDate === today;
      }).length
    };
    
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
