import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import type { BuilderDay } from '@/lib/programBuilder/types';

interface DayTabsProps {
  days: BuilderDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddDay: () => void;
}

/** Batch 12 Step 2 — horizontally scrollable training day selector. */
export function DayTabs({ days, selectedIndex, onSelect, onAddDay }: DayTabsProps) {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {days.map((day, idx) => (
        <TouchableOpacity
          key={`${day.label}-${idx}`}
          onPress={() => onSelect(idx)}
          style={[styles.tab, selectedIndex === idx && styles.tabActive]}
        >
          <Text style={[styles.tabText, selectedIndex === idx && styles.tabTextActive]}>{day.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={onAddDay} style={styles.addTab}>
        <Ionicons name="add" size={16} color={colors.textMuted} style={{ marginRight: 2 }} />
        <Text style={styles.addTabText}>{t('userTrial.programs.addDay') || 'Add Day'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, alignItems: 'center', gap: 8, paddingVertical: 4 },
  tab: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  tabText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  tabTextActive: { color: colors.primary, fontFamily: typography.family.bodyBold },
  addTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTabText: { color: colors.textMuted, fontSize: typography.size.sm },
});
