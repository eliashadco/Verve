import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateLegacyBuilderDraftLoose } from '@/lib/programBuilder/legacyDraftMigration';
import { normalizeProgramForBuilder } from '@/lib/programBuilder/normalizeProgramForBuilder';
import { createId } from '@/lib/programBuilder/utils';
import type { BuilderProgram } from '@/lib/programBuilder/types';

/** Match `User trial.html` keys (localStorage → AsyncStorage). */
export const BUILDER_RECENT_KEY = 'verve_builder_recent_exercises_v1';
export const PROGRAM_LIBRARY_KEY = 'verve_program_library_v1';
export const ACTIVE_PROGRAM_KEY = 'verve_active_program_id_v1';

const MAX_RECENTS = 8;

export async function readBuilderRecents(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BUILDER_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

export async function writeBuilderRecents(ids: string[]): Promise<void> {
  const next = ids.slice(0, MAX_RECENTS);
  await AsyncStorage.setItem(BUILDER_RECENT_KEY, JSON.stringify(next));
}

export async function pushRecentExerciseId(exerciseId: string): Promise<void> {
  const key = String(exerciseId || '').trim();
  if (!key) return;
  const current = await readBuilderRecents();
  const next = [key, ...current.filter((x) => x !== key)].slice(0, MAX_RECENTS);
  await writeBuilderRecents(next);
}

export interface SavedLibraryCard {
  id: string;
  program: BuilderProgram;
}

function normalizeLibraryProgram(raw: Record<string, unknown>): BuilderProgram {
  const migrated = migrateLegacyBuilderDraftLoose(raw);
  return normalizeProgramForBuilder(migrated, undefined);
}

/** Load client-saved builder programs (HTML `getProgramLibrary`). */
export async function loadSavedProgramLibrary(): Promise<SavedLibraryCard[]> {
  try {
    const item = await AsyncStorage.getItem(PROGRAM_LIBRARY_KEY);
    if (!item) return [];
    const parsed = JSON.parse(item);
    if (!Array.isArray(parsed)) return [];

    const out: SavedLibraryCard[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const r = row as { id?: string; program?: unknown; name?: string; days?: unknown; dayPlans?: unknown };

      if (r.program && typeof r.program === 'object') {
        const prog = normalizeLibraryProgram(r.program as Record<string, unknown>);
        out.push({ id: String(r.id || prog.id || createId('lib')), program: prog });
        continue;
      }

      const loose = r as Record<string, unknown>;
      if (Array.isArray(loose.days) || Array.isArray(loose.dayPlans)) {
        const prog = normalizeLibraryProgram(migrateLegacyBuilderDraftLoose(loose));
        out.push({ id: String(loose.id || prog.id || createId('lib')), program: prog });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function saveSavedProgramLibrary(cards: SavedLibraryCard[]): Promise<void> {
  await AsyncStorage.setItem(PROGRAM_LIBRARY_KEY, JSON.stringify(cards));
}

export async function getActiveProgramId(): Promise<string | null> {
  try {
    const id = await AsyncStorage.getItem(ACTIVE_PROGRAM_KEY);
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export async function setActiveProgramId(programId: string | null): Promise<void> {
  if (!programId || !String(programId).trim()) {
    await AsyncStorage.removeItem(ACTIVE_PROGRAM_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_PROGRAM_KEY, String(programId).trim());
}
