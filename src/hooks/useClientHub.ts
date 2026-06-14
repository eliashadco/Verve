import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

export interface HubTask {
  id: string;
  title: string;
  subtitle: string;
  done: boolean;
  action: 'sign' | 'edit';
}

export interface HubMedicalDoc {
  id: string;
  title: string;
  meta: string;
  kind: 'pdf' | 'image' | 'pending';
}

export interface HubAdminDoc {
  id: string;
  title: string;
  meta: string;
  kind: 'pdf' | 'doc';
}

export interface HubInvoice {
  id: string;
  date: string;
  service: string;
  amount: string;
  status: 'paid' | 'unpaid';
  overdue: boolean;
}

export interface HubTransaction {
  date: string;
  service: string;
  method: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Refunded';
}

export interface HubEngagementRow {
  id: string;
  label: 'physio' | 'trainer';
}

export interface HubPaymentMethod {
  id: string;
  label: string;
  expiry: string;
  isDefault: boolean;
}

/** Static fixtures aligned with `User trial.html` `#view-inbox` + `renderBilling()`. */
const HUB_TASKS_SEED: HubTask[] = [
  { id: 'task1', title: 'Sign Consent Form', subtitle: 'Required for treatment', done: false, action: 'sign' },
  { id: 'task2', title: 'Update Insurance', subtitle: 'Policy expiring soon', done: false, action: 'edit' },
];

const MEDICAL_DOCS_SEED: HubMedicalDoc[] = [
  { id: 'mri-knee', title: 'MRI Report - Knee', meta: 'Oct 12, 2026 · 2.4 MB', kind: 'pdf' },
  { id: 'xray-shoulder', title: 'X-Ray L-Shoulder', meta: 'Sep 05, 2026 · 4.1 MB', kind: 'image' },
  { id: 'blood-panel', title: 'Blood Test Panel', meta: 'Aug 19, 2026 · 1.1 MB', kind: 'pdf' },
];

const ADMIN_DOCS_SEED: HubAdminDoc[] = [
  { id: 'referral', title: 'Referral Letter', meta: 'Sep 28, 2026 · 220 KB', kind: 'doc' },
  { id: 'inv-4021', title: 'Invoice #INV-4021', meta: 'Sep 21, 2026 · 96 KB', kind: 'pdf' },
];

const INVOICES_SEED: HubInvoice[] = [
  { id: 'INV-003', date: 'Oct 24, 2026', service: 'Follow-up Session', amount: '90.00', status: 'unpaid', overdue: true },
  { id: 'INV-002', date: 'Oct 10, 2026', service: '10-Session Pack', amount: '800.00', status: 'paid', overdue: false },
  { id: 'INV-001', date: 'Oct 01, 2026', service: 'Initial Assessment', amount: '120.00', status: 'paid', overdue: false },
];

const TRANSACTIONS_SEED: HubTransaction[] = [
  { date: 'Oct 10, 2026', service: '10-Session Pack', method: 'Visa •••• 4242', amount: '800.00', status: 'Paid' },
  { date: 'Oct 01, 2026', service: 'Initial Assessment', method: 'Visa •••• 4242', amount: '120.00', status: 'Paid' },
  { date: 'Sep 21, 2026', service: 'Follow-up Session', method: 'Mastercard •••• 9231', amount: '90.00', status: 'Refunded' },
];

const ENGAGEMENTS_SEED: HubEngagementRow[] = [
  { id: 'physio', label: 'physio' },
  { id: 'trainer', label: 'trainer' },
];

const PAYMENT_METHODS_SEED: HubPaymentMethod[] = [
  { id: 'visa', label: 'Visa •••• 4242', expiry: '12/28', isDefault: true },
  { id: 'mc', label: 'Mastercard •••• 9231', expiry: '06/27', isDefault: false },
];

export interface HubToastMessages {
  taskComplete: string;
  uploadSuccess: string;
  photosPermissionTitle: string;
  photosPermissionBody: string;
  pendingDocMeta: string;
}

export function useClientHub(messages: HubToastMessages) {
  const [tasks, setTasks] = useState<HubTask[]>(() => HUB_TASKS_SEED.map((t) => ({ ...t })));
  const [medicalDocs, setMedicalDocs] = useState<HubMedicalDoc[]>(() => MEDICAL_DOCS_SEED.map((d) => ({ ...d })));

  const pendingTaskCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  const toggleTaskDone = useCallback((id: string) => {
    setTasks((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const nextDone = !item.done;
        if (nextDone) Alert.alert('', messages.taskComplete);
        return { ...item, done: nextDone };
      }),
    );
  }, [messages.taskComplete]);

  const uploadDocument = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(messages.photosPermissionTitle, messages.photosPermissionBody);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const name = result.assets[0].fileName ?? result.assets[0].uri.split('/').pop() ?? 'upload';
    const pending: HubMedicalDoc = {
      id: `upload-${Date.now()}`,
      title: name,
      meta: messages.pendingDocMeta,
      kind: 'pending',
    };
    setMedicalDocs((prev) => [pending, ...prev]);
    Alert.alert('', messages.uploadSuccess);
  }, [messages]);

  const payInvoice = useCallback((message: string) => {
    Alert.alert('', message);
  }, []);

  return {
    data: {
      tasks,
      medicalDocs,
      adminDocs: ADMIN_DOCS_SEED,
      invoices: INVOICES_SEED,
      transactions: TRANSACTIONS_SEED,
      engagements: ENGAGEMENTS_SEED,
      paymentMethods: PAYMENT_METHODS_SEED,
    },
    pendingTaskCount,
    loading: false,
    error: null as string | null,
    refresh: async () => {},
    toggleTaskDone,
    uploadDocument,
    payInvoice,
  };
}
