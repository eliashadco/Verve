import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { usePrograms } from '@/hooks/usePrograms';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function TrainerPrograms() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const { programs, loading, refresh } = usePrograms(profile?.id ?? null, 'trainer');
  const clients = useLinkedClients(profile?.id ?? null);
  const visiblePrograms = programs.filter((program) => program.status !== 'archived');

  const resolveClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.clients.find((row) => row.id === clientId);
    if (!client) return t('trainerProgramsScreen.assignedClientFallback');
    const name = `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim();
    return name || client.email;
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header
        title={t('screens.programsTrainer.title')}
        rightSlot={
          <Pressable
            onPress={() => router.push('/(trainer)/program/builder')}
            style={styles.addBtn}
            accessibilityLabel={t('trainerProgramsScreen.createProgramA11y')}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      <Text style={styles.lead}>{t('trainerProgramsScreen.lead')}</Text>

      {visiblePrograms.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="barbell-outline"
            title={t('trainerProgramsScreen.emptyTitle')}
            body={t('trainerProgramsScreen.emptyBody')}
          />
        </GlassCard>
      ) : (
        visiblePrograms.map((p) => (
          <Link key={p.id} href={`/(trainer)/program/${p.id}`} asChild>
            <Pressable>
              <GlassCard style={{ gap: 6 }}>
                <View style={styles.row}>
                  <Badge label={p.status} tone={p.status === 'active' ? 'primary' : 'neutral'} />
                  {p.assigned_to ? (
                    <Badge label={t('trainerProgramsScreen.assigned')} tone="clinical" />
                  ) : (
                    <Badge label={t('trainerProgramsScreen.unassigned')} tone="neutral" />
                  )}
                </View>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>
                  {t('trainerProgramsScreen.meta', {
                    days: p.days.length,
                    weeks: p.duration_weeks ?? t('common.emDash'),
                    focus: p.focus ?? t('trainerProgramsScreen.noFocus'),
                  })}
                </Text>
                {p.assigned_to ? (
                  <Text style={styles.assignedText}>
                    {t('trainerProgramsScreen.assignedTo', { name: resolveClientName(p.assigned_to) ?? '' })}
                  </Text>
                ) : null}
              </GlassCard>
            </Pressable>
          </Link>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  lead: { color: colors.textMuted, fontSize: typography.size.sm },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  name: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.lg },
  meta: { color: colors.textMuted, fontSize: typography.size.sm },
  assignedText: { color: colors.textFaint, fontSize: typography.size.xs },
});
