import { create } from 'zustand';

import type { Program } from '@/types/database';

/**
 * Lightweight global store that tracks the currently-staged draft program.
 *
 * When a user presses "Use Draft" on a saved template, the draft is converted
 * into a `Program` shape and stored here.  The Current tab, Live FAB, and
 * Live-session picker all read from this store to operate on the draft.
 */

export interface ActiveDraftState {
  /** The draft promoted to the Current tab for viewing / live sessions. */
  activeDraft: Program | null;
  /** ID of the original BuilderDraft card (for bookkeeping / deduplication). */
  sourceDraftId: string | null;
  /** Whether the user is in an ongoing live session with the draft. */
  isSessionActive: boolean;
  /** Expo Router href to resume an in-progress session (e.g. `/(client)/live/draft_xxx/0`). */
  activeSessionRoute: string | null;

  setActiveDraft: (program: Program, sourceDraftId?: string | null) => void;
  clearActiveDraft: () => void;
  startSession: (route: string) => void;
  endSession: () => void;
}

export const useActiveDraftStore = create<ActiveDraftState>((set) => ({
  activeDraft: null,
  sourceDraftId: null,
  isSessionActive: false,
  activeSessionRoute: null,

  setActiveDraft: (program, sourceDraftId = null) =>
    set({ activeDraft: program, sourceDraftId, isSessionActive: false, activeSessionRoute: null }),

  clearActiveDraft: () =>
    set({ activeDraft: null, sourceDraftId: null, isSessionActive: false, activeSessionRoute: null }),

  startSession: (route) =>
    set({ isSessionActive: true, activeSessionRoute: route }),

  endSession: () =>
    set({ isSessionActive: false, activeSessionRoute: null }),
}));
