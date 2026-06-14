-- =============================================================================
-- Verve MVP — Seed data
-- =============================================================================
-- Optional: gives the mobile app a non-empty exercise library to render.
-- Apply AFTER schema.sql.
-- =============================================================================

insert into public.exercises (name, category, equipment, difficulty, description, setup_cues, execution_cues, primary_muscles, is_system)
values
  ('Barbell Back Squat', 'compound', array['barbell','rack'], 'intermediate',
   'A foundational lower-body compound lift.',
   'Bar resting on the upper traps, feet shoulder-width, brace the core.',
   'Sit between the hips, knees track over toes, drive up through mid-foot.',
   '[
     {"muscle":"quads","contribution":0.35},
     {"muscle":"glutes","contribution":0.30},
     {"muscle":"hamstrings","contribution":0.15},
     {"muscle":"core","contribution":0.10},
     {"muscle":"calves","contribution":0.05},
     {"muscle":"hip_flexors","contribution":0.05}
   ]'::jsonb, true),

  ('Barbell Bench Press', 'compound', array['barbell','bench'], 'intermediate',
   'Primary horizontal push.',
   'Shoulder blades retracted, feet planted, slight back arch.',
   'Lower bar to mid-chest under control, press up and slightly back.',
   '[
     {"muscle":"chest","contribution":0.50},
     {"muscle":"front_delt","contribution":0.20},
     {"muscle":"triceps","contribution":0.25},
     {"muscle":"core","contribution":0.05}
   ]'::jsonb, true),

  ('Conventional Deadlift', 'compound', array['barbell'], 'advanced',
   'Maximum total-body posterior chain expression.',
   'Bar over mid-foot, hips above knees, lats engaged.',
   'Push the floor away, hips and shoulders rise together, lock out tall.',
   '[
     {"muscle":"hamstrings","contribution":0.30},
     {"muscle":"glutes","contribution":0.25},
     {"muscle":"upper_back","contribution":0.15},
     {"muscle":"lats","contribution":0.10},
     {"muscle":"core","contribution":0.10},
     {"muscle":"forearms","contribution":0.10}
   ]'::jsonb, true),

  ('Pull-up', 'compound', array['bodyweight','bar'], 'intermediate',
   'Vertical pulling.',
   'Hang from a bar, hands slightly wider than shoulders.',
   'Pull elbows to ribs, drive chest to bar, control the descent.',
   '[
     {"muscle":"lats","contribution":0.45},
     {"muscle":"upper_back","contribution":0.20},
     {"muscle":"biceps","contribution":0.20},
     {"muscle":"rear_delt","contribution":0.10},
     {"muscle":"forearms","contribution":0.05}
   ]'::jsonb, true),

  ('Overhead Press', 'compound', array['barbell'], 'intermediate',
   'Vertical push.',
   'Bar at clavicle height, glutes squeezed, ribs down.',
   'Press straight overhead, finish with bar over mid-foot.',
   '[
     {"muscle":"front_delt","contribution":0.40},
     {"muscle":"side_delt","contribution":0.20},
     {"muscle":"triceps","contribution":0.20},
     {"muscle":"upper_back","contribution":0.10},
     {"muscle":"core","contribution":0.10}
   ]'::jsonb, true),

  ('Romanian Deadlift', 'compound', array['barbell'], 'intermediate',
   'Hip-hinge focus on hamstrings and glutes.',
   'Slight knee bend, neutral spine, bar close to thighs.',
   'Push hips back, feel the hamstring stretch, drive hips forward to lock out.',
   '[
     {"muscle":"hamstrings","contribution":0.45},
     {"muscle":"glutes","contribution":0.30},
     {"muscle":"upper_back","contribution":0.10},
     {"muscle":"core","contribution":0.10},
     {"muscle":"forearms","contribution":0.05}
   ]'::jsonb, true)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- P-2.4 QA: optional clinical_constraints row (replace UUIDs with real profiles).
-- Example blocks the seeded exercise "Barbell Back Squat" for a pilot client:
--
-- insert into public.clinical_constraints (
--   patient_id, physio_id, constraint_type, target, value, severity, notes, status
-- ) values (
--   '<pilot-client-uuid>',
--   '<physio-uuid>',
--   'blocked_exercise',
--   'Barbell Back Squat',
--   null,
--   'hard',
--   'No loaded squatting until cleared.',
--   'active'
-- );
-- -----------------------------------------------------------------------------
