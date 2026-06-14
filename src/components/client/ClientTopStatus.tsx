import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface ClientTopStatusProps {
  showLogout?: boolean;
  onLogout?: () => void;
}

export function ClientTopStatus({ showLogout = false, onLogout }: ClientTopStatusProps) {
  const { t } = useTranslation();
  const platform = Platform.OS;
  const syncLabel =
    platform === 'ios'
      ? t('home.client.healthSyncApple')
      : platform === 'android'
        ? t('home.client.healthSyncAndroid')
        : t('home.client.healthSyncOther');
  const icon =
    platform === 'ios'
      ? ('logo-apple' as const)
      : platform === 'android'
        ? ('logo-google' as const)
        : ('fitness-outline' as const);

  return (
    <View style={styles.row}>
      <View style={styles.syncChunk}>
        <Ionicons name={icon} size={16} color={colors.primary} style={styles.syncIconGlow} />
        <Text style={styles.glowText} numberOfLines={1}>
          {syncLabel}
        </Text>
      </View>
      {showLogout && onLogout ? (
        <Pressable onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t('home.client.healthCardLogout')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  syncChunk: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  syncIconGlow: {
    textShadowColor: 'rgba(16,185,129,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  glowText: {
    flex: 1,
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(16,185,129,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerDim,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexShrink: 0,
  },
  logoutText: {
    color: colors.danger,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
});
