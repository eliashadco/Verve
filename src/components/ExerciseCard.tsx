import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { ExerciseSessionData, useLiveSessionStore } from '../features/workout/store';
import { MusclePill, ConstraintBadge } from './LiveSessionPrimitives';

export const ExerciseCard = ({ exercise, isActive }: { exercise: ExerciseSessionData; isActive: boolean }) => {
  const [expanded, setExpanded] = useState(isActive);
  const logSet = useLiveSessionStore((s) => s.logSet);
  const copyPrevSet = useLiveSessionStore((s) => s.copyPrevSet);
  const advanceExercise = useLiveSessionStore((s) => s.advanceExercise);

  const heightValue = useSharedValue(isActive ? 1 : 0);

  const toggleExpand = () => {
    setExpanded(!expanded);
    heightValue.value = withTiming(expanded ? 0 : 1, { duration: 300 });
  };

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: heightValue.value,
  }));

  const isCompleted = exercise.sets.every(s => s.isLogged);

  return (
    <View style={[styles.card, isActive && styles.activeCard, isCompleted && styles.completedCard]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand}>
        <View style={[styles.labelBadge, !isActive && styles.inactiveLabel]}>
          <Text style={styles.labelText}>{exercise.label}</Text>
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.nameText, !isActive && styles.inactiveName]}>{exercise.name}</Text>
            {exercise.isConstrained && <ConstraintBadge label="Flex < 90°" />}
          </View>
          <View style={styles.musclesRow}>
            {exercise.muscles.map((m) => (
              <MusclePill key={m} muscle={m} />
            ))}
          </View>
        </View>

        <Text style={styles.progressText}>
          {exercise.sets.filter(s => s.isLogged).length}/{exercise.sets.length} sets
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={[styles.body, bodyStyle]}>
          <View style={styles.metaInfoRow}>
          <Text style={styles.metaText}><Ionicons name="time-outline" size={12} /> Tempo {exercise.targetSetsStr}</Text>
          <Text style={styles.metaText}><Ionicons name="stopwatch-outline" size={12} /> Rest {exercise.restSeconds}s</Text>
        </View>

        {/* Set Rows */}
        {exercise.sets.map((set) => (
          <View key={set.id} style={[styles.setRow, set.isLogged ? styles.loggedSet : null]}>
            <Text style={styles.setNum}>{set.setNum}</Text>
            <View style={styles.setInputs}>
              <Text style={styles.fakeDropdown}>{set.kg} kg</Text>
              <Text style={styles.fakeDropdown}>{set.reps} reps</Text>
              {!set.isLogged ? (
                <TextInput
                  style={styles.rirInput}
                  placeholder="RIR"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    // Update local state before logging (simplified)
                  }}
                />
              ) : (
                <Text style={styles.loggedRir}>{set.rir} RIR</Text>
              )}
            </View>
            {!set.isLogged ? (
              <TouchableOpacity style={styles.logBtn} onPress={() => logSet(exercise.id, set.id, 45, 8, 2)}>
                <Ionicons name="checkmark" size={14} color="#14b8a6" />
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#14b8a6" />
            )}
          </View>
        ))}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.restBtn}>
            <Ionicons name="stopwatch-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.restBtnText}>Rest {exercise.restSeconds}s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={() => advanceExercise(exercise.id)}>
            <Text style={styles.nextBtnText}>Next Ex <Ionicons name="arrow-forward" size={14} /></Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: 'rgba(20,184,166,0.28)',
    backgroundColor: 'rgba(20,184,166,0.03)',
  },
  completedCard: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  labelBadge: {
    backgroundColor: 'rgba(20,184,166,0.2)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginRight: 10,
  },
  inactiveLabel: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#14b8a6',
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  nameText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#e2e8f0',
  },
  inactiveName: {
    color: '#94a3b8',
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  progressText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginRight: 8,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  loggedSet: {
    opacity: 0.65,
  },
  setNum: {
    fontWeight: 'bold',
    color: '#14b8a6',
    width: 20,
  },
  setInputs: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    paddingHorizontal: 10,
  },
  fakeDropdown: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
  },
  rirInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: '#f0f6fc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 12,
    width: 50,
    textAlign: 'center',
  },
  loggedRir: {
    color: '#14b8a6',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,184,166,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.32)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  logBtnText: {
    color: '#14b8a6',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  restBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  restBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
