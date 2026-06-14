import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated';

import type { ClientProfile } from '@/types/database';
import { supabase } from '@/lib/supabase';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { VerveButton } from '@/components/VerveButton';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { ClientTopStatus } from '@/components/client/ClientTopStatus';
import { linkPractitionerByCode, updateProfile, uploadAvatar } from '@/hooks/useProfileMutations';
import { useLocalClientSettings } from '@/hooks/useLocalClientSettings';
import { useTranslation } from '@/lib/i18n';
import { colors, typography, updateTheme } from '@/lib/theme';

const LOCALES = ['en', 'fr'] as const;
const TIMEZONES = [
  'Europe/Luxembourg',
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Beirut',
] as const;

export default function ClientProfile() {
  const { t } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('en');
  const [timezone, setTimezone] = useState<(typeof TIMEZONES)[number]>('Europe/Luxembourg');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [persona, setPersona] = useState<'rehab' | 'solo' | 'training'>('rehab');
  const [linkCode, setLinkCode] = useState('');
  const [linkedPractitioner, setLinkedPractitioner] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColor] = useState<'green' | 'cyan' | 'amber'>('green');
  const [notifSession, setNotifSession] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifMilestones, setNotifMilestones] = useState(true);
  const localSettings = useLocalClientSettings();
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  useEffect(() => {
    if (profile?.id) {
      supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setClientProfile(data as ClientProfile);
        });
    }
  }, [profile?.id]);

  const completionPercentage = useMemo(() => {
    let count = 0;
    if (firstName.trim()) count += 10;
    if (lastName.trim()) count += 10;
    if (phone.trim()) count += 10;
    if (bio.trim()) count += 10;
    if (avatarUrl) count += 10;
    if (clientProfile?.height_cm) count += 10;
    if (clientProfile?.weight_kg) count += 10;
    if (clientProfile?.body_type) count += 10;
    if (clientProfile?.gender) count += 10;
    if (linkedPractitioner || profile?.onboarding_completed) count += 10;
    return count;
  }, [firstName, lastName, phone, bio, avatarUrl, clientProfile, linkedPractitioner, profile?.onboarding_completed]);

  useEffect(() => {
    if (localSettings.loading) return;
    setUnits(localSettings.settings.units);
    setPersona(localSettings.settings.persona);
    setThemeMode(localSettings.settings.theme);
    setAccentColor((localSettings.settings.accentColor as 'green' | 'cyan' | 'amber') ?? 'green');
    setNotifSession(localSettings.settings.notifSession);
    setNotifMessages(localSettings.settings.notifMessages);
    setNotifMilestones(localSettings.settings.notifMilestones);
  }, [localSettings.loading, localSettings.settings]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setPhone(profile.phone ?? '');
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
      if (profile.locale === 'fr') setLocale('fr');
      else setLocale('en');
      if (TIMEZONES.includes(profile.timezone as (typeof TIMEZONES)[number])) {
        setTimezone(profile.timezone as (typeof TIMEZONES)[number]);
      } else {
        setTimezone('Europe/Luxembourg');
      }
    }
  }, [profile]);

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
      Alert.alert(t('profile.avatarUpdated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.uploadFailedGeneric');
      Alert.alert(t('profile.uploadFailed'), message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSave = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await updateProfile(profile.id, {
        first_name: firstName,
        last_name: lastName,
        phone,
        bio,
        locale,
        timezone,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      await localSettings.save({
        units,
        persona,
        notifSession,
        notifMessages,
        notifMilestones,
        theme: themeMode,
        accentColor,
      });
      updateTheme(themeMode, accentColor);
      Alert.alert(t('profile.saved'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.uploadFailedGeneric');
      Alert.alert(t('profile.couldNotSave'), message);
    } finally {
      setBusy(false);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim() || profile?.email || t('common.you');
  const onLinkPractitioner = async () => {
    if (!profile?.id) return;
    try {
      const result = await linkPractitionerByCode(profile.id, linkCode);
      setLinkedPractitioner(result.practitionerName);
      Alert.alert(t('userTrial.profile.linkedTitle'), t('userTrial.profile.linkedBody', { name: result.practitionerName, code: result.code }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not link practitioner.';
      Alert.alert(t('userTrial.profile.linkFailed'), message);
    }
  };

  return (
    <ScreenContainer>
      <Header title={t('profile.title')} />
      <ClientTopStatus showLogout onLogout={() => signOut().catch(() => {})} />

      <GlassCard style={{ alignItems: 'center', gap: 8 }}>
        <ProfileCompletionRing percentage={completionPercentage}>
          <Avatar uri={avatarUrl} name={fullName} size={80} />
        </ProfileCompletionRing>
        <Text style={styles.completionText}>
          Profile Completion: {completionPercentage}%
        </Text>
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
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('userTrial.profile.units')}</Text>
          <View style={styles.chipRow}>
            {(['metric', 'imperial'] as const).map((value) => (
              <Pressable key={value} onPress={() => setUnits(value)} style={[styles.chip, units === value && styles.chipActive]}>
                <Text style={[styles.chipText, units === value && styles.chipTextActive]}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <VerveButton label={t('profile.save')} onPress={onSave} loading={busy} />
      </GlassCard>

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.section}>{t('userTrial.profile.accountMode')}</Text>
        <View style={styles.chipRow}>
          {([
            { key: 'rehab', label: t('userTrial.profile.rehabPatient') },
            { key: 'solo', label: t('userTrial.profile.soloAthlete') },
            { key: 'training', label: t('userTrial.profile.coachedAthlete') },
          ] as const).map((entry) => (
            <Pressable key={entry.key} onPress={() => setPersona(entry.key)} style={[styles.chip, persona === entry.key && styles.chipActive]}>
              <Text style={[styles.chipText, persona === entry.key && styles.chipTextActive]}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      {process.env.EXPO_PUBLIC_DEMO_USER_TRIAL === '1' ? (
        <GlassCard style={{ gap: 12 }}>
          <Text style={styles.section}>{t('userTrial.profile.linkedPractitioner')}</Text>
          <Text style={styles.dim}>{linkedPractitioner ? `Linked to ${linkedPractitioner}` : t('userTrial.profile.noneLinked')}</Text>
          <Input label={t('userTrial.profile.linkCode')} value={linkCode} onChangeText={setLinkCode} />
          <VerveButton label={t('userTrial.profile.linkPractitioner')} variant="ghost" onPress={() => void onLinkPractitioner()} />
        </GlassCard>
      ) : (
        <GlassCard style={{ gap: 12 }}>
          <Text style={styles.section}>{t('profile.linkManagedTitle')}</Text>
          <Text style={styles.dim}>{t('profile.linkManagedBody')}</Text>
        </GlassCard>
      )}

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.section}>{t('userTrial.profile.wearables')}</Text>
        <Text style={styles.dim}>{t('userTrial.profile.appleHealthConnected')}</Text>
        <Text style={styles.dim}>{t('userTrial.profile.garminNotConnected')}</Text>
        <Text style={styles.dim}>{t('userTrial.profile.whoopNotConnected')}</Text>
      </GlassCard>

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.section}>{t('userTrial.profile.notifications')}</Text>
        <View style={styles.chipRow}>
          <Pressable onPress={() => setNotifSession((v) => !v)} style={[styles.chip, notifSession && styles.chipActive]}><Text style={[styles.chipText, notifSession && styles.chipTextActive]}>{t('userTrial.profile.sessionReminders')}</Text></Pressable>
          <Pressable onPress={() => setNotifMessages((v) => !v)} style={[styles.chip, notifMessages && styles.chipActive]}><Text style={[styles.chipText, notifMessages && styles.chipTextActive]}>{t('userTrial.profile.practitionerMessages')}</Text></Pressable>
          <Pressable onPress={() => setNotifMilestones((v) => !v)} style={[styles.chip, notifMilestones && styles.chipActive]}><Text style={[styles.chipText, notifMilestones && styles.chipTextActive]}>{t('userTrial.profile.progressMilestones')}</Text></Pressable>
        </View>
      </GlassCard>

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.section}>{t('userTrial.profile.appearance')}</Text>
        <View style={styles.chipRow}>
          {(['dark', 'light'] as const).map((mode) => (
            <Pressable key={mode} onPress={() => setThemeMode(mode)} style={[styles.chip, themeMode === mode && styles.chipActive]}>
              <Text style={[styles.chipText, themeMode === mode && styles.chipTextActive]}>{mode}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chipRow}>
          {(['green', 'cyan', 'amber'] as const).map((accent) => (
            <Pressable key={accent} onPress={() => setAccentColor(accent)} style={[styles.chip, accentColor === accent && styles.chipActive]}>
              <Text style={[styles.chipText, accentColor === accent && styles.chipTextActive]}>{accent}</Text>
            </Pressable>
          ))}
        </View>
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
          label={t('userTrial.profile.exportMyData')}
          variant="ghost"
          onPress={() =>
            Alert.alert(
              t('userTrial.profile.exportPreview'),
              JSON.stringify({ firstName, lastName, locale, timezone, units, persona }, null, 2),
            )
          }
        />
        <View style={{ height: 8 }} />
        <VerveButton
          label={t('userTrial.profile.clearSessionHistory')}
          variant="ghost"
          onPress={() =>
            Alert.alert(t('userTrial.profile.immutableHistoryTitle'), t('userTrial.profile.immutableHistoryBody'))
          }
        />
        <View style={{ height: 8 }} />
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
  ringContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    marginTop: 4,
  },
});

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProfileCompletionRing({ percentage, children }: { percentage: number; children: React.ReactNode }) {
  const radius = 46;
  const strokeWidth = 6;
  const size = 110;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * withTiming(percentage, { duration: 800 })) / 100,
  }));

  return (
    <View style={styles.ringContainer}>
      <Svg width={size} height={size}>
        <Circle
          stroke={colors.surfaceHover}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          stroke={colors.primary}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        {children}
      </View>
    </View>
  );
}
