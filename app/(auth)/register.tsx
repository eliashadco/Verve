import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import { VERVE_PRIVACY_URL } from '@/lib/config';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/lib/theme';
import type { Role } from '@/types/database';

const ROLE_IDS = [
  { id: 'client' as const, icon: 'person-outline' as const },
  { id: 'trainer' as const, icon: 'barbell-outline' as const },
];

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [consentChecked, setConsentChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roles = useMemo(
    () =>
      ROLE_IDS.map((r) => ({
        ...r,
        title: t(`auth.register.roles.${r.id}.title`),
        subtitle: t(`auth.register.roles.${r.id}.subtitle`),
      })),
    [t],
  );

  const consentLabel = t('auth.register.consentLabel');
  const consentLinkText = t('auth.register.consentLinkText');
  const linkIdx = consentLabel.lastIndexOf(consentLinkText);
  const consentBefore = linkIdx >= 0 ? consentLabel.slice(0, linkIdx) : consentLabel;
  const consentAfter = linkIdx >= 0 ? consentLabel.slice(linkIdx + consentLinkText.length) : '';

  const onSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError(t('auth.register.allFields'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.register.passwordShort'));
      return;
    }
    if (!consentChecked) return;
    setBusy(true);
    setError(null);
    try {
      await signUp({ firstName, lastName, email: email.trim(), password, role });
      // Best-effort consent write; ConsentGate handles the case it misses (e.g. email confirmation pending).
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (authData.session?.user.id) {
          await supabase
            .from('profiles')
            .update({ consent_version: 'pilot-1', consent_at: new Date().toISOString() })
            .eq('id', authData.session.user.id);
        }
      } catch { /* ConsentGate covers the miss */ }
      setSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('auth.register.signUpFailed');
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bgApp }}
    >
      <ScreenContainer contentStyle={{ paddingTop: 32 }}>
        <Link href="/(auth)/login" style={styles.back}>
          {t('auth.register.back')}
        </Link>

        <Text style={styles.title}>{t('auth.register.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

        <View style={styles.roleRow}>
          {roles.map((r) => {
            const active = role === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[styles.roleCard, active && styles.roleCardActive]}
              >
                <Ionicons
                  name={r.icon}
                  size={22}
                  color={active ? colors.primary : colors.textSub}
                />
                <Text style={[styles.roleTitle, active && { color: colors.primary }]}>
                  {r.title}
                </Text>
                <Text style={styles.roleSub}>{r.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <GlassCard style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Input
              label={t('auth.register.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="name-given"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label={t('auth.register.lastName')}
              value={lastName}
              onChangeText={setLastName}
              autoComplete="name-family"
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Input
            label={t('auth.login.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />

          <Input
            label={t('auth.login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            helper={t('auth.register.passwordHelper')}
          />

          <Pressable
            style={styles.consentRow}
            onPress={() => setConsentChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentChecked }}
          >
            <Ionicons
              name={consentChecked ? 'checkbox' : 'square-outline'}
              size={20}
              color={consentChecked ? colors.primary : colors.textMuted}
            />
            <Text style={styles.consentText}>
              {consentBefore}
              <Text
                style={styles.consentLink}
                onPress={() => void Linking.openURL(VERVE_PRIVACY_URL)}
              >
                {consentLinkText}
              </Text>
              {consentAfter}
            </Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? (
            <Text style={styles.successText}>{t('auth.register.success')}</Text>
          ) : null}

          <VerveButton
            label={t('auth.register.createAccount')}
            onPress={onSubmit}
            loading={busy}
            disabled={success || !consentChecked}
          />
        </GlassCard>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  back: {
    color: colors.primary,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    marginTop: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    gap: 6,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  roleTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  roleSub: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  errorText: { color: colors.danger, fontSize: typography.size.sm },
  successText: { color: colors.success, fontSize: typography.size.sm },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  consentText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.5,
  },
  consentLink: {
    color: colors.primary,
    fontFamily: typography.family.bodyMedium,
    textDecorationLine: 'underline',
  },
});
