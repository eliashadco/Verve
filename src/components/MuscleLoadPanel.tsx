import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useLiveSessionStore } from '../features/workout/store';

export const MuscleLoadPanel = () => {
  const musclePcts = useLiveSessionStore((s) => s.musclePcts);
  const volumeKg = useLiveSessionStore((s) => s.volumeKg);

  const muscles = [
    { key: 'quads', label: 'Quadriceps' },
    { key: 'glutes', label: 'Glutes' },
    { key: 'hams', label: 'Hamstrings' },
    { key: 'core', label: 'Core' },
    { key: 'erect', label: 'Erectors' },
    { key: 'calves', label: 'Calves' },
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={16} color="#14b8a6" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Session Load Distribution</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Text style={styles.mutedText}>Updates as sets are logged</Text>
          <Text style={styles.volumeText}>Total Volume: {Math.round(volumeKg)} kg</Text>
        </View>

        {muscles.map((m) => (
          <View key={m.key} style={styles.row}>
            <Text style={styles.label}>{m.label}</Text>
            <View style={styles.track}>
              <AnimatedBar pct={musclePcts[m.key] || 0} />
            </View>
            <Text style={styles.pct}>{musclePcts[m.key] || 0}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const AnimatedBar = ({ pct }: { pct: number }) => {
  const widthVal = useSharedValue(pct);

  useEffect(() => {
    widthVal.value = withTiming(pct, { duration: 600 });
  }, [pct]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
  }));

  return (
    <Animated.View style={[styles.bar, animatedStyle]} />
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(20,184,166,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.12)',
    borderRadius: 14,
    marginTop: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#14b8a6',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,184,166,0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 10,
  },
  mutedText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  volumeText: {
    fontSize: 10,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 86,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  track: {
    flex: 1,
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 99,
    overflow: 'hidden',
    marginRight: 8,
  },
  bar: {
    height: '100%',
    backgroundColor: '#14b8a6',
    borderRadius: 99,
  },
  pct: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
    textAlign: 'right',
  },
});
