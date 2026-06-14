import AsyncStorage from '@react-native-async-storage/async-storage';

/** Match `User trial.html` `BUILDER_DRAFT_KEY`. */
export const BUILDER_DRAFT_STORAGE_KEY = 'verve_program_builder_draft_v1';

export async function loadBuilderDraftRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BUILDER_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveBuilderDraftRaw(json: string): Promise<void> {
  await AsyncStorage.setItem(BUILDER_DRAFT_STORAGE_KEY, json);
}

export async function clearBuilderDraft(): Promise<void> {
  await AsyncStorage.removeItem(BUILDER_DRAFT_STORAGE_KEY);
}
