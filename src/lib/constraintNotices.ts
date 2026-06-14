import { DeviceEventEmitter } from 'react-native';

import { translateSync } from '@/lib/i18n/runtime';

const NOTICE = 'verve:constraint-notice';

export interface ConstraintNoticePayload {
  message: string;
}

export function emitConstraintNotice(message: string) {
  const payload: ConstraintNoticePayload = { message };
  DeviceEventEmitter.emit(NOTICE, payload);
}

export function subscribeConstraintNotice(
  handler: (payload: ConstraintNoticePayload) => void,
) {
  const sub = DeviceEventEmitter.addListener(
    NOTICE,
    (payload: ConstraintNoticePayload) => {
      handler(payload);
    },
  );
  return () => sub.remove();
}

export function showClientConstraintToast() {
  emitConstraintNotice(translateSync('constraints.noticeClient'));
}

export function showTrainerConstraintToast(clientLabel: string) {
  emitConstraintNotice(translateSync('constraints.noticeTrainer', { name: clientLabel }));
}
