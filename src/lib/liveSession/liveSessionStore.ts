import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { BuilderProgram } from '../programBuilder/types';

export const LIVE_SESSION_STATE_KEY = 'verve_live_session_state_v1';
export const SESSION_HISTORY_KEY = 'verve_session_history_v1';

export interface LiveSetLog {
  kg: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  loggedAt: string;
}

export interface LiveExerciseLog {
  name: string;
  targetSets: number;
  contributions: Record<string, number>;
  sets: LiveSetLog[];
}

export interface LiveSessionStateV1 {
  status: 'none' | 'active' | 'paused';
  startedAt: string | null;
  pausedAt: string | null;
  programId: string | null;
  programName: string | null;
  programFocus: string | null;
  dayIndex: number | null;
  dayLabel: string | null;
  exerciseLogs: Record<string, LiveExerciseLog>;
  sessVolumeKg: number;
  sessLoggedCount: number;
  sessTotalSets: number;
  hydrated: boolean;
}

export interface LiveSessionStore extends LiveSessionStateV1 {
  startSession: (program: BuilderProgram, dayIndex: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  logSet: (exId: string, setIndex: number, kg: number, reps: number, rir: number | null) => void;
  cancelSession: () => void;
  saveCompletedSession: (notes: string) => Promise<any>;
  hydrate: () => Promise<void>;
}

export const calcRPE = (rir: number | null): number | null => {
  if (rir === null || !Number.isFinite(rir)) return null;
  return Math.max(5, Math.min(10, 10 - rir));
};

const persist = async (state: Partial<LiveSessionStateV1>) => {
  try {
    const raw = await AsyncStorage.getItem(LIVE_SESSION_STATE_KEY);
    const current = raw ? JSON.parse(raw) : {};
    const updated = { ...current, ...state };
    delete updated.hydrated; // Don't persist temporary hydration flag
    await AsyncStorage.setItem(LIVE_SESSION_STATE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist live session state', err);
  }
};

export const useLiveSessionStore = create<LiveSessionStore>((set, get) => ({
  status: 'none',
  startedAt: null,
  pausedAt: null,
  programId: null,
  programName: null,
  programFocus: null,
  dayIndex: null,
  dayLabel: null,
  exerciseLogs: {},
  sessVolumeKg: 0,
  sessLoggedCount: 0,
  sessTotalSets: 0,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(LIVE_SESSION_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          status: parsed.status || 'none',
          startedAt: parsed.startedAt || null,
          pausedAt: parsed.pausedAt || null,
          programId: parsed.programId || null,
          programName: parsed.programName || null,
          programFocus: parsed.programFocus || null,
          dayIndex: parsed.dayIndex !== undefined ? parsed.dayIndex : null,
          dayLabel: parsed.dayLabel || null,
          exerciseLogs: parsed.exerciseLogs || {},
          sessVolumeKg: parsed.sessVolumeKg || 0,
          sessLoggedCount: parsed.sessLoggedCount || 0,
          sessTotalSets: parsed.sessTotalSets || 0,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  startSession: (program, dayIndex) => {
    const day = program.days[dayIndex];
    if (!day) return;

    const totalSets = day.exercises.reduce((acc, ex) => acc + (ex.sets || 3), 0);
    const preinitLogs: Record<string, LiveExerciseLog> = {};

    day.exercises.forEach((ex) => {
      preinitLogs[ex.id] = {
        name: ex.name,
        targetSets: ex.sets || 3,
        contributions: ex._muscleContributions || {},
        sets: [],
      };
    });

    const newState: Partial<LiveSessionStateV1> = {
      status: 'active',
      startedAt: new Date().toISOString(),
      pausedAt: null,
      programId: program.id,
      programName: program.name,
      programFocus: program.focus || 'Custom',
      dayIndex,
      dayLabel: day.label || `Day ${dayIndex + 1}`,
      exerciseLogs: preinitLogs,
      sessVolumeKg: 0,
      sessLoggedCount: 0,
      sessTotalSets: totalSets,
    };

    set(newState);
    void persist(newState);
  },

  pauseSession: () => {
    const newState = {
      status: 'paused' as const,
      pausedAt: new Date().toISOString(),
    };
    set(newState);
    void persist(newState);
  },

  resumeSession: () => {
    const newState = {
      status: 'active' as const,
      pausedAt: null,
    };
    set(newState);
    void persist(newState);
  },

  logSet: (exId, setIndex, kg, reps, rir) => {
    const state = get();
    const logs = { ...state.exerciseLogs };
    const exLog = logs[exId];
    if (!exLog) return;

    // Check if set is already logged (or update it)
    const existingSet = exLog.sets[setIndex];
    const loggedAt = existingSet ? existingSet.loggedAt : new Date().toISOString();
    const rpe = calcRPE(rir);

    const newSetLog: LiveSetLog = {
      kg,
      reps,
      rir,
      rpe,
      loggedAt,
    };

    const updatedSets = [...exLog.sets];
    updatedSets[setIndex] = newSetLog;

    logs[exId] = {
      ...exLog,
      sets: updatedSets,
    };

    // Recompute logged count & volume
    let loggedCount = 0;
    let totalVolume = 0;
    Object.values(logs).forEach((l) => {
      l.sets.forEach((s) => {
        if (s) {
          loggedCount++;
          totalVolume += s.kg * s.reps;
        }
      });
    });

    const newState = {
      exerciseLogs: logs,
      sessLoggedCount: loggedCount,
      sessVolumeKg: totalVolume,
    };

    set(newState);
    void persist(newState);
  },

  cancelSession: () => {
    const emptyState = {
      status: 'none' as const,
      startedAt: null,
      pausedAt: null,
      programId: null,
      programName: null,
      programFocus: null,
      dayIndex: null,
      dayLabel: null,
      exerciseLogs: {},
      sessVolumeKg: 0,
      sessLoggedCount: 0,
      sessTotalSets: 0,
    };
    set(emptyState);
    void AsyncStorage.removeItem(LIVE_SESSION_STATE_KEY);
  },

  saveCompletedSession: async (notes) => {
    const state = get();
    const started = state.startedAt ? new Date(state.startedAt).getTime() : Date.now();
    const durationMs = Date.now() - started;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const durationLabel = `${minutes}m ${seconds}s`;
    const adherencePct = Math.round(state.sessLoggedCount / Math.max(state.sessTotalSets, 1) * 100);

    const sessionRecord = {
      id: `sess_${Date.now()}`,
      date: new Date().toISOString(),
      programId: state.programId,
      programName: state.programName || 'Ad-hoc',
      programFocus: state.programFocus || 'Custom',
      dayIndex: state.dayIndex,
      dayLabel: state.dayLabel,
      setsLogged: state.sessLoggedCount,
      totalSets: state.sessTotalSets,
      volumeKg: Math.round(state.sessVolumeKg),
      durationLabel,
      adherencePct,
      exerciseLogs: state.exerciseLogs,
      notes,
    };

    try {
      // Load and append to history
      const rawHistory = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      history.unshift(sessionRecord);
      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
    } catch (err) {
      console.error('Failed to save session history', err);
    }

    // Reset session state
    const emptyState = {
      status: 'none' as const,
      startedAt: null,
      pausedAt: null,
      programId: null,
      programName: null,
      programFocus: null,
      dayIndex: null,
      dayLabel: null,
      exerciseLogs: {},
      sessVolumeKg: 0,
      sessLoggedCount: 0,
      sessTotalSets: 0,
    };
    set(emptyState);
    void AsyncStorage.removeItem(LIVE_SESSION_STATE_KEY);

    return sessionRecord;
  },
}));
