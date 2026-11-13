export type VisitType = 'FIRST_VISIT' | 'FOLLOW_UP_2M' | 'REPORT_CHECK';

export type AppointmentStatus = 'CONFIRMED' | 'IN_CHAMBER' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface Chamber {
  id: string;
  hospitalName: string;
  branchOrArea: string;
  address: string;
  roomNumber: string;
  phone: string;
  visitingDays: string[]; // e.g., ['Saturday', 'Monday', 'Wednesday']
  visitingHours: string; // e.g., '05:00 PM - 09:00 PM'
  maxPatientsPerDay: number;
  isActive: boolean;
  chamberSpecificFeeOverride?: {
    firstVisitFee?: number;
    followUpFee?: number;
  };
}

export interface DoctorProfile {
  name: string;
  title: string;
  qualifications: string;
  speciality: string;
  bmdcRegNo: string;
  experienceYears: number;
  about: string;
  avatarUrl: string;
  phone: string;
  email: string;
}

export interface FeeConfig {
  firstVisitFee: number; // e.g., 1000
  followUpFee: number;   // e.g., 500
  followUpWindowDays: number; // default 60 days (approx 2 months)
  reportCheckFee: number; // e.g., 300
  currencySymbol: string; // '৳', '$', '₹'
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  address?: string;
  totalVisits: number;
  lastVisitDate?: string; // YYYY-MM-DD
  lastChamberId?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage: string; // e.g. '1 + 0 + 1', '1 + 0 + 0', '0 + 0 + 1'
  timing: string; // e.g. 'খাবার পরে (After meal)', 'খাবার আগে (Before meal)'
  duration: string; // e.g. '14 দিন', '1 মাস', 'চলবে (Continue)'
  instructions?: string;
}

export interface ClinicalVitals {
  bloodPressure?: string; // e.g. '120/80 mmHg'
  pulseRate?: string;     // e.g. '76 bpm'
  weightKg?: string;      // e.g. '68 kg'
  temperature?: string;   // e.g. '98.4 °F'
  spo2?: string;          // e.g. '98%'
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  chamberId: string;
  date: string; // YYYY-MM-DD
  vitals: ClinicalVitals;
  chiefComplaints: string;
  diagnosis: string;
  investigations: string[];
  medicines: PrescriptionMedicine[];
  advice: string;
  nextFollowUpNote?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  serialNumber: number; // Token # 1, 2, 3... for that date & chamber
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  chamberId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., '05:30 PM - 05:45 PM'
  visitType: VisitType;
  isAutoCalculated: boolean;
  daysSinceLastVisit?: number;
  feeAmount: number;
  discountAmount: number;
  payableAmount: number;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  chiefComplaint: string;
  doctorNotes?: string;
  prescriptionSummary?: string;
  prescription?: Prescription; // Full Digital Rx attached directly
  createdAt: string;
}

export interface FeeCalculationResult {
  visitType: VisitType;
  fee: number;
  daysSinceLastVisit: number | null;
  lastVisitDate: string | null;
  isFollowUpEligible: boolean;
  remainingFollowUpDays: number | null;
  explanation: string;
  explanationBn: string;
}

export interface SystemAccessConfig {
  isMasterSystemEnabled: boolean; // Master system switch (on/off)
  maintenanceMessage: string;
  isPatientBookingEnabled: boolean;
  bookingDisabledNotice: string;
  isDoctorAdminEnabled: boolean;
  isRxDownloadEnabled: boolean;
  isStaffAccessEnabled: boolean;
}

export type UserRole = 'SUPER_ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'RECEPTIONIST' | 'PATIENT_PUBLIC';

export interface UserAccessItem {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  phone: string;
  email?: string;
  chamberName?: string;
  chamberId?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  notes?: string;
}

export interface AuthSession {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
}

export type BroadcastType = 'EMERGENCY' | 'IMPORTANT' | 'INFO';
export type BroadcastAudience = 'ALL' | 'PATIENTS' | 'DOCTORS';

export interface SystemBroadcastMessage {
  id: string;
  isActive: boolean;
  type: BroadcastType;
  title: string;
  body: string;
  targetAudience: BroadcastAudience;
  createdAt: string;
}

export interface SentMessageLog {
  id: string;
  recipientLabel: string;
  recipientPhone?: string;
  channel: 'BROADCAST' | 'WHATSAPP' | 'SMS';
  title?: string;
  message: string;
  sentAt: string;
  status: 'DELIVERED' | 'POSTED';
}
