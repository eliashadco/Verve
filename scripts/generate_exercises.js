const fs = require('fs');

const exercises = {
    "Chest": [
        {name: "Barbell Bench Press", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Shoulder blades retracted, feet planted, slight back arch.", muscles: {chest: 0.50, front_delt: 0.20, triceps: 0.25, core: 0.05}},
        {name: "Dumbbell Bench Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Control descent, stretch at bottom, press up.", muscles: {chest: 0.60, front_delt: 0.20, triceps: 0.20}},
        {name: "Incline Barbell Bench Press", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Bench at 30-45 degrees, press over upper chest.", muscles: {chest: 0.60, front_delt: 0.25, triceps: 0.15}},
        {name: "Incline Dumbbell Bench Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Bench at 30-45 degrees, stretch pecs, press up.", muscles: {chest: 0.65, front_delt: 0.20, triceps: 0.15}},
        {name: "Decline Barbell Bench Press", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Decline bench, press lower chest.", muscles: {chest: 0.60, triceps: 0.30, front_delt: 0.10}},
        {name: "Decline Dumbbell Bench Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Decline bench, control dumbbells.", muscles: {chest: 0.65, triceps: 0.25, front_delt: 0.10}},
        {name: "Cable Crossover (High to Low)", equipment: ["cable"], difficulty: "intermediate", cues: "Pull from high cables down and together.", muscles: {chest: 0.80, front_delt: 0.10, core: 0.10}},
        {name: "Cable Crossover (Low to High)", equipment: ["cable"], difficulty: "intermediate", cues: "Pull from low cables up and together.", muscles: {chest: 0.80, front_delt: 0.15, core: 0.05}},
        {name: "Cable Crossover (Mid)", equipment: ["cable"], difficulty: "intermediate", cues: "Pull from mid cables straight together.", muscles: {chest: 0.85, front_delt: 0.10, core: 0.05}},
        {name: "Pec Deck Machine", equipment: ["machine"], difficulty: "beginner", cues: "Keep elbows slightly bent, squeeze chest at center.", muscles: {chest: 0.90, front_delt: 0.10}},
        {name: "Machine Chest Press", equipment: ["machine"], difficulty: "beginner", cues: "Press handles straight forward, keep back against pad.", muscles: {chest: 0.70, triceps: 0.20, front_delt: 0.10}},
        {name: "Machine Incline Chest Press", equipment: ["machine"], difficulty: "beginner", cues: "Press handles upward, focus on upper chest.", muscles: {chest: 0.70, front_delt: 0.20, triceps: 0.10}},
        {name: "Push-up", equipment: ["bodyweight"], difficulty: "beginner", cues: "Keep body straight, lower until chest touches floor.", muscles: {chest: 0.50, triceps: 0.30, front_delt: 0.10, core: 0.10}},
        {name: "Deficit Push-up", equipment: ["bodyweight", "blocks"], difficulty: "intermediate", cues: "Hands on blocks for greater stretch.", muscles: {chest: 0.60, triceps: 0.20, front_delt: 0.10, core: 0.10}},
        {name: "Weighted Push-up", equipment: ["bodyweight", "plate"], difficulty: "advanced", cues: "Plate on back, maintain straight body.", muscles: {chest: 0.50, triceps: 0.30, front_delt: 0.10, core: 0.10}},
        {name: "Dumbbell Fly", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Slight bend in elbows, open wide, squeeze top.", muscles: {chest: 0.85, front_delt: 0.15}},
        {name: "Incline Dumbbell Fly", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Incline bench, focus on upper pec stretch.", muscles: {chest: 0.80, front_delt: 0.20}},
        {name: "Decline Dumbbell Fly", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Decline bench, focus on lower pec stretch.", muscles: {chest: 0.85, front_delt: 0.15}},
        {name: "Floor Press", equipment: ["barbell"], difficulty: "intermediate", cues: "Lie on floor, press until triceps touch floor.", muscles: {triceps: 0.50, chest: 0.40, front_delt: 0.10}},
        {name: "Chest Dip", equipment: ["bodyweight", "dip_station"], difficulty: "advanced", cues: "Lean forward, flare elbows slightly.", muscles: {chest: 0.60, triceps: 0.30, front_delt: 0.10}}
    ],
    "Back": [
        {name: "Pull-up", equipment: ["bodyweight", "bar"], difficulty: "intermediate", cues: "Pull elbows down, chest to bar.", muscles: {lats: 0.50, upper_back: 0.20, biceps: 0.20, core: 0.10}},
        {name: "Chin-up", equipment: ["bodyweight", "bar"], difficulty: "intermediate", cues: "Underhand grip, pull chest to bar.", muscles: {lats: 0.40, biceps: 0.40, upper_back: 0.10, core: 0.10}},
        {name: "Lat Pulldown (Wide Grip)", equipment: ["cable"], difficulty: "beginner", cues: "Pull bar to upper chest, squeeze lats.", muscles: {lats: 0.60, upper_back: 0.20, biceps: 0.20}},
        {name: "Lat Pulldown (Close Grip)", equipment: ["cable"], difficulty: "beginner", cues: "Neutral grip, pull handle to chest.", muscles: {lats: 0.50, upper_back: 0.20, biceps: 0.30}},
        {name: "Barbell Row", equipment: ["barbell"], difficulty: "intermediate", cues: "Hinge at hips, pull bar to stomach.", muscles: {upper_back: 0.40, lats: 0.30, biceps: 0.10, hamstrings: 0.10, core: 0.10}},
        {name: "Pendlay Row", equipment: ["barbell"], difficulty: "advanced", cues: "Pull from floor each rep, explosive.", muscles: {upper_back: 0.50, lats: 0.20, biceps: 0.10, core: 0.20}},
        {name: "Dumbbell Single Arm Row", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Support on bench, pull dumbbell to hip.", muscles: {lats: 0.50, upper_back: 0.30, biceps: 0.20}},
        {name: "Seated Cable Row", equipment: ["cable"], difficulty: "beginner", cues: "Keep back straight, pull handle to stomach.", muscles: {upper_back: 0.50, lats: 0.30, biceps: 0.20}},
        {name: "T-Bar Row", equipment: ["barbell", "machine"], difficulty: "intermediate", cues: "Straddle bar, pull to chest.", muscles: {upper_back: 0.50, lats: 0.30, biceps: 0.20}},
        {name: "Chest-Supported Dumbbell Row", equipment: ["dumbbell", "bench"], difficulty: "beginner", cues: "Lie face down on incline bench, row up.", muscles: {upper_back: 0.60, lats: 0.20, biceps: 0.20}},
        {name: "Machine Row", equipment: ["machine"], difficulty: "beginner", cues: "Pull handles back, squeeze shoulder blades.", muscles: {upper_back: 0.50, lats: 0.30, biceps: 0.20}},
        {name: "Straight Arm Pulldown", equipment: ["cable"], difficulty: "beginner", cues: "Keep arms straight, pull down to thighs.", muscles: {lats: 0.80, triceps: 0.10, core: 0.10}},
        {name: "Meadows Row", equipment: ["barbell"], difficulty: "advanced", cues: "Landmine setup, staggered stance, pull to hip.", muscles: {upper_back: 0.50, lats: 0.40, biceps: 0.10}},
        {name: "Renegade Row", equipment: ["dumbbell"], difficulty: "advanced", cues: "Pushup position, row one arm at a time.", muscles: {upper_back: 0.30, lats: 0.20, core: 0.40, chest: 0.10}},
        {name: "Inverted Row", equipment: ["bodyweight", "bar"], difficulty: "beginner", cues: "Body straight under bar, pull chest to bar.", muscles: {upper_back: 0.50, lats: 0.20, biceps: 0.20, core: 0.10}},
        {name: "Rack Pull", equipment: ["barbell", "rack"], difficulty: "advanced", cues: "Deadlift from knee height, squeeze glutes.", muscles: {upper_back: 0.40, glutes: 0.30, hamstrings: 0.20, core: 0.10}},
        {name: "Good Morning", equipment: ["barbell"], difficulty: "advanced", cues: "Bar on back, hinge hips back, slight knee bend.", muscles: {hamstrings: 0.40, glutes: 0.30, upper_back: 0.20, core: 0.10}},
        {name: "Back Extension", equipment: ["bodyweight", "machine"], difficulty: "beginner", cues: "Hinge at hips, squeeze glutes and lower back.", muscles: {lower_back: 0.50, glutes: 0.30, hamstrings: 0.20}},
        {name: "Farmer's Walk", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Hold heavy weights, walk with tall posture.", muscles: {traps: 0.30, forearms: 0.30, core: 0.30, calves: 0.10}},
        {name: "Barbell Shrug", equipment: ["barbell"], difficulty: "beginner", cues: "Elevate shoulders straight up.", muscles: {traps: 0.80, forearms: 0.20}}
    ],
    "Shoulders": [
        {name: "Overhead Press", equipment: ["barbell"], difficulty: "intermediate", cues: "Press bar overhead, lock elbows.", muscles: {front_delt: 0.50, side_delt: 0.20, triceps: 0.20, core: 0.10}},
        {name: "Dumbbell Shoulder Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Seated, press dumbbells overhead.", muscles: {front_delt: 0.50, side_delt: 0.30, triceps: 0.20}},
        {name: "Arnold Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Rotate palms out as you press up.", muscles: {front_delt: 0.50, side_delt: 0.30, triceps: 0.20}},
        {name: "Machine Shoulder Press", equipment: ["machine"], difficulty: "beginner", cues: "Press handles overhead.", muscles: {front_delt: 0.60, side_delt: 0.20, triceps: 0.20}},
        {name: "Dumbbell Lateral Raise", equipment: ["dumbbell"], difficulty: "beginner", cues: "Raise arms to sides, slight elbow bend.", muscles: {side_delt: 0.80, front_delt: 0.10, traps: 0.10}},
        {name: "Cable Lateral Raise", equipment: ["cable"], difficulty: "beginner", cues: "Pull cable across body and up.", muscles: {side_delt: 0.85, traps: 0.15}},
        {name: "Machine Lateral Raise", equipment: ["machine"], difficulty: "beginner", cues: "Raise pads outward.", muscles: {side_delt: 0.90, traps: 0.10}},
        {name: "Dumbbell Front Raise", equipment: ["dumbbell"], difficulty: "beginner", cues: "Raise dumbbells straight forward.", muscles: {front_delt: 0.90, side_delt: 0.10}},
        {name: "Cable Front Raise", equipment: ["cable"], difficulty: "beginner", cues: "Pull cable forward and up.", muscles: {front_delt: 0.90, side_delt: 0.10}},
        {name: "Barbell Front Raise", equipment: ["barbell"], difficulty: "beginner", cues: "Raise barbell straight forward.", muscles: {front_delt: 0.90, side_delt: 0.10}},
        {name: "Dumbbell Rear Delt Fly", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hinge forward, raise arms to sides.", muscles: {rear_delt: 0.70, upper_back: 0.30}},
        {name: "Reverse Pec Deck", equipment: ["machine"], difficulty: "beginner", cues: "Pull handles backwards, squeeze rear delts.", muscles: {rear_delt: 0.80, upper_back: 0.20}},
        {name: "Cable Face Pull", equipment: ["cable"], difficulty: "beginner", cues: "Pull rope to face, separate hands.", muscles: {rear_delt: 0.50, upper_back: 0.30, side_delt: 0.20}},
        {name: "Upright Row", equipment: ["barbell"], difficulty: "intermediate", cues: "Pull bar up to chin, elbows high.", muscles: {side_delt: 0.50, traps: 0.30, biceps: 0.20}},
        {name: "Cable Upright Row", equipment: ["cable"], difficulty: "beginner", cues: "Pull handle up, elbows high.", muscles: {side_delt: 0.50, traps: 0.30, biceps: 0.20}},
        {name: "Push Press", equipment: ["barbell"], difficulty: "advanced", cues: "Dip legs, drive bar overhead.", muscles: {front_delt: 0.40, triceps: 0.20, quads: 0.20, core: 0.20}},
        {name: "Bradford Press", equipment: ["barbell"], difficulty: "advanced", cues: "Press over head to front, then back.", muscles: {front_delt: 0.50, side_delt: 0.30, triceps: 0.20}},
        {name: "Lu Raise", equipment: ["dumbbell", "plate"], difficulty: "intermediate", cues: "Full lateral raise meeting overhead.", muscles: {side_delt: 0.60, traps: 0.30, front_delt: 0.10}},
        {name: "Egyptian Lateral Raise", equipment: ["cable"], difficulty: "intermediate", cues: "Lean away, pull cable from behind back.", muscles: {side_delt: 0.90, traps: 0.10}},
        {name: "Z Press", equipment: ["barbell"], difficulty: "advanced", cues: "Sit on floor, legs straight, press overhead.", muscles: {front_delt: 0.50, core: 0.30, triceps: 0.20}}
    ],
    "Triceps": [
        {name: "Triceps Pushdown", equipment: ["cable"], difficulty: "beginner", cues: "Keep elbows tucked, extend arms.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Overhead Triceps Extension (Cable)", equipment: ["cable"], difficulty: "beginner", cues: "Extend arms overhead, stretch long head.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Overhead Triceps Extension (Dumbbell)", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hold dumbbell overhead, lower behind head.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Skull Crusher", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Lower bar to forehead, extend up.", muscles: {triceps: 0.90, chest: 0.10}},
        {name: "Close-Grip Bench Press", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Hands shoulder-width, tuck elbows.", muscles: {triceps: 0.60, chest: 0.30, front_delt: 0.10}},
        {name: "Triceps Dip", equipment: ["bodyweight", "dip_station"], difficulty: "advanced", cues: "Stay upright, lower body, push up.", muscles: {triceps: 0.70, chest: 0.20, front_delt: 0.10}},
        {name: "Bench Dip", equipment: ["bodyweight", "bench"], difficulty: "beginner", cues: "Hands on bench behind you, lower body.", muscles: {triceps: 0.70, front_delt: 0.20, chest: 0.10}},
        {name: "Dumbbell Kickback", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hinge forward, extend arm back.", muscles: {triceps: 0.90, rear_delt: 0.10}},
        {name: "Cable Kickback", equipment: ["cable"], difficulty: "beginner", cues: "Hinge forward, extend cable back.", muscles: {triceps: 0.90, rear_delt: 0.10}},
        {name: "JM Press", equipment: ["barbell", "bench"], difficulty: "advanced", cues: "Lower bar toward neck/chin, extend.", muscles: {triceps: 0.80, chest: 0.20}},
        {name: "Tate Press", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Elbows out, lower dumbbells to chest.", muscles: {triceps: 0.85, chest: 0.15}},
        {name: "Rolling Triceps Extension", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Roll shoulders back as you lower, extend.", muscles: {triceps: 0.90, lats: 0.10}},
        {name: "Single Arm Reverse Pushdown", equipment: ["cable"], difficulty: "beginner", cues: "Underhand grip, push down.", muscles: {triceps: 0.90, forearms: 0.10}},
        {name: "V-Bar Pushdown", equipment: ["cable"], difficulty: "beginner", cues: "Use V-bar attachment, push down.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Rope Pushdown", equipment: ["cable"], difficulty: "beginner", cues: "Spread rope at bottom.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Cross-Body Triceps Extension", equipment: ["cable"], difficulty: "intermediate", cues: "Pull cables across body.", muscles: {triceps: 0.95, core: 0.05}},
        {name: "Diamond Push-up", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Hands form diamond shape, push up.", muscles: {triceps: 0.60, chest: 0.30, core: 0.10}},
        {name: "French Press", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Seated, extend barbell overhead.", muscles: {triceps: 0.90, core: 0.10}},
        {name: "Floor Skull Crusher", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Lie on floor, lower dumbbells near ears.", muscles: {triceps: 0.95, chest: 0.05}},
        {name: "Machine Triceps Extension", equipment: ["machine"], difficulty: "beginner", cues: "Place elbows on pad, extend arms.", muscles: {triceps: 0.95, chest: 0.05}}
    ],
    "Biceps": [
        {name: "Barbell Curl", equipment: ["barbell"], difficulty: "beginner", cues: "Keep elbows fixed, curl bar up.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Dumbbell Curl", equipment: ["dumbbell"], difficulty: "beginner", cues: "Supinate wrist as you curl.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Hammer Curl", equipment: ["dumbbell"], difficulty: "beginner", cues: "Neutral grip, curl up.", muscles: {biceps: 0.60, brachialis: 0.20, forearms: 0.20}},
        {name: "EZ Bar Curl", equipment: ["barbell"], difficulty: "beginner", cues: "Grip angled bar, curl up.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Preacher Curl", equipment: ["barbell", "bench"], difficulty: "beginner", cues: "Arms on pad, full extension, curl up.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Incline Dumbbell Curl", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Incline bench, stretch biceps, curl.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Concentration Curl", equipment: ["dumbbell", "bench"], difficulty: "beginner", cues: "Elbow on inner thigh, strict curl.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Cable Curl", equipment: ["cable"], difficulty: "beginner", cues: "Constant tension, curl up.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Reverse Curl", equipment: ["barbell"], difficulty: "beginner", cues: "Overhand grip, curl up.", muscles: {forearms: 0.50, biceps: 0.30, brachialis: 0.20}},
        {name: "Zottman Curl", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Curl up underhand, lower overhand.", muscles: {biceps: 0.60, forearms: 0.40}},
        {name: "Spider Curl", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Chest on incline bench, arms hang down.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Machine Bicep Curl", equipment: ["machine"], difficulty: "beginner", cues: "Arms on pad, pull handles.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "High Cable Curl", equipment: ["cable"], difficulty: "intermediate", cues: "Arms raised to sides, curl handles to head.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Drag Curl", equipment: ["barbell"], difficulty: "intermediate", cues: "Pull elbows back, drag bar up torso.", muscles: {biceps: 0.80, rear_delt: 0.20}},
        {name: "Bayesian Curl", equipment: ["cable"], difficulty: "intermediate", cues: "Face away from cable, full stretch.", muscles: {biceps: 0.95, forearms: 0.05}},
        {name: "Cross-Body Hammer Curl", equipment: ["dumbbell"], difficulty: "beginner", cues: "Curl dumbbell across chest.", muscles: {biceps: 0.50, brachialis: 0.30, forearms: 0.20}},
        {name: "Plate Pinch Curl", equipment: ["plate"], difficulty: "advanced", cues: "Pinch weight plate, curl up.", muscles: {biceps: 0.50, forearms: 0.50}},
        {name: "Seated Alternating Dumbbell Curl", equipment: ["dumbbell", "bench"], difficulty: "beginner", cues: "Strict form, alternate arms.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Waiters Curl", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hold top of dumbbell flat, curl up.", muscles: {biceps: 0.90, forearms: 0.10}},
        {name: "Suspension Trainer Bicep Curl", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Lean back, curl body to handles.", muscles: {biceps: 0.80, core: 0.20}}
    ],
    "Quads": [
        {name: "Barbell Back Squat", equipment: ["barbell", "rack"], difficulty: "intermediate", cues: "Sit between hips, drive up.", muscles: {quads: 0.40, glutes: 0.30, hamstrings: 0.20, core: 0.10}},
        {name: "Barbell Front Squat", equipment: ["barbell", "rack"], difficulty: "advanced", cues: "Bar on front delts, upright torso.", muscles: {quads: 0.60, glutes: 0.20, core: 0.20}},
        {name: "Leg Press", equipment: ["machine"], difficulty: "beginner", cues: "Feet mid-platform, lower control, press up.", muscles: {quads: 0.60, glutes: 0.30, hamstrings: 0.10}},
        {name: "Leg Extension", equipment: ["machine"], difficulty: "beginner", cues: "Extend legs, squeeze quads at top.", muscles: {quads: 1.0}},
        {name: "Hack Squat", equipment: ["machine"], difficulty: "intermediate", cues: "Back flat against pad, squat down.", muscles: {quads: 0.70, glutes: 0.20, calves: 0.10}},
        {name: "Goblet Squat", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hold weight at chest, squat deep.", muscles: {quads: 0.50, glutes: 0.30, core: 0.20}},
        {name: "Bulgarian Split Squat", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Rear foot elevated, drop back knee.", muscles: {quads: 0.50, glutes: 0.40, core: 0.10}},
        {name: "Walking Lunge", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Step forward, drop knee, push to next step.", muscles: {quads: 0.50, glutes: 0.40, core: 0.10}},
        {name: "Reverse Lunge", equipment: ["dumbbell"], difficulty: "beginner", cues: "Step back, drop knee, push forward.", muscles: {quads: 0.40, glutes: 0.50, core: 0.10}},
        {name: "Forward Lunge", equipment: ["dumbbell"], difficulty: "beginner", cues: "Step forward, push back to start.", muscles: {quads: 0.60, glutes: 0.30, core: 0.10}},
        {name: "Sissy Squat", equipment: ["bodyweight"], difficulty: "advanced", cues: "Lean back, knees forward, heels up.", muscles: {quads: 0.90, core: 0.10}},
        {name: "Pistol Squat", equipment: ["bodyweight"], difficulty: "advanced", cues: "One leg straight out, squat on other.", muscles: {quads: 0.50, glutes: 0.30, core: 0.20}},
        {name: "Zercher Squat", equipment: ["barbell", "rack"], difficulty: "advanced", cues: "Hold bar in crooks of elbows.", muscles: {quads: 0.50, glutes: 0.20, core: 0.30}},
        {name: "Smith Machine Squat", equipment: ["machine"], difficulty: "beginner", cues: "Feet slightly forward, squat down.", muscles: {quads: 0.50, glutes: 0.40, hamstrings: 0.10}},
        {name: "Step Up", equipment: ["dumbbell", "box"], difficulty: "beginner", cues: "Step onto box, drive through front heel.", muscles: {quads: 0.50, glutes: 0.40, core: 0.10}},
        {name: "Spanish Squat", equipment: ["band"], difficulty: "intermediate", cues: "Band behind knees, sit back keeping shins vertical.", muscles: {quads: 0.90, glutes: 0.10}},
        {name: "Box Squat", equipment: ["barbell", "box"], difficulty: "intermediate", cues: "Sit back onto box, pause, drive up.", muscles: {glutes: 0.40, quads: 0.30, hamstrings: 0.30}},
        {name: "Heel Elevated Goblet Squat", equipment: ["dumbbell", "plate"], difficulty: "beginner", cues: "Heels on small plate, squat upright.", muscles: {quads: 0.80, glutes: 0.20}},
        {name: "Belt Squat", equipment: ["machine"], difficulty: "intermediate", cues: "Weight on hips, squat down.", muscles: {quads: 0.60, glutes: 0.40}},
        {name: "Pendulum Squat", equipment: ["machine"], difficulty: "advanced", cues: "Back on pad, deep squat arc.", muscles: {quads: 0.70, glutes: 0.30}}
    ],
    "Hamstrings": [
        {name: "Romanian Deadlift", equipment: ["barbell"], difficulty: "intermediate", cues: "Hinge hips back, feel stretch, drive up.", muscles: {hamstrings: 0.60, glutes: 0.30, lower_back: 0.10}},
        {name: "Seated Leg Curl", equipment: ["machine"], difficulty: "beginner", cues: "Curl pad back, squeeze hamstrings.", muscles: {hamstrings: 1.0}},
        {name: "Lying Leg Curl", equipment: ["machine"], difficulty: "beginner", cues: "Lie face down, curl weight up.", muscles: {hamstrings: 1.0}},
        {name: "Stiff-Leg Deadlift", equipment: ["barbell"], difficulty: "advanced", cues: "Legs straight, hinge deeply.", muscles: {hamstrings: 0.70, lower_back: 0.20, glutes: 0.10}},
        {name: "Nordic Hamstring Curl", equipment: ["bodyweight"], difficulty: "advanced", cues: "Kneeling, lower torso slowly.", muscles: {hamstrings: 0.90, glutes: 0.10}},
        {name: "Dumbbell RDL", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hinge hips with dumbbells close to legs.", muscles: {hamstrings: 0.60, glutes: 0.30, lower_back: 0.10}},
        {name: "Glute-Ham Raise", equipment: ["machine"], difficulty: "advanced", cues: "Curl body up using hamstrings.", muscles: {hamstrings: 0.70, glutes: 0.20, calves: 0.10}},
        {name: "Single Leg RDL", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Balance on one leg, hinge forward.", muscles: {hamstrings: 0.50, glutes: 0.30, core: 0.20}},
        {name: "Cable Pull-Through", equipment: ["cable"], difficulty: "beginner", cues: "Face away, pull rope through legs with hips.", muscles: {hamstrings: 0.40, glutes: 0.60}},
        {name: "Swiss Ball Leg Curl", equipment: ["bodyweight"], difficulty: "beginner", cues: "Heels on ball, lift hips, curl ball in.", muscles: {hamstrings: 0.70, glutes: 0.20, core: 0.10}},
        {name: "Good Morning", equipment: ["barbell"], difficulty: "advanced", cues: "Bar on back, hinge forward.", muscles: {hamstrings: 0.50, lower_back: 0.30, glutes: 0.20}},
        {name: "Sliding Leg Curl", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Heels on sliders, lift hips, curl in.", muscles: {hamstrings: 0.80, glutes: 0.10, core: 0.10}},
        {name: "Kettlebell Swing", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Hinge hips, explosively swing weight.", muscles: {hamstrings: 0.40, glutes: 0.40, core: 0.20}},
        {name: "Banded Leg Curl", equipment: ["band"], difficulty: "beginner", cues: "Band around ankle, curl leg back.", muscles: {hamstrings: 1.0}},
        {name: "Trap Bar RDL", equipment: ["barbell"], difficulty: "intermediate", cues: "Hold trap bar, hinge hips.", muscles: {hamstrings: 0.50, glutes: 0.30, lower_back: 0.20}},
        {name: "Standing Single Leg Curl", equipment: ["machine"], difficulty: "beginner", cues: "Curl one leg at a time on machine.", muscles: {hamstrings: 1.0}},
        {name: "Slider Eccentric Hamstring Curl", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Slowly extend legs out on sliders.", muscles: {hamstrings: 0.90, core: 0.10}},
        {name: "Deficit RDL", equipment: ["barbell", "plate"], difficulty: "advanced", cues: "Stand on plate for deeper stretch.", muscles: {hamstrings: 0.70, glutes: 0.20, lower_back: 0.10}},
        {name: "B-Stance RDL", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Staggered stance, hinge hips.", muscles: {hamstrings: 0.60, glutes: 0.30, lower_back: 0.10}},
        {name: "Machine Good Morning", equipment: ["machine"], difficulty: "intermediate", cues: "Use machine pad, hinge forward.", muscles: {hamstrings: 0.50, lower_back: 0.30, glutes: 0.20}}
    ],
    "Glutes": [
        {name: "Barbell Hip Thrust", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Shoulders on bench, thrust hips up.", muscles: {glutes: 0.70, hamstrings: 0.20, core: 0.10}},
        {name: "Glute Bridge", equipment: ["bodyweight"], difficulty: "beginner", cues: "Lie on back, squeeze glutes to lift hips.", muscles: {glutes: 0.80, hamstrings: 0.10, core: 0.10}},
        {name: "Kas Glute Bridge", equipment: ["barbell", "bench"], difficulty: "intermediate", cues: "Short ROM hip thrust, constant tension.", muscles: {glutes: 0.90, hamstrings: 0.10}},
        {name: "Bulgarian Split Squat (Glute Focus)", equipment: ["dumbbell", "bench"], difficulty: "intermediate", cues: "Long stride, hinge torso forward slightly.", muscles: {glutes: 0.60, quads: 0.30, core: 0.10}},
        {name: "Cable Pull-Through", equipment: ["cable"], difficulty: "beginner", cues: "Pull cable forward with hips.", muscles: {glutes: 0.60, hamstrings: 0.40}},
        {name: "Cable Kickback", equipment: ["cable"], difficulty: "beginner", cues: "Kick leg straight back, squeeze glute.", muscles: {glutes: 0.80, hamstrings: 0.20}},
        {name: "Machine Hip Abduction", equipment: ["machine"], difficulty: "beginner", cues: "Push knees outward against pads.", muscles: {glutes: 0.90, hips: 0.10}},
        {name: "Deficit Reverse Lunge", equipment: ["dumbbell", "plate"], difficulty: "intermediate", cues: "Stand on plate, lunge back for deep stretch.", muscles: {glutes: 0.60, quads: 0.30, core: 0.10}},
        {name: "Frog Pumps", equipment: ["bodyweight"], difficulty: "beginner", cues: "Feet together, bridge hips up.", muscles: {glutes: 0.90, core: 0.10}},
        {name: "Banded Lateral Walk", equipment: ["band"], difficulty: "beginner", cues: "Band around knees/ankles, step side to side.", muscles: {glutes: 0.90, hips: 0.10}},
        {name: "Single Leg Hip Thrust", equipment: ["bodyweight", "bench"], difficulty: "intermediate", cues: "Thrust up with one leg.", muscles: {glutes: 0.70, hamstrings: 0.20, core: 0.10}},
        {name: "Step-Downs", equipment: ["bodyweight", "box"], difficulty: "intermediate", cues: "Slowly step down off box, focus on glute stretch.", muscles: {glutes: 0.60, quads: 0.40}},
        {name: "Dumbbell Sumo Squat", equipment: ["dumbbell"], difficulty: "beginner", cues: "Wide stance, toes out, squat down.", muscles: {glutes: 0.50, quads: 0.30, adductors: 0.20}},
        {name: "Curtsy Lunge", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Step leg behind and across, drop knee.", muscles: {glutes: 0.60, quads: 0.40}},
        {name: "45-Degree Hyperextension", equipment: ["machine"], difficulty: "intermediate", cues: "Round upper back, squeeze glutes to rise.", muscles: {glutes: 0.60, hamstrings: 0.30, lower_back: 0.10}},
        {name: "Smith Machine Donkey Kick", equipment: ["machine"], difficulty: "intermediate", cues: "Push bar up with sole of foot.", muscles: {glutes: 0.80, hamstrings: 0.20}},
        {name: "Banded Clamshells", equipment: ["band"], difficulty: "beginner", cues: "Lie on side, open knees against band.", muscles: {glutes: 0.90, hips: 0.10}},
        {name: "Reverse Hyper", equipment: ["machine"], difficulty: "advanced", cues: "Swing legs up behind, squeeze glutes.", muscles: {glutes: 0.50, lower_back: 0.40, hamstrings: 0.10}},
        {name: "Kneeling Squat", equipment: ["barbell"], difficulty: "intermediate", cues: "Kneel, sit back, thrust hips forward.", muscles: {glutes: 0.80, quads: 0.20}},
        {name: "Fire Hydrants", equipment: ["bodyweight"], difficulty: "beginner", cues: "All fours, lift leg out to side.", muscles: {glutes: 0.90, hips: 0.10}}
    ],
    "Calves": [
        {name: "Standing Calf Raise", equipment: ["machine"], difficulty: "beginner", cues: "Press toes down, lift heels high.", muscles: {calves: 1.0}},
        {name: "Seated Calf Raise", equipment: ["machine"], difficulty: "beginner", cues: "Press toes down, focus on soleus.", muscles: {calves: 1.0}},
        {name: "Leg Press Calf Raise", equipment: ["machine"], difficulty: "beginner", cues: "Toes on bottom edge, press up.", muscles: {calves: 1.0}},
        {name: "Dumbbell Single Leg Calf Raise", equipment: ["dumbbell"], difficulty: "beginner", cues: "Hold dumbbell, balance, raise heel.", muscles: {calves: 1.0}},
        {name: "Donkey Calf Raise", equipment: ["machine"], difficulty: "intermediate", cues: "Hinge forward, weight on hips, raise heels.", muscles: {calves: 1.0}},
        {name: "Smith Machine Calf Raise", equipment: ["machine"], difficulty: "beginner", cues: "Bar on back, toes on plate, raise heels.", muscles: {calves: 1.0}},
        {name: "Bodyweight Calf Raise", equipment: ["bodyweight"], difficulty: "beginner", cues: "Stand on edge of step, raise heels.", muscles: {calves: 1.0}},
        {name: "Farmer's Walk on Toes", equipment: ["dumbbell"], difficulty: "advanced", cues: "Walk forward staying on tiptoes.", muscles: {calves: 0.70, core: 0.20, traps: 0.10}},
        {name: "Jump Rope", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Stay light on feet, bounce on calves.", muscles: {calves: 0.70, cardio: 0.30}},
        {name: "Box Jumps", equipment: ["box"], difficulty: "advanced", cues: "Explosive jump onto box.", muscles: {calves: 0.40, quads: 0.30, glutes: 0.30}},
        {name: "Sled Push", equipment: ["machine"], difficulty: "intermediate", cues: "Drive through toes to push sled.", muscles: {calves: 0.40, quads: 0.40, glutes: 0.20}},
        {name: "Tibialis Raise", equipment: ["bodyweight"], difficulty: "beginner", cues: "Heels against wall, raise toes.", muscles: {calves: 1.0}},
        {name: "Barbell Seated Calf Raise", equipment: ["barbell", "bench"], difficulty: "beginner", cues: "Bar over knees, raise heels.", muscles: {calves: 1.0}},
        {name: "Banded Calf Extension", equipment: ["band"], difficulty: "beginner", cues: "Band around foot, press gas pedal.", muscles: {calves: 1.0}},
        {name: "Agility Ladder Drills", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Quick feet, stay on toes.", muscles: {calves: 0.60, cardio: 0.40}},
        {name: "Pogo Jumps", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Stiff legs, bounce using ankles.", muscles: {calves: 0.80, quads: 0.20}},
        {name: "Treadmill Incline Walk", equipment: ["machine"], difficulty: "beginner", cues: "Steep incline, walk on toes.", muscles: {calves: 0.50, glutes: 0.30, cardio: 0.20}},
        {name: "Stairmaster", equipment: ["machine"], difficulty: "intermediate", cues: "Step with toes, drive up.", muscles: {calves: 0.40, quads: 0.40, cardio: 0.20}},
        {name: "Wall Sit with Calf Raise", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Hold wall sit, raise heels.", muscles: {quads: 0.50, calves: 0.50}},
        {name: "Plyometric Lunges", equipment: ["bodyweight"], difficulty: "advanced", cues: "Jump switch lunges, push off toes.", muscles: {quads: 0.40, calves: 0.30, glutes: 0.30}}
    ],
    "Core": [
        {name: "Plank", equipment: ["bodyweight"], difficulty: "beginner", cues: "Straight body, brace core.", muscles: {core: 0.90, shoulders: 0.10}},
        {name: "Crunch", equipment: ["bodyweight"], difficulty: "beginner", cues: "Lift shoulder blades off floor.", muscles: {core: 1.0}},
        {name: "Leg Raises", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Lie flat, lift legs straight up.", muscles: {core: 0.80, hip_flexors: 0.20}},
        {name: "Hanging Leg Raises", equipment: ["bodyweight", "bar"], difficulty: "advanced", cues: "Hang from bar, lift toes to bar.", muscles: {core: 0.70, hip_flexors: 0.20, lats: 0.10}},
        {name: "Ab Wheel Rollout", equipment: ["machine"], difficulty: "advanced", cues: "Roll forward, keep back neutral.", muscles: {core: 0.80, lats: 0.10, triceps: 0.10}},
        {name: "Russian Twist", equipment: ["dumbbell"], difficulty: "beginner", cues: "Lean back, rotate torso side to side.", muscles: {core: 0.90, obliques: 0.10}},
        {name: "Bicycle Crunch", equipment: ["bodyweight"], difficulty: "beginner", cues: "Opposite elbow to knee, twist.", muscles: {core: 0.80, obliques: 0.20}},
        {name: "Cable Crunch", equipment: ["cable"], difficulty: "intermediate", cues: "Kneel, pull cable down with abs.", muscles: {core: 1.0}},
        {name: "Woodchopper", equipment: ["cable"], difficulty: "intermediate", cues: "Pull cable diagonally across body.", muscles: {core: 0.60, obliques: 0.40}},
        {name: "Side Plank", equipment: ["bodyweight"], difficulty: "beginner", cues: "Support on one arm, body straight.", muscles: {obliques: 0.80, core: 0.20}},
        {name: "Dead Bug", equipment: ["bodyweight"], difficulty: "beginner", cues: "Lower opposite arm and leg, back flat.", muscles: {core: 0.90, hip_flexors: 0.10}},
        {name: "V-Up", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Touch toes to hands in V shape.", muscles: {core: 0.80, hip_flexors: 0.20}},
        {name: "Dragon Flag", equipment: ["bodyweight", "bench"], difficulty: "advanced", cues: "Lift entire rigid body up.", muscles: {core: 0.80, lats: 0.20}},
        {name: "Hollow Body Hold", equipment: ["bodyweight"], difficulty: "intermediate", cues: "Lower back pressed to floor, lift limbs.", muscles: {core: 0.90, hip_flexors: 0.10}},
        {name: "Pallof Press", equipment: ["cable"], difficulty: "intermediate", cues: "Press cable straight out, resist rotation.", muscles: {core: 0.60, obliques: 0.40}},
        {name: "Flutter Kicks", equipment: ["bodyweight"], difficulty: "beginner", cues: "Small rapid leg kicks.", muscles: {core: 0.70, hip_flexors: 0.30}},
        {name: "Sit-up", equipment: ["bodyweight"], difficulty: "beginner", cues: "Sit all the way up.", muscles: {core: 0.70, hip_flexors: 0.30}},
        {name: "Mountain Climbers", equipment: ["bodyweight"], difficulty: "beginner", cues: "Plank position, drive knees to chest.", muscles: {core: 0.60, cardio: 0.40}},
        {name: "Suitcase Carry", equipment: ["dumbbell"], difficulty: "intermediate", cues: "Carry heavy weight in one hand.", muscles: {obliques: 0.60, core: 0.40}},
        {name: "Toes to Bar", equipment: ["bodyweight", "bar"], difficulty: "advanced", cues: "Swing slightly, touch toes to bar.", muscles: {core: 0.60, hip_flexors: 0.20, lats: 0.20}}
    ]
};

function generateMarkdown() {
    let md = "# Exercise Library List\n\n";
    md += "A comprehensive list of exercises covering 10 major muscle groups, with exactly 20 exercises each, including precise volume load attribution.\n\n";
    
    for (const [group, groupExercises] of Object.entries(exercises)) {
        md += `## ${group}\n`;
        md += "| Exercise | Difficulty | Primary Muscles (Volume Load) |\n";
        md += "| --- | --- | --- |\n";
        for (const ex of groupExercises) {
            const musclesStr = Object.entries(ex.muscles)
                .map(([k, v]) => `${k} (${Math.round(v * 100)}%)`)
                .join(', ');
            md += `| ${ex.name} | ${ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1)} | ${musclesStr} |\n`;
        }
        md += "\n";
    }
    fs.writeFileSync("docs/exercise_library.md", md);
}

function generateSQL() {
    let sql = "-- Extended Exercise Library Seed (20 per muscle group)\n";
    sql += "insert into public.exercises (name, category, equipment, difficulty, description, setup_cues, execution_cues, primary_muscles, is_system)\n";
    sql += "values\n";
    
    const valuesLines = [];
    for (const [group, groupExercises] of Object.entries(exercises)) {
        for (const ex of groupExercises) {
            const musclesJson = Object.entries(ex.muscles).map(([k, v]) => ({muscle: k, contribution: v}));
            const musclesStr = JSON.stringify(musclesJson).replace(/'/g, "''");
            const equipmentArr = "array[" + ex.equipment.map(eq => `'${eq}'`).join(",") + "]";
            
            const line = `  ('${ex.name.replace(/'/g, "''")}', '${group.toLowerCase()}', ${equipmentArr}, '${ex.difficulty}', 'Targeting ${group}.', 'Setup carefully.', '${ex.cues.replace(/'/g, "''")}', '${musclesStr}'::jsonb, true)`;
            valuesLines.append ? valuesLines.push(line) : valuesLines.push(line);
        }
    }
    
    sql += valuesLines.join(",\n");
    sql += "\n;\n"; // Fixed missing semicolon instead of on conflict do nothing since no unique constraints on name yet.
    fs.writeFileSync("supabase/seed_exercises_extended.sql", sql);
}

generateMarkdown();
generateSQL();
console.log("Files generated successfully.");
