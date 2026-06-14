import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SocialGroupPanel } from '@/components/client/SocialGroupPanel';
import { SocialPostCard } from '@/components/client/SocialPostCard';
import { SocialStoryRail } from '@/components/client/SocialStoryRail';
import { useSocialFeed } from '@/hooks/useSocialFeed';
import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function ClientSocial() {
  const { t } = useTranslation();
  const social = useSocialFeed();
  const demoEnabled = USER_TRIAL_DEMO_FLAGS.enabled;
  const feedEmpty = social.posts.length === 0 && social.stories.length === 0 && social.groups.length === 0;
  const [tab, setTab] = useState<'for-you' | 'groups' | 'near-you'>('for-you');
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState('');

  return (
    <ScreenContainer>
      <Header title={t('userTrial.social.title')} />
      <Text style={styles.subtitle}>{t('userTrial.social.subtitle')}</Text>
      <View style={styles.topRow}>
        {demoEnabled ? <Badge label={t('userTrial.social.freshDrops')} tone="clinical" /> : null}
        <Pressable style={styles.newPostBtn} onPress={() => setShowComposer(true)}>
          <Text style={styles.newPostText}>{t('userTrial.social.newPost')}</Text>
        </Pressable>
      </View>
      <View style={styles.tabs}>
        {([
          { key: 'for-you', label: t('userTrial.social.forYou') },
          { key: 'groups', label: t('userTrial.social.groups') },
          { key: 'near-you', label: t('userTrial.social.nearYou') },
        ] as const).map((item) => (
          <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, tab === item.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {demoEnabled ? (
        <GlassCard>
          <Text style={styles.contextPill}>{t('userTrial.social.context')}</Text>
        </GlassCard>
      ) : null}
      <SocialStoryRail stories={social.stories} />
      {demoEnabled ? (
        <GlassCard style={{ gap: 8 }}>
          <Text style={styles.panelTitle}>{t('userTrial.social.nearbyTitle')}</Text>
          <Text style={styles.panelMeta}>{t('userTrial.social.nearbyBody')}</Text>
        </GlassCard>
      ) : null}
      {demoEnabled ? (
        <View style={styles.kpiRow}>
          <GlassCard style={styles.kpi}><Text style={styles.kpiLabel}>{t('userTrial.social.kpiFreshPulse')}</Text><Text style={styles.kpiValue}>12</Text></GlassCard>
          <GlassCard style={styles.kpi}><Text style={styles.kpiLabel}>{t('userTrial.social.kpiSquadLoops')}</Text><Text style={styles.kpiValue}>4</Text></GlassCard>
          <GlassCard style={styles.kpi}><Text style={styles.kpiLabel}>{t('userTrial.social.kpiSavedCues')}</Text><Text style={styles.kpiValue}>8</Text></GlassCard>
        </View>
      ) : null}
      <SocialGroupPanel groups={social.groups} />
      {social.posts.map((post) => <SocialPostCard key={post.id} post={post} />)}
      {!demoEnabled && feedEmpty ? (
        <GlassCard>
          <EmptyState
            icon="people-circle-outline"
            title={t('userTrial.social.emptyTitle')}
            body={t('userTrial.social.emptyBody')}
          />
        </GlassCard>
      ) : null}

      <Modal visible={showComposer} transparent animationType="fade" onRequestClose={() => setShowComposer(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.panelTitle}>{t('userTrial.social.shareToPulse')}</Text>
            <TextInput value={draft} onChangeText={setDraft} placeholder={t('userTrial.social.writeUpdate')} placeholderTextColor={colors.textFaint} style={styles.input} multiline />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => setShowComposer(false)}><Text style={styles.modalBtnText}>{t('userTrial.social.cancel')}</Text></Pressable>
              <Pressable style={styles.modalBtn} onPress={() => { social.addPost(draft); setDraft(''); setShowComposer(false); Alert.alert(t('userTrial.social.postedTitle'), t('userTrial.social.postedBody')); }}><Text style={styles.modalBtnText}>{t('userTrial.social.post')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newPostBtn: { borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 10, backgroundColor: colors.primaryDim, paddingHorizontal: 12, paddingVertical: 8 },
  newPostText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.borderDefault, backgroundColor: colors.surface2, paddingVertical: 8 },
  tabActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  tabText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm, textTransform: 'capitalize' },
  tabTextActive: { color: colors.primary, fontFamily: typography.family.bodyBold },
  contextPill: { color: colors.textSub, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  panelTitle: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  panelMeta: { color: colors.textMuted, fontSize: typography.size.sm },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, gap: 2 },
  kpiLabel: { color: colors.textFaint, fontSize: typography.size.xs, textTransform: 'uppercase' },
  kpiValue: { color: colors.primary, fontFamily: typography.family.headingSemi, fontSize: typography.size.lg },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,4,8,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { width: '100%', backgroundColor: colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderDefault, padding: 14, gap: 10 },
  input: { minHeight: 88, backgroundColor: colors.surface2, borderRadius: 10, borderWidth: 1, borderColor: colors.borderDefault, color: colors.textStrong, paddingHorizontal: 10, paddingVertical: 10, fontFamily: typography.family.body, fontSize: typography.size.base, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.borderDefault, backgroundColor: colors.surface2, paddingVertical: 10 },
  modalBtnText: { color: colors.textSub, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
});
