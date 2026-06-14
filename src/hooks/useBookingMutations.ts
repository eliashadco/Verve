import { supabase } from '@/lib/supabase';
import type { BookingStatus, BookingType } from '@/types/database';

export interface CreateBookingInput {
  practitionerId: string;
  clientId: string;
  startsAt: string;
  endsAt: string;
  title?: string | null;
  bookingType?: BookingType;
  status?: BookingStatus;
}

export async function createBooking(input: CreateBookingInput) {
  const { error } = await supabase.from('bookings').insert({
    practitioner_id: input.practitionerId,
    client_id: input.clientId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    title: input.title ?? 'Session',
    booking_type: input.bookingType ?? 'pt_session',
    status: input.status ?? 'confirmed',
    currency: 'EUR',
  });
  if (error) throw error;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId: string, reason?: string | null) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: nowIso,
      cancellation_reason: reason ?? 'Cancelled by practitioner',
    })
    .eq('id', bookingId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function rescheduleBooking(bookingId: string, startsAtIso: string, endsAtIso: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ starts_at: startsAtIso, ends_at: endsAtIso })
    .eq('id', bookingId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}
