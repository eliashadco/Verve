import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedExerciseCard } from './AnimatedExerciseCard';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { Exercise } from '@/types/database';

interface AnimatedExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void;
}

export function AnimatedExerciseLibrary({ onSelectExercise }: AnimatedExerciseLibraryProps) {
  const [search, setSearch] = useState('');
  
  // `useExerciseCatalog` internally loads 100 exercises or filters by name.
  // It handles its own loading state.
  const { exercises, loading } = useExerciseCatalog(search, true);

  // Simple column rendering for masonry-like feel
  const leftColumn = exercises.filter((_, i) => i % 2 === 0);
  const rightColumn = exercises.filter((_, i) => i % 2 !== 0);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textFaint} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Loading & Empty States */}
      {loading && exercises.length === 0 ? (
        <LoadingScreen label="Loading library..." />
      ) : exercises.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="search-outline"
            title="No exercises found"
            body={`We couldn't find any exercises matching "${search}". Try another term.`}
          />
        </View>
      ) : (
        <FlatList
          data={[1]} // single row for columns
          keyExtractor={() => 'grid'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={() => (
            <View style={styles.grid}>
              <View style={styles.column}>
                {leftColumn.map((ex) => (
                  <AnimatedExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onPress={() => onSelectExercise(ex)}
                  />
                ))}
              </View>
              <View style={styles.column}>
                {rightColumn.map((ex) => (
                  <AnimatedExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onPress={() => onSelectExercise(ex)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  listContent: {
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
    gap: 16,
  },
});
