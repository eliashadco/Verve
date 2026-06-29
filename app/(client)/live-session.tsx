import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLiveSessionStore } from '../../src/features/workout/store';
import { LiveSessionHeader } from '../../src/components/LiveSessionHeader';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import { MuscleLoadPanel } from '../../src/components/MuscleLoadPanel';
import { ClinicalGuardrails } from '../../src/components/ClinicalGuardrails';

export default function LiveSessionScreen() {
  const exercises = useLiveSessionStore((s) => s.exercises);
  const activeExerciseIndex = useLiveSessionStore((s) => s.activeExerciseIndex);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} indicatorStyle="white">
        <LiveSessionHeader />

        <View style={styles.layout}>
          {/* Main Column */}
          <View style={styles.mainColumn}>
            {exercises.map((ex, index) => (
              <ExerciseCard 
                key={ex.id} 
                exercise={ex} 
                isActive={index === activeExerciseIndex} 
              />
            ))}

            <MuscleLoadPanel />
          </View>

          {/* Right Column (Guardrails) - stacked vertically on mobile */}
          <View style={styles.sideColumn}>
            <ClinicalGuardrails />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  layout: {
    flexDirection: 'column', // Typically stacked on mobile
    gap: 16,
  },
  mainColumn: {
    flex: 1,
  },
  sideColumn: {
    flex: 1,
  },
});
