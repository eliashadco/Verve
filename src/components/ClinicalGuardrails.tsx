import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLiveSessionStore } from '../features/workout/store';

export const ClinicalGuardrails = () => {
  const endSession = useLiveSessionStore((s) => s.endSession);

  return (
    <View style={styles.container}>
      {/* Constraint Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="shield" size={16} color="#fff" />
        </View>
        <View style={styles.bannerContent}>
          <View style={styles.bannerRow}>
            <View style={styles.restrictedBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={styles.restrictedText}>Restricted</Text>
            </View>
            <Text style={styles.conditionText}>Knee — ACL Post-Op W5</Text>
          </View>
          <View style={styles.chipsRow}>
            <Text style={styles.chipText}>Flex &lt; 90°</Text>
            <Text style={styles.chipText}>No valgus</Text>
            <Text style={styles.chipText}>No plyos</Text>
          </View>
          <View style={styles.doctorRow}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/68.jpg' }}
              style={styles.doctorImg}
            />
            <Text style={styles.doctorText}>Dr. Sarah Ray · Updated Jan 18</Text>
          </View>
        </View>
      </View>

      {/* Subjective Feedback */}
      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>SUBJECTIVE FEEDBACK</Text>
        <View style={styles.anatomyWrap}>
          <View style={styles.anatomyPlaceholder}>
            <Text style={styles.anatomyText}>[Anatomy Model]</Text>
          </View>
          <View style={styles.feedbackBtns}>
            <TouchableOpacity style={styles.painBtn}>
              <Ionicons name="bandage" size={14} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.soreBtn}>
              <Ionicons name="layers" size={14} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.painLevelBox}>
          <View style={styles.painLevelRow}>
            <Text style={styles.painLevelLabel}>Knee Pain</Text>
            <Text style={styles.painLevelVal}>2/10</Text>
          </View>
          <View style={styles.painTrack}>
            <View style={[styles.painBar, { width: '20%' }]} />
          </View>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Session notes..."
          placeholderTextColor="#64748b"
          multiline
        />
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={endSession}>
        <Ionicons name="stop-circle" size={16} color="#f87171" style={{ marginRight: 8 }} />
        <Text style={styles.endBtnText}>End Session</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restrictedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conditionText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  chipText: {
    color: '#f87171',
    fontSize: 10,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorImg: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  doctorText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
  },
  feedbackTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  anatomyWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  anatomyPlaceholder: {
    flex: 1,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anatomyText: {
    color: '#64748b',
    fontSize: 12,
  },
  feedbackBtns: {
    gap: 8,
  },
  painBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soreBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  painLevelBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  painLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  painLevelLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  painLevelVal: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 11,
  },
  painTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  painBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: 10,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.32)',
    borderRadius: 12,
    paddingVertical: 14,
  },
  endBtnText: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 14,
  },
});
