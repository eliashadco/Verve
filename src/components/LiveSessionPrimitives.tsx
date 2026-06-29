import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const MusclePill = ({ muscle }: { muscle: string }) => {
  const stylesMap: Record<string, { bg: string; color: string; border: string }> = {
    quads: { bg: 'rgba(59,130,246,0.14)', color: '#93c5fd', border: 'rgba(59,130,246,0.22)' },
    glutes: { bg: 'rgba(168,85,247,0.14)', color: '#c4b5fd', border: 'rgba(168,85,247,0.22)' },
    hams: { bg: 'rgba(234,179,8,0.14)', color: '#fde68a', border: 'rgba(234,179,8,0.22)' },
    core: { bg: 'rgba(16,185,129,0.14)', color: '#6ee7b7', border: 'rgba(16,185,129,0.22)' },
    erect: { bg: 'rgba(251,191,36,0.12)', color: '#fcd34d', border: 'rgba(251,191,36,0.2)' },
    calves: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.2)' },
  };

  const style = stylesMap[muscle.toLowerCase()] || stylesMap.core;

  return (
    <View style={[styles.pillContainer, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.pillText, { color: style.color }]}>{muscle}</Text>
    </View>
  );
};

export const ConstraintBadge = ({ label }: { label: string }) => (
  <View style={styles.constraintBadge}>
    <Ionicons name="shield-checkmark" size={10} color="#fca5a5" style={{ marginRight: 4 }} />
    <Text style={styles.constraintText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginRight: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  constraintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  constraintText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fca5a5',
  },
});
