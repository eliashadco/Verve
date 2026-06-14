import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, shadows, spacing, typography } from '@/lib/theme';

interface Props {
  protocolName: string;
  assignedLabel: string;
}

/** User trial.html `notification-banner` (protocol inbox, teal variant). */
export function DashboardProtocolBanner({ protocolName, assignedLabel }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name="journal-outline" size={16} color={colors.primary} />
      </View>
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.strong}>{protocolName}</Text>
        {` ${t('home.client.demoProtocolAssigned', { when: assignedLabel })}`}
      </Text>
      <Pressable
        style={styles.action}
        onPress={() => router.push('/(client)/therapy')}
        hitSlop={8}
      >
        <Text style={styles.actionText}>{t('home.client.demoProtocolView')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.notificationProtocolBg,
    borderWidth: 1,
    borderColor: colors.notificationProtocolBorder,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
    ...shadows.sm,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.notificationProtocolIconBg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
    color: colors.textSub,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.sm,
  },
  strong: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  actionText: {
    color: colors.textSoft,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
});
