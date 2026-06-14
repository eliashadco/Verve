import { Stack, useLocalSearchParams } from 'expo-router';

import { ProgramBuilderShell } from '@/components/programBuilder';
import { colors } from '@/lib/theme';

export default function ClientProgramBuilderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Program Builder',
          headerStyle: { backgroundColor: colors.bgSurface },
          headerTintColor: colors.textMain,
        }}
      />
      <ProgramBuilderShell programId={id} role="client" />
    </>
  );
}
