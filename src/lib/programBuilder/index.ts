export type {
  BuilderConstraint,
  BuilderDay,
  BuilderExercise,
  BuilderExerciseMeta,
  BuilderMuscleContributions,
  BuilderProgram,
  ExerciseMetaResolver,
} from '@/lib/programBuilder/types';
export { normalizeProgramForBuilder } from '@/lib/programBuilder/normalizeProgramForBuilder';
export {
  supabaseProgramToBuilder,
  supabaseProgramToBuilderLoose,
  builderProgramToSupabaseDays,
} from '@/lib/programBuilder/supabaseBridge';
export {
  buildExerciseMetaResolver,
  contributionsFromPrimaryMuscles,
  metaFromSupabaseExercise,
} from '@/lib/programBuilder/contributions';
export { clampInt, createId } from '@/lib/programBuilder/utils';
export {
  getMuscleLabel,
  getDominantMuscleKey,
  getDefaultRIR,
  toMuscleKey,
  MUSCLE_LABELS,
} from '@/lib/programBuilder/muscles';
export {
  BUILDER_DRAFT_STORAGE_KEY,
  loadBuilderDraftRaw,
  saveBuilderDraftRaw,
  clearBuilderDraft,
} from '@/lib/programBuilder/builderStorage';
export { migrateLegacyBuilderDraftLoose } from '@/lib/programBuilder/legacyDraftMigration';
export {
  BUILDER_RECENT_KEY,
  PROGRAM_LIBRARY_KEY,
  ACTIVE_PROGRAM_KEY,
  readBuilderRecents,
  writeBuilderRecents,
  pushRecentExerciseId,
  loadSavedProgramLibrary,
  saveSavedProgramLibrary,
  getActiveProgramId,
  setActiveProgramId,
  type SavedLibraryCard,
} from '@/lib/programBuilder/peripheralBuilderStorage';
export { seedPreviewProgramLoose } from '@/lib/programBuilder/seedPreviewProgram';
export { HEATMAP_PATHS, HEATMAP_MUSCLE_KEYS } from '@/lib/programBuilder/heatmapPaths';
export {
  computeVolumeMap,
  mergeTargets,
  totalSetCount,
  progressMuscleKeys,
  muscleFillColor,
  DEFAULT_MUSCLE_TARGETS,
} from '@/lib/programBuilder/volume';
export {
  computeVolumeSnapshot,
  computeProgramContributionKeyTotals,
  computeMuscleSplit,
  getVolumeBandState,
  getErepsBand,
  computeDayVolumeSummary,
  EREPS_STANDARDS,
  type VolumeSnapshot,
  type VolumeContributor,
  type VolumeBand,
  type ErepsBand,
  type DayVolumeSummary,
  type DayVolumeWarning,
} from '@/lib/programBuilder/volumeEngine';

