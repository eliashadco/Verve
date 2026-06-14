import { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { useTranslation } from '@/lib/i18n';
import { SUPABASE_CONFIGURED } from '@/lib/supabase';
import { colors, typography } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email || !password) {
      setError(t('auth.login.emailPasswordRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('auth.login.signInFailed');
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
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={20} color={colors.bgApp} />
          </View>
          <Text style={styles.wordmark}>{t('brand.wordmark')}</Text>
        </View>

        <View style={{ gap: 4, marginTop: 16 }}>
          <Text style={styles.title}>{t('auth.login.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
        </View>

        <GlassCard style={{ gap: 14, marginTop: 8 }}>
          {!SUPABASE_CONFIGURED && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>{t('auth.login.supabaseWarning')}</Text>
            </View>
          )}

          <Input
            label={t('auth.login.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={t('auth.login.emailPh')}
          />

          <Input
            label={t('auth.login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            autoComplete="password"
            placeholder={t('auth.login.passwordDots')}
          />

          <Pressable onPress={() => setShowPwd((v) => !v)}>
            <Text style={styles.toggle}>
              {showPwd ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
            </Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <VerveButton label={t('auth.login.signIn')} onPress={onSubmit} loading={busy} />
        </GlassCard>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('auth.login.newToVerve')}</Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            {t('auth.login.createAccount')}
          </Link>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  logoMark: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  wordmark: {
    color: colors.textStrong,
    fontFamily: typography.family.headingExtra,
    fontSize: 20, letterSpacing: 4,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.display,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
  },
  toggle: {
    color: colors.primary,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
    alignSelf: 'flex-end',
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  warning: {
    backgroundColor: colors.warningDim,
    borderColor: 'rgba(245,158,11,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  warningText: { color: colors.warning, fontSize: 12, lineHeight: 18 },
  footerRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16, alignItems: 'center',
  },
  footerText: { color: colors.textMuted, fontSize: typography.size.sm },
  footerLink: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
