import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLiveSessionStore } from '../features/workout/store';

export const LiveSessionHeader = () => {
  const timerSeconds = useLiveSessionStore((s) => s.timerSeconds);
  const incrementTimer = useLiveSessionStore((s) => s.incrementTimer);

  useEffect(() => {
    const intId = setInterval(incrementTimer, 1000);
    return () => clearInterval(intId);
  }, [incrementTimer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.profileArea}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80' }} 
            style={styles.avatar} 
          />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>Sarah Jenkins</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.subText}>Week 3, Day 2 — Lower Body Power</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>READINESS</Text>
          <View style={styles.statValRow}>
            <View style={styles.readinessTrack}>
              <View style={[styles.readinessBar, { width: '45%' }]} />
            </View>
            <Text style={styles.readinessText}>45%</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>HEART RATE</Text>
          <Text style={styles.hrText}><Ionicons name="heart" color="#ef4444" size={12} /> 135</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>DURATION</Text>
          <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(9,9,11,0.97)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(20,184,166,0.4)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  nameText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },
  liveBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  subText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'flex-start',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readinessTrack: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  readinessBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  readinessText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  hrText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerText: {
    color: '#14b8a6',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});
