import {
  initialAppointments,
  initialChambers,
  initialDoctorProfile,
  initialFeeConfig,
  initialPatients,
  initialSystemAccessConfig,
  initialUserAccessList,
  initialBroadcastMessage,
  initialMessageLogs,
} from '../data/mockData';
import {
  Appointment,
  Chamber,
  DoctorProfile,
  FeeConfig,
  Patient,
  SystemAccessConfig,
  UserAccessItem,
  SystemBroadcastMessage,
  SentMessageLog,
  AuthSession,
} from '../types';

const STORAGE_KEYS = {
  CHAMBERS: 'docchamber_chambers_v1',
  DOCTOR_PROFILE: 'docchamber_doctor_v1',
  FEE_CONFIG: 'docchamber_fee_config_v1',
  PATIENTS: 'docchamber_patients_v1',
  APPOINTMENTS: 'docchamber_appointments_v4',
  LANGUAGE: 'docchamber_lang_v1',
  SYSTEM_ACCESS: 'docchamber_sys_access_v1',
  USER_ACCESS: 'docchamber_usr_access_v2',
  BROADCAST: 'docchamber_broadcast_v1',
  MESSAGE_LOGS: 'docchamber_msg_logs_v1',
  AUTH_SESSION: 'docchamber_auth_session_v1',
};

export function loadChambers(): Chamber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAMBERS);
    return raw ? JSON.parse(raw) : initialChambers;
  } catch {
    return initialChambers;
  }
}

export function saveChambers(chambers: Chamber[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAMBERS, JSON.stringify(chambers));
  } catch (e) {
    console.error('Failed to save chambers', e);
  }
}

export function loadDoctorProfile(): DoctorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILE);
    return raw ? JSON.parse(raw) : initialDoctorProfile;
  } catch {
    return initialDoctorProfile;
  }
}

export function saveDoctorProfile(profile: DoctorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCTOR_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save doctor profile', e);
  }
}

export function loadFeeConfig(): FeeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEE_CONFIG);
    return raw ? JSON.parse(raw) : initialFeeConfig;
  } catch {
    return initialFeeConfig;
  }
}

export function saveFeeConfig(config: FeeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save fee config', e);
  }
}

export function loadPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return raw ? JSON.parse(raw) : initialPatients;
  } catch {
    return initialPatients;
  }
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } catch (e) {
    console.error('Failed to save patients', e);
  }
}

export function loadAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return raw ? JSON.parse(raw) : initialAppointments;
  } catch {
    return initialAppointments;
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error('Failed to save appointments', e);
  }
}

export function loadLanguage(): 'en' | 'bn' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return raw === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguage(lang: 'en' | 'bn'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (e) {
    console.error('Failed to save language', e);
  }
}

export function loadSystemAccessConfig(): SystemAccessConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_ACCESS);
    return raw ? JSON.parse(raw) : initialSystemAccessConfig;
  } catch {
    return initialSystemAccessConfig;
  }
}

export function saveSystemAccessConfig(config: SystemAccessConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_ACCESS, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save system access config', e);
  }
}

export function loadUserAccessList(): UserAccessItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ACCESS);
    if (!raw) return initialUserAccessList;
    const parsed: UserAccessItem[] = JSON.parse(raw);
    const hasShafiq = parsed.some((u) => u.username?.toLowerCase() === 'shafiq');
    if (!hasShafiq) {
      return initialUserAccessList;
    }
    return parsed.map((u) => ({
      ...u,
      username: u.username || (u.role === 'SUPER_ADMIN' ? 'Shafiq' : u.role === 'DOCTOR' ? 'doctor' : `staff_${u.id}`),
      password: u.password || (u.role === 'SUPER_ADMIN' ? '0707' : u.role === 'DOCTOR' ? 'doctor123' : 'staff123'),
    }));
  } catch {
    return initialUserAccessList;
  }
}

export function saveUserAccessList(users: UserAccessItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ACCESS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save user access list', e);
  }
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    }
  } catch (e) {
    console.error('Failed to save auth session', e);
  }
}

export function loadBroadcastMessage(): SystemBroadcastMessage {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BROADCAST);
    return raw ? JSON.parse(raw) : initialBroadcastMessage;
  } catch {
    return initialBroadcastMessage;
  }
}

export function saveBroadcastMessage(broadcast: SystemBroadcastMessage): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BROADCAST, JSON.stringify(broadcast));
  } catch (e) {
    console.error('Failed to save broadcast message', e);
  }
}

export function loadMessageLogs(): SentMessageLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGE_LOGS);
    return raw ? JSON.parse(raw) : initialMessageLogs;
  } catch {
    return initialMessageLogs;
  }
}

export function saveMessageLogs(logs: SentMessageLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGE_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save message logs', e);
  }
}

export function resetAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
