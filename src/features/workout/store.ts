import { create } from 'zustand';

export type SetData = {
  id: string;
  setNum: number;
  kg: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  tempo: string;
  isLogged: boolean;
};

export type ExerciseSessionData = {
  id: string;
  label: string; // e.g. A1, B1
  name: string;
  muscles: string[]; // e.g. ['quads', 'glutes']
  isConstrained: boolean;
  restSeconds: number;
  targetSetsStr: string;
  sets: SetData[];
  muscleContributions: Record<string, number>;
};

interface LiveSessionState {
  timerSeconds: number;
  volumeKg: number;
  musclePcts: Record<string, number>;
  activeExerciseIndex: number;
  exercises: ExerciseSessionData[];
  
  incrementTimer: () => void;
  logSet: (exId: string, setId: string, kg: number, reps: number, rir: number | null) => void;
  addSet: (exId: string) => void;
  copyPrevSet: (exId: string, currentSetNum: number) => void;
  advanceExercise: (exId: string) => void;
  endSession: () => void;
}

const mockExercises: ExerciseSessionData[] = [
  {
    id: 'ex1',
    label: 'A1',
    name: 'Box Squat',
    muscles: ['quads', 'glutes', 'core'],
    isConstrained: true,
    restSeconds: 90,
    targetSetsStr: '3 × 8 reps',
    muscleContributions: { quads: 30, glutes: 22, core: 10 },
    sets: [
      { id: 'ex1-1', setNum: 1, kg: 45, reps: 8, rir: 4, rpe: 6, tempo: '3-1-2-0', isLogged: true },
      { id: 'ex1-2', setNum: 2, kg: 45, reps: 8, rir: null, rpe: null, tempo: '3-1-2-0', isLogged: false },
      { id: 'ex1-3', setNum: 3, kg: 45, reps: 8, rir: null, rpe: null, tempo: '3-1-2-0', isLogged: false },
    ],
  },
  {
    id: 'ex2',
    label: 'B1',
    name: 'Trap Bar Deadlift',
    muscles: ['glutes', 'hams', 'erect'],
    isConstrained: false,
    restSeconds: 120,
    targetSetsStr: '3 × 6 reps',
    muscleContributions: { glutes: 25, hams: 32, erect: 18 },
    sets: [
      { id: 'ex2-1', setNum: 1, kg: 70, reps: 6, rir: null, rpe: null, tempo: '2-0-2-0', isLogged: false },
      { id: 'ex2-2', setNum: 2, kg: 70, reps: 6, rir: null, rpe: null, tempo: '2-0-2-0', isLogged: false },
      { id: 'ex2-3', setNum: 3, kg: 70, reps: 6, rir: null, rpe: null, tempo: '2-0-2-0', isLogged: false },
    ],
  },
];

export const useLiveSessionStore = create<LiveSessionState>((set, get) => ({
  timerSeconds: 14 * 60 + 32, // Start at 14:32 for mock purposes
  volumeKg: 360,
  musclePcts: { quads: 65, glutes: 52, hams: 0, core: 22, erect: 0, calves: 0 },
  activeExerciseIndex: 0,
  exercises: mockExercises,

  incrementTimer: () => set((state) => ({ timerSeconds: state.timerSeconds + 1 })),

  logSet: (exId, setId, kg, reps, rir) => {
    set((state) => {
      let volumeAdded = 0;
      const updatedExercises = state.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId && !s.isLogged) {
            volumeAdded = kg * reps;
            const rpe = rir !== null ? Math.max(5, Math.min(10, 10 - rir)) : null;
            return { ...s, kg, reps, rir, rpe, isLogged: true };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      });

      // Update Muscle Loads
      const ex = state.exercises.find((e) => e.id === exId);
      const newPcts = { ...state.musclePcts };
      if (ex) {
        const loggedCount = updatedExercises.find(e => e.id === exId)?.sets.filter(s => s.isLogged).length || 0;
        Object.entries(ex.muscleContributions).forEach(([m, contrib]) => {
          const add = Math.round(contrib * (loggedCount / 3) * 0.5);
          newPcts[m] = Math.min(100, (newPcts[m] || 0) + add);
        });
      }

      return {
        exercises: updatedExercises,
        volumeKg: state.volumeKg + volumeAdded,
        musclePcts: newPcts,
      };
    });
  },

  addSet: (exId) => {
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const newSetNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: `${exId}-${newSetNum}`, setNum: newSetNum, kg: 0, reps: 0, rir: null, rpe: null, tempo: '—', isLogged: false },
          ],
        };
      }),
    }));
  },

  copyPrevSet: (exId, currentSetNum) => {
    set((state) => ({
      exercises: state.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const prevSet = ex.sets.find((s) => s.setNum === currentSetNum - 1);
        if (!prevSet) return ex;
        const updatedSets = ex.sets.map((s) => {
          if (s.setNum === currentSetNum) {
            return { ...s, kg: prevSet.kg, reps: prevSet.reps };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }),
    }));
  },

  advanceExercise: (exId) => {
    set((state) => {
      const idx = state.exercises.findIndex((ex) => ex.id === exId);
      if (idx === -1 || idx === state.exercises.length - 1) return state;
      return { activeExerciseIndex: idx + 1 };
    });
  },

  endSession: () => {
    // Logic for ending session
    console.log('Session Ended');
  },
}));
