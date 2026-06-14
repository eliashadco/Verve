import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface PractitionerNoteItem {
  from: string;
  role: string;
  avatar: string;
  date: string;
  note: string;
}

interface Props {
  notes: readonly PractitionerNoteItem[] | PractitionerNoteItem[];
}

/**
 * Port of `User trial.html` Practitioner Notes glass-panel block (overview row 2).
 */
export function PractitionerNotesCard({ notes }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('home.client.practitionerNotesTitle')}</Text>
        <Pressable
          onPress={() => router.push('/(client)/messages')}
          style={styles.viewAllBtn}
          accessibilityRole="link"
          accessibilityLabel={t('home.client.practitionerNotesViewAllA11y')}
        >
          <View style={styles.viewAllInner}>
            <Text style={styles.viewAllText}>{t('home.client.practitionerNotesViewAll')}</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.primary} />
          </View>
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <Text style={styles.empty}>{t('home.client.practitionerNotesEmpty')}</Text>
      ) : (
        <View style={styles.listWrap}>
          {notes.map((n, i) => (
            <View key={`${n.from}-${n.date}-${i}`} style={styles.noteCard}>
              <View style={styles.noteHead}>
                <Image source={{ uri: n.avatar }} style={styles.avatar} />
                <View style={styles.noteHeadText}>
                  <Text style={styles.from}>{n.from}</Text>
                  <Text style={styles.roleDate}>
                    {n.role} · {n.date}
                  </Text>
                </View>
              </View>
              <Text style={styles.noteBody}>{n.note}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.md,
    letterSpacing: 0.2,
  },
  viewAllBtn: { flexShrink: 0 },
  viewAllInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  listWrap: { gap: 8 },
  noteCard: {
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.3)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  noteHeadText: { flex: 1, minWidth: 0, lineHeight: 14 },
  from: {
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: 12.5,
  },
  roleDate: {
    color: colors.textMuted,
    fontSize: 9.9,
    marginTop: 2,
    fontFamily: typography.family.body,
  },
  noteBody: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18.5,
    marginBottom: 0,
    fontFamily: typography.family.body,
  },
});
