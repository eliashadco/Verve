import { useCallback, useEffect, useState } from 'react';
import { startOfWeek, subDays } from 'date-fns';

import { supabase } from '@/lib/supabase';
import type { AdherenceEntry, Booking, Profile, Program } from '@/types/database';

export interface ClientFlag {
  clientId: string;
  label: string;
  reason: 'no_active_program' | 'no_logs_14d';
}

interface TrainerKpis {
  activeClients: number;
  sessionsThisWeek: number;
  avgAdherencePct: number;
  attention: ClientFlag[];
}

export function useTrainerKpis(trainerId: string | null) {
  const [data, setData] = useState<TrainerKpis>({
    activeClients: 0,
    sessionsThisWeek: 0,
    avgAdherencePct: 0,
    attention: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!trainerId) {
      setData({ activeClients: 0, sessionsThisWeek: 0, avgAdherencePct: 0, attention: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data: links, error: linksError } = await supabase
      .from('practitioner_client_links')
      .select('client_id')
      .eq('practitioner_id', trainerId)
      .eq('status', 'active');
    if (linksError) {
      setLoading(false);
      setError(linksError.message);
      return;
    }
    const clientIds = Array.from(new Set((links ?? []).map((link) => link.client_id)));
    if (clientIds.length === 0) {
      setData({ activeClients: 0, sessionsThisWeek: 0, avgAdherencePct: 0, attention: [] });
      setLoading(false);
      return;
    }

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

    const [profilesResult, bookingsResult, programsResult, adherenceResult] = await Promise.all([
      supabase.from('profiles').select('*').in('id', clientIds),
      supabase
        .from('bookings')
        .select('*')
        .eq('practitioner_id', trainerId)
        .gte('starts_at', weekStart),
      supabase.from('programs').select('*').eq('created_by', trainerId).in('assigned_to', clientIds),
      supabase
        .from('adherence_ledger')
        .select('*')
        .in('client_id', clientIds)
        .gte('started_at', thirtyDaysAgo),
    ]);

    if (profilesResult.error || bookingsResult.error || programsResult.error || adherenceResult.error) {
      setLoading(false);
      setError(
        profilesResult.error?.message ??
          bookingsResult.error?.message ??
          programsResult.error?.message ??
          adherenceResult.error?.message ??
          'Could not load KPIs.',
      );
      return;
    }

    const profiles = (profilesResult.data ?? []) as Profile[];
    const bookings = (bookingsResult.data ?? []) as Booking[];
    const programs = (programsResult.data ?? []) as Program[];
    const adherence = (adherenceResult.data ?? []) as AdherenceEntry[];

    const sessionsThisWeek = bookings.filter((booking) => booking.status !== 'cancelled').length;
    const sessionsLogged30d = adherence.filter((entry) => Boolean(entry.completed_at)).length;

    // MVP formula from roadmap: expected sessions ~= active program days x 4 weeks.
    const expectedSessions30d = programs.reduce((sum, program) => sum + (program.days?.length ?? 0) * 4, 0);
    const avgAdherencePct = expectedSessions30d > 0
      ? Math.round((sessionsLogged30d / expectedSessions30d) * 100)
      : 0;

    const latestLogsByClient = adherence.reduce<Record<string, string>>((acc, entry) => {
      const previous = acc[entry.client_id];
      if (!previous || new Date(entry.started_at).getTime() > new Date(previous).getTime()) {
        acc[entry.client_id] = entry.started_at;
      }
      return acc;
    }, {});
    const activeProgramClientIds = new Set(
      programs
        .filter((program) => program.status === 'active' && program.assigned_to)
        .map((program) => program.assigned_to as string),
    );

    const attention: ClientFlag[] = [];
    profiles.forEach((client) => {
      const fullName = `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || client.email;
      if (!activeProgramClientIds.has(client.id)) {
        attention.push({ clientId: client.id, label: fullName, reason: 'no_active_program' });
        return;
      }
      const lastLogAt = latestLogsByClient[client.id];
      if (!lastLogAt || new Date(lastLogAt) < new Date(fourteenDaysAgo)) {
        attention.push({ clientId: client.id, label: fullName, reason: 'no_logs_14d' });
      }
    });

    setData({
      activeClients: clientIds.length,
      sessionsThisWeek,
      avgAdherencePct,
      attention,
    });
    setLoading(false);
  }, [trainerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}
