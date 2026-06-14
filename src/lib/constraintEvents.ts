import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase';
import type { ConstraintEventType } from '@/types/database';

/** Fire-and-forget propagation event. Duplicate once-per-actor events (23505) are expected and silent. */
export async function emitConstraintEvent(input: {
  constraintId: string;
  patientId: string;
  eventType: ConstraintEventType;
  actorId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!SUPABASE_CONFIGURED) return;
  const { error } = await supabase.from('constraint_events').insert({
    constraint_id: input.constraintId,
    patient_id: input.patientId,
    event_type: input.eventType,
    actor_id: input.actorId,
    metadata: input.metadata ?? {},
  });
  if (error && error.code !== '23505') {
    console.warn('[constraintEvents] emit failed', error.message);
  }
}
