import { useState } from 'react';
import { Linking, Modal, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { GlassCard } from '@/components/GlassCard';
import { VerveButton } from '@/components/VerveButton';
import { VERVE_PRIVACY_URL } from '@/lib/config';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/lib/theme';

const DEV_BYPASS_ROLE = process.env.EXPO_PUBLIC_DEV_BYPASS_ROLE;
const IS_DEV_BYPASS = DEV_BYPASS_ROLE === 'client' || DEV_BYPASS_ROLE === 'trainer';

export function ConsentGate() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const needsConsent = !IS_DEV_BYPASS && profile !== null && profile.consent_at == null;

  if (!needsConsent) return null;

  const label = t('auth.register.consentLabel');
  const linkText = t('auth.register.consentLinkText');
  const idx = label.lastIndexOf(linkText);
  const before = idx >= 0 ? label.slice(0, idx) : label;
  const after = idx >= 0 ? label.slice(idx + linkText.length) : '';

  const accept = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await supabase
        .from('profiles')
        .update({ consent_version: 'pilot-1', consent_at: new Date().toISOString() })
        .eq('id', profile.id);
      await refreshProfile();
    } catch {
      // Gate stays visible on failure — user must accept before continuing.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>{t('auth.register.consentGateTitle')}</Text>
          <Text style={styles.body}>
            {before}
            <Text
              style={styles.link}
              onPress={() => void Linking.openURL(VERVE_PRIVACY_URL)}
            >
              {linkText}
            </Text>
            {after}
          </Text>
          <View style={{ height: 4 }} />
          <VerveButton
            label={t('auth.register.consentAccept')}
            onPress={accept}
            loading={busy}
          />
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    gap: 12,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.lg,
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * 1.5,
  },
  link: {
    color: colors.primary,
    fontFamily: typography.family.bodyMedium,
    textDecorationLine: 'underline',
  },
});
