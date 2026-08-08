import { Dispatch, SetStateAction } from 'react';
import { eventsApi } from '../api/eventsApi';
import { useToast } from '../context/ToastContext';
import { Event } from '../types';

export function useEventStatusHandler(siteId: string, setEvents: Dispatch<SetStateAction<Event[]>>) {
  const { toast } = useToast();

  return async (id: string, status: 'acknowledged' | 'resolved', assignedTo?: string) => {
    try {
      const updated = await eventsApi.updateEventStatus(siteId, id, status, assignedTo);
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
      toast.success(status === 'acknowledged' ? 'تم إسناد الحدث' : 'تم حل الحدث');
    } catch {
      toast.error('فشل تحديث حالة الحدث');
    }
  };
}
