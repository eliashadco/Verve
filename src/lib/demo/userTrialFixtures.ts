export const USER_TRIAL_DEMO_FLAGS = {
  enabled: process.env.EXPO_PUBLIC_DEMO_USER_TRIAL === '1',
} as const;

/** Matches `User trial.html` dashboard protocol alert demo. */
export const USER_TRIAL_DEMO_PROTOCOL_BANNER = {
  name: 'Moon ACL (Phase 2)',
} as const;

/** Matches `User trial.html` `PRAC_NOTES` + `practNotes` render. */
export const USER_TRIAL_DEMO_PRACTITIONER_NOTES = [
  {
    from: 'Dr. Emma Clarke',
    role: 'Physiotherapist',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    date: 'Feb 28',
    note:
      'Great progress on knee flexion. ROM at 115° — on track for ski season goal. Continue with step-up protocol, 3×/week.',
  },
  {
    from: 'Coach Alex',
    role: 'Trainer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    date: 'Mar 1',
    note:
      'Increased back squat load to 87.5 kg — excellent bar path this session. Next session focus: tempo on eccentric phase.',
  },
] as const;

export function useDemoAwareData<T>(realData: T, demoData: T): T {
  return USER_TRIAL_DEMO_FLAGS.enabled ? demoData : realData;
}

export interface WearableSummaryFixture {
  readinessScore: number;
  restingHeartRate: number;
  hrvMs: number;
  sleepHours: number;
  steps: number;
  activityMinutes: number;
  syncedLabel: string;
  lastSyncLabel: string;
  avgHeartRate?: number;
  highHeartRate?: number;
}

export const USER_TRIAL_WEARABLE_SUMMARY_FIXTURE: WearableSummaryFixture = {
  readinessScore: 82,
  restingHeartRate: 62,
  hrvMs: 63,
  sleepHours: 7.8,
  steps: 8420,
  activityMinutes: 62,
  syncedLabel: 'Synced',
  lastSyncLabel: 'Last sync: 2m ago',
  avgHeartRate: 78,
  highHeartRate: 154,
};

export interface DemoFeedItemFixture {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
}

export const USER_TRIAL_SOCIAL_FEED_FIXTURES: DemoFeedItemFixture[] = [
  {
    id: 'feed-1',
    title: 'Recovery breathing challenge',
    subtitle: 'Join your weekly 7-minute guided breathwork challenge.',
    ctaLabel: 'Open challenge',
  },
  {
    id: 'feed-2',
    title: 'Coach insight',
    subtitle: 'Your lower body workload is trending up this week.',
    ctaLabel: 'View insight',
  },
];

export const USER_TRIAL_HUB_DOCUMENT_FIXTURES: DemoFeedItemFixture[] = [
  {
    id: 'doc-1',
    title: 'Mobility preparation PDF',
    subtitle: 'Updated protocol for lumbar decompression prep.',
    ctaLabel: 'Review',
  },
  {
    id: 'doc-2',
    title: 'Nutrition checklist',
    subtitle: 'Coach-approved fueling checklist for training days.',
    ctaLabel: 'Open checklist',
  },
];
