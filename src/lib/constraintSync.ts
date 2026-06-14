import { DeviceEventEmitter } from 'react-native';

export const CONSTRAINT_PATIENT_REFRESH = 'verve:constraint-patient-refresh';

export function emitConstraintPatientRefresh(patientId: string) {
  DeviceEventEmitter.emit(CONSTRAINT_PATIENT_REFRESH, patientId);
}

export function subscribeConstraintPatientRefresh(handler: (patientId: string) => void) {
  return DeviceEventEmitter.addListener(CONSTRAINT_PATIENT_REFRESH, handler);
}