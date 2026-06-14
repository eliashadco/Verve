import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Booking, Role } from '@/types/database';

interface CancelBookingInput {
  bookingId: string;
  reason: string;
}

export function useBookings(userId: string | null, role: Role | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !role) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const column = role === 'client' ? 'client_id' : 'practitioner_id';
    const { data, error: e } = await supabase
      .from('bookings')
      .select('*')
      .eq(column, userId)
      .order('starts_at', { ascending: true });
    if (e) {
      setError(e.message);
      setBookings([]);
    } else {
      setBookings((data ?? []) as Booking[]);
      setError(null);
    }
    setLoading(false);
  }, [userId, role]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelBooking = useCallback(
    async ({ bookingId, reason }: CancelBookingInput) => {
      const nowIso = new Date().toISOString();
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          cancellation_reason: reason,
        })
        .eq('id', bookingId)
        .select('*')
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) return;

      setBookings((previous) =>
        previous.map((booking) => (booking.id === bookingId ? ({ ...booking, ...(data as Booking) }) : booking)),
      );
    },
    [],
  );

  return { bookings, loading, error, refresh: load, cancelBooking };
}
