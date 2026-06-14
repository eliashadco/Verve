/**
 * ScreenContainer — full-bleed dark background + safe-area handling.
 * Use as the root of every screen.
 */

import { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import type { ScrollViewProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout } from '@/lib/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshControl?: ScrollViewProps['refreshControl'];
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  ambient?: 'none' | 'tealGlass';
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
  edges = ['top', 'left', 'right'],
  ambient = 'none',
}: Props) {
  const scrollPad: ViewStyle = {
    paddingHorizontal: layout.screenPad,
    paddingBottom: 32,
    gap: 16,
  };

  const ambientLayers =
    ambient === 'tealGlass' ? (
      <>
        <LinearGradient
          colors={[colors.ambientTealDeep, colors.bgApp, colors.ambientTealMid, colors.bgApp]}
          locations={[0, 0.38, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.ambientTealGlow, colors.ambientMintWash, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </>
    ) : null;

  return (
    <View style={[styles.root, ambient === 'tealGlass' && styles.rootTransparent]}>
      <StatusBar barStyle="light-content" />
      {ambientLayers}
      <SafeAreaView style={[styles.safe, ambient === 'tealGlass' && styles.safeTransparent]} edges={edges}>
        {scroll ? (
          <ScrollView
            style={ambient === 'tealGlass' ? styles.scrollTransparent : undefined}
            contentContainerStyle={[scrollPad, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[scrollPad, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  rootTransparent: { backgroundColor: colors.transparent },
  safe: { flex: 1 },
  safeTransparent: { backgroundColor: colors.transparent },
  scrollTransparent: { backgroundColor: colors.transparent },
});
