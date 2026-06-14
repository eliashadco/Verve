import { useState } from 'react';

import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';

export interface SocialPost {
  id: string;
  author: string;
  group: string;
  content: string;
  likes: number;
  comments: number;
}

export function useSocialFeed() {
  const demoEnabled = USER_TRIAL_DEMO_FLAGS.enabled;
  const [posts, setPosts] = useState<SocialPost[]>(demoEnabled ? [
    {
      id: 'p1',
      author: 'Nina K',
      group: 'Rehab Warriors',
      content: 'Completed phase-2 mobility without pain spikes today.',
      likes: 14,
      comments: 6,
    },
    {
      id: 'p2',
      author: 'Max D',
      group: 'Strength Loop',
      content: 'New PR on split squat. Staying consistent this week.',
      likes: 21,
      comments: 9,
    },
  ] : []);

  const addPost = (content: string) => {
    if (!demoEnabled) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    setPosts((prev) => [
      {
        id: `p-${Date.now()}`,
        author: 'You',
        group: 'Community Pulse',
        content: trimmed,
        likes: 0,
        comments: 0,
      },
      ...prev,
    ]);
  };

  return {
    posts,
    stories: demoEnabled ? ['Morning Mobility', 'Pulse Studio', 'Coach Highlights', 'Near You'] : [],
    groups: demoEnabled ? ['Rehab Warriors', 'Strength Loop', 'Mindset Reset'] : [],
    loading: false,
    error: null as string | null,
    isDemoData: demoEnabled,
    refresh: async () => {},
    addPost,
  };
}
