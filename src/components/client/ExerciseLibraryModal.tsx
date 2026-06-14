import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useExercises } from '@/hooks/useExercises';
import { readBuilderRecents } from '@/lib/programBuilder/peripheralBuilderStorage';
import { getMuscleLabel } from '@/lib/programBuilder/muscles';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { Exercise, ClinicalConstraint } from '@/types/database';
import { validate } from '@/features/constraints/validate';

interface ExerciseLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  constraints?: ClinicalConstraint[];
  /** Add resolved catalog row to the selected builder day */
  onPickExercise: (ex: Exercise) => void;
}

function muscleSummary(ex: Exercise): string {
  const rows = ex.primary_muscles?.slice(0, 2) ?? [];
  if (!rows.length) return '';
  return rows.map((m) => getMuscleLabel(m.muscle)).join(' · ');
}

export function ExerciseLibraryModal({ visible, onClose, constraints, onPickExercise }: ExerciseLibraryModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const { exercises: searchResults, loading } = useExerciseCatalog(query, visible);

  useEffect(() => {
    if (!visible) return;
    readBuilderRecents().then(setRecentIds);
    setQuery('');
    setSelectedEquipment(null);
    setSelectedDifficulty(null);
  }, [visible]);

  const { exercises: recentMap } = useExercises(recentIds.length ? recentIds : undefined);

  const recentRows = useMemo(() => {
    return recentIds.map((id) => recentMap[id]).filter(Boolean) as Exercise[];
  }, [recentIds, recentMap]);

  const listData = useMemo(() => {
    const seen = new Set<string>();
    const merged: Exercise[] = [];
    for (const ex of recentRows) {
      if (seen.has(ex.id)) continue;
      seen.add(ex.id);
      merged.push(ex);
    }
    const q = query.trim();
    if (q.length >= 2) {
      for (const ex of searchResults) {
        if (seen.has(ex.id)) continue;
        seen.add(ex.id);
        merged.push(ex);
      }
    } else {
      for (const ex of searchResults) {
        if (seen.has(ex.id)) continue;
        seen.add(ex.id);
        merged.push(ex);
      }
    }
    return merged;
  }, [recentRows, searchResults, query]);

  const filteredListData = useMemo(() => {
    return listData.filter((ex) => {
      if (selectedEquipment) {
        const eqList = (ex.equipment || []).map((e) => e.toLowerCase());
        if (!eqList.includes(selectedEquipment)) return false;
      }
      if (selectedDifficulty) {
        if (ex.difficulty !== selectedDifficulty) return false;
      }
      return true;
    });
  }, [listData, selectedEquipment, selectedDifficulty]);

  const sections = useMemo(() => {
    const compound: Exercise[] = [];
    const isolation: Exercise[] = [];
    const general: Exercise[] = [];

    filteredListData.forEach((ex) => {
      const cat = String(ex.category || '').toLowerCase();
      if (cat.includes('compound')) {
        compound.push(ex);
      } else if (cat.includes('isolation')) {
        isolation.push(ex);
      } else {
        general.push(ex);
      }
    });

    const result = [];
    if (compound.length > 0) {
      result.push({ title: 'Compound Exercises', data: compound });
    }
    if (isolation.length > 0) {
      result.push({ title: 'Isolation Exercises', data: isolation });
    }
    if (general.length > 0) {
      result.push({ title: 'Other Exercises', data: general });
    }
    return result;
  }, [filteredListData]);

  const renderMiniBars = (item: Exercise) => {
    const muscles = item.primary_muscles || [];
    if (muscles.length === 0) return null;
    return (
      <View style={styles.miniBarContainer}>
        {muscles.slice(0, 3).map((m) => {
          const pct = Math.round(m.contribution * 100);
          return (
            <View key={m.muscle} style={styles.miniBarCol}>
              <Text style={styles.miniBarLabel}>{getMuscleLabel(m.muscle)}</Text>
              <View style={styles.miniBarTrack}>
                <View style={[styles.miniBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Exercise }) => {
    const violations = constraints ? validate(item, constraints) : [];
    const primaryV = violations.length > 0 ? violations[0] : null;

    return (
      <Pressable
        style={styles.row}
        onPress={() => {
          onPickExercise(item);
          onClose();
        }}
      >
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            {primaryV && (
              <View style={[
                styles.libraryConstraintBadge,
                primaryV.level === 'hard' ? styles.libraryConstraintHard : primaryV.level === 'soft' ? styles.libraryConstraintSoft : styles.libraryConstraintAdvisory
              ]}>
                <Text style={[
                  styles.libraryConstraintText,
                  primaryV.level === 'hard' ? styles.libraryConstraintTextHard : primaryV.level === 'soft' ? styles.libraryConstraintTextSoft : styles.libraryConstraintTextAdvisory
                ]}>
                  {primaryV.badgeLabel}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {[muscleSummary(item), item.category].filter(Boolean).join(' · ') || '—'}
          </Text>
          {renderMiniBars(item)}
        </View>
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('userTrial.programs.exerciseLibraryTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={t('userTrial.programs.exerciseLibraryClose')}>
            <Ionicons name="close" size={28} color={colors.textStrong} />
          </Pressable>
        </View>
        <Text style={styles.hint}>{t('userTrial.programs.exerciseLibraryHint')}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('userTrial.programs.exerciseLibrarySearch')}
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, 'bodyweight', 'dumbbell', 'barbell', 'cable', 'machine', 'kettlebell']}
            keyExtractor={(item) => String(item || 'all')}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedEquipment(item)}
                style={[
                  styles.chip,
                  selectedEquipment === item && styles.chipActive
                ]}
              >
                <Text style={[
                  styles.chipText,
                  selectedEquipment === item && styles.chipTextActive
                ]}>
                  {item ? item.charAt(0).toUpperCase() + item.slice(1) : 'All Equipment'}
                </Text>
              </Pressable>
            )}
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, 'beginner', 'intermediate', 'advanced']}
            keyExtractor={(item) => String(item || 'all')}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedDifficulty(item)}
                style={[
                  styles.chip,
                  selectedDifficulty === item && styles.chipActive
                ]}
              >
                <Text style={[
                  styles.chipText,
                  selectedDifficulty === item && styles.chipTextActive
                ]}>
                  {item ? item.charAt(0).toUpperCase() + item.slice(1) : 'All Levels'}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {recentRows.length > 0 && query.trim().length < 2 && !selectedEquipment && !selectedDifficulty ? (
          <Text style={styles.sectionLabel}>{t('userTrial.programs.exerciseLibraryRecents')}</Text>
        ) : null}

        {loading && filteredListData.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('userTrial.programs.exerciseLibraryEmpty')}</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bgApp, paddingHorizontal: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.lg },
  hint: { color: colors.textFaint, fontSize: typography.size.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textStrong,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    marginBottom: 4,
  },
  filterSection: {
    gap: 8,
    marginBottom: 4,
  },
  chipsRow: {
    gap: 6,
  },
  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.family.bodySemi,
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: typography.family.bodyBold,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  list: { paddingBottom: spacing.xl, gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 6,
  },
  rowBody: { flex: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  rowTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm, flex: 1, marginRight: 8 },
  rowMeta: { color: colors.textMuted, fontSize: typography.size.xs },
  empty: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.xl },
  loader: { marginTop: spacing.xl },
  sectionHeader: {
    backgroundColor: colors.bgApp,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniBarContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  miniBarCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  miniBarLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontFamily: typography.family.bodySemi,
  },
  miniBarTrack: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  libraryConstraintBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'center',
  },
  libraryConstraintHard: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 },
  libraryConstraintSoft: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1 },
  libraryConstraintAdvisory: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1 },
  libraryConstraintText: { fontSize: 8, fontFamily: typography.family.bodyBold },
  libraryConstraintTextHard: { color: '#ef4444' },
  libraryConstraintTextSoft: { color: '#f59e0b' },
  libraryConstraintTextAdvisory: { color: '#3b82f6' },
});

