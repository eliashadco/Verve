import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

import { useBookings } from '@/hooks/useBookings';
import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';
import type { Role } from '@/types/database';

const INTERESTED_KEY = 'verve_schedule_events_interested_v1';

export interface ScheduleEvent {
  id: string;
  type: 'session' | 'class' | 'community';
  title: string;
  date: string;
  time: string;
  instructor: string;
  location: string;
  intensity?: string;
  going?: string[];
}

const DISCOVERY_EVENTS: ScheduleEvent[] = [
  {
    id: 'class-yoga',
    type: 'class',
    title: 'Recovery Yoga',
    date: '2026-05-02',
    time: '18:00',
    instructor: 'Coach Lina',
    location: 'Studio B',
    intensity: 'Low',
  },
  {
    id: 'community-run',
    type: 'community',
    title: 'Community 5K Run',
    date: '2026-05-04',
    time: '07:00',
    instructor: 'Verve Team',
    location: 'City Park',
    intensity: 'Medium',
  },
];

export function buildMonthCells(year: number, monthIndex: number, events: ScheduleEvent[]) {
  const first = new Date(year, monthIndex, 1);
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { day, date, events: events.filter((event) => event.date === date) };
    }),
  ];
}

export function useScheduleEvents(userId: string | null, role: Role | null = 'client') {
  const bookings = useBookings(userId, role);
  const [interestedIds, setInterestedIds] = useState<string[]>([]);
  const discovery = USER_TRIAL_DEMO_FLAGS.enabled ? DISCOVERY_EVENTS : [];

  useEffect(() => {
    AsyncStorage.getItem(INTERESTED_KEY)
      .then((raw) => {
        if (raw) setInterestedIds(JSON.parse(raw) as string[]);
      })
      .catch(() => {});
  }, []);

  const sessionEvents: ScheduleEvent[] = useMemo(
    () =>
      bookings.bookings.map((booking) => {
        const dateObj = new Date(booking.starts_at);
        return {
          id: booking.id,
          type: 'session',
          title: booking.title ?? 'Session',
          date: format(dateObj, 'yyyy-MM-dd'),
          time: format(dateObj, 'HH:mm'),
          instructor: 'Practitioner',
          location: 'Verve Clinic',
        } as ScheduleEvent;
      }),
    [bookings.bookings],
  );

  const events = useMemo(() => [...sessionEvents, ...discovery], [discovery, sessionEvents]);

  const toggleInterested = (id: string) => {
    setInterestedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id];
      AsyncStorage.setItem(INTERESTED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return {
    events,
    discovery,
    interestedIds,
    toggleInterested,
    loading: bookings.loading,
    error: bookings.error,
    refresh: bookings.refresh,
  };
}
