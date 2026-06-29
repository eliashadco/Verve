import { create } from 'zustand';
import { Alert } from 'react-native';
import { normalizeProgramForBuilder } from './normalizeProgramForBuilder';
import { createId } from './utils';
import type { BuilderProgram, BuilderExercise } from './types';
import type { Exercise, ClinicalConstraint } from '@/types/database';
import { validate } from '@/features/constraints/validate';
import { emitConstraintEvent } from '@/lib/constraintEvents';
import { supabase } from '@/lib/supabase';

export interface BuilderFilter {
  q: string;
  muscle: string;
  equipment?: string;
  tags?: string[];
}

export interface BuilderState {
  // State
  program: BuilderProgram;
  hydrated: boolean;
  selectedDayIndex: number;
  selectedMuscleTarget: string;
  heatmapScope: 'all' | 'day';
  filter: BuilderFilter;
  libraryOpen: boolean;
  saveToast: boolean;
  saving: boolean;
  expandedExerciseId: string | null;
  
  // Internal config
  resolver: (key: string) => any;

  // Actions
  setHydrated: (h: boolean) => void;
  setResolver: (r: (key: string) => any) => void;
  setProgramRaw: (loose: Record<string, unknown>) => void;
  setProgramName: (name: string) => void;
  setDaysPerWeek: (count: number) => void;
  setSelectedDayIndex: (index: number) => void;
  setSelectedMuscleTarget: (target: string) => void;
  setHeatmapScope: (scope: 'all' | 'day') => void;
  setFilter: (f: BuilderFilter) => void;
  setLibraryOpen: (open: boolean) => void;
  setSaveToast: (show: boolean) => void;
  setSaving: (saving: boolean) => void;
  setExpandedExerciseId: (id: string | null) => void;

  addExerciseToSelectedDay: (t: (key: string, opts?: Record<string, string | number>) => string, nextIndex: number) => void;
  addCatalogExerciseToSelectedDay: (ex: Exercise, constraints?: ClinicalConstraint[]) => void;
  removeExercise: (dayIndex: number, exerciseId: string) => void;
  updateExerciseProperty: (dayIndex: number, exerciseId: string, field: 'sets' | 'reps' | 'targetRIR' | 'rest' | 'tempo' | 'weight' | 'notes' | 'warmup', deltaOrValue: any) => void;
  duplicateExercise: (dayIndex: number, exerciseId: string) => void;
  reorderExercises: (dayIndex: number, exercises: BuilderExercise[]) => void;
  groupExerciseWithNext: (dayIndex: number, exerciseId: string) => boolean;
  ungroupSuperset: (dayIndex: number, groupId: string) => void;
  adjustMuscleTarget: (muscle: string, delta: number) => void;
  addTrainingDay: () => boolean;
}

function resizeDays(program: BuilderProgram, count: number): BuilderProgram {
  const n = Math.max(1, Math.min(7, count));
  const days = program.days.slice();
  while (days.length < n) {
    days.push({
      label: `Day ${days.length + 1} — Workout`,
      exercises: [],
    });
  }
  if (days.length > n) {
    days.length = n;
  }
  return { ...program, days };
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  program: normalizeProgramForBuilder({}, undefined),
  hydrated: false,
  selectedDayIndex: 0,
  selectedMuscleTarget: 'quads',
  heatmapScope: 'all',
  filter: { q: '', muscle: 'all' },
  libraryOpen: false,
  saveToast: false,
  saving: false,
  expandedExerciseId: null,
  resolver: () => undefined,

  setHydrated: (h) => set({ hydrated: h }),
  setResolver: (r) => set((state) => ({ 
    resolver: r,
    program: state.hydrated ? normalizeProgramForBuilder(state.program as unknown as Record<string, unknown>, r) : state.program
  })),
  
  setProgramRaw: (loose) => set((state) => ({ 
    program: normalizeProgramForBuilder(loose, state.resolver),
    selectedDayIndex: Math.min(state.selectedDayIndex, Math.max(0, (loose.days as any[])?.length - 1 || 0))
  })),

  setProgramName: (name) => set((state) => ({
    program: normalizeProgramForBuilder({ ...state.program, name } as Record<string, unknown>, state.resolver)
  })),

  setDaysPerWeek: (count) => set((state) => ({
    program: normalizeProgramForBuilder(resizeDays(state.program, count) as unknown as Record<string, unknown>, state.resolver)
  })),

  setSelectedDayIndex: (index) => set({ selectedDayIndex: index }),
  setSelectedMuscleTarget: (target) => set({ selectedMuscleTarget: target }),
  setHeatmapScope: (scope) => set({ heatmapScope: scope }),
  setFilter: (f) => set({ filter: f }),
  setLibraryOpen: (open) => set({ libraryOpen: open }),
  setSaveToast: (show) => set({ saveToast: show }),
  setSaving: (saving) => set({ saving }),
  setExpandedExerciseId: (id) => set({ expandedExerciseId: id }),

  addExerciseToSelectedDay: (t, nextIndex) => set((state) => {
    const days = state.program.days.map((d, di) => {
      if (di !== state.selectedDayIndex) return d;
      const upperLower = nextIndex % 2 === 0 ? t('userTrial.programs.targetUpper') : t('userTrial.programs.targetLower');
      return {
        ...d,
        exercises: [
          ...d.exercises,
          {
            id: createId('pex'),
            exerciseId: '',
            name: t('userTrial.programs.builderExercise', { n: nextIndex }),
            muscle: upperLower,
            sets: 3,
            reps: '8-12',
            targetRIR: 2,
            tempo: '3-1-2-0',
            restSeconds: 90,
            rest: 90,
            weight: '',
            notes: '',
            groupId: null,
            groupOrder: d.exercises.length,
            warmup: false,
            _muscleContributions: {},
          },
        ],
      };
    });
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  addCatalogExerciseToSelectedDay: (ex, constraints) => set((state) => {
    if (constraints && constraints.length > 0) {
      const violations = validate(ex, constraints);
      const hardViolation = violations.find((v) => v.level === 'hard');
      if (hardViolation) {
        Alert.alert(
          'Restricted Exercise',
          `This exercise is restricted by your physio:\n\n• ${hardViolation.detail}${
            hardViolation.notes ? `\n\nNote: ${hardViolation.notes}` : ''
          }`,
        );
        const violatedConstraint = constraints.find((c) => c.id === hardViolation.constraintId);
        if (violatedConstraint) {
          void (async () => {
            const { data } = await supabase.auth.getUser();
            const actorId = data.user?.id;
            if (!actorId) return;
            await emitConstraintEvent({
              constraintId: hardViolation.constraintId,
              patientId: violatedConstraint.patient_id,
              eventType: 'enforced',
              actorId,
              metadata: { exercise: ex.name },
            });
          })();
        }
        return {};
      }
    }
    const contributions = Object.fromEntries((ex.primary_muscles || []).map((m) => [m.muscle, m.contribution]));
    const days = state.program.days.map((d, di) => {
      if (di !== state.selectedDayIndex) return d;
      const looseExercises = [
        ...JSON.parse(JSON.stringify(d.exercises)),
        {
          id: createId('pex'),
          exerciseId: ex.id,
          name: ex.name,
          _muscleContributions: contributions,
        },
      ];
      return { ...d, exercises: looseExercises };
    });
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),


  removeExercise: (dayIndex, exerciseId) => set((state) => {
    const days = state.program.days.map((d, i) =>
      i === dayIndex ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) } : d,
    );
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  updateExerciseProperty: (dayIndex, exerciseId, field, deltaOrValue) => set((state) => {
    const days = state.program.days.map((d, dIdx) => {
      if (dIdx !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          if (field === 'sets') return { ...ex, sets: Math.max(1, Math.min(15, ex.sets + deltaOrValue)) };
          if (field === 'targetRIR') return { ...ex, targetRIR: Math.max(0, Math.min(5, ex.targetRIR + deltaOrValue)) };
          if (field === 'reps') {
            const currentReps = parseInt(ex.reps, 10) || 10;
            return { ...ex, reps: String(Math.max(1, Math.min(50, currentReps + deltaOrValue))) };
          }
          if (['rest', 'tempo', 'weight', 'notes', 'warmup'].includes(field)) {
             return { ...ex, [field]: deltaOrValue };
          }
          return ex;
        }),
      };
    });
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  duplicateExercise: (dayIndex, exerciseId) => set((state) => {
    const days = state.program.days.map((d, dIdx) => {
      if (dIdx !== dayIndex) return d;
      const index = d.exercises.findIndex((x) => x.id === exerciseId);
      if (index === -1) return d;
      const copy = { ...d.exercises[index], id: createId('pex') };
      const nextExercises = [...d.exercises];
      nextExercises.splice(index + 1, 0, copy);
      return { ...d, exercises: nextExercises };
    });
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  reorderExercises: (dayIndex, exercises) => set((state) => {
    const days = state.program.days.map((d, dIdx) => (dIdx === dayIndex ? { ...d, exercises } : d));
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  groupExerciseWithNext: (dayIndex, exerciseId) => {
    let grouped = false;
    set((state) => {
      const day = state.program.days[dayIndex];
      if (!day) return state;
      const idx = day.exercises.findIndex((e) => e.id === exerciseId);
      // Requires an adjacent succeeding exercise to pair with.
      if (idx === -1 || idx === day.exercises.length - 1) return state;
      const ex1 = day.exercises[idx];
      const ex2 = day.exercises[idx + 1];
      // Reuse an existing group id if either side already belongs to a superset.
      const groupId = ex1.groupId || ex2.groupId || createId('superset');
      grouped = true;
      const days = state.program.days.map((d, dIdx) => {
        if (dIdx !== dayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) =>
            ex.id === ex1.id || ex.id === ex2.id ? { ...ex, groupId } : ex,
          ),
        };
      });
      return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
    });
    return grouped;
  },

  ungroupSuperset: (dayIndex, groupId) => set((state) => {
    const days = state.program.days.map((d, dIdx) => {
      if (dIdx !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises.map((ex) => (ex.groupId === groupId ? { ...ex, groupId: null } : ex)),
      };
    });
    return { program: normalizeProgramForBuilder({ ...state.program, days } as Record<string, unknown>, state.resolver) };
  }),

  adjustMuscleTarget: (muscle, delta) => set((state) => {
    const current = state.program.targets[muscle] || 0;
    return {
      program: normalizeProgramForBuilder({
        ...state.program,
        targets: { ...state.program.targets, [muscle]: Math.max(0, current + delta) },
      } as Record<string, unknown>, state.resolver)
    };
  }),

  addTrainingDay: () => {
    let added = false;
    set((state) => {
      if (state.program.days.length >= 7) return state;
      added = true;
      const next = resizeDays(state.program, state.program.days.length + 1);
      return { 
        program: normalizeProgramForBuilder(next as unknown as Record<string, unknown>, state.resolver),
        selectedDayIndex: next.days.length - 1
      };
    });
    return added;
  },
}));
