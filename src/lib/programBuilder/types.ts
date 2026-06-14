/**
 * Builder program model — mirrors `normalizeProgramForBuilder()` output in `User trial.html`.
 */

export interface BuilderMuscleContributions {
  [muscleKey: string]: number;
}

export interface BuilderExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  targetRIR: number;
  tempo: string;
  restSeconds: number;
  rest: number;
  weight: string;
  notes: string;
  groupId: string | null;
  groupOrder: number;
  warmup: boolean;
  _muscleContributions: BuilderMuscleContributions;
}

export interface BuilderDay {
  label: string;
  exercises: BuilderExercise[];
}

export interface BuilderConstraint {
  rule?: string;
  exerciseIds?: string[];
  [key: string]: unknown;
}

export interface BuilderProgram {
  id: string;
  name: string;
  focus: string;
  weeksPlanned: number;
  environment: string;
  targets: BuilderMuscleContributions;
  constraints: BuilderConstraint[];
  clientId: string | null;
  lastUsedAt: string;
  updatedAt: string;
  timeSpentMs: number;
  days: BuilderDay[];
  createdAt: string;
}

/** Catalog row shape used during normalization (subset of DB `Exercise`). */
export interface BuilderExerciseMeta {
  id: string;
  name: string;
  difficulty: string | null;
  primaryMuscles: { muscle: string; contribution: number }[];
}

export type ExerciseMetaResolver = (exerciseIdOrName: string) => BuilderExerciseMeta | null;
