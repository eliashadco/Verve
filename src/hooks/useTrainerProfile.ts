import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profile, TrainerProfile } from '@/types/database';

export interface TrainerProfileBundle {
  profile: Profile;
  trainerProfile: TrainerProfile | null;
}

export function useTrainerProfile(userId: string | null) {
  const [data, setData] = useState<TrainerProfileBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const [profileRes, trainerRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('trainer_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    if (profileRes.error) {
      setData(null);
      setLoading(false);
      setError(profileRes.error.message);
      return;
    }
    if (trainerRes.error) {
      setData(null);
      setLoading(false);
      setError(trainerRes.error.message);
      return;
    }
    if (!profileRes.data) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setData({
      profile: profileRes.data as Profile,
      trainerProfile: (trainerRes.data as TrainerProfile) ?? null,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

export interface SaveTrainerProfileInput {
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    bio: string | null;
    avatar_url: string | null;
    locale: string;
    timezone: string;
  };
  trainer: {
    certifications: string[];
    specialties: string[];
    session_price: number | null;
    accepts_new: boolean;
  };
}

export async function saveTrainerProfile(userId: string, input: SaveTrainerProfileInput) {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: input.profile.first_name,
      last_name: input.profile.last_name,
      phone: input.profile.phone,
      bio: input.profile.bio,
      avatar_url: input.profile.avatar_url,
      locale: input.profile.locale,
      timezone: input.profile.timezone,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { data: existing } = await supabase
    .from('trainer_profiles')
    .select('group_class_price, years_experience')
    .eq('user_id', userId)
    .maybeSingle();

  const { error: trainerError } = await supabase.from('trainer_profiles').upsert(
    {
      user_id: userId,
      certifications: input.trainer.certifications.length ? input.trainer.certifications : null,
      specialties: input.trainer.specialties.length ? input.trainer.specialties : null,
      session_price: input.trainer.session_price,
      group_class_price: existing?.group_class_price ?? null,
      years_experience: existing?.years_experience ?? null,
      accepts_new: input.trainer.accepts_new,
    },
    { onConflict: 'user_id' },
  );
  if (trainerError) throw trainerError;
}
