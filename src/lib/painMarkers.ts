import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase';
import { emitConstraintEvent } from '@/lib/constraintEvents';
import type { PainMarkerContext } from '@/types/database';

interface EmitPainMarkerInput {
  clientId: string;
  painScore: number;
  bodyRegion?: string | null;
  context?: PainMarkerContext;
  exerciseId?: string | null;
  programId?: string | null;
  notes?: string | null;
  /** If provided, also writes a 'pain_reported' audit event into constraint_events. */
  constraintId?: string | null;
  actorId?: string | null;
}

/**
 * Inserts a pain_markers row for the client.
 *
 * Optionally fires a 'pain_reported' audit entry into constraint_events so the
 * trainer's existing constraint realtime subscription picks up the signal.
 *
 * Fire-and-forget: errors are logged but not rethrown to avoid blocking the
 * live-session UI.
 */
export async function emitPainMarker(input: EmitPainMarkerInput): Promise<void> {
  if (!SUPABASE_CONFIGURED) return;

  const { error } = await supabase.from('pain_markers').insert({
    client_id: input.clientId,
    pain_score: input.painScore,
    body_region: input.bodyRegion ?? null,
    context: input.context ?? 'live_session',
    exercise_id: input.exerciseId ?? null,
    program_id: input.programId ?? null,
    notes: input.notes ?? null,
  });

  if (error) {
    console.warn('[painMarkers] insert failed', error.message);
    return;
  }

  // Optional: write a pain_reported audit event so it shows up in the trainer's
  // constraint events feed even before they open the dedicated pain panel.
  if (input.constraintId && input.actorId) {
    await emitConstraintEvent({
      constraintId: input.constraintId,
      patientId: input.clientId,
      eventType: 'pain_reported',
      actorId: input.actorId,
      metadata: {
        pain_score: input.painScore,
        body_region: input.bodyRegion ?? null,
        context: input.context ?? 'live_session',
        exercise_id: input.exerciseId ?? null,
        program_id: input.programId ?? null,
      },
    });
  }
}
