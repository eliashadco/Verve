import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { useClientHub } from '@/hooks/useClientHub';
import type { HubAdminDoc, HubEngagementRow, HubInvoice, HubMedicalDoc, HubPaymentMethod, HubTask, HubTransaction } from '@/hooks/useClientHub';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

type TabType = 'tasks' | 'documents' | 'billing';

export function ClientHubContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  const hubMessages = useMemo(
    () => ({
      taskComplete: t('userTrial.hub.taskComplete'),
      uploadSuccess: t('userTrial.hub.uploadSuccess'),
      photosPermissionTitle: t('userTrial.hub.photosPermissionTitle'),
      photosPermissionBody: t('userTrial.hub.photosPermissionBody'),
      pendingDocMeta: t('userTrial.hub.pendingDocMeta'),
    }),
    [t],
  );

  const txLabels = useMemo(
    () => ({
      paid: t('userTrial.hub.txPaid'),
      pending: t('userTrial.hub.txPending'),
      refunded: t('userTrial.hub.txRefunded'),
    }),
    [t],
  );

  const hub = useClientHub(hubMessages);
  const { data, pendingTaskCount } = hub;

  const hasOverdueInvoices = useMemo(() => {
    return data.invoices.some(inv => inv.overdue);
  }, [data.invoices]);

  interface HubTabConfig {
    key: TabType;
    label: string;
    icon: string;
    badgeCount?: number;
    badgeTone?: 'primary' | 'clinical' | 'warning' | 'danger' | 'neutral';
  }

  const tabs: HubTabConfig[] = [
    { key: 'tasks', label: t('userTrial.hub.actionRequired'), icon: 'checkbox-outline', badgeCount: pendingTaskCount, badgeTone: 'warning' },
    { key: 'documents', label: t('userTrial.hub.medicalDocs'), icon: 'document-text-outline' },
    { key: 'billing', label: t('userTrial.hub.invoicesPayments'), icon: 'card-outline', badgeCount: hasOverdueInvoices ? 1 : 0, badgeTone: 'danger' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('userTrial.hub.title')}</Text>
          <Text style={styles.subtitle}>{t('userTrial.hub.subtitle')}</Text>
        </View>
        <Pressable style={styles.uploadBtn} onPress={() => hub.uploadDocument()}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
          <Text style={styles.uploadText}>{t('userTrial.hub.uploadDoc')}</Text>
        </Pressable>
      </View>

      {/* Top Segmented Tab Navigator */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <View style={styles.tabItemContent}>
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <View style={styles.tabBadge}>
                    <Badge label={String(tab.badgeCount)} tone={tab.badgeTone} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <GlassCard variant="inline" style={styles.actionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.actionTitleRow}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.actionSectionTitle}>{t('userTrial.hub.actionRequired')}</Text>
              </View>
              {pendingTaskCount > 0 ? (
                <Badge label={String(pendingTaskCount)} tone="warning" />
              ) : null}
            </View>
            <View style={styles.taskList}>
              {data.tasks.length === 0 ? (
                <Text style={styles.emptyText}>{t('userTrial.hub.noTasks') ?? 'No tasks outstanding.'}</Text>
              ) : (
                data.tasks.map((task) => (
                  <HubTaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => hub.toggleTaskDone(task.id)}
                    onAction={() =>
                      Alert.alert(
                        task.action === 'sign' ? t('userTrial.hub.signActionTitle') : t('userTrial.hub.editActionTitle'),
                        t('userTrial.hub.actionPlaceholderBody'),
                      )
                    }
                    labels={{
                      sign: t('userTrial.hub.sign'),
                      edit: t('userTrial.hub.edit'),
                    }}
                  />
                ))
              )}
            </View>
          </GlassCard>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <View style={styles.tabContentContainer}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>{t('userTrial.hub.medicalDocs')}</Text>
                <Badge label={t('userTrial.hub.clinicalBadge')} tone="clinical" />
              </View>
              <View style={styles.docList}>
                {data.medicalDocs.length === 0 ? (
                  <Text style={styles.emptyText}>No medical documents uploaded.</Text>
                ) : (
                  data.medicalDocs.map((doc) => (
                    <HubDocRow key={doc.id} doc={doc} onDownload={() => Alert.alert(t('userTrial.hub.downloadSoonTitle'), t('userTrial.hub.downloadSoonBody'))} />
                  ))
                )}
              </View>
              <Pressable onPress={() => Alert.alert(t('userTrial.hub.viewAllDocs'), t('userTrial.hub.viewAllDocsBody'))}>
                <Text style={styles.link}>{t('userTrial.hub.viewAllDocs')}</Text>
              </Pressable>
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>{t('userTrial.hub.adminFinancial')}</Text>
                <Badge label={t('userTrial.hub.adminBadge')} tone="primary" />
              </View>
              <View style={styles.docList}>
                {data.adminDocs.length === 0 ? (
                  <Text style={styles.emptyText}>No administrative documents found.</Text>
                ) : (
                  data.adminDocs.map((doc) => (
                    <HubAdminDocRow key={doc.id} doc={doc} onDownload={() => Alert.alert(t('userTrial.hub.downloadSoonTitle'), t('userTrial.hub.downloadSoonBody'))} />
                  ))
                )}
              </View>
              <Pressable onPress={() => Alert.alert(t('userTrial.hub.viewAllAdminDocs'), t('userTrial.hub.viewAllDocsBody'))}>
                <Text style={styles.link}>{t('userTrial.hub.viewAllAdminDocs')}</Text>
              </Pressable>
            </GlassCard>
          </View>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <View style={styles.tabContentContainer}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>{t('userTrial.hub.invoicesPayments')}</Text>
                {hasOverdueInvoices && (
                  <Badge label={t('userTrial.hub.overdueBadge')} tone="danger" />
                )}
              </View>
              <View style={styles.invoiceList}>
                {data.invoices.length === 0 ? (
                  <Text style={styles.emptyText}>No invoices.</Text>
                ) : (
                  data.invoices.map((inv) => (
                    <HubInvoiceRow
                      key={inv.id}
                      invoice={inv}
                      labels={{
                        payNow: t('userTrial.hub.payNow'),
                        paid: t('userTrial.hub.statusPaid'),
                      }}
                      onPay={() => hub.payInvoice(t('userTrial.hub.payRedirect', { id: inv.id }))}
                    />
                  ))
                )}
              </View>

              <View style={styles.txHeader}>
                <Text style={styles.txTitle}>{t('userTrial.hub.transactionHistory')}</Text>
                <Text style={styles.txHint}>{t('userTrial.hub.last90Days')}</Text>
              </View>
              <View style={styles.txCards}>
                {data.transactions.length === 0 ? (
                  <Text style={styles.emptyText}>No recent transactions.</Text>
                ) : (
                  data.transactions.map((row) => (
                    <HubTransactionCard key={`${row.date}-${row.service}`} row={row} labels={txLabels} />
                  ))
                )}
              </View>

              <Link href="/(client)/booking" asChild>
                <Pressable style={styles.payOutstandingBtn}>
                  <Ionicons name="card-outline" size={18} color={colors.textStrong} />
                  <Text style={styles.payOutstandingText}>{t('userTrial.hub.payOutstanding')}</Text>
                </Pressable>
              </Link>
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>{t('userTrial.hub.activeEngagements')}</Text>
                <Badge label={t('userTrial.hub.engagementActive')} tone="success" />
              </View>
              <View style={styles.engagementList}>
                {data.engagements.map((row) => (
                  <EngagementRowCard key={row.id} row={row} t={t} />
                ))}
              </View>
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionLabel}>{t('userTrial.hub.paymentMethods')}</Text>
                <Pressable onPress={() => Alert.alert(t('userTrial.hub.manage'), t('userTrial.hub.managePaymentBody'))}>
                  <Text style={styles.manageBtn}>{t('userTrial.hub.manage')}</Text>
                </Pressable>
              </View>
              <View style={styles.pmList}>
                {data.paymentMethods.map((pm) => (
                  <HubPaymentMethodRow
                    key={pm.id}
                    method={pm}
                    labels={{
                      default: t('userTrial.hub.defaultMethod'),
                      remove: t('userTrial.hub.remove'),
                      expires: t('userTrial.hub.expires'),
                    }}
                    onRemove={() => Alert.alert(t('userTrial.hub.remove'), t('userTrial.hub.removeCardBody'))}
                  />
                ))}
              </View>
              <Pressable style={styles.addCardBtn} onPress={() => Alert.alert(t('userTrial.hub.addCard'), t('userTrial.hub.addCardBody'))}>
                <Ionicons name="add" size={18} color={colors.textStrong} />
                <Text style={styles.addCardText}>{t('userTrial.hub.addCard')}</Text>
              </Pressable>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function HubTaskRow({
  task,
  onToggle,
  onAction,
  labels,
}: {
  task: HubTask;
  onToggle: () => void;
  onAction: () => void;
  labels: { sign: string; edit: string };
}) {
  return (
    <View style={[styles.taskRow, task.done && styles.taskRowDone]}>
      <Pressable onPress={onToggle} style={styles.checkbox} accessibilityRole="checkbox" accessibilityState={{ checked: task.done }}>
        <Ionicons name={task.done ? 'checkbox' : 'square-outline'} size={22} color={task.done ? colors.primary : colors.warning} />
      </Pressable>
      <View style={styles.taskBody}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
      </View>
      <Pressable style={styles.taskCta} onPress={onAction}>
        <Text style={styles.taskCtaText}>{task.action === 'sign' ? labels.sign : labels.edit}</Text>
      </Pressable>
    </View>
  );
}

function HubDocRow({ doc, onDownload }: { doc: HubMedicalDoc; onDownload: () => void }) {
  const icon = doc.kind === 'pdf' ? 'document-text' : doc.kind === 'image' ? 'image-outline' : 'hourglass-outline';
  return (
    <Pressable style={styles.docRow} onPress={onDownload}>
      <View style={styles.docIcon}>
        <Ionicons name={icon as 'document-text'} size={20} color={colors.textMuted} />
      </View>
      <View style={styles.docBody}>
        <Text style={styles.docTitle}>{doc.title}</Text>
        <Text style={styles.docMeta}>{doc.meta}</Text>
      </View>
      <Ionicons name="download-outline" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

function HubAdminDocRow({ doc, onDownload }: { doc: HubAdminDoc; onDownload: () => void }) {
  const icon = doc.kind === 'pdf' ? 'document-text' : 'document-outline';
  return (
    <Pressable style={styles.docRow} onPress={onDownload}>
      <View style={styles.docIcon}>
        <Ionicons name={icon as 'document-text'} size={20} color={colors.textMuted} />
      </View>
      <View style={styles.docBody}>
        <Text style={styles.docTitle}>{doc.title}</Text>
        <Text style={styles.docMeta}>{doc.meta}</Text>
      </View>
      <Ionicons name="download-outline" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

function HubInvoiceRow({
  invoice,
  onPay,
  labels,
}: {
  invoice: HubInvoice;
  onPay: () => void;
  labels: { payNow: string; paid: string };
}) {
  return (
    <View style={[styles.invoiceRow, invoice.overdue ? styles.invoiceOverdue : styles.invoiceOk]}>
      <View style={styles.invoiceLeft}>
        <View style={styles.invoiceIcon}>
          <Ionicons name="receipt-outline" size={18} color={colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceService}>{invoice.service}</Text>
          <Text style={styles.invoiceMeta}>
            {invoice.date} · #{invoice.id}
          </Text>
        </View>
      </View>
      <View style={styles.invoiceRight}>
        <Text style={styles.invoiceAmount}>${invoice.amount}</Text>
        {invoice.status === 'unpaid' ? (
          <Pressable style={styles.payNowBtn} onPress={onPay}>
            <Text style={styles.payNowText}>{labels.payNow}</Text>
          </Pressable>
        ) : (
          <Badge label={labels.paid} tone="success" />
        )}
      </View>
    </View>
  );
}

function HubTransactionCard({
  row,
  labels,
}: {
  row: HubTransaction;
  labels: { paid: string; pending: string; refunded: string };
}) {
  const tone = row.status === 'Paid' ? 'success' : row.status === 'Refunded' ? 'neutral' : 'warning';
  const label = row.status === 'Paid' ? labels.paid : row.status === 'Refunded' ? labels.refunded : labels.pending;
  return (
    <View style={styles.txCard}>
      <View style={styles.txCardTop}>
        <Text style={styles.txCardDate}>{row.date}</Text>
        <Badge label={label} tone={tone} />
      </View>
      <Text style={styles.txCardService}>{row.service}</Text>
      <View style={styles.txCardBottom}>
        <Text style={styles.txCardMethod}>{row.method}</Text>
        <Text style={styles.txCardAmount}>${row.amount}</Text>
      </View>
    </View>
  );
}

function EngagementRowCard({ row, t }: { row: HubEngagementRow; t: (k: string) => string }) {
  const label =
    row.label === 'physio' ? t('userTrial.hub.engagementPhysioLabel') : t('userTrial.hub.engagementTrainerLabel');
  const badge =
    row.label === 'physio' ? t('userTrial.hub.engagementActive') : t('userTrial.hub.engagementPack');
  const tone = row.label === 'physio' ? 'success' : 'primary';
  return (
    <View style={styles.engagementRow}>
      <Text style={styles.engagementLabel}>{label}</Text>
      <Badge label={badge} tone={tone} />
    </View>
  );
}

function HubPaymentMethodRow({
  method,
  onRemove,
  labels,
}: {
  method: HubPaymentMethod;
  onRemove: () => void;
  labels: { default: string; remove: string; expires: string };
}) {
  return (
    <View style={styles.pmRow}>
      <Ionicons name="card-outline" size={22} color={colors.textStrong} />
      <View style={styles.pmBody}>
        <Text style={styles.pmLabel}>{method.label}</Text>
        <Text style={styles.pmExpiry}>
          {labels.expires} {method.expiry}
        </Text>
      </View>
      {method.isDefault ? <Badge label={labels.default} tone="neutral" /> : null}
      <Pressable onPress={onRemove} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>{labels.remove}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: spacing.xl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  headerCopy: { flex: 1 },
  title: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.xl },
  subtitle: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm, marginTop: 4 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  uploadText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  
  // Custom Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  tabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 11,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabBadge: {
    marginLeft: 2,
  },

  tabContentContainer: {
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: 12,
  },

  actionCard: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    gap: spacing.sm,
  },
  sectionCard: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionSectionTitle: {
    color: colors.warning,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  taskList: { gap: spacing.sm },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  taskRowDone: { opacity: 0.55 },
  checkbox: { padding: 4 },
  taskBody: { flex: 1 },
  taskTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  taskSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  taskCta: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  taskCtaText: { color: colors.warning, fontFamily: typography.family.bodyBold, fontSize: 10 },
  docList: { gap: spacing.xs },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBody: { flex: 1 },
  docTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  docMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  link: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm, marginTop: 6 },
  invoiceList: { gap: spacing.sm },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  invoiceOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  invoiceOk: { borderColor: colors.borderSubtle, backgroundColor: colors.surface2 },
  invoiceLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  invoiceIcon: {
    padding: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  invoiceService: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  invoiceMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 6 },
  invoiceAmount: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.sm },
  payNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  payNowText: { color: '#0f172a', fontFamily: typography.family.bodyBold, fontSize: 10 },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  txTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, textTransform: 'uppercase' },
  txHint: { color: colors.textMuted, fontSize: typography.size.xs },
  txCards: { gap: spacing.sm, marginTop: spacing.xs },
  txCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    padding: spacing.sm,
    gap: 6,
  },
  txCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txCardDate: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  txCardService: { color: colors.textStrong, fontSize: typography.size.sm },
  txCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txCardMethod: { color: colors.textMuted, fontSize: typography.size.xs },
  txCardAmount: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  payOutstandingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface2,
  },
  payOutstandingText: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  engagementList: { gap: spacing.xs, marginTop: spacing.xs },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
  },
  engagementLabel: { color: colors.textStrong, fontSize: typography.size.sm },
  manageBtn: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  pmList: { gap: spacing.sm, marginTop: spacing.xs },
  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
  },
  pmBody: { flex: 1 },
  pmLabel: { color: colors.textStrong, fontSize: typography.size.sm },
  pmExpiry: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  removeBtn: { borderWidth: 1, borderColor: colors.borderDefault, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnText: { color: colors.textMuted, fontSize: 10 },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  addCardText: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
});
