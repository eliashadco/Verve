import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AnimatedExerciseLibrary } from '@/features/exercise/AnimatedExerciseLibrary';
import { ExerciseDetailSheet } from '@/features/exercise/ExerciseDetailSheet';
import { colors } from '@/lib/theme';
import type { Exercise } from '@/types/database';

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer scroll={false} ambient="tealGlass">
        <Header 
          title="Exercise Library" 
          rightSlot={
            <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={colors.textMain} />
            </Pressable>
          }
        />
        
        <AnimatedExerciseLibrary 
          onSelectExercise={setSelectedExercise} 
        />

        <ExerciseDetailSheet
          visible={Boolean(selectedExercise)}
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      </ScreenContainer>
    </>
  );
}
