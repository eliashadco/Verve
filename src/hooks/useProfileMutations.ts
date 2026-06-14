import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

function createAvatarKey(userId: string) {
  const random = Math.random().toString(36).slice(2, 12);
  return `${userId}/${Date.now()}-${random}.jpg`;
}

export async function updateProfile(userId: string, values: ProfileUpdate) {
  const { error } = await supabase.from('profiles').update(values).eq('id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, blob: Blob) {
  const key = createAvatarKey(userId);
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(key, blob, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(key);
  const publicUrl = publicUrlData.publicUrl;
  await updateProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
}

export async function upsertTrainerProfileDetails(
  userId: string,
  values: {
    certifications: string[];
    specialties: string[];
    session_price: number | null;
    accepts_new: boolean;
  },
) {
  const { error } = await supabase
    .from('trainer_profiles')
    .upsert({ user_id: userId, ...values }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function linkPractitionerByCode(_userId: string, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Please enter a valid practitioner code.');
  // Demo-only until link-request backend contract is finalized.
  return {
    status: 'demo_linked' as const,
    code: normalized,
    practitionerName: 'Assigned Practitioner',
  };
}
