/**
 * usePrograms — load programs for the current user.
 *
 * - Client: programs assigned to me
 * - Trainer: programs I created
 *
 * RLS handles authorization; the query just selects accordingly.
 */

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Program, Role } from '@/types/database';

interface State {
  programs: Program[];
  myPrograms: Program[];
  assignedPrograms: Program[];
  loading: boolean;
  error: string | null;
}

export function usePrograms(userId: string | null, role: Role | null) {
  const [state, setState] = useState<State>({ programs: [], myPrograms: [], assignedPrograms: [], loading: true, error: null });

  const load = useCallback(async () => {
    if (!userId || !role) {
      setState({ programs: [], myPrograms: [], assignedPrograms: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));

    const query = supabase.from('programs').select('*').order('updated_at', { ascending: false });
    const filter = role === 'client'
      ? query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      : query.eq('created_by', userId);

    try {
      const { data, error } = await filter;
      if (error) {
        setState({ programs: [], myPrograms: [], assignedPrograms: [], loading: false, error: error.message });
        return;
      }
      const allPrograms = (data ?? []) as Program[];
      const myPrograms = allPrograms.filter(p => p.created_by === userId);
      const assignedPrograms = allPrograms.filter(p => p.created_by !== userId);
      
      setState({ programs: allPrograms, myPrograms, assignedPrograms, loading: false, error: null });
    } catch (e: any) {
      setState({ programs: [], myPrograms: [], assignedPrograms: [], loading: false, error: e?.message ?? 'Failed to load programs' });
    }
  }, [userId, role]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

export async function assignProgramToClient(programId: string, clientId: string) {
  const { error } = await supabase
    .from('programs')
    .update({ assigned_to: clientId, status: 'active' })
    .eq('id', programId);
  if (error) throw error;
}

export async function duplicateProgram(program: Program, createdBy: string) {
  const { data, error } = await supabase
    .from('programs')
    .insert({
      name: `${program.name} (copy)`,
      created_by: createdBy,
      assigned_to: null,
      focus: program.focus,
      phase: program.phase,
      duration_weeks: program.duration_weeks,
      days: program.days,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Program;
}

export async function archiveProgram(programId: string) {
  const { error } = await supabase
    .from('programs')
    .update({ status: 'archived' })
    .eq('id', programId);
  if (error) throw error;
}

export async function createProgram(program: Omit<Program, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('programs')
    .insert({
      ...program,
      status: program.status || 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Program;
}

export async function updateProgram(programId: string, updates: Partial<Omit<Program, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('programs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', programId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Program;
}

