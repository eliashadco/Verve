/** Front-view schematic paths — parity with `suggested_program_builder_preview.html`. */
export const HEATMAP_PATHS: { muscle: string; d: string }[] = [
  { muscle: 'chest', d: 'M36,45 L64,45 L60,60 L40,60 Z' },
  { muscle: 'shoulders', d: 'M30,46 Q35,42 37,55 Z M70,46 Q65,42 63,55 Z' },
  { muscle: 'core', d: 'M41,64 L59,64 L56,92 L44,92 Z' },
  { muscle: 'quads', d: 'M34,96 L49,96 L47,145 L37,145 Z M51,96 L66,96 L63,145 L53,145 Z' },
  { muscle: 'calves', d: 'M36,152 L45,152 L43,190 L39,190 Z M55,152 L64,152 L61,190 L57,190 Z' },
];

export const HEATMAP_MUSCLE_KEYS = HEATMAP_PATHS.map((p) => p.muscle);
