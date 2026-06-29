export const EXERCISE_LIBRARY = [
    {
      id: 'ex_bench_press',
      name: 'Barbell Bench Press',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.55 },
        { muscle: 'triceps', contribution: 0.25 },
        { muscle: 'front_delt', contribution: 0.2 }
      ],
      secondaryMuscles: ['core', 'rotator_cuff'],
      tags: ['push', 'horizontal', 'bilateral'],
      contraindications: ['shoulder_impingement', 'wrist_injury'],
      alternatives: ['ex_incline_db_press', 'ex_pushup'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_incline_db_press',
      name: 'Incline Dumbbell Press',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['dumbbell', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.5 },
        { muscle: 'front_delt', contribution: 0.3 },
        { muscle: 'triceps', contribution: 0.2 }
      ],
      secondaryMuscles: ['rotator_cuff', 'core'],
      tags: ['push', 'incline', 'bilateral'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_bench_press', 'ex_machine_chest_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_decline_bench_press',
      name: 'Decline Bench Press',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.58 },
        { muscle: 'triceps', contribution: 0.27 },
        { muscle: 'front_delt', contribution: 0.15 }
      ],
      secondaryMuscles: ['core'],
      tags: ['push', 'decline', 'bilateral'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_bench_press', 'ex_pushup'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_machine_chest_press',
      name: 'Machine Chest Press',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['machine'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.62 },
        { muscle: 'triceps', contribution: 0.23 },
        { muscle: 'front_delt', contribution: 0.15 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['push', 'horizontal', 'machine'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_bench_press', 'ex_cable_fly'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_pushup',
      name: 'Push-Up',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.5 },
        { muscle: 'triceps', contribution: 0.3 },
        { muscle: 'front_delt', contribution: 0.2 }
      ],
      secondaryMuscles: ['core'],
      tags: ['push', 'horizontal', 'bodyweight'],
      contraindications: ['wrist_injury'],
      alternatives: ['ex_bench_press', 'ex_single_arm_cable_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_weighted_pushup',
      name: 'Weighted Push-Up',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['bodyweight', 'weight_plate'],
      difficulty: 'advanced',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.52 },
        { muscle: 'triceps', contribution: 0.28 },
        { muscle: 'front_delt', contribution: 0.2 }
      ],
      secondaryMuscles: ['core'],
      tags: ['push', 'horizontal', 'bodyweight'],
      contraindications: ['wrist_injury', 'shoulder_impingement'],
      alternatives: ['ex_pushup', 'ex_bench_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_cable_fly',
      name: 'Cable Fly',
      muscle: 'Chest',
      category: 'isolation',
      equipment: ['cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.9 },
        { muscle: 'front_delt', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['push', 'isolation', 'horizontal'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_machine_chest_press', 'ex_single_arm_cable_press'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_single_arm_cable_press',
      name: 'Single-Arm Cable Press',
      muscle: 'Chest',
      category: 'compound',
      equipment: ['cable'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'chest', contribution: 0.48 },
        { muscle: 'triceps', contribution: 0.27 },
        { muscle: 'front_delt', contribution: 0.15 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['push', 'horizontal', 'unilateral'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_pushup', 'ex_cable_fly'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_pullup',
      name: 'Pull-Up',
      muscle: 'Back',
      category: 'compound',
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'lats', contribution: 0.45 },
        { muscle: 'biceps', contribution: 0.25 },
        { muscle: 'upper_back', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['core', 'rear_delt'],
      tags: ['pull', 'vertical', 'bodyweight'],
      contraindications: ['elbow_tendinopathy', 'shoulder_impingement'],
      alternatives: ['ex_lat_pulldown', 'ex_inverted_row'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_lat_pulldown',
      name: 'Lat Pulldown',
      muscle: 'Back',
      category: 'compound',
      equipment: ['cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'lats', contribution: 0.5 },
        { muscle: 'biceps', contribution: 0.2 },
        { muscle: 'upper_back', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['rear_delt'],
      tags: ['pull', 'vertical', 'machine'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_pullup', 'ex_straight_arm_pulldown'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_bent_over_row',
      name: 'Bent-Over Barbell Row',
      muscle: 'Back',
      category: 'compound',
      equipment: ['barbell'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.4 },
        { muscle: 'lats', contribution: 0.3 },
        { muscle: 'biceps', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['hamstrings', 'core'],
      tags: ['pull', 'horizontal', 'hinge'],
      contraindications: ['lumbar_irritation'],
      alternatives: ['ex_chest_supported_row', 'ex_one_arm_db_row'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_seated_cable_row',
      name: 'Seated Cable Row',
      muscle: 'Back',
      category: 'compound',
      equipment: ['cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.42 },
        { muscle: 'lats', contribution: 0.32 },
        { muscle: 'biceps', contribution: 0.18 },
        { muscle: 'forearms', contribution: 0.08 }
      ],
      secondaryMuscles: ['rear_delt'],
      tags: ['pull', 'horizontal', 'machine'],
      contraindications: ['lumbar_irritation'],
      alternatives: ['ex_bent_over_row', 'ex_chest_supported_row'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_one_arm_db_row',
      name: 'One-Arm Dumbbell Row',
      muscle: 'Back',
      category: 'compound',
      equipment: ['dumbbell', 'bench'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'lats', contribution: 0.4 },
        { muscle: 'upper_back', contribution: 0.3 },
        { muscle: 'biceps', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['core', 'rear_delt'],
      tags: ['pull', 'horizontal', 'unilateral'],
      contraindications: ['lumbar_irritation'],
      alternatives: ['ex_seated_cable_row', 'ex_chest_supported_row'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_chest_supported_row',
      name: 'Chest-Supported Row',
      muscle: 'Back',
      category: 'compound',
      equipment: ['dumbbell', 'bench'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.45 },
        { muscle: 'lats', contribution: 0.3 },
        { muscle: 'biceps', contribution: 0.17 },
        { muscle: 'forearms', contribution: 0.08 }
      ],
      secondaryMuscles: ['rear_delt'],
      tags: ['pull', 'horizontal', 'supported'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_seated_cable_row', 'ex_one_arm_db_row'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_inverted_row',
      name: 'Inverted Row',
      muscle: 'Back',
      category: 'compound',
      equipment: ['bar', 'bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.4 },
        { muscle: 'lats', contribution: 0.3 },
        { muscle: 'biceps', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['core', 'rear_delt'],
      tags: ['pull', 'horizontal', 'bodyweight'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_pullup', 'ex_seated_cable_row'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_straight_arm_pulldown',
      name: 'Straight-Arm Pulldown',
      muscle: 'Back',
      category: 'isolation',
      equipment: ['cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'lats', contribution: 0.85 },
        { muscle: 'traps', contribution: 0.15 }
      ],
      secondaryMuscles: ['core'],
      tags: ['pull', 'isolation', 'vertical'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_lat_pulldown', 'ex_pullup'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_back_squat',
      name: 'Back Squat',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['barbell', 'rack'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.5 },
        { muscle: 'glutes', contribution: 0.3 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['squat', 'bilateral', 'compound'],
      contraindications: ['knee_pain', 'lumbar_irritation'],
      alternatives: ['ex_front_squat', 'ex_goblet_squat'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_front_squat',
      name: 'Front Squat',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['barbell', 'rack'],
      difficulty: 'advanced',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.55 },
        { muscle: 'glutes', contribution: 0.2 },
        { muscle: 'core', contribution: 0.15 },
        { muscle: 'hamstrings', contribution: 0.1 }
      ],
      secondaryMuscles: ['traps', 'calves'],
      tags: ['squat', 'bilateral', 'front_rack'],
      contraindications: ['wrist_injury', 'knee_pain'],
      alternatives: ['ex_back_squat', 'ex_goblet_squat'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_goblet_squat',
      name: 'Goblet Squat',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['dumbbell', 'kettlebell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.52 },
        { muscle: 'glutes', contribution: 0.25 },
        { muscle: 'core', contribution: 0.13 },
        { muscle: 'hamstrings', contribution: 0.1 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['squat', 'bilateral', 'home'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_split_squat', 'ex_step_up'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_leg_press',
      name: 'Leg Press',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['machine'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.6 },
        { muscle: 'glutes', contribution: 0.25 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'calves', contribution: 0.05 }
      ],
      secondaryMuscles: ['core'],
      tags: ['squat_pattern', 'bilateral', 'machine'],
      contraindications: ['knee_pain', 'hip_irritation'],
      alternatives: ['ex_hack_squat', 'ex_back_squat'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_split_squat',
      name: 'Split Squat',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['dumbbell', 'bodyweight'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.5 },
        { muscle: 'glutes', contribution: 0.25 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'core', contribution: 0.15 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['squat', 'unilateral', 'balance'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_walking_lunge', 'ex_step_up'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_walking_lunge',
      name: 'Walking Lunge',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['dumbbell', 'bodyweight'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.45 },
        { muscle: 'glutes', contribution: 0.3 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'core', contribution: 0.15 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['lunge', 'unilateral', 'gait'],
      contraindications: ['knee_pain', 'balance_deficit'],
      alternatives: ['ex_split_squat', 'ex_step_up'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_step_up',
      name: 'Step-Up',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['box', 'dumbbell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.48 },
        { muscle: 'glutes', contribution: 0.32 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['unilateral', 'squat_pattern', 'rehab'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_split_squat', 'ex_goblet_squat'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_hack_squat',
      name: 'Hack Squat',
      muscle: 'Legs (Quads)',
      category: 'compound',
      equipment: ['machine'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.62 },
        { muscle: 'glutes', contribution: 0.23 },
        { muscle: 'hamstrings', contribution: 0.1 },
        { muscle: 'core', contribution: 0.05 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['squat', 'bilateral', 'machine'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_leg_press', 'ex_front_squat'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_deadlift',
      name: 'Conventional Deadlift',
      muscle: 'Legs (Hams/Glutes)',
      category: 'compound',
      equipment: ['barbell'],
      difficulty: 'advanced',
      primaryMuscles: [
        { muscle: 'hamstrings', contribution: 0.3 },
        { muscle: 'glutes', contribution: 0.3 },
        { muscle: 'upper_back', contribution: 0.2 },
        { muscle: 'quads', contribution: 0.1 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['core', 'traps'],
      tags: ['hinge', 'bilateral', 'strength'],
      contraindications: ['lumbar_irritation'],
      alternatives: ['ex_romanian_deadlift', 'ex_hip_thrust'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_romanian_deadlift',
      name: 'Romanian Deadlift',
      muscle: 'Legs (Hams/Glutes)',
      category: 'compound',
      equipment: ['barbell', 'dumbbell'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'hamstrings', contribution: 0.45 },
        { muscle: 'glutes', contribution: 0.35 },
        { muscle: 'upper_back', contribution: 0.1 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['core'],
      tags: ['hinge', 'bilateral', 'posterior_chain'],
      contraindications: ['lumbar_irritation', 'hamstring_strain'],
      alternatives: ['ex_single_leg_rdl', 'ex_hip_thrust'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_hip_thrust',
      name: 'Hip Thrust',
      muscle: 'Legs (Hams/Glutes)',
      category: 'compound',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'glutes', contribution: 0.7 },
        { muscle: 'hamstrings', contribution: 0.2 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['quads'],
      tags: ['hinge', 'bilateral', 'glute_bias'],
      contraindications: ['hip_irritation'],
      alternatives: ['ex_glute_bridge', 'ex_romanian_deadlift'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_glute_bridge',
      name: 'Glute Bridge',
      muscle: 'Legs (Hams/Glutes)',
      category: 'compound',
      equipment: ['bodyweight', 'band'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'glutes', contribution: 0.75 },
        { muscle: 'hamstrings', contribution: 0.15 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['quads'],
      tags: ['hinge', 'rehab', 'home'],
      contraindications: ['hip_irritation'],
      alternatives: ['ex_hip_thrust', 'ex_single_leg_rdl'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_leg_curl',
      name: 'Lying Leg Curl',
      muscle: 'Legs (Hams/Glutes)',
      category: 'isolation',
      equipment: ['machine'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'hamstrings', contribution: 0.9 },
        { muscle: 'glutes', contribution: 0.1 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['hinge', 'isolation', 'machine'],
      contraindications: ['hamstring_strain'],
      alternatives: ['ex_romanian_deadlift', 'ex_single_leg_rdl'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_single_leg_rdl',
      name: 'Single-Leg Romanian Deadlift',
      muscle: 'Legs (Hams/Glutes)',
      category: 'compound',
      equipment: ['dumbbell', 'bodyweight'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'hamstrings', contribution: 0.42 },
        { muscle: 'glutes', contribution: 0.38 },
        { muscle: 'core', contribution: 0.2 }
      ],
      secondaryMuscles: ['calves'],
      tags: ['hinge', 'unilateral', 'balance'],
      contraindications: ['balance_deficit', 'hamstring_strain'],
      alternatives: ['ex_romanian_deadlift', 'ex_glute_bridge'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_overhead_press',
      name: 'Overhead Press',
      muscle: 'Shoulders',
      category: 'compound',
      equipment: ['barbell'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'front_delt', contribution: 0.45 },
        { muscle: 'triceps', contribution: 0.3 },
        { muscle: 'side_delt', contribution: 0.15 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff', 'traps'],
      tags: ['push', 'vertical', 'bilateral'],
      contraindications: ['shoulder_impingement', 'no_overhead'],
      alternatives: ['ex_db_shoulder_press', 'ex_arnold_press'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_db_shoulder_press',
      name: 'Dumbbell Shoulder Press',
      muscle: 'Shoulders',
      category: 'compound',
      equipment: ['dumbbell', 'bench'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'front_delt', contribution: 0.42 },
        { muscle: 'triceps', contribution: 0.28 },
        { muscle: 'side_delt', contribution: 0.2 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['push', 'vertical', 'bilateral'],
      contraindications: ['shoulder_impingement', 'no_overhead'],
      alternatives: ['ex_overhead_press', 'ex_lateral_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_arnold_press',
      name: 'Arnold Press',
      muscle: 'Shoulders',
      category: 'compound',
      equipment: ['dumbbell'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'front_delt', contribution: 0.4 },
        { muscle: 'side_delt', contribution: 0.25 },
        { muscle: 'triceps', contribution: 0.25 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['push', 'vertical', 'bilateral'],
      contraindications: ['shoulder_impingement', 'no_overhead'],
      alternatives: ['ex_db_shoulder_press', 'ex_lateral_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_lateral_raise',
      name: 'Lateral Raise',
      muscle: 'Shoulders',
      category: 'isolation',
      equipment: ['dumbbell', 'cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'side_delt', contribution: 0.9 },
        { muscle: 'traps', contribution: 0.1 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['shoulder', 'isolation', 'abduction'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_arnold_press', 'ex_rear_delt_fly'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_rear_delt_fly',
      name: 'Rear Delt Fly',
      muscle: 'Shoulders',
      category: 'isolation',
      equipment: ['dumbbell', 'cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'rear_delt', contribution: 0.85 },
        { muscle: 'upper_back', contribution: 0.15 }
      ],
      secondaryMuscles: ['rotator_cuff'],
      tags: ['pull', 'isolation', 'posterior_shoulder'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_face_pull', 'ex_lateral_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_face_pull',
      name: 'Face Pull',
      muscle: 'Shoulders',
      category: 'compound',
      equipment: ['cable', 'band'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'rear_delt', contribution: 0.45 },
        { muscle: 'upper_back', contribution: 0.25 },
        { muscle: 'rotator_cuff', contribution: 0.2 },
        { muscle: 'traps', contribution: 0.1 }
      ],
      secondaryMuscles: ['biceps'],
      tags: ['pull', 'rehab', 'posture'],
      contraindications: [],
      alternatives: ['ex_rear_delt_fly', 'ex_band_external_rotation'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_barbell_curl',
      name: 'Barbell Curl',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['barbell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'biceps', contribution: 0.85 },
        { muscle: 'forearms', contribution: 0.15 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'elbow_flexion'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_db_curl', 'ex_hammer_curl'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_db_curl',
      name: 'Dumbbell Curl',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['dumbbell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'biceps', contribution: 0.85 },
        { muscle: 'forearms', contribution: 0.15 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'unilateral'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_barbell_curl', 'ex_hammer_curl'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_hammer_curl',
      name: 'Hammer Curl',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['dumbbell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'biceps', contribution: 0.65 },
        { muscle: 'forearms', contribution: 0.35 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'neutral_grip'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_db_curl', 'ex_preacher_curl'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_preacher_curl',
      name: 'Preacher Curl',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['ez_bar', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'biceps', contribution: 0.9 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'machine'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_barbell_curl', 'ex_db_curl'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_triceps_pressdown',
      name: 'Triceps Rope Pressdown',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['cable', 'rope'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'triceps', contribution: 0.9 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'elbow_extension'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_overhead_triceps_extension', 'ex_skull_crusher'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_overhead_triceps_extension',
      name: 'Overhead Triceps Extension',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['dumbbell', 'cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'triceps', contribution: 0.88 },
        { muscle: 'front_delt', contribution: 0.12 }
      ],
      secondaryMuscles: ['core'],
      tags: ['arms', 'isolation', 'long_head'],
      contraindications: ['shoulder_impingement', 'no_overhead'],
      alternatives: ['ex_triceps_pressdown', 'ex_skull_crusher'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_skull_crusher',
      name: 'Skull Crusher',
      muscle: 'Arms',
      category: 'isolation',
      equipment: ['ez_bar', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'triceps', contribution: 0.92 },
        { muscle: 'forearms', contribution: 0.08 }
      ],
      secondaryMuscles: [],
      tags: ['arms', 'isolation', 'supine'],
      contraindications: ['elbow_tendinopathy'],
      alternatives: ['ex_triceps_pressdown', 'ex_overhead_triceps_extension'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_close_grip_bench',
      name: 'Close-Grip Bench Press',
      muscle: 'Arms',
      category: 'compound',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'triceps', contribution: 0.45 },
        { muscle: 'chest', contribution: 0.35 },
        { muscle: 'front_delt', contribution: 0.2 }
      ],
      secondaryMuscles: ['core'],
      tags: ['push', 'horizontal', 'compound'],
      contraindications: ['wrist_injury', 'shoulder_impingement'],
      alternatives: ['ex_bench_press', 'ex_triceps_pressdown'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_plank',
      name: 'Plank',
      muscle: 'Core',
      category: 'isolation',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.9 },
        { muscle: 'glutes', contribution: 0.1 }
      ],
      secondaryMuscles: ['front_delt', 'quads'],
      tags: ['core', 'anti_extension', 'rehab'],
      contraindications: ['wrist_injury'],
      alternatives: ['ex_dead_bug', 'ex_side_plank'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_side_plank',
      name: 'Side Plank',
      muscle: 'Core',
      category: 'isolation',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.85 },
        { muscle: 'glutes', contribution: 0.15 }
      ],
      secondaryMuscles: ['front_delt'],
      tags: ['core', 'anti_lateral_flexion', 'rehab'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_plank', 'ex_pallof_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_dead_bug',
      name: 'Dead Bug',
      muscle: 'Core',
      category: 'isolation',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.8 },
        { muscle: 'hip_flexors', contribution: 0.2 }
      ],
      secondaryMuscles: [],
      tags: ['core', 'motor_control', 'rehab'],
      contraindications: ['hip_flexor_irritation'],
      alternatives: ['ex_plank', 'ex_bird_dog'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_pallof_press',
      name: 'Pallof Press',
      muscle: 'Core',
      category: 'isolation',
      equipment: ['band', 'cable'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.85 },
        { muscle: 'glutes', contribution: 0.15 }
      ],
      secondaryMuscles: ['front_delt'],
      tags: ['core', 'anti_rotation', 'rehab'],
      contraindications: [],
      alternatives: ['ex_side_plank', 'ex_dead_bug'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_hanging_knee_raise',
      name: 'Hanging Knee Raise',
      muscle: 'Core',
      category: 'compound',
      equipment: ['pullup_bar'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.65 },
        { muscle: 'hip_flexors', contribution: 0.25 },
        { muscle: 'forearms', contribution: 0.1 }
      ],
      secondaryMuscles: ['lats'],
      tags: ['core', 'hip_flexion', 'bodyweight'],
      contraindications: ['hip_flexor_irritation', 'shoulder_impingement'],
      alternatives: ['ex_dead_bug', 'ex_pallof_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_cat_cow',
      name: 'Cat-Cow',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.5 },
        { muscle: 'upper_back', contribution: 0.5 }
      ],
      secondaryMuscles: [],
      tags: ['mobility', 'spine', 'warmup'],
      contraindications: ['acute_disc_irritation'],
      alternatives: ['ex_thoracic_rotation', 'ex_bird_dog'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_hip_flexor_stretch',
      name: 'Half-Kneeling Hip Flexor Stretch',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'hip_flexors', contribution: 0.8 },
        { muscle: 'glutes', contribution: 0.2 }
      ],
      secondaryMuscles: ['core'],
      tags: ['mobility', 'hip', 'rehab'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_worlds_greatest_stretch', 'ex_glute_bridge'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_thoracic_rotation',
      name: 'Thoracic Rotation',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.6 },
        { muscle: 'core', contribution: 0.4 }
      ],
      secondaryMuscles: ['rear_delt'],
      tags: ['mobility', 'spine', 'rotation'],
      contraindications: ['acute_disc_irritation'],
      alternatives: ['ex_cat_cow', 'ex_face_pull'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_band_external_rotation',
      name: 'Band External Rotation',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['band'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'rotator_cuff', contribution: 0.9 },
        { muscle: 'rear_delt', contribution: 0.1 }
      ],
      secondaryMuscles: ['upper_back'],
      tags: ['rehab', 'shoulder', 'prehab'],
      contraindications: ['acute_shoulder_pain'],
      alternatives: ['ex_face_pull', 'ex_rear_delt_fly'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_worlds_greatest_stretch',
      name: 'World\'s Greatest Stretch',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'hip_flexors', contribution: 0.35 },
        { muscle: 'core', contribution: 0.25 },
        { muscle: 'glutes', contribution: 0.2 },
        { muscle: 'upper_back', contribution: 0.2 }
      ],
      secondaryMuscles: ['hamstrings'],
      tags: ['mobility', 'warmup', 'full_body'],
      contraindications: ['knee_pain'],
      alternatives: ['ex_hip_flexor_stretch', 'ex_cat_cow'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_assault_bike_intervals',
      name: 'Assault Bike Intervals',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['air_bike'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.3 },
        { muscle: 'hamstrings', contribution: 0.2 },
        { muscle: 'glutes', contribution: 0.2 },
        { muscle: 'core', contribution: 0.15 },
        { muscle: 'triceps', contribution: 0.15 }
      ],
      secondaryMuscles: ['calves', 'front_delt'],
      tags: ['cardio', 'intervals', 'conditioning'],
      contraindications: ['cardio_intolerance'],
      alternatives: ['ex_rower_sprint', 'ex_incline_treadmill_walk'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_rower_sprint',
      name: 'Rower Sprint',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['rower'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.25 },
        { muscle: 'hamstrings', contribution: 0.2 },
        { muscle: 'upper_back', contribution: 0.25 },
        { muscle: 'lats', contribution: 0.15 },
        { muscle: 'core', contribution: 0.15 }
      ],
      secondaryMuscles: ['forearms', 'calves'],
      tags: ['cardio', 'intervals', 'full_body'],
      contraindications: ['lumbar_irritation'],
      alternatives: ['ex_assault_bike_intervals', 'ex_jump_rope'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_jump_rope',
      name: 'Jump Rope',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['jump_rope'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'calves', contribution: 0.45 },
        { muscle: 'quads', contribution: 0.2 },
        { muscle: 'hamstrings', contribution: 0.15 },
        { muscle: 'core', contribution: 0.2 }
      ],
      secondaryMuscles: ['forearms'],
      tags: ['cardio', 'plyometric', 'conditioning'],
      contraindications: ['achilles_pain', 'knee_pain'],
      alternatives: ['ex_incline_treadmill_walk', 'ex_battle_ropes'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_incline_treadmill_walk',
      name: 'Incline Treadmill Walk',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['treadmill'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'glutes', contribution: 0.3 },
        { muscle: 'hamstrings', contribution: 0.25 },
        { muscle: 'quads', contribution: 0.2 },
        { muscle: 'calves', contribution: 0.15 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: [],
      tags: ['cardio', 'low_impact', 'zone2'],
      contraindications: ['cardio_intolerance'],
      alternatives: ['ex_low_impact_steps', 'ex_assault_bike_intervals'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_battle_ropes',
      name: 'Battle Ropes',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['battle_rope'],
      difficulty: 'intermediate',
      primaryMuscles: [
        { muscle: 'upper_back', contribution: 0.2 },
        { muscle: 'front_delt', contribution: 0.2 },
        { muscle: 'triceps', contribution: 0.2 },
        { muscle: 'core', contribution: 0.2 },
        { muscle: 'forearms', contribution: 0.2 }
      ],
      secondaryMuscles: ['quads'],
      tags: ['cardio', 'upper_body', 'intervals'],
      contraindications: ['shoulder_impingement'],
      alternatives: ['ex_rower_sprint', 'ex_assault_bike_intervals'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_standing_calf_raise',
      name: 'Standing Calf Raise',
      muscle: 'Calves',
      category: 'isolation',
      equipment: ['machine', 'bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'calves', contribution: 0.95 },
        { muscle: 'forearms', contribution: 0.05 }
      ],
      secondaryMuscles: ['core'],
      tags: ['calves', 'isolation', 'ankle'],
      contraindications: ['achilles_pain'],
      alternatives: ['ex_seated_calf_raise', 'ex_single_leg_calf_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_seated_calf_raise',
      name: 'Seated Calf Raise',
      muscle: 'Calves',
      category: 'isolation',
      equipment: ['machine'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'calves', contribution: 0.97 },
        { muscle: 'hamstrings', contribution: 0.03 }
      ],
      secondaryMuscles: [],
      tags: ['calves', 'isolation', 'machine'],
      contraindications: ['achilles_pain'],
      alternatives: ['ex_standing_calf_raise', 'ex_single_leg_calf_raise'],
      videoUrl: null,
      homeFriendly: false
    },
    {
      id: 'ex_single_leg_calf_raise',
      name: 'Single-Leg Calf Raise',
      muscle: 'Calves',
      category: 'isolation',
      equipment: ['bodyweight', 'dumbbell'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'calves', contribution: 0.95 },
        { muscle: 'core', contribution: 0.05 }
      ],
      secondaryMuscles: [],
      tags: ['calves', 'unilateral', 'balance'],
      contraindications: ['achilles_pain', 'balance_deficit'],
      alternatives: ['ex_standing_calf_raise', 'ex_tibialis_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_tibialis_raise',
      name: 'Tibialis Raise',
      muscle: 'Calves',
      category: 'isolation',
      equipment: ['bodyweight', 'tib_bar'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'calves', contribution: 1.0 }
      ],
      secondaryMuscles: [],
      tags: ['calves', 'anterior_chain', 'injury_prevention'],
      contraindications: ['shin_pain'],
      alternatives: ['ex_single_leg_calf_raise', 'ex_standing_calf_raise'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_clamshell',
      name: 'Clamshell',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['band', 'bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'glutes', contribution: 0.8 },
        { muscle: 'core', contribution: 0.2 }
      ],
      secondaryMuscles: [],
      tags: ['rehab', 'hip', 'activation'],
      contraindications: ['hip_irritation'],
      alternatives: ['ex_glute_bridge', 'ex_pallof_press'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_bird_dog',
      name: 'Bird Dog',
      muscle: 'Mobility',
      category: 'mobility',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'core', contribution: 0.6 },
        { muscle: 'glutes', contribution: 0.25 },
        { muscle: 'upper_back', contribution: 0.15 }
      ],
      secondaryMuscles: [],
      tags: ['rehab', 'motor_control', 'spine'],
      contraindications: ['acute_disc_irritation'],
      alternatives: ['ex_dead_bug', 'ex_cat_cow'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_spanish_squat',
      name: 'Spanish Squat',
      muscle: 'Legs (Quads)',
      category: 'mobility',
      equipment: ['strap', 'band'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.8 },
        { muscle: 'glutes', contribution: 0.2 }
      ],
      secondaryMuscles: ['core'],
      tags: ['rehab', 'knee', 'isometric'],
      contraindications: ['acute_knee_swelling'],
      alternatives: ['ex_leg_press', 'ex_step_up'],
      videoUrl: null,
      homeFriendly: true
    },
    {
      id: 'ex_low_impact_steps',
      name: 'Low-Impact Cardio (Walk/Steps)',
      muscle: 'Conditioning',
      category: 'cardio',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      primaryMuscles: [
        { muscle: 'quads', contribution: 0.3 },
        { muscle: 'glutes', contribution: 0.25 },
        { muscle: 'hamstrings', contribution: 0.2 },
        { muscle: 'calves', contribution: 0.15 },
        { muscle: 'core', contribution: 0.1 }
      ],
      secondaryMuscles: [],
      tags: ['cardio', 'low_impact', 'home'],
      contraindications: ['cardio_intolerance'],
      alternatives: ['ex_incline_treadmill_walk', 'ex_jump_rope'],
      videoUrl: null,
      homeFriendly: true
    }
  ];
