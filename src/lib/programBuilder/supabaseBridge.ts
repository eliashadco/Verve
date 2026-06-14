import type { BuilderProgram } from '@/lib/programBuilder/types';
import type { Program, ProgramDay, ProgramDayExercise } from '@/types/database';

import { normalizeProgramForBuilder } from '@/lib/programBuilder/normalizeProgramForBuilder';
import type { ExerciseMetaResolver } from '@/lib/programBuilder/types';

/** Map assigned Supabase program → loose object for `normalizeProgramForBuilder`. */
export function supabaseProgramToBuilderLoose(program: Program): Record<string, unknown> {
  return {
    id: program.id,
    name: program.name,
    focus: program.focus ?? 'Custom',
    weeksPlanned: program.duration_weeks ?? 4,
    environment: 'Gym',
    targets: {},
    constraints: [],
    clientId: program.assigned_to,
    lastUsedAt: '',
    updatedAt: program.updated_at,
    timeSpentMs: 0,
    createdAt: program.created_at,
    days: program.days.map((d) => ({
      label: d.label,
      exercises: d.exercises.map((ex, order) => programExerciseToLoose(ex, order)),
    })),
  };
}

function programExerciseToLoose(ex: ProgramDayExercise, order: number): Record<string, unknown> {
  return {
    exerciseId: ex.exerciseId,
    sets: ex.sets,
    reps: ex.reps,
    targetRIR: ex.rir ?? undefined,
    rir: ex.rir ?? undefined,
    tempo: ex.tempo ?? undefined,
    restSeconds: ex.restSeconds,
    rest: ex.restSeconds,
    notes: ex.notes ?? undefined,
    warmup: ex.warmup,
    groupId: ex.supersetGroup ?? null,
    groupOrder: ex.order ?? order,
  };
}

export function supabaseProgramToBuilder(program: Program, resolveMeta?: ExerciseMetaResolver): BuilderProgram {
  return normalizeProgramForBuilder(supabaseProgramToBuilderLoose(program), resolveMeta);
}

/** Persistable patch for `programs` table (days JSON). Does not set status/name unless caller merges. */
export function builderProgramToSupabaseDays(program: BuilderProgram): ProgramDay[] {
  return program.days.map((d, dayIdx) => ({
    label: d.label,
    dayOfWeek: dayIdx % 7,
    exercises: d.exercises.map((ex, order) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      rir: ex.targetRIR,
      restSeconds: ex.restSeconds,
      tempo: ex.tempo || null,
      notes: ex.notes || null,
      warmup: ex.warmup,
      order,
      supersetGroup: ex.groupId,
    })),
  }));
}
