/**
 * Converts a local `BuilderProgram` (saved template) into a `Program` shape
 * so the Current-tab components can render it identically to a Supabase-assigned program.
 */

import type { BuilderProgram } from '@/lib/programBuilder/types';
import type { Program, ProgramDay, ProgramDayExercise } from '@/types/database';

export function draftToProgram(draft: BuilderProgram, userId: string): Program {
  const now = new Date().toISOString();

  const days: ProgramDay[] = draft.days.map((builderDay, dayIndex) => {
    const exercises: ProgramDayExercise[] = builderDay.exercises.map((ex, exIndex) => ({
      exerciseId: ex.exerciseId || ex.id,
      sets: ex.sets,
      reps: ex.reps,
      rir: ex.targetRIR ?? null,
      restSeconds: ex.restSeconds || ex.rest || 90,
      tempo: ex.tempo || null,
      notes: ex.notes || null,
      warmup: ex.warmup ?? false,
      order: exIndex,
      supersetGroup: ex.groupId || null,
    }));

    return {
      label: builderDay.label,
      dayOfWeek: dayIndex,
      exercises,
    };
  });

  return {
    id: draft.id || `draft_${Math.random().toString(36).slice(2, 10)}`,
    name: draft.name,
    created_by: userId,
    assigned_to: null,
    focus: draft.focus || null,
    phase: null,
    duration_weeks: draft.weeksPlanned || null,
    days,
    status: 'draft',
    created_at: draft.createdAt || now,
    updated_at: draft.updatedAt || now,
  };
}
