export type UserRole =
  | 'master_admin'
  | 'super_admin'
  | 'admin'
  | 'teacher'
  | 'accountant'
  | 'student'
  | 'guardian'
  | 'librarian'
  | 'receptionist'
  | 'gatekeeper';

export interface SystemAccessControl {
  isSystemLocked: boolean;
  disabledRoles: UserRole[];
  disabledMessage: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nameBn: string;
  role: UserRole;
  phone?: string;
  schoolId?: string;
  linkedStudentId?: string;
  linkedStaffId?: string;
  avatar?: string;
  username?: string;
  isDisabled?: boolean;
  permissions?: StaffRBACPermissions;
}

export interface SchoolProfile {
  id: string;
  nameEn: string;
  nameBn: string;
  eiin: string;
  schoolCode: string;
  addressEn: string;
  addressBn: string;
  phone: string;
  email: string;
  website: string;
  principalNameEn: string;
  principalNameBn: string;
  establishedYear: string;
  currentSession: string;
  logoUrl?: string;
  heroImageUrl?: string;
  aboutImageUrl?: string;
  heroTaglineBn?: string;
  heroTaglineEn?: string;
  heroWelcomeTitleBn?: string;
  heroWelcomeTitleEn?: string;
  heroSubtitleBn?: string;
  heroSubtitleEn?: string;
  mottoBn?: string;
  mottoEn?: string;
  statsStudents?: string;
  statsTeachers?: string;
  statsClassrooms?: string;
  statsExperience?: string;
  currencySymbol: string;
  timezone: string;
  isSaturdayOff?: boolean; // true = Saturday Weekly Holiday (School), false = Saturday Open (Madrasha / Open School)
}

export type ClassLevel =
  | 'Play'
  | 'Nurany'
  | 'Nursery'
  | 'KG'
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | (string & {});

export type ShiftType = 'Morning' | 'Day';

export type GroupType = 'General' | 'Science' | 'Commerce' | 'Arts' | 'Humanities' | 'Vocational';

export interface ClassInfo {
  id: string;
  name: ClassLevel;
  nameBn: string;
  order: number;
  sections: string[];
  shifts: ShiftType[];
  hasGroups: boolean;
  isActive: boolean;
}

export interface Subject {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  className: ClassLevel;
  group?: GroupType;
  fullMarks: number;
  passMarks: number;
  writtenMarks: number;
  mcqMarks?: number;
  practicalMarks?: number;
  oralMarks?: number;
  teacherId?: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. "S-2026-001"
  admissionNo?: string;
  nameEn: string;
  nameBn: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string; // YYYY-MM-DD
  bloodGroup: string;
  religion: string;
  className: ClassLevel;
  section: string;
  shift: ShiftType;
  group?: GroupType;
  roll: string;
  session: string;
  fatherNameEn: string;
  fatherNameBn: string;
  fatherPhone?: string;
  fatherNid?: string;
  motherNameEn: string;
  motherNameBn: string;
  motherPhone?: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  presentAddress: string;
  permanentAddress: string;
  previousSchool?: string;
  photoUrl?: string;
  medicalNotes?: string;
  status: 'active' | 'transferred' | 'graduated' | 'inactive';
  admissionDate: string;
  password?: string; // Student login password, defaults to '1234'
  // Digital Document Vault & Hard Copies
  birthCertificateNo?: string;
  birthCertificateUrl?: string;
  fatherNidUrl?: string;
  motherNid?: string;
  motherNidUrl?: string;
  guardianNid?: string;
  guardianNidUrl?: string;
  transferCertificateUrl?: string;
  documents?: StudentDocument[];
}

export interface StudentDocument {
  id: string;
  title: string; // e.g. "জন্ম নিবন্ধন সনদ", "পিতার এনআইডি", "ছাড়পত্র (TC)"
  type: 'birth_certificate' | 'father_nid' | 'mother_nid' | 'guardian_nid' | 'transfer_certificate' | 'medical' | 'other';
  category?: 'birth_certificate' | 'father_nid' | 'mother_nid' | 'guardian_nid' | 'transfer_certificate' | 'medical' | 'other';
  documentNumber?: string;
  fileUrl: string; // Base64 data URL or external image/pdf URL
  fileName?: string;
  fileSize?: string;
  uploadedAt: string;
  uploadDate?: string;
  verified?: boolean;
}

export interface StaffRBACPermissions {
  manageStudents: boolean;
  manageAttendance: boolean;
  manageExams: boolean;
  manageFees: boolean;
  manageRoutine: boolean;
  manageHomework: boolean;
  manageLibrary: boolean;
  onlyQrAttendanceKiosk?: boolean;
}

export interface Staff {
  id: string;
  employeeId: string; // e.g. "T-101"
  nameEn: string;
  nameBn: string;
  gender: 'Male' | 'Female';
  designation: string;
  department: string;
  role: UserRole;
  email: string;
  phone: string;
  nid?: string;
  qualification: string;
  joiningDate: string;
  basicSalary: number;
  houseRentAllowance: number;
  medicalAllowance: number;
  otherAllowance: number;
  providentFundDeduction: number;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  status: 'active' | 'on_leave' | 'resigned';
  photoUrl?: string;
  username?: string;
  password?: string;
  permissions?: StaffRBACPermissions;
  bloodGroup?: string;
  emergencyContact?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  targetType: 'student' | 'staff';
  targetId: string;
  targetName: string;
  rollOrEmpId: string;
  className?: string;
  section?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  recordedBy?: string;
  scanTime?: string;
  inTime?: string; // Check-In time (e.g. "08:15:30 AM")
  outTime?: string; // Check-Out time (e.g. "02:30:15 PM")
  inTimestamp?: number; // Check-In epoch milliseconds
  outTimestamp?: number; // Check-Out epoch milliseconds
  stayDuration?: string; // e.g. "৪ ঘণ্টা ৩০ মিনিট"
  stayMinutes?: number;
  checkInRecordedBy?: string;
  checkOutRecordedBy?: string;
  method?: 'manual' | 'qr_scanner' | 'face_scan';
  deviceInfo?: string;
}

export type ExamTerm = '1st_term' | 'half_yearly' | 'annual' | 'model_test' | 'class_test';

export interface Exam {
  id: string;
  nameEn: string;
  nameBn: string;
  term: ExamTerm;
  session: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  applicableClasses: ClassLevel[];
}

export interface ClassFeeConfig {
  className: ClassLevel;
  classNameBn: string;
  tuitionFee: number; // e.g. Nursery: 400, Class 5: 700, Class 10: 1200
  sessionFee: number; // সেশন ফি / চার্জ
  admissionFee?: number; // নতুন ভর্তি ফি (Admission Fee)
  customFees?: Record<string, number>; // যেকোনো কাস্টম ফি আইটেম { [feeKey: string]: number }
  examFee1stModelTest?: number; // 1st Model Test Exam Fee (১ম মডেল টেস্ট)
  examFee1stSemester?: number; // 1st Semester Exam Fee (১ম সেমিস্টার পরীক্ষা)
  examFee2ndModelTest?: number; // 2nd Model Test Exam Fee (২য় মডেল টেস্ট)
  examFee2ndSemester?: number; // 2nd Semester Exam Fee (২য় সেমিস্টার পরীক্ষা)
  examFee3rdModelTest?: number; // 3rd Model Test Exam Fee (৩য় মডেল টেস্ট)
  examFee3rdSemester?: number; // 3rd Semester Exam Fee (৩য় সেমিস্টার পরীক্ষা)
  // Legacy / alternative names for backward compatibility
  examFee1stTest?: number;
  examFeeModelTest?: number;
  examFeeHalfYearly?: number;
  examFeeAnnual?: number;
}

export interface ScheduledFee {
  id: string;
  titleEn: string;
  titleBn: string;
  category: 'Tuition Fee' | 'Exam Fee' | 'Session Fee' | 'Transport Fee' | 'Study Tour' | 'Sports Fee' | 'Other';
  amount: number;
  classAmounts?: Record<string, number>;
  applicableClasses: ClassLevel[] | 'all';
  dueDate: string; // Last date of fee submission (শেষ তারিখ)
  session: string;
  month?: string;
  description?: string;
  isCompulsory: boolean;
  status: 'active' | 'closed';
}

export interface StudentTransport {
  id: string;
  studentId: string;
  studentName: string;
  studentNameBn: string;
  className: ClassLevel;
  section: string;
  roll: string;
  guardianPhone: string;
  routeId: string;
  routeName: string;
  pickupPoint: string;
  monthlyFare: number;
  assignedDate: string;
  status: 'active' | 'inactive';
}

export interface ExamScheduleItem {
  id: string;
  examId: string;
  className: ClassLevel;
  group?: GroupType; // Group specific schedule (Science, Commerce, Humanities, Vocational)
  subjectCode: string;
  subjectNameEn: string;
  subjectNameBn: string;
  examDate: string; // YYYY-MM-DD
  dayOfWeek?: string; // Sunday, Monday, etc.
  startTime: string; // e.g. "10:00 AM"
  endTime: string;   // e.g. "01:00 PM"
  roomNo?: string;   // e.g. "Room 204"
}

export interface MarksEntry {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  roll?: string;
  className?: string;
  section?: string;
  subjectId: string;
  subjectName: string;
  written: number;
  writtenCQ?: number;
  mcq: number;
  practical: number;
  total: number;
  totalMarks?: number;
  grade: string; // 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F'
  gpa: number;   // 5.0, 4.0, 3.5, etc.
  gradePoint?: number;
  isPassed?: boolean;
  remarks?: string;
}

export interface FeeHead {
  id: string;
  nameEn: string;
  nameBn: string;
  code: string;
  frequency: 'Monthly' | 'Annual' | 'One-Time' | 'Per-Exam';
  defaultAmount: number;
}

export interface FeeItem {
  id: string;
  headName: string;
  month?: string;
  dueDate?: string;
  isOverdue?: boolean;
  amount: number;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentNameEn: string;
  studentNameBn: string;
  studentName?: string;
  className: ClassLevel;
  section: string;
  roll: string;
  session: string;
  year?: string;
  feeType: string;
  month?: string;
  items?: FeeItem[];
  amount: number;
  totalAmount?: number;
  discount: number;
  netAmount: number;
  paidAmount: number;
  dueAmount: number;
  issueDate?: string;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
  paymentDate?: string;
  paymentMethod?: string;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  className: string;
  roll: string;
  amount: number;
  items?: FeeItem[];
  paidDate: string;
  paymentDate?: string;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  transactionId?: string;
  collectedBy: string;
  notes?: string;
  remarks?: string;
}

export interface Expense {
  id: string;
  voucherNo: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'bKash';
  referenceNo?: string;
  approvedBy: string;
  notes?: string;
}

export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

export interface RoutinePeriod {
  id: string;
  day: DayOfWeek;
  periodNumber: number;
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "09:45 AM"
  className: ClassLevel;
  section: string;
  shift: ShiftType;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomNo: string;
}

export interface Homework {
  id: string;
  className: ClassLevel;
  section: string;
  subjectName: string;
  subject?: string;
  teacherName: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  attachmentName?: string;
  totalMarks?: number;
  instructions?: string;
  // Extended AI Smart Evaluation properties
  fullMarks?: number; // 5, 10, 20, 50, 100 or custom
  referenceAnswer?: string;
  referenceAnswerAttachment?: string;
  optionalInstructions?: string;
  homeworkDate?: string;
  questionAttachment?: string; // Photo of Question Paper, Textbook page, or problem sheet
  questionImages?: string[]; // Multiple photos of questions/problems
}

export interface AIEvaluationResult {
  status: 'evaluated' | 'review_required' | 'failed';
  suggestedMarks: number;
  fullMarks: number;
  confidence: number;
  correctAnswers: number;
  partialAnswers: number;
  incorrectAnswers: number;
  missingAnswers?: number;
  mathematicalAccuracy?: string;
  spellingQuality?: string;
  feedback: string;
  requiresTeacherReview: boolean;
  reviewReason?: string;
  alternativeAnswerAccepted?: boolean;
  evaluatedAt: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  className: ClassLevel;
  section: string;
  submissionDate: string;
  submissionType: 'handwritten_image' | 'text' | 'pdf' | 'mixed';
  imageUrls: string[];
  textAnswer?: string;
  attachmentName?: string;
  status: 'submitted' | 'ai_evaluated' | 'approved' | 'rejected' | 'resubmission_requested' | 'review_required' | 'pending';
  version: number;
  aiEvaluation?: AIEvaluationResult;
  teacherMarks?: number;
  teacherFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ClassAttendanceSchedule {
  className: string;
  shift?: 'Morning' | 'Day' | 'All';
  startTime: string; // e.g. "08:00"
  lateThresholdTime: string; // e.g. "08:15"
  dismissalTime?: string; // e.g. "10:00", "11:30", "13:00", "16:00"
  closingTime?: string; // e.g. "10:00"
  enabled: boolean;
}

export interface AttendanceRuleConfig {
  schoolStartTime: string; // e.g. "08:30"
  lateThresholdTime: string; // e.g. "09:00"
  attendanceClosingTime: string; // e.g. "10:30"
  workingDays: DayOfWeek[]; // e.g. ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  holidayDays: ('Friday' | 'Saturday')[]; // e.g. ['Friday']
  allowManualCorrection: boolean;
  session: string;
  isSaturdayOff?: boolean;
  // Shift-wise timing rules
  staffStartTime?: string; // e.g. "08:15"
  staffLateThresholdTime?: string; // e.g. "08:30"
  morningShiftStartTime?: string; // e.g. "07:30"
  morningShiftLateThresholdTime?: string; // e.g. "08:00"
  dayShiftStartTime?: string; // e.g. "11:30"
  dayShiftLateThresholdTime?: string; // e.g. "12:00"
  // Dismissal and smart cooldown timing rules
  schoolDismissalTime?: string; // e.g. "13:30" (১:৩০ PM)
  morningShiftDismissalTime?: string; // e.g. "11:30"
  dayShiftDismissalTime?: string; // e.g. "16:00"
  duplicateCooldownMinutes?: number; // e.g. 3 minutes buffer to prevent duplicate rescans
  minStayMinutesForCheckout?: number; // e.g. 15 minutes minimum stay before departure
  // Per-Class Custom Schedule Mapping
  classSchedules?: Record<string, ClassAttendanceSchedule>;
}

export interface AttendanceAuditLog {
  id: string;
  studentId: string;
  studentName: string;
  roll: string;
  className: string;
  action: 'qr_scanned' | 'check_in' | 'check_out' | 'manual_update' | 'late_marked' | 'rescan_blocked';
  scanType?: 'in' | 'out';
  timestamp: string;
  operatorName: string;
  details: string;
  photoUrl?: string;
}

export interface SubjectPerformanceItem {
  subjectName: string;
  marks: number;
  fullMarks: number;
  percentage: number;
  grade: string;
  status: 'strong' | 'average' | 'weak';
}

export interface StudentPerformanceAnalytics {
  studentId: string;
  studentName: string;
  studentNameBn: string;
  className: ClassLevel;
  section: string;
  roll: string;
  photoUrl?: string;
  attendancePercentage: number;
  totalSchoolDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  homeworkSubmissionRate: number;
  totalHomeworkCount: number;
  submittedHomeworkCount: number;
  missingHomeworkCount: number;
  homeworkAverageMarks: number;
  examAverageMarks: number;
  overallScore: number;
  subjectPerformance: SubjectPerformanceItem[];
  weakSubjects: string[];
  strongSubjects: string[];
  attendanceWarning: boolean;
  improvementPercentage: number;
  aiSummary: string;
  aiRecommendations: string[];
  generatedAt: string;
}

export interface AdmissionEnquiry {
  id: string;
  applicationNo?: string;
  photoUrl?: string;
  applicantNameEn: string;
  applicantNameBn: string;
  applyingClass: ClassLevel;
  gender: 'Male' | 'Female';
  dob: string;
  bloodGroup?: string;
  guardianName: string;
  phone: string;
  email?: string;
  address: string;
  previousSchool?: string;
  gpa?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Enrolled';
  appliedDate: string;
  remarks?: string;
}

export interface WebsiteMessage {
  id: string;
  senderName: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  sentAt: string;
  isRead: boolean;
  repliedNotes?: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  rack: string;
  quantity: number;
  available: number;
  price: number;
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerType: 'student' | 'staff';
  borrowerId: string;
  borrowerName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: 'Issued' | 'Returned' | 'Overdue';
}

export interface TransportRoute {
  id: string;
  routeName: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  monthlyFare: number;
  stops: string[];
  assignedStudentsCount: number;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: 'Furniture' | 'Science Lab' | 'IT & Computer' | 'Sports' | 'Stationery' | 'Electrical';
  quantity: number;
  unit: string;
  location: string;
  condition: 'Good' | 'Needs Repair' | 'Damaged';
  purchaseDate: string;
  cost: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'General' | 'Academic' | 'Exam' | 'Holiday' | 'Emergency';
  targetAudience: 'All' | 'Teachers' | 'Guardians' | 'Class';
  targetClass?: ClassLevel;
  author: string;
  isImportant?: boolean;
}

export interface NotificationLog {
  id: string;
  type: 'SMS' | 'InApp';
  recipientPhone?: string;
  recipientName: string;
  title: string;
  message: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  sentAt: string;
}

export interface CertificateTemplateData {
  student: Student;
  school: SchoolProfile;
  type: 'id_card' | 'admit_card' | 'testimonial' | 'transfer' | 'character' | 'bonafide';
  serialNo: string;
  issueDate: string;
  examName?: string;
  gpaResult?: string;
  remarks?: string;
}

export interface SchoolHoliday {
  id: string;
  titleEn: string;
  titleBn: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  category: 'national' | 'religious' | 'vacation' | 'emergency' | 'local';
  description?: string;
  createdAt: string;
}

export interface SuperAdminCredentials {
  username: string;
  password: string;
  email: string;
  name: string;
  nameBn?: string;
  phone?: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  titleEn: string;
  titleBn: string;
  slug?: string;
  category: 'Academic' | 'Co-Curricular' | 'Science & Tech' | 'Events' | 'Sports' | 'Moral & Values';
  categoryBn: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  authorRole: string;
  published: boolean;
  publishedAt: string;
  views?: number;
  featured?: boolean;
}

export interface MfsPaymentSettings {
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  bkashQrUrl?: string;
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant' | 'Agent';
  nagadQrUrl?: string;
  instructionsBn?: string;
  instructionsEn?: string;
}

export interface OnlinePaymentRequest {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  className: string;
  section: string;
  feeTitle: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad';
  senderPhone: string;
  transactionId: string;
  requestDate: string; // YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  notes?: string;
}


