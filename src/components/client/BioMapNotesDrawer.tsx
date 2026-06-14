import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface BioMapNote {
  id: string;
  region: string;
  note: string;
  createdAt: string;
}

interface BioMapNotesDrawerProps {
  visible: boolean;
  notes: BioMapNote[];
  onClose: () => void;
}

export function BioMapNotesDrawer({ visible, notes, onClose }: BioMapNotesDrawerProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('userTrial.progress.bioMapNotes')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel={t('userTrial.progress.closeBioMapNotesA11y')}>
              <Text style={styles.closeText}>{t('common.close')}</Text>
            </Pressable>
          </View>
          <Text style={styles.viewAll}>{t('userTrial.progress.viewAll')}</Text>
          {notes.length === 0 ? (
            <Text style={styles.empty}>{t('userTrial.progress.noNotesYet')}</Text>
          ) : (
            <View style={styles.feed}>
              {notes.map((note) => (
                <View key={note.id} style={styles.note}>
                  <Text style={styles.region}>{note.region}</Text>
                  <Text style={styles.body}>{note.note}</Text>
                  <Text style={styles.date}>{new Date(note.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 4, 8, 0.68)',
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.lg },
  closeButton: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closeText: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  viewAll: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, textTransform: 'uppercase' },
  empty: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm, lineHeight: 20 },
  feed: { gap: spacing.sm },
  note: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  region: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, textTransform: 'uppercase' },
  body: { color: colors.textSub, fontFamily: typography.family.body, fontSize: typography.size.sm },
  date: { color: colors.textFaint, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
});
