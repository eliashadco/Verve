/**
 * Older mobile drafts used `dayPlans` + `{ id, name, target }` exercises (Builder Lite).
 * HTML and the canonical builder use `days` + full exercise rows. Migrate before normalize.
 */
export function migrateLegacyBuilderDraftLoose(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const existingDays = Array.isArray(raw.days) ? raw.days : [];
  if (existingDays.length > 0) {
    return { ...raw };
  }
  const dayPlans = raw.dayPlans;
  if (!Array.isArray(dayPlans) || dayPlans.length === 0) {
    return { ...raw };
  }
  const days = dayPlans.map((plan: unknown, idx: number) => {
    const p = plan as { exercises?: unknown[] };
    const exercises = Array.isArray(p?.exercises)
      ? p.exercises.map((e: unknown) => {
          const ex = e as { id?: string; name?: string; target?: string; muscle?: string; exerciseId?: string };
          return {
            id: ex.id,
            name: ex.name,
            exerciseId: ex.exerciseId ?? '',
            muscle: ex.muscle ?? ex.target ?? 'Custom',
          };
        })
      : [];
    return {
      label: `Day ${idx + 1} — Workout`,
      exercises,
    };
  });
  const next: Record<string, unknown> = { ...raw, days };
  delete next.dayPlans;
  return next;
}
