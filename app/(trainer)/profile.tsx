import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import { uploadAvatar, updateProfile, upsertTrainerProfileDetails } from '@/hooks/useProfileMutations';
import { useTrainerProfile } from '@/hooks/useTrainerProfile';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

const LOCALES = ['en', 'fr'] as const;
const TIMEZONES = [
  'Europe/Luxembourg',
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Beirut',
] as const;

function TagInputRow({
  label,
  draft,
  onDraftChange,
  chips,
  onRemove,
  onCommitDraft,
  placeholder,
}: {
  label: string;
  draft: string;
  onDraftChange: (value: string) => void;
  chips: string[];
  onRemove: (value: string) => void;
  onCommitDraft: () => void;
  placeholder: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.tagBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {chips.length > 0 ? (
        <View style={styles.chipWrap}>
          {chips.map((chip, index) => (
            <View key={`${chip}-${index}`} style={styles.removableChip}>
              <Text style={styles.removableChipText}>{chip}</Text>
              <Pressable
                onPress={() => onRemove(chip)}
                accessibilityLabel={t('profile.removeChipA11y', { label: chip })}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <TextInput
        value={draft}
        onChangeText={onDraftChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.tagInput}
        onSubmitEditing={onCommitDraft}
        blurOnSubmit={false}
        returnKeyType="done"
        accessibilityLabel={label}
      />
      <Text style={styles.tagHint}>{t('profile.tagHint')}</Text>
    </View>
  );
}

export default function TrainerProfile() {
  const { t } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const userId = profile?.id ?? null;
  const { data, loading, error, refresh } = useTrainerProfile(userId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('en');
  const [timezone, setTimezone] = useState<(typeof TIMEZONES)[number]>('Europe/Luxembourg');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [certDraft, setCertDraft] = useState('');
  const [specDraft, setSpecDraft] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [sessionPrice, setSessionPrice] = useState('');
  const [acceptsNew, setAcceptsNew] = useState(true);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p = data.profile;
    setFirstName(p.first_name ?? '');
    setLastName(p.last_name ?? '');
    setPhone(p.phone ?? '');
    setBio(p.bio ?? '');
    setAvatarUrl(p.avatar_url ?? null);
    if (p.locale === 'fr') setLocale('fr');
    else setLocale('en');
    if (TIMEZONES.includes(p.timezone as (typeof TIMEZONES)[number])) {
      setTimezone(p.timezone as (typeof TIMEZONES)[number]);
    } else {
      setTimezone('Europe/Luxembourg');
    }

    const trainerRow = data.trainerProfile;
    setCertifications(trainerRow?.certifications?.filter(Boolean) ?? []);
    setSpecialties(trainerRow?.specialties?.filter(Boolean) ?? []);
    setSessionPrice(trainerRow?.session_price != null ? String(trainerRow.session_price) : '');
    setAcceptsNew(trainerRow?.accepts_new ?? true);
  }, [data]);

  const commitCertDraft = () => {
    const part = certDraft.trim().replace(/,$/, '');
    if (!part) return;
    setCertifications((prev) => [...prev, part]);
    setCertDraft('');
  };

  const commitSpecDraft = () => {
    const part = specDraft.trim().replace(/,$/, '');
    if (!part) return;
    setSpecialties((prev) => [...prev, part]);
    setSpecDraft('');
  };

  const onCertDraftChange = (text: string) => {
    if (text.endsWith(',')) {
      const part = text.slice(0, -1).trim();
      if (part) setCertifications((prev) => [...prev, part]);
      setCertDraft('');
      return;
    }
    setCertDraft(text);
  };

  const onSpecDraftChange = (text: string) => {
    if (text.endsWith(',')) {
      const part = text.slice(0, -1).trim();
      if (part) setSpecialties((prev) => [...prev, part]);
      setSpecDraft('');
      return;
    }
    setSpecDraft(text);
  };

  const pickAvatar = async () => {
    if (!profile) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('profile.permissionPhotos'), t('profile.permissionPhotosBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setAvatarBusy(true);
    try {
      const processed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );

      const response = await fetch(processed.uri);
      const blob = await response.blob();
      const publicUrl = await uploadAvatar(profile.id, blob);

      setAvatarUrl(publicUrl);
      await refreshProfile();
      void refresh();
      Alert.alert(t('profile.avatarUpdated'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.uploadFailedGeneric');
      Alert.alert(t('profile.uploadFailed'), message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSave = async () => {
    if (!profile) return;
    const parsed = sessionPrice.trim() === '' ? null : Number(sessionPrice.replace(',', '.'));
    const priceValue = parsed != null && !Number.isNaN(parsed) ? parsed : null;

    setBusy(true);

    // First write: core profile
    try {
      await updateProfile(profile.id, {
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        locale,
        timezone,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.trainerSaveError');
      Alert.alert(t('profile.couldNotSave'), message);
      setBusy(false);
      return;
    }

    // Second write: trainer details — partial save on failure
    try {
      await upsertTrainerProfileDetails(profile.id, {
        certifications,
        specialties,
        session_price: priceValue,
        accepts_new: acceptsNew,
      });
      await refreshProfile();
      await refresh();
      Alert.alert(t('profile.saved'));
    } catch {
      await refreshProfile();
      void refresh();
      Alert.alert(t('errors.partialSave'));
    } finally {
      setBusy(false);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim() || profile?.email || t('common.you');

  if (loading && !data) {
    return (
      <ScreenContainer>
        <Header title={t('profile.title')} />
        <GlassCard>
          <Text style={styles.dim}>{t('profile.loadingProfile')}</Text>
        </GlassCard>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <Header title={t('profile.title')} />
        <GlassCard>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 12 }} />
          <VerveButton label={t('common.tryAgain')} onPress={() => void refresh()} />
        </GlassCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title={t('profile.title')} />

      <GlassCard style={{ alignItems: 'center', gap: 8 }}>
        <Avatar uri={avatarUrl} name={fullName} size={88} />
        <Pressable onPress={pickAvatar} style={styles.avatarBtn} accessibilityLabel={t('profile.changeAvatar')}>
          <Text style={styles.avatarBtnText}>{avatarBusy ? t('profile.uploading') : t('profile.changeAvatarLabel')}</Text>
        </Pressable>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        {profile?.role ? <Badge label={profile.role} /> : null}
      </GlassCard>

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.section}>{t('profile.personal')}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input label={t('auth.register.firstName')} value={firstName} onChangeText={setFirstName} containerStyle={{ flex: 1 }} />
          <Input label={t('auth.register.lastName')} value={lastName} onChangeText={setLastName} containerStyle={{ flex: 1 }} />
        </View>
        <Input label={t('profile.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input
          label={t('profile.bio')}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('profile.locale')}</Text>
          <View style={styles.chipRow}>
            {LOCALES.map((value) => (
              <Pressable
                key={value}
                onPress={() => setLocale(value)}
                style={[styles.chip, locale === value && styles.chipActive]}
              >
                <Text style={[styles.chipText, locale === value && styles.chipTextActive]}>{value.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('profile.timezone')}</Text>
          <View style={styles.chipRow}>
            {TIMEZONES.map((value) => (
              <Pressable
                key={value}
                onPress={() => setTimezone(value)}
                style={[styles.tzChip, timezone === value && styles.chipActive]}
              >
                <Text style={[styles.tzChipText, timezone === value && styles.chipTextActive]}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </GlassCard>

      <GlassCard style={{ gap: 14 }}>
        <Text style={styles.section}>{t('profile.professional')}</Text>
        <TagInputRow
          label={t('profile.certifications')}
          draft={certDraft}
          onDraftChange={onCertDraftChange}
          chips={certifications}
          onRemove={(c) => setCertifications((prev) => prev.filter((x) => x !== c))}
          onCommitDraft={commitCertDraft}
          placeholder={t('profile.certPh')}
        />
        <TagInputRow
          label={t('profile.specialties')}
          draft={specDraft}
          onDraftChange={onSpecDraftChange}
          chips={specialties}
          onRemove={(c) => setSpecialties((prev) => prev.filter((x) => x !== c))}
          onCommitDraft={commitSpecDraft}
          placeholder={t('profile.specPh')}
        />
        <Input
          label={t('profile.sessionPriceEur')}
          value={sessionPrice}
          onChangeText={setSessionPrice}
          keyboardType="decimal-pad"
          placeholder={t('profile.pricePh')}
        />
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>{t('profile.acceptingTitle')}</Text>
            <Text style={styles.dim}>{t('profile.acceptingHint')}</Text>
          </View>
          <Switch
            value={acceptsNew}
            onValueChange={setAcceptsNew}
            trackColor={{ false: colors.borderDefault, true: colors.primaryDim }}
            thumbColor={acceptsNew ? colors.primary : colors.textMuted}
            accessibilityLabel={t('profile.acceptingA11y')}
          />
        </View>
        <VerveButton label={t('profile.save')} onPress={onSave} loading={busy} />
      </GlassCard>

      <GlassCard>
        <VerveButton
          label={t('profile.reportProblem')}
          variant="ghost"
          onPress={() => void Linking.openURL('mailto:elias312.h@gmail.com?subject=Verve%20Pilot%20Feedback')}
        />
      </GlassCard>

      <GlassCard>
        <Text style={styles.section}>{t('profile.session')}</Text>
        <Text style={styles.dim}>{t('profile.signedInAs', { email: profile?.email ?? '' })}</Text>
        <View style={{ height: 12 }} />
        <VerveButton label={t('common.signOut')} variant="danger" onPress={signOut} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.section}>{t('profile.danger')}</Text>
        <Text style={styles.dim}>{t('profile.dangerHint')}</Text>
        <View style={{ height: 12 }} />
        <VerveButton
          label={t('profile.deleteAccount')}
          variant="danger"
          onPress={() => Alert.alert(t('profile.comingSoon'), t('profile.supportBody'))}
        />
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.xl },
  email: { color: colors.textMuted, fontSize: typography.size.sm },
  section: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dim: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 6 },
  errorText: { color: colors.danger, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  avatarBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 999,
    backgroundColor: colors.primaryDim,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  avatarBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipActive: {
    borderColor: colors.primaryBorderStrong,
    backgroundColor: colors.primaryDim,
  },
  chipText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  chipTextActive: {
    color: colors.primary,
  },
  tzChip: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tzChipText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  tagBlock: { gap: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  removableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 6,
  },
  removableChipText: {
    color: colors.textMain,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  tagInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textMain,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    minHeight: 48,
  },
  tagHint: { color: colors.textFaint, fontSize: typography.size.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
