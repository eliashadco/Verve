import { useCallback, useEffect, useState } from 'react';
import { format, startOfISOWeek, subWeeks } from 'date-fns';

import { supabase } from '@/lib/supabase';
import type { AdherenceEntry, Program } from '@/types/database';

const HISTORY_PAGE_SIZE = 20;

export interface ProgressPoint {
  weekKey: string;
  weekLabel: string;
  sessions: number;
  volumeKg: number;
}

export interface ProgressHistoryItem {
  id: string;
  createdAt: string;
  programName: string;
  dayLabel: string;
  dayIndex: number;
  exerciseCount: number;
  totalVolumeKg: number;
  exercises: AdherenceEntry['exercises_logged'];
}

export interface ProgressTotals {
  sessions: number;
  totalSets: number;
  volumeKg: number;
  avgAdherencePct: number;
}

interface ProgressStatsData {
  weekly: ProgressPoint[];
  history: ProgressHistoryItem[];
  totals: ProgressTotals;
}

interface ProgressStatsState {
  data: ProgressStatsData;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useProgressStats(clientId: string | null) {
  const [state, setState] = useState<ProgressStatsState>({
    data: { weekly: [], history: [], totals: { sessions: 0, totalSets: 0, volumeKg: 0, avgAdherencePct: 0 } },
    loading: true,
    loadingMore: false,
    error: null,
    hasMore: false,
  });

  const loadPage = useCallback(async (offset: number) => {
    if (!clientId) {
      setState({ data: { weekly: [], history: [], totals: { sessions: 0, totalSets: 0, volumeKg: 0, avgAdherencePct: 0 } }, loading: false, loadingMore: false, error: null, hasMore: false });
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: offset === 0,
      loadingMore: offset > 0,
      error: null,
    }));

    const thisWeekStart = startOfISOWeek(new Date());
    const chartStart = subWeeks(thisWeekStart, 7);

    const { data: weeklyRows, error: weeklyError } = await supabase
      .from('adherence_ledger')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', chartStart.toISOString())
      .order('created_at', { ascending: false });

    if (weeklyError) {
      setState({ data: { weekly: [], history: [], totals: { sessions: 0, totalSets: 0, volumeKg: 0, avgAdherencePct: 0 } }, loading: false, loadingMore: false, error: weeklyError.message, hasMore: false });
      return;
    }

    const { data: historyRows, error: historyError } = await supabase
      .from('adherence_ledger')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + HISTORY_PAGE_SIZE - 1);

    if (historyError) {
      setState((previous) => ({
        ...previous,
        loading: false,
        loadingMore: false,
        error: historyError.message,
      }));
      return;
    }

    const weeklyAdherence = (weeklyRows ?? []) as AdherenceEntry[];
    const historyAdherence = (historyRows ?? []) as AdherenceEntry[];
    const programIds = Array.from(
      new Set([...weeklyAdherence, ...historyAdherence].map((entry) => entry.program_id)),
    );

    const programById: Record<string, Program> = {};
    if (programIds.length > 0) {
      const { data: programsRows, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .in('id', programIds);

      if (programsError) {
        setState((previous) => ({
          ...previous,
          loading: false,
          loadingMore: false,
          error: programsError.message,
        }));
        return;
      }

      (programsRows ?? []).forEach((row) => {
        const program = row as Program;
        programById[program.id] = program;
      });
    }

    const weekly = Array.from({ length: 8 }, (_, idx) => {
      const weekStart = subWeeks(thisWeekStart, 7 - idx);
      const weekKey = format(weekStart, 'RRRR-II');
      return {
        weekKey,
        weekLabel: format(weekStart, 'd MMM'),
        sessions: 0,
        volumeKg: 0,
      };
    });
    const weeklyIndexByKey = weekly.reduce<Record<string, number>>((acc, point, index) => {
      acc[point.weekKey] = index;
      return acc;
    }, {});

    weeklyAdherence.forEach((entry) => {
      const weekKey = format(new Date(entry.created_at), 'RRRR-II');
      const weeklyIndex = weeklyIndexByKey[weekKey];
      if (weeklyIndex == null) return;
      weekly[weeklyIndex].sessions += 1;
      weekly[weeklyIndex].volumeKg += getEntryVolume(entry);
    });

    const pageHistory: ProgressHistoryItem[] = historyAdherence.map((entry) => {
      const program = programById[entry.program_id];
      const exerciseCount = entry.exercises_logged.length;
      const totalVolumeKg = getEntryVolume(entry);

      return {
        id: entry.id,
        createdAt: entry.created_at,
        programName: program?.name ?? 'Program',
        dayLabel: program?.days?.[entry.day_index]?.label ?? `Day ${entry.day_index + 1}`,
        dayIndex: entry.day_index,
        exerciseCount,
        totalVolumeKg,
        exercises: entry.exercises_logged,
      };
    });

    const totals: ProgressTotals = {
      sessions: weeklyAdherence.length,
      totalSets: weeklyAdherence.reduce((sum, entry) => sum + entry.exercises_logged.reduce((acc, ex) => acc + ex.setsCompleted, 0), 0),
      volumeKg: weeklyAdherence.reduce((sum, entry) => sum + getEntryVolume(entry), 0),
      avgAdherencePct: weeklyAdherence.length
        ? weeklyAdherence.reduce((sum, entry) => {
            const completed = entry.exercises_logged.filter((exercise) => !exercise.skipped).length;
            return sum + (entry.exercises_logged.length ? (completed / entry.exercises_logged.length) * 100 : 0);
          }, 0) / weeklyAdherence.length
        : 0,
    };

    setState((previous) => ({
      data: {
        weekly,
        history: offset === 0 ? pageHistory : [...previous.data.history, ...pageHistory],
        totals,
      },
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: pageHistory.length === HISTORY_PAGE_SIZE,
    }));
  }, [clientId]);

  const load = useCallback(() => loadPage(0), [loadPage]);

  const loadMore = useCallback(() => {
    if (state.loading || state.loadingMore || !state.hasMore) return;
    return loadPage(state.data.history.length);
  }, [loadPage, state.data.history.length, state.hasMore, state.loading, state.loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load, loadMore };
}

function getEntryVolume(entry: AdherenceEntry) {
  return entry.exercises_logged.reduce((sum, exercise) => {
    const setVolume = exercise.repsPerSet.reduce((setSum, reps, idx) => {
      const weight = exercise.weightKg[idx] ?? 0;
      return setSum + reps * weight;
    }, 0);
    return sum + setVolume;
  }, 0);
}
