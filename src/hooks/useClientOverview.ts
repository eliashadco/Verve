import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';

import { useAdherence } from '@/hooks/useAdherence';
import { useBookings } from '@/hooks/useBookings';
import { useLinkedPractitioners } from '@/hooks/useLinkedPractitioners';
import { usePrograms } from '@/hooks/usePrograms';
import { useWearableSummary } from '@/hooks/useWearableSummary';

export function useClientOverview(clientId: string | null) {
  const programs = usePrograms(clientId, 'client');
  const bookings = useBookings(clientId, 'client');
  const adherence = useAdherence(clientId, 200);
  const wearable = useWearableSummary();
  const practitioners = useLinkedPractitioners(clientId);

  const activeProgram = useMemo(
    () => programs.programs.find((program) => program.status === 'active') ?? programs.programs[0] ?? null,
    [programs.programs],
  );

  const nextBooking = useMemo(
    () => bookings.bookings.find((booking) => new Date(booking.starts_at).getTime() > Date.now()) ?? null,
    [bookings.bookings],
  );

  const streak = useMemo(() => {
    if (adherence.entries.length === 0) return 0;
    const dates = new Set(adherence.entries.map((entry) => format(parseISO(entry.created_at), 'yyyy-MM-dd')));
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let count = 0;
    while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
      count += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }
    return count;
  }, [adherence.entries]);

  return {
    data: {
      activeProgram,
      nextBooking,
      bookings: bookings.bookings,
      adherenceEntries: adherence.entries,
      programCount: programs.programs.length,
      wearable: wearable.summary,
      practitioner: practitioners.data[0] ?? null,
      streak,
    },
    loading: programs.loading || bookings.loading || adherence.loading || practitioners.loading,
    error: programs.error ?? bookings.error ?? practitioners.error ?? null,
    refresh: async () => {
      await Promise.all([programs.refresh(), bookings.refresh(), adherence.refresh(), practitioners.refresh()]);
    },
  };
}
