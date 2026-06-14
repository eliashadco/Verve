/** Seed snapshot matching `suggested_program_builder_preview.html` mock data. */
export function seedPreviewProgramLoose(): Record<string, unknown> {
  return {
    name: 'Hypertrophy Plan',
    focus: 'Rehab',
    targets: { quads: 8, chest: 6, core: 4 },
    days: [
      {
        label: 'Day 1',
        exercises: [
          { id: '1', name: 'Barbell Back Squat', muscle: 'quads', sets: 3, reps: '8', targetRIR: 2 },
          { id: '2', name: 'Incline Dumbbell Press', muscle: 'chest', sets: 3, reps: '10', targetRIR: 2 },
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          { id: '3', name: 'Weighted Plank', muscle: 'core', sets: 3, reps: '45s', targetRIR: 0 },
          { id: '4', name: 'Standing Calf Raise', muscle: 'calves', sets: 4, reps: '15', targetRIR: 1 },
        ],
      },
      {
        label: 'Day 3',
        exercises: [{ id: '5', name: 'Leg Press', muscle: 'quads', sets: 3, reps: '12', targetRIR: 2 }],
      },
      { label: 'Day 4', exercises: [] },
    ],
  };
}
