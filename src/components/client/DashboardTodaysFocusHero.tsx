import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { AdherenceEntry, Profile, Program } from '@/types/database';
import { useTranslation } from '@/lib/i18n';
import {
  adherenceForProgram,
  estimateDayDurationMinutes,
  getOverviewHeroModel,
  isDayIndexCompleted,
  stripProgramDayIndex,
} from '@/lib/overviewHeroModel';
import { colors, radii, shadows, spacing, typography } from '@/lib/theme';

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop';
const FALLBACK_AVATAR = 'https://i.imgur.com/8b4v2V1.jpg';

interface Props {
  program: Program | null;
  practitioner: Profile | null;
  adherenceEntries: AdherenceEntry[];
}

export function DashboardTodaysFocusHero({ program, practitioner, adherenceEntries }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const model = useMemo(() => getOverviewHeroModel(program), [program]);
  const programHistory = useMemo(
    () => adherenceForProgram(adherenceEntries, program?.id ?? null),
    [adherenceEntries, program?.id],
  );

  const startHref = useMemo<Href>(() => {
    if (!program?.id || model.chosenDayIndex == null) return '/(client)/live';
    return `/(client)/live/${program.id}/${model.chosenDayIndex}` as Href;
  }, [program?.id, model.chosenDayIndex]);

  const phaseLabel = useMemo(() => {
    if (!program) return t('home.client.overviewHero.emptyPhase');
    return program.focus ?? program.name ?? t('home.client.overviewHero.defaultPhase');
  }, [program, t]);

  const weekLabel = useMemo(() => {
    if (!program) return t('home.client.overviewHero.emptyWeek');
    const daysLen = program.days?.length ?? 0;
    const weekNum = Math.min(daysLen || 1, 1 + programHistory.length);
    const of = Math.max(1, daysLen || 1);
    return t('home.client.overviewHero.weekOf', { n: weekNum, total: of });
  }, [program, programHistory.length, t]);

  const heroProgressPct = useMemo(() => {
    if (!program) return 8;
    const daysLen = program.days?.length ?? 0;
    return Math.min(
      100,
      Math.max(12, Math.round(((programHistory.length + 1) / Math.max(1, daysLen * 3)) * 100)),
    );
  }, [program, programHistory.length]);

  const focusTitle = useMemo(() => {
    if (!program) return t('home.client.overviewHero.emptyTitle');
    const days = program.days;
    return model.chosenDay?.label ?? days[0]?.label ?? t('home.client.overviewHero.fallbackSession');
  }, [program, model.chosenDay, t]);

  const durationMin = useMemo(
    () => estimateDayDurationMinutes(model.chosenDay ?? program?.days?.[0]),
    [model.chosenDay, program?.days],
  );

  const coachName =
    practitioner?.first_name && practitioner?.last_name
      ? `${practitioner.first_name} ${practitioner.last_name}`.trim()
      : (practitioner?.first_name ?? practitioner?.email ?? t('home.client.overviewHero.defaultCoach'));

  const coachAvatar = practitioner?.avatar_url ?? FALLBACK_AVATAR;

  const openDetails = () => {
    const idx = model.chosenDayIndex ?? 0;
    router.push({
      pathname: '/(client)/programs' as any,
      params: { focusDay: String(idx), builderTab: 'false' },
    });
  };

  const openFullWeek = () => {
    openDetails();
  };

  const openChat = () => {
    router.push('/(client)/messages');
  };

  const openProgramsBuild = () => {
    router.push({
      pathname: '/(client)/programs' as any,
      params: { builderTab: 'true' },
    });
  };

  const openProgramsBrowse = () => {
    router.push({
      pathname: '/(client)/programs' as any,
      params: { builderTab: 'false' },
    });
  };

  const stripLabels = useMemo(
    () => [
      t('home.client.overviewHero.sun'),
      t('home.client.overviewHero.mon'),
      t('home.client.overviewHero.tue'),
      t('home.client.overviewHero.wed'),
      t('home.client.overviewHero.thu'),
      t('home.client.overviewHero.fri'),
      t('home.client.overviewHero.sat'),
    ],
    [t],
  );

  const todayJs = new Date().getDay();

  return (
    <View style={styles.shell}>
      <Image source={{ uri: HERO_BG_IMAGE }} style={styles.heroImage} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(2,4,8,0.15)', 'rgba(2,4,8,0.95)']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(2,4,8,0.92)', 'rgba(2,4,8,0.78)', 'rgba(2,4,8,0.5)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.phaseBlock}>
            <View style={styles.phaseBadgeRow}>
              <View style={styles.phaseBadge}>
                <Text style={styles.phaseBadgeText}>{phaseLabel}</Text>
              </View>
              <Text style={styles.weekInline}>{weekLabel}</Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${heroProgressPct}%` }]} />
            </View>
          </View>

          <View style={styles.coachPill}>
            <Image source={{ uri: coachAvatar }} style={styles.coachAvatar} />
            <View style={styles.coachTextCol}>
              <Text style={styles.coachName} numberOfLines={1}>
                {coachName}
              </Text>
              <Text style={styles.coachStatus}>{t('home.client.overviewHero.coachOnline')}</Text>
            </View>
            <View style={styles.coachDivider} />
            <Pressable onPress={openChat} style={styles.coachChatBtn} hitSlop={8}>
              <Ionicons name="chatbubbles" size={18} color={colors.textSoft} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.focusKicker}>{t('home.client.overviewHero.todaysFocus')}</Text>
        <Text style={styles.focusTitle}>{focusTitle}</Text>

        {program ? (
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText}>
                {t('home.client.overviewHero.mins', { count: durationMin })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flash-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText} numberOfLines={1}>
                {program.focus ?? t('home.client.overviewHero.programDay')}
              </Text>
            </View>
            <View style={[styles.metaItem, styles.metaItemGrow]}>
              <Ionicons name="person-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText} numberOfLines={1}>
                {practitioner?.first_name ?? t('home.client.overviewHero.verveCoach')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <Pressable style={styles.metaItem} onPress={openProgramsBuild}>
              <Ionicons name="color-wand-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText}>{t('home.client.overviewHero.emptyMetaBuild')}</Text>
            </Pressable>
            <Pressable style={styles.metaItem} onPress={openProgramsBrowse}>
              <Ionicons name="book-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText}>{t('home.client.overviewHero.emptyMetaBrowse')}</Text>
            </Pressable>
            <Pressable style={[styles.metaItem, styles.metaItemGrow]} onPress={openChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSoft} />
              <Text style={styles.metaText} numberOfLines={1}>
                {t('home.client.overviewHero.emptyMetaAsk')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Link href={startHref} asChild>
            <Pressable style={styles.btnPrimary}>
              <Ionicons name="play" size={18} color={colors.bgApp} />
              <Text style={styles.btnPrimaryLabel}>{t('home.client.overviewHero.startSession')}</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.btnGhost} onPress={openDetails}>
            <Ionicons name="list-outline" size={18} color={colors.textSoft} />
            <Text style={styles.btnGhostLabel}>{t('home.client.overviewHero.details')}</Text>
          </Pressable>
        </View>

        <View style={styles.stripSection}>
          <View style={styles.stripRow}>
            {stripLabels.map((label, idx) => {
              const isToday = idx === todayJs;
              const daysLen = program?.days?.length ?? 0;
              const pDayIdx = program ? stripProgramDayIndex(daysLen, idx) : 0;
              const completed =
                program && program.id ? isDayIndexCompleted(adherenceEntries, program.id, pDayIdx) : false;
              return (
                <View key={label} style={[styles.stripCell, isToday && styles.stripCellToday]}>
                  <Text style={[styles.stripLabel, isToday && styles.stripLabelToday]}>{label}</Text>
                  {!program ? (
                    <Ionicons name="remove-circle-outline" size={18} color={colors.textFaint} />
                  ) : completed ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : isToday ? (
                    <>
                      <View style={styles.stripTodayCircle}>
                        <Text style={styles.stripTodayLetter}>P</Text>
                      </View>
                      <Ionicons name="caret-up" size={12} color={colors.primary} style={styles.stripCaret} />
                    </>
                  ) : (
                    <View style={styles.stripDot} />
                  )}
                </View>
              );
            })}
          </View>
          <Pressable style={styles.viewWeekBtn} onPress={openFullWeek}>
            <Text style={styles.viewWeekText}>{t('home.client.overviewHero.viewFullWeek')}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textFaint} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgApp,
    ...shadows.md,
  },
  heroImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    opacity: 0.2,
  },
  inner: {
    padding: spacing.lg,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  phaseBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  phaseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  phaseBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  phaseBadgeText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  weekInline: {
    color: colors.textSoft,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    flexShrink: 1,
  },
  heroProgressTrack: {
    height: 4,
    width: 120,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  coachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: '48%',
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  coachTextCol: {
    flex: 1,
    minWidth: 0,
  },
  coachName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  coachStatus: {
    color: colors.success,
    fontSize: 10,
    marginTop: 2,
    fontFamily: typography.family.bodyMedium,
  },
  coachDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.textFaint,
    opacity: 0.35,
  },
  coachChatBtn: {
    padding: 4,
  },
  focusKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.label,
    marginBottom: spacing.xs,
  },
  focusTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingExtra,
    fontSize: typography.size.display,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.size.display * typography.lineHeight.tight,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemGrow: {
    flex: 1,
    minWidth: 88,
  },
  metaText: {
    color: colors.textSoft,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  btnPrimaryLabel: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnGhostLabel: {
    color: colors.textSoft,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  stripSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 2,
  },
  stripCell: {
    flex: 1,
    alignItems: 'center',
    opacity: 0.85,
    minHeight: 56,
  },
  stripCellToday: {
    opacity: 1,
  },
  stripLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    marginBottom: 4,
  },
  stripLabelToday: {
    color: colors.accentBlue,
  },
  stripTodayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  stripTodayLetter: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  stripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textFaint,
    marginTop: 6,
  },
  stripCaret: {
    marginTop: 2,
  },
  viewWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewWeekText: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
});
