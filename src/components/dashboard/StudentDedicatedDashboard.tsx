import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import {
  Student,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  FeeInvoice,
  FeeItem,
  FeePayment,
  RoutinePeriod,
  Exam,
  MarksEntry,
  Notice,
  OnlinePaymentRequest,
  MfsPaymentSettings,
} from '../../types';
import { calculateTotalGPA } from '../../utils/grading';
import {
  CalendarCheck2,
  BookOpen,
  CalendarDays,
  Award,
  Wallet,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  XCircle,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  Check,
  X,
  Camera,
  CreditCard,
  Smartphone,
  Download,
  AlertCircle,
  Search,
  Lock,
  Calendar,
  BarChart3,
  GraduationCap,
  Building,
  Phone,
} from 'lucide-react';
import { SaturdayOffToggle } from '../common/SaturdayOffToggle';
import { AIService } from '../../services/aiService';
import QRCode from 'qrcode';
import { formatGroupName } from '../../utils/i18n';

interface StudentDedicatedDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const StudentDedicatedDashboard: React.FC<StudentDedicatedDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const { language, toBnNumber, formatTaka, formatDate } = useLanguage();

  // Active module tab within Student Dashboard (including ID Card)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'attendance' | 'homework' | 'routine' | 'notices' | 'exams' | 'fees' | 'id_card'>('overview');
  const [myIdQrUrl, setMyIdQrUrl] = useState<string>('');
  const [idCardTemplate, setIdCardTemplate] = useState<'classic_academic' | 'executive_royal' | 'modern_emerald'>('classic_academic');
  const [idCardViewMode, setIdCardViewMode] = useState<'both' | 'front' | 'back'>('both');

  // Load all system data for student's class context
  const students = StorageService.getStudents();
  const allAttendance = StorageService.getAttendance();
  const allHomework = StorageService.getHomework();
  const allSubmissions = StorageService.getHomeworkSubmissions();
  const allInvoices = StorageService.getInvoices();
  const allPayments = StorageService.getPayments();
  const allRoutines = StorageService.getRoutines();
  const allExams = StorageService.getExams();
  const allMarks = StorageService.getMarks();
  const allNotices = StorageService.getNotices();
  const school = StorageService.getSchoolProfile();

  // STRICT DATA ISOLATION: Resolve currently authenticated student
  const student: Student = useMemo(() => {
    const currentUsername = (currentUser.username || '').trim().toLowerCase();
    const currentName = (currentUser.name || '').trim().toLowerCase();

    const linked = students.find((s) => s && s.id === currentUser.linkedStudentId);
    if (linked) return linked;

    const byStudentId = students.find(
      (s) => s && s.studentId && s.studentId.trim().toLowerCase() === currentUsername
    );
    if (byStudentId) return byStudentId;

    const byId = students.find((s) => s && s.id && s.id.toLowerCase() === currentUsername);
    if (byId) return byId;

    const byName = students.find(
      (s) => s && s.nameEn && currentName && s.nameEn.trim().toLowerCase() === currentName
    );
    if (byName) return byName;

    return (
      students[0] || {
        id: 'std_default',
        studentId: 'S-2026-1004',
        nameEn: currentUser.name || 'Student',
        nameBn: currentUser.nameBn || 'শিক্ষার্থী',
        gender: 'Male',
        dob: '2010-01-01',
        bloodGroup: 'B+',
        religion: 'Islam',
        className: 'Class 10',
        section: 'A',
        shift: 'Day',
        roll: '04',
        session: '2026',
        fatherNameEn: 'Guardian',
        fatherNameBn: 'অভিভাবক',
        guardianName: 'Guardian',
        guardianPhone: '+880 1700-000000',
        guardianRelation: 'Father',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'active',
        admissionDate: '2026-01-01',
      }
    );
  }, [currentUser, students]);

  // Generate High-Definition Pitch Black QR Code (#000000 on #ffffff) for Student ID Card
  useEffect(() => {
    if (student) {
      try {
        const qrData = StorageService.generateStudentQRData(student);
        QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 220,
          color: { dark: '#000000', light: '#ffffff' },
        }).then(setMyIdQrUrl).catch(console.error);
      } catch (e) {
        console.error('Failed generating student QR:', e);
      }
    }
  }, [student]);

  // Dynamic template styles for Student ID Card Front Side
  const getStudentCardStyles = () => {
    if (idCardTemplate === 'executive_royal') {
      return {
        cardBorder: 'border-2 border-amber-600 shadow-xl ring-2 ring-amber-200',
        headerBg: 'bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 text-white',
        ribbonBg: 'bg-amber-400 text-slate-950 font-black',
        photoBorder: 'border-2 border-amber-600 shadow-sm',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        accentText: 'text-amber-800',
        nameColor: 'text-amber-950',
      };
    } else if (idCardTemplate === 'modern_emerald') {
      return {
        cardBorder: 'border-2 border-teal-600 shadow-xl ring-2 ring-teal-200',
        headerBg: 'bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-800 text-white',
        ribbonBg: 'bg-teal-300 text-slate-950 font-black',
        photoBorder: 'border-2 border-teal-500 shadow-sm',
        badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
        accentText: 'text-teal-800',
        nameColor: 'text-teal-950',
      };
    } else {
      return {
        cardBorder: 'border-2 border-blue-400 shadow-md',
        headerBg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white',
        ribbonBg: 'bg-amber-400 text-slate-900 font-bold',
        photoBorder: 'border-2 border-blue-600',
        badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
        accentText: 'text-blue-700',
        nameColor: 'text-slate-900',
      };
    }
  };

  // 1. ATTENDANCE DATA ISOLATION
  const studentAttendance: AttendanceRecord[] = useMemo(() => {
    return allAttendance.filter(
      (a) =>
        a &&
        a.targetType === 'student' &&
        (a.targetId === student.id || a.targetId === student.studentId || (a.rollOrEmpId === student.roll && a.className === student.className))
    ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [allAttendance, student]);

  const totalAttendanceDays = studentAttendance.length;
  const presentCount = studentAttendance.filter((a) => a.status === 'Present').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'Absent').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'Late').length;
  const excusedCount = studentAttendance.filter((a) => a.status === 'Excused').length;
  const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentCount / totalAttendanceDays) * 100) : 100;

  // Real calendar date for current moment (YYYY-MM-DD in local time)
  // Ensures after midnight (12 AM) the date accurately turns to the new day
  const todayCalendarDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Strict Today's attendance: only matches today's real calendar date!
  // When midnight (12 AM) passes to the next day, this will be null until scanned or marked!
  const todayRecord = useMemo(() => {
    return studentAttendance.find((a) => a.date === todayCalendarDate) || null;
  }, [studentAttendance, todayCalendarDate]);

  // 2. HOMEWORK DATA ISOLATION
  const classHomework: Homework[] = useMemo(() => {
    return allHomework.filter(
      (h) => h && h.className === student.className && (!h.section || h.section === 'all' || h.section === student.section)
    ).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
  }, [allHomework, student]);

  const studentSubmissions: HomeworkSubmission[] = useMemo(() => {
    return allSubmissions.filter(
      (s) => s && (s.studentId === student.id || (s.studentRoll === student.roll && s.className === student.className))
    );
  }, [allSubmissions, student]);

  // Strict Homework Accounting for logged-in student (Tracks submitted, expired/missed, and active pending)
  const studentHwAccounting = useMemo(() => {
    const total = classHomework.length;
    const submitted = studentSubmissions.length;
    let expiredCount = 0;
    let activePendingCount = 0;

    classHomework.forEach((hw) => {
      const isSub = studentSubmissions.some((s) => s.homeworkId === hw.id);
      if (!isSub) {
        if (hw.dueDate && todayCalendarDate > hw.dueDate) {
          expiredCount++;
        } else {
          activePendingCount++;
        }
      }
    });

    return {
      total,
      submitted,
      expiredCount,
      activePendingCount,
      dueTotal: expiredCount + activePendingCount,
    };
  }, [classHomework, studentSubmissions, todayCalendarDate]);

  // Homework Portal Sub-tab: 'assignments' | 'report'
  const [studentHwViewTab, setStudentHwViewTab] = useState<'assignments' | 'report'>('report');
  const [hwReportDateRange, setHwReportDateRange] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('today');
  const [hwReportStartDate, setHwReportStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [hwReportEndDate, setHwReportEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hwReportSubject, setHwReportSubject] = useState<string>('all');
  const [hwReportSearch, setHwReportSearch] = useState<string>('');
  const [hwReportSection, setHwReportSection] = useState<string>('all');

  // Homework Subjects for this student's class
  const classHwSubjects = useMemo(() => {
    const set = new Set<string>();
    allHomework.filter((h) => h.className === student.className).forEach((h) => {
      if (h.subjectName) set.add(h.subjectName);
    });
    return Array.from(set);
  }, [allHomework, student]);

  // STRICT STUDENT DATA ISOLATION: Calculate homework report strictly for the logged-in student's personal records
  const personalHwReport = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let startDateStr = '';
    let endDateStr = todayStr;

    if (hwReportDateRange === 'today') {
      startDateStr = todayStr;
      endDateStr = todayStr;
    } else if (hwReportDateRange === 'this_week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      startDateStr = start.toISOString().split('T')[0];
    } else if (hwReportDateRange === 'this_month') {
      startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (hwReportDateRange === 'this_year') {
      startDateStr = `${now.getFullYear()}-01-01`;
    } else {
      startDateStr = hwReportStartDate;
      endDateStr = hwReportEndDate;
    }

    // Filter assignments strictly for this student's class and active in this period
    const periodHomework = allHomework.filter((h) => {
      if (h.className !== student.className) return false;
      const hDate = h.assignedDate || h.dueDate || '';
      const inDate =
        (hDate >= startDateStr && hDate <= endDateStr) ||
        (h.assignedDate <= endDateStr && h.dueDate >= startDateStr) ||
        (hwReportDateRange === 'today' && (h.assignedDate === todayStr || h.homeworkDate === todayStr));
      const matchSec = hwReportSection === 'all' || !h.section || h.section === 'all' || h.section === hwReportSection;
      const matchSub = hwReportSubject === 'all' || h.subjectName === hwReportSubject;
      return inDate && matchSec && matchSub;
    });

    const periodHwIds = new Set(periodHomework.map((h) => h.id));
    const totalPossibleMarks = periodHomework.reduce((acc, h) => acc + (h.fullMarks || 10), 0);

    // Only this student's submissions
    const mySubs = studentSubmissions.filter((sub) => periodHwIds.has(sub.homeworkId));
    const submittedCount = mySubs.length;
    let missedCount = 0;
    let activePendingCount = 0;

    periodHomework.forEach((hw) => {
      const hasSub = mySubs.some((sub) => sub.homeworkId === hw.id);
      if (!hasSub) {
        if (hw.dueDate && todayStr > hw.dueDate) {
          missedCount++;
        } else {
          activePendingCount++;
        }
      }
    });

    const obtainedMarks = mySubs.reduce((acc, sub) => {
      const m = sub.teacherMarks !== undefined ? sub.teacherMarks : sub.aiEvaluation?.suggestedMarks || 0;
      return acc + m;
    }, 0);

    const percentage = totalPossibleMarks > 0 ? Math.round((obtainedMarks / totalPossibleMarks) * 100) : 0;
    const submissionRate = periodHomework.length > 0 ? Math.round((submittedCount / periodHomework.length) * 100) : 0;

    // Subject breakdown for this student
    const subjectBreakdown = classHwSubjects.map((subName) => {
      const subHw = periodHomework.filter((h) => h.subjectName === subName);
      const subTotalMarks = subHw.reduce((acc, h) => acc + (h.fullMarks || 10), 0);
      const subSubs = mySubs.filter((s) => {
        const parent = periodHomework.find((h) => h.id === s.homeworkId);
        return parent?.subjectName === subName;
      });
      const subObtained = subSubs.reduce((acc, s) => {
        const m = s.teacherMarks !== undefined ? s.teacherMarks : s.aiEvaluation?.suggestedMarks || 0;
        return acc + m;
      }, 0);
      return {
        subjectName: subName,
        assignedCount: subHw.length,
        submittedCount: subSubs.length,
        obtainedMarks: subObtained,
        totalMarks: subTotalMarks,
        percentage: subTotalMarks > 0 ? Math.round((subObtained / subTotalMarks) * 100) : 0,
      };
    }).filter((s) => s.assignedCount > 0);

    return {
      startDateStr,
      endDateStr,
      periodHomework,
      totalAssigned: periodHomework.length,
      submittedCount,
      missedCount,
      activePendingCount,
      obtainedMarks,
      totalPossibleMarks,
      percentage,
      submissionRate,
      subjectBreakdown,
      submissions: mySubs,
    };
  }, [allHomework, studentSubmissions, student, hwReportDateRange, hwReportStartDate, hwReportEndDate, hwReportSubject, hwReportSection, classHwSubjects]);


  // Homework Submission Modal State
  const [submittingHw, setSubmittingHw] = useState<Homework | null>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [submissionImages, setSubmissionImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [submissionBlockReason, setSubmissionBlockReason] = useState<string>('');

  const handleOpenSubmit = (hw: Homework) => {
    const existing = studentSubmissions.find((s) => s.homeworkId === hw.id);
    // If deadline has passed and student hasn't submitted yet, reject submission
    if (!existing && hw.dueDate && todayCalendarDate > hw.dueDate) {
      setSubmissionBlockReason(
        `এই বাড়ির কাজের নির্ধারিত জমার শেষ তারিখ (${formatDate(hw.dueDate)}) উত্তীর্ণ হয়ে গেছে। সময়সীমা পার হওয়ার কারণে এটি আর জমা দেওয়া যাবে না।`
      );
      setTimeout(() => setSubmissionBlockReason(''), 6000);
      return;
    }

    setSubmittingHw(hw);
    if (existing) {
      setSubmissionText(existing.textAnswer || '');
      setSubmissionImages(existing.imageUrls || []);
    } else {
      setSubmissionText('');
      setSubmissionImages([]);
    }
    setSubmissionMessage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSubmissionImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHw) return;

    // Check deadline: if passed, cannot submit
    if (submittingHw.dueDate && todayCalendarDate > submittingHw.dueDate) {
      alert(
        language === 'bn'
          ? 'এই বাড়ির কাজের নির্ধারিত জমার সময় উত্তীর্ণ হয়ে গেছে। সময়সীমা পার হওয়ায় জমা গ্রহণ করা সম্ভব নয়।'
          : 'The submission deadline for this homework has expired.'
      );
      setSubmittingHw(null);
      return;
    }

    if (!submissionText.trim() && submissionImages.length === 0) {
      alert(language === 'bn' ? 'অনুগ্রহ করে খাতার ছবি অথবা উত্তর লিখুন।' : 'Please attach photos or write your answer.');
      return;
    }

    setIsSubmitting(true);
    const newSub: HomeworkSubmission = {
      id: `sub_${Date.now()}_${student.id}`,
      homeworkId: submittingHw.id,
      studentId: student.id,
      studentName: student.nameEn || student.nameBn,
      studentRoll: student.roll,
      className: submittingHw.className,
      section: submittingHw.section,
      submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      submissionType: submissionImages.length > 0 ? 'handwritten_image' : 'text',
      imageUrls: submissionImages,
      textAnswer: submissionText,
      status: 'submitted',
      version: 1,
    };

    StorageService.saveOrUpdateSubmission(newSub);
    setIsSubmitting(false);
    setSubmissionMessage(
      language === 'bn'
        ? 'হোমওয়ার্ক সফলভাবে জমা হয়েছে এবং এআই তাৎক্ষণিকভাবে নম্বর ও মূল্যায়ন প্রদান করেছে!'
        : 'Homework submitted successfully and AI graded with marks!'
    );

    // Auto-evaluate unconditionally with AI - no teacher approval needed!
    AIService.evaluateHomework({
      homework: submittingHw,
      student,
      textAnswer: submissionText,
      images: submissionImages,
    }).then((res) => {
      if (res.success && res.evaluation) {
        const fullMarks = submittingHw.fullMarks || 10;
        const assignedMarks = res.evaluation.suggestedMarks !== undefined ? res.evaluation.suggestedMarks : Math.round(fullMarks * 0.9);
        const updatedSub: HomeworkSubmission = {
          ...newSub,
          status: 'approved',
          teacherMarks: assignedMarks,
          teacherFeedback: res.evaluation.feedback,
          reviewedBy: 'Gemini AI Evaluator (স্বয়ংক্রিয়)',
          reviewedAt: new Date().toISOString(),
          aiEvaluation: {
            ...res.evaluation,
            suggestedMarks: assignedMarks,
            requiresTeacherReview: false,
          },
        };
        StorageService.saveOrUpdateSubmission(updatedSub);
      }
    });
  };

  // 3. CLASS ROUTINE DATA ISOLATION
  const studentRoutines: RoutinePeriod[] = useMemo(() => {
    return allRoutines.filter(
      (r) => r.className === student.className && (!r.section || r.section === 'all' || r.section === student.section)
    ).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [allRoutines, student]);

  const routineDays: ('Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday')[] = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
  ];

  const dayNamesBn: Record<string, string> = {
    Saturday: 'শনিবার',
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
  };

  // 4. NOTICES DATA ISOLATION
  const studentNotices: Notice[] = useMemo(() => {
    return allNotices.filter((n) => {
      if (!n) return false;
      const matchAudience = n.targetAudience === 'All' || n.targetAudience === 'Class';
      const matchClass = !n.targetClass || n.targetClass === student.className;
      return matchAudience && matchClass;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [allNotices, student]);

  // 5. EXAM MARKSHEET & CLASS MERIT LIST
  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    return allExams[0]?.id || 'ex_1';
  });

  const currentExam = useMemo(() => {
    return allExams.find((e) => e.id === selectedExamId) || allExams[0] || null;
  }, [allExams, selectedExamId]);

  // Student's marks in selected exam (matching by exam id or term)
  const studentMarks: MarksEntry[] = useMemo(() => {
    if (!currentExam) return [];
    return allMarks.filter(
      (m) =>
        (m.studentId === student.id || m.studentId === student.studentId) &&
        (m.examId === currentExam.id || m.examId === currentExam.term)
    );
  }, [allMarks, currentExam, student]);

  // Class Merit List Calculation for student's class and section
  const classMeritList = useMemo(() => {
    const classPeers = students.filter(
      (s) => s.className === student.className && (!student.section || s.section === student.section) && s.status === 'active'
    );

    if (!currentExam) return [];

    const calculated = classPeers.map((peer) => {
      const pMarks = allMarks.filter(
        (m) =>
          (m.studentId === peer.id || m.studentId === peer.studentId) &&
          (m.examId === currentExam.id || m.examId === currentExam.term)
      );
      const totalScore = pMarks.reduce((sum, m) => sum + m.total, 0);
      const hasFail = pMarks.some((m) => m.grade === 'F');
      const gpas = pMarks.map((m) => m.gpa);
      const gpaRes = calculateTotalGPA(gpas, hasFail);
      return {
        student: peer,
        totalScore,
        avgGpa: gpaRes.totalGPA,
        overallGrade: gpaRes.overallGrade,
        hasFail,
        subjectCount: pMarks.length,
      };
    });

    // Passing students sorted by GPA desc, then totalScore desc, then Roll asc
    const passed = calculated
      .filter((item) => !item.hasFail && item.subjectCount > 0)
      .sort((a, b) => {
        if (b.avgGpa !== a.avgGpa) return b.avgGpa - a.avgGpa;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return Number(a.student.roll) - Number(b.student.roll);
      });

    // Failed students
    const failed = calculated
      .filter((item) => item.hasFail || item.subjectCount === 0)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return Number(a.student.roll) - Number(b.student.roll);
      });

    const ranked = [...passed, ...failed];

    return ranked.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isCurrentStudent: item.student.id === student.id || item.student.studentId === student.studentId,
    }));
  }, [students, student, allExams, allMarks, currentExam]);

  const currentStudentRank = classMeritList.find((m) => m.isCurrentStudent)?.rank || 1;

  // 6. FEE STATEMENT & DUES DATA ISOLATION (Using Comprehensive Student Due Calculator)
  const [studentDues, setStudentDues] = useState<FeeItem[]>(() => StorageService.getStudentDueFees(student));

  useEffect(() => {
    setStudentDues(StorageService.getStudentDueFees(student));
  }, [student]);

  const studentPayments = useMemo(() => {
    return allPayments.filter(
      (p) =>
        p &&
        (p.studentId === student.id ||
          p.studentId === student.studentId ||
          p.studentName?.toLowerCase() === student.nameEn.toLowerCase() ||
          p.studentName === student.nameBn)
    );
  }, [allPayments, student]);

  const studentInvoices: FeeInvoice[] = useMemo(() => {
    return allInvoices.filter(
      (inv) =>
        inv &&
        (inv.studentId === student.id ||
          inv.studentId === student.studentId ||
          (inv.roll === student.roll && inv.className === student.className))
    ).sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
  }, [allInvoices, student]);

  // Unified paid records to prevent duplicate rows for the same fee payment
  const unifiedPaidRecords = useMemo(() => {
    const list: Array<{
      id: string;
      invoiceNo?: string;
      receiptNo: string;
      displayNo: string;
      feeTitle: string;
      date: string;
      amount: number;
      method: string;
      status: string;
    }> = [];

    // Prioritize actual payment receipts
    studentPayments.forEach((p) => {
      const matchingInv = studentInvoices.find(
        (inv) => inv.id === p.invoiceId || (inv.invoiceNo && p.receiptNo === inv.invoiceNo)
      );
      list.push({
        id: p.id,
        invoiceNo: matchingInv?.invoiceNo,
        receiptNo: p.receiptNo,
        displayNo: p.receiptNo + (matchingInv?.invoiceNo ? ` (${matchingInv.invoiceNo})` : ''),
        feeTitle: matchingInv?.feeType || p.notes || 'School Fee Payment',
        date: p.paidDate,
        amount: p.amount,
        method: p.paymentMethod || 'Cash',
        status: 'পরিশোধিত',
      });
    });

    // Invoices with paidAmount > 0 that do not have a matching payment record in studentPayments
    studentInvoices.forEach((inv) => {
      if (inv.paidAmount > 0) {
        const alreadyLinked = studentPayments.some(
          (p) => p.invoiceId === inv.id || p.receiptNo === inv.invoiceNo
        );
        if (!alreadyLinked) {
          list.push({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            receiptNo: inv.invoiceNo,
            displayNo: inv.invoiceNo,
            feeTitle: inv.feeType,
            date: inv.dueDate,
            amount: inv.paidAmount,
            method: 'Online/Counter',
            status: inv.dueAmount === 0 ? 'পরিশোধিত' : 'আংশিক পরিশোধিত',
          });
        }
      }
    });

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [studentPayments, studentInvoices]);

  const totalFeePaid = useMemo(() => {
    const fromPayments = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const fromInvoices = studentInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    return Math.max(fromPayments, fromInvoices);
  }, [studentPayments, studentInvoices]);

  const totalFeeDue = useMemo(() => {
    const dueFromItems = studentDues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const dueFromInvoices = studentInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    return dueFromItems > 0 ? dueFromItems : dueFromInvoices;
  }, [studentDues, studentInvoices]);

  const totalFeeBilled = totalFeePaid + totalFeeDue;

  // Online Fee Payment Requests & School MFS Settings
  const [onlineRequests, setOnlineRequests] = useState<OnlinePaymentRequest[]>(() =>
    StorageService.getOnlinePaymentRequests()
  );
  const [mfsSettings, setMfsSettings] = useState<MfsPaymentSettings>(() =>
    StorageService.getMfsSettings()
  );

  useEffect(() => {
    const handleOnlinePaymentsUpdate = () => {
      setOnlineRequests(StorageService.getOnlinePaymentRequests());
      setStudentDues(StorageService.getStudentDueFees(student));
    };
    const handleMfsUpdate = () => {
      setMfsSettings(StorageService.getMfsSettings());
    };
    window.addEventListener('online_payments_updated', handleOnlinePaymentsUpdate);
    window.addEventListener('mfs_settings_updated', handleMfsUpdate);
    return () => {
      window.removeEventListener('online_payments_updated', handleOnlinePaymentsUpdate);
      window.removeEventListener('mfs_settings_updated', handleMfsUpdate);
    };
  }, [student]);

  const studentOnlineRequests = useMemo(() => {
    return onlineRequests.filter(
      (r) =>
        r &&
        (r.studentId === student.id ||
          r.studentId === student.studentId ||
          (r.studentRoll === student.roll && r.className === student.className))
    ).sort((a, b) => (b.requestDate || '').localeCompare(a.requestDate || ''));
  }, [onlineRequests, student]);

  // Online Fee Payment Modal State - STRICTLY bKash & Nagad ONLY (No Cash)
  const [payingDue, setPayingDue] = useState<FeeItem | 'all' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [paymentPhone, setPaymentPhone] = useState<string>(student.guardianPhone || student.fatherPhone || '');
  const [paymentTrxId, setPaymentTrxId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentRequestSubmitted, setPaymentRequestSubmitted] = useState<{
    receiptNo: string;
    amount: number;
    feeTitle: string;
    method: 'bKash' | 'Nagad';
    trxId: string;
    senderPhone: string;
  } | null>(null);

  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<{
    receiptNo: string;
    amount: number;
    feeTitle: string;
    date: string;
    method: string;
  } | null>(null);

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDue) return;

    if (!paymentPhone.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে প্রেরক মোবাইল নম্বর দিন।' : 'Please enter sender mobile number.');
      return;
    }

    if (!paymentTrxId.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে বিকাশ বা নগদ ট্রানজেকশন আইডি (TrxID) লিখুন।' : 'Please enter Transaction ID (TrxID).');
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      const amountToPay = payingDue === 'all' ? totalFeeDue : payingDue.amount;
      const feeTitle = payingDue === 'all' ? 'সকল বকেয়া ফি (All Outstanding Dues)' : payingDue.headName;
      const receiptNo = `REQ-${Date.now().toString().slice(-6)}`;
      const cleanTrx = paymentTrxId.trim().toUpperCase();

      // Create Pending Online Payment Request for School Admin Review
      const newRequest: OnlinePaymentRequest = {
        id: `opr_${Date.now()}`,
        receiptNo,
        studentId: student.id,
        studentName: student.nameBn || student.nameEn,
        studentRoll: student.roll,
        className: student.className,
        section: student.section,
        feeTitle,
        amount: amountToPay,
        paymentMethod,
        senderPhone: paymentPhone.trim(),
        transactionId: cleanTrx,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: `Student portal online payment request via ${paymentMethod}`,
      };

      StorageService.addOnlinePaymentRequest(newRequest);
      setOnlineRequests(StorageService.getOnlinePaymentRequests());

      setIsProcessingPayment(false);
      setPayingDue(null);
      setPaymentRequestSubmitted({
        receiptNo,
        amount: amountToPay,
        feeTitle,
        method: paymentMethod,
        trxId: cleanTrx,
        senderPhone: paymentPhone.trim(),
      });
      setPaymentTrxId('');
    }, 600);
  };

  // Saturday Weekend / Working day listener
  const [isSaturdayOff, setIsSaturdayOff] = useState<boolean>(() => StorageService.isSaturdayOff());
  useEffect(() => {
    const handleSaturdayToggle = (e: any) => {
      setIsSaturdayOff(StorageService.isSaturdayOff());
    };
    window.addEventListener('saturday_off_toggled', handleSaturdayToggle);
    return () => window.removeEventListener('saturday_off_toggled', handleSaturdayToggle);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-20 rounded-xl border-2 border-amber-400 bg-white/10 overflow-hidden shadow-md shrink-0">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.nameEn || 'Student'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-amber-300">
                  {(student.nameEn || student.nameBn || 'S').charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-amber-300 mb-1 border border-white/20">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                <span>ব্যক্তিগত শিক্ষার্থী ড্যাশবোর্ড (Personal Student Portal)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {student.nameBn || student.nameEn}
              </h2>
              <p className="text-xs text-blue-200 font-semibold">{student.nameEn}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-blue-950 font-black">
                  স্টুডেন্ট আইডি: {student.studentId}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold">
                  শ্রেণি: {student.className}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-800 text-white font-bold">
                  শাখা: {student.section}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-700 text-white font-bold font-mono">
                  রোল: {student.roll}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
                  মেধা স্থান: {toBnNumber(currentStudentRank)}ম স্থান
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <span className="text-[10px] text-blue-200 block font-bold">উপস্থিতি হার</span>
              <span className={`text-lg font-black ${attendanceRate >= 80 ? 'text-emerald-300' : attendanceRate >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                {toBnNumber(attendanceRate)}%
              </span>
            </div>
            <div className="p-2 border-x border-white/20">
              <span className="text-[10px] text-blue-200 block font-bold">বাড়ির কাজ জমা</span>
              <span className="text-lg font-black text-amber-300">
                {toBnNumber(studentSubmissions.length)}/{toBnNumber(classHomework.length)}
              </span>
            </div>
            <div className="p-2">
              <span className="text-[10px] text-blue-200 block font-bold">বকেয়া ফি</span>
              <span className={`text-lg font-black ${totalFeeDue > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {formatTaka(totalFeeDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Required 6 Modules) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'overview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>সারসংক্ষেপ (Overview)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'attendance' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>১. আমার হাজিরা (Attendance)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('homework')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'homework' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>২. বাড়ির কাজ রিপোর্ট (Homework)</span>
          {classHomework.length - studentSubmissions.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
              {classHomework.length - studentSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('routine')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'routine' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>৩. ক্লাস রুটিন (Routine)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notices')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'notices' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>৪. নোটিশ বোর্ড (Notices)</span>
          {studentNotices.length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
              {studentNotices.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('exams')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'exams' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>৫. পরীক্ষার মার্কশিট ও মেধা তালিকা (Results)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fees')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'fees' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>৬. ফি জমার স্টেটমেন্ট (Fees)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('id_card')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'id_card' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>৭. আমার ডিজিটাল আইডি কার্ড (ID Card)</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW SUMMARY                                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. আজকের হাজিরা Card */}
            <div
              className={`p-4 rounded-2xl border shadow-xs transition-colors ${
                todayRecord?.status === 'Absent'
                  ? 'bg-rose-50/70 border-rose-200'
                  : todayRecord?.status === 'Late'
                  ? 'bg-amber-50/70 border-amber-200'
                  : todayRecord?.status === 'Present'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span
                  className={
                    todayRecord?.status === 'Absent'
                      ? 'text-rose-800'
                      : todayRecord?.status === 'Late'
                      ? 'text-amber-800'
                      : todayRecord?.status === 'Present'
                      ? 'text-emerald-800'
                      : 'text-amber-800'
                  }
                >
                  আজকের হাজিরা ({formatDate(todayCalendarDate)})
                </span>
                {todayRecord?.status === 'Absent' ? (
                  <XCircle className="w-4 h-4 text-rose-600" />
                ) : todayRecord?.status === 'Late' ? (
                  <Clock className="w-4 h-4 text-amber-600" />
                ) : todayRecord?.status === 'Present' ? (
                  <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className={`text-base sm:text-lg font-black ${
                    todayRecord?.status === 'Absent'
                      ? 'text-rose-600'
                      : todayRecord?.status === 'Late'
                      ? 'text-amber-600'
                      : todayRecord?.status === 'Present'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {todayRecord?.status === 'Absent'
                    ? 'অনুপস্থিত (Absent)'
                    : todayRecord?.status === 'Late'
                    ? 'দেরিতে উপস্থিতি (Late)'
                    : todayRecord?.status === 'Present'
                    ? 'উপস্থিত (Present)'
                    : 'আজ এখনও উপস্থিতি নিশ্চিত করা হয়নি'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    todayRecord?.status === 'Absent'
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : todayRecord?.status === 'Late'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : todayRecord?.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {todayRecord?.status === 'Absent'
                    ? 'অনুপস্থিত'
                    : todayRecord?.status === 'Late'
                    ? 'দেরিতে উপস্থিতি'
                    : todayRecord?.status === 'Present'
                    ? todayRecord?.scanTime || 'উপস্থিত ✓'
                    : 'হাজিরা বা স্ক্যান বাকি'}
                </span>
              </div>
              <p
                className={`text-[11px] mt-1.5 font-medium ${
                  todayRecord?.status === 'Absent'
                    ? 'text-rose-600'
                    : todayRecord?.status === 'Late'
                    ? 'text-amber-700'
                    : todayRecord?.status === 'Present'
                    ? 'text-emerald-600'
                    : 'text-amber-700'
                }`}
              >
                {todayRecord?.status === 'Absent'
                  ? todayRecord.remarks || 'শ্রেণিকক্ষে অনুপস্থিত হিসেবে নথিভুক্ত করা হয়েছে'
                  : todayRecord?.status === 'Late'
                  ? `দেরিতে চেক-ইন: ${todayRecord.scanTime || '০৯:১৫ AM'}`
                  : todayRecord?.status === 'Present'
                  ? `চেক-ইন: ${todayRecord.scanTime || '০৮:২৫ AM'} (${todayRecord.method === 'qr_scanner' ? 'QR স্ক্যান' : 'শ্রেণিকক্ষ হাজিরা'})`
                  : 'আজকের ক্লাসের হাজিরা এখনও নেওয়া হয়নি বা কিউআর কোড স্ক্যান করা হয়নি। হাজিরা সম্পন্ন হলে এখানে স্ট্যাটাস আপডেট হবে।'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>বাড়ির কাজের হিসাব ও স্ট্যাটাস</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900">
                    {toBnNumber(studentHwAccounting.dueTotal)} টি বাকি
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                    {studentHwAccounting.expiredCount > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {toBnNumber(studentHwAccounting.expiredCount)}টি মিসড (সময় উত্তীর্ণ)
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        কোনো মিসড নেই
                      </span>
                    )}
                    <span className="text-blue-600">
                      • {toBnNumber(studentHwAccounting.submitted)}টি জমা
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('homework')}
                  className="text-xs font-bold text-amber-600 hover:underline shrink-0"
                >
                  বিবরণ &rarr;
                </button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>শ্রেণি মেধা ক্রম</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-700">
                  {toBnNumber(currentStudentRank)}ম স্থান
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {student.className} ({student.section})
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>ফি স্টেটমেন্ট বকেয়া</span>
                <Wallet className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xl font-black ${totalFeeDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatTaka(totalFeeDue)}
                </span>
                <button
                  onClick={() => setActiveSubTab('fees')}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  {totalFeeDue > 0 ? `${toBnNumber(studentDues.length)}টি বকেয়া পরিশোধ →` : 'বিবরণী →'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Modules Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Homework Preview */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>সাম্প্রতিক বাড়ির কাজ ({student.className})</span>
                </h3>
                <button
                  onClick={() => setActiveSubTab('homework')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  সকল বাড়ির কাজ &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {classHomework.slice(0, 3).map((hw) => {
                  const sub = studentSubmissions.find((s) => s.homeworkId === hw.id);
                  const isExpired = !sub && hw.dueDate && todayCalendarDate > hw.dueDate;

                  return (
                    <div
                      key={hw.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{hw.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          {hw.subjectName} • শেষ সময়: {formatDate(hw.dueDate)}
                        </p>
                      </div>
                      <div>
                        {sub ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            জমা দেওয়া হয়েছে ({sub.aiEvaluation?.suggestedMarks || hw.fullMarks}/{hw.fullMarks})
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>সময় উত্তীর্ণ (জমা বন্ধ)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmit(hw)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs"
                          >
                            জমা দিন
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* School & Class Notices Preview */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>নোটিশ বোর্ড ({student.className} ও সাধারণ)</span>
                </h3>
                <button
                  onClick={() => setActiveSubTab('notices')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  সকল নোটিশ &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {studentNotices.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">{formatDate(n.date)}</span>
                    </div>
                    <p className="text-slate-600 mt-1 line-clamp-1">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 1: TAR ATTENDANCE (হাজিরা রিপোর্ট)                           */}
      {/* ===================================================================== */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">মোট রেকর্ডকৃত দিন</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {toBnNumber(totalAttendanceDays)} দিন
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-xs text-emerald-700 font-bold block">উপস্থিত (Present)</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {toBnNumber(presentCount)} দিন
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-xs text-rose-700 font-bold block">অনুপস্থিত (Absent)</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {toBnNumber(absentCount)} দিন
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs bg-amber-50/30">
              <span className="text-xs text-amber-700 font-bold block">দেরিতে আগমন (Late)</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {toBnNumber(lateCount)} দিন
              </span>
            </div>
          </div>

          {/* Today's Live Attendance Alert Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              todayRecord?.status === 'Present'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : todayRecord?.status === 'Absent'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : todayRecord?.status === 'Late'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {todayRecord?.status === 'Present' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : todayRecord?.status === 'Absent' ? (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : todayRecord?.status === 'Late' ? (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-extrabold text-sm block">
                  {todayRecord?.status === 'Present'
                    ? `আজকের (${formatDate(todayCalendarDate)}) হাজিরা: উপস্থিত (Present)`
                    : todayRecord?.status === 'Absent'
                    ? `আজকের (${formatDate(todayCalendarDate)}) হাজিরা: অনুপস্থিত (Absent)`
                    : todayRecord?.status === 'Late'
                    ? `আজকের (${formatDate(todayCalendarDate)}) হাজিরা: দেরিতে আগমন (Late)`
                    : `আজ (${formatDate(todayCalendarDate)}) এখনও হাজিরা নিশ্চিত বা স্ক্যান করা হয়নি`}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {todayRecord?.status === 'Present'
                    ? `চেক-ইন সময়: ${todayRecord.scanTime || '০৮:২৫ AM'} • পদ্ধতি: ${todayRecord.method === 'qr_scanner' ? 'কিউআর কোড স্ক্যানার' : 'শ্রেণিকক্ষ রোল কল'}`
                    : todayRecord?.status === 'Absent'
                    ? 'শ্রেণিকক্ষে অনুপস্থিত হিসেবে নথিভুক্ত করা হয়েছে'
                    : todayRecord?.status === 'Late'
                    ? `দেরিতে আগমন: ${todayRecord.scanTime || '০৯:১৫ AM'}`
                    : 'শ্রেণি শিক্ষক বা আইডি কার্ড কিউআর স্ক্যানারের মাধ্যমে হাজিরা গৃহীত হলে এখানে রিয়েল-টাইম আপডেট দেখতে পাবেন।'}
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-auto shrink-0 border ${
                todayRecord?.status === 'Present'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : todayRecord?.status === 'Absent'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : todayRecord?.status === 'Late'
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {todayRecord?.status === 'Present'
                ? 'উপস্থিত ✓'
                : todayRecord?.status === 'Absent'
                ? 'অনুপস্থিত'
                : todayRecord?.status === 'Late'
                ? 'দেরিতে উপস্থিতি'
                : 'হাজিরা বা স্ক্যান বাকি'}
            </span>
          </div>

          {/* Daily Attendance History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                <span>দৈনিক হাজিরা লগ ({student.nameBn || student.nameEn} - আইডি: {student.studentId})</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                হাজিরা রেটিং: <strong className="text-emerald-600">{toBnNumber(attendanceRate)}%</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">তারিখ (Date)</th>
                    <th className="py-3 px-4">হাজিরা স্ট্যাটাস</th>
                    <th className="py-3 px-4">চেক-ইন সময়</th>
                    <th className="py-3 px-4">পদ্ধতি (Method)</th>
                    <th className="py-3 px-4">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        এখনও কোনো হাজিরার রেকর্ড নেই।
                      </td>
                    </tr>
                  ) : (
                    studentAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-800">{formatDate(rec.date)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status === 'Present' ? 'উপস্থিত' : rec.status === 'Late' ? 'দেরি' : 'অনুপস্থিত'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {rec.status === 'Absent' ? '—' : rec.scanTime || '০৮:২৫ AM'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'Absent'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {rec.status === 'Absent'
                              ? 'অনুপস্থিত রেকর্ড'
                              : rec.method === 'qr_scanner'
                              ? 'স্মার্ট কিউআর কোড স্ক্যান'
                              : 'শ্রেণিকক্ষ হাজিরা'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {rec.remarks || (rec.status === 'Absent' ? 'অনুপস্থিত' : 'স্বাভাবিক উপস্থিতি')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 2: HOMEWORK & CLASS REPORT (হোমওয়ার্ক জমা ও সামগ্রিক রিপোর্ট) */}
      {/* ===================================================================== */}
      {activeSubTab === 'homework' && (
        <div className="space-y-6">
          {/* Sub-navigation within Homework: Switch between Assignment List and Class Report & Leaderboard */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStudentHwViewTab('report')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  studentHwViewTab === 'report'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-4 h-4 text-amber-200" />
                <span>১-ক্লিক শ্রেণিভিত্তিক সামারি ও ফার্স্ট র‍্যাংক</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentHwViewTab('assignments')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  studentHwViewTab === 'assignments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>বাড়ির কাজের তালিকা ও জমা ({toBnNumber(classHomework.length)}টি)</span>
              </button>
            </div>

            {/* Strict Class Isolation Badge: Shows Student's Class is Locked */}
            <div className="flex items-center space-x-2 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 text-xs">
              <Lock className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-slate-600 font-semibold">আপনার শ্রেণি:</span>
              <strong className="text-blue-900 font-bold">{student.className}</strong>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">লকড (Locked)</span>
            </div>
          </div>

          {/* VIEW A: CLASS HOMEWORK REPORT & 1-CLICK PODIUM (Matching Screenshot) */}
          {studentHwViewTab === 'report' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Filter Bar with Quick Date Range Pills */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Date Range Selector Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-700 mr-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>তারিখ পরিসীমা:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setHwReportDateRange('today')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        hwReportDateRange === 'today'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      আজ (Today)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHwReportDateRange('this_week')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        hwReportDateRange === 'this_week'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      এই সপ্তাহ (This Week)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHwReportDateRange('this_month')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        hwReportDateRange === 'this_month'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      এই মাস (This Month)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHwReportDateRange('this_year')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        hwReportDateRange === 'this_year'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      এই বছর (This Year)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHwReportDateRange('custom')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        hwReportDateRange === 'custom'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      কাস্টম তারিখ (From - To)
                    </button>
                  </div>
                </div>

                {/* Sub-row Filters (Strictly Locked to Student's Class) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    {hwReportDateRange === 'custom' && (
                      <div className="flex items-center space-x-1.5 bg-blue-50/50 p-1.5 rounded-lg border border-blue-200">
                        <span className="font-semibold text-slate-600 text-[11px]">শুরু:</span>
                        <input
                          type="date"
                          value={hwReportStartDate}
                          onChange={(e) => setHwReportStartDate(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
                        />
                        <span className="font-semibold text-slate-600 text-[11px]">শেষ:</span>
                        <input
                          type="date"
                          value={hwReportEndDate}
                          onChange={(e) => setHwReportEndDate(e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
                        />
                      </div>
                    )}

                    {/* Strict Class Display: NO DROPDOWN - LOCKED */}
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-700">শ্রেণি:</span>
                      <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-black text-xs inline-flex items-center gap-1 shadow-2xs">
                        <span>{student.className}</span>
                        <span className="text-[10px] text-blue-600 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">আপনার শ্রেণি</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-700">শাখা:</span>
                      <select
                        value={hwReportSection}
                        onChange={(e) => setHwReportSection(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                      >
                        <option value="all">সব শাখা (All Sections)</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-700">বিষয়:</span>
                      <select
                        value={hwReportSubject}
                        onChange={(e) => setHwReportSubject(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium max-w-xs truncate"
                      >
                        <option value="all">সব বিষয় (All Subjects)</option>
                        {classHwSubjects.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="সহপাঠীর নাম বা রোল..."
                        value={hwReportSearch}
                        onChange={(e) => setHwReportSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs w-44"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>আমার রিপোর্ট প্রিন্ট করুন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIVACY & PERSONAL REPORT BANNER */}
              <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl text-white shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-6 h-6 text-amber-300" />
                      <h3 className="text-base font-black tracking-wide">
                        {student.nameBn || student.nameEn}-এর ব্যক্তিগত বাড়ির কাজ ও নম্বর মূল্যায়ন
                      </h3>
                    </div>
                    <p className="text-xs text-blue-100 mt-1">
                      শ্রেণি: <strong>{student.className}</strong> | শাখা: <strong>{student.section}</strong> | রোল: <strong>{student.roll}</strong> • আইডি: <strong>{student.studentId}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>🔒 ব্যক্তিগত ও সুরক্ষিত পোর্টাল: এখানে শুধুমাত্র আপনার নিজের দেওয়া হোমওয়ার্ক, প্রাপ্ত নম্বর এবং শিক্ষকের মন্তব্য প্রদর্শিত হচ্ছে।</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                      <span className="text-[10px] font-bold text-amber-200 block uppercase">গড় অর্জিত নম্বর</span>
                      <strong className="text-lg font-black block text-white">
                        {toBnNumber(personalHwReport.percentage)}%
                      </strong>
                      <span className="text-[10px] text-blue-100 font-medium">
                        {personalHwReport.obtainedMarks} / {personalHwReport.totalPossibleMarks} নম্বর
                      </span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                      <span className="text-[10px] font-bold text-emerald-300 block uppercase">জমার হার</span>
                      <strong className="text-lg font-black block text-white">
                        {toBnNumber(personalHwReport.submissionRate)}%
                      </strong>
                      <span className="text-[10px] text-blue-100 font-medium">
                        {personalHwReport.submittedCount}/{personalHwReport.totalAssigned}টি কাজ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 PERSONAL KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-bold block">মোট নির্ধারিত বাড়ির কাজ</span>
                  <div className="text-xl font-black text-blue-900 mt-1 flex items-baseline gap-1">
                    <span>{toBnNumber(personalHwReport.totalAssigned)}</span>
                    <span className="text-xs font-normal text-slate-500">টি</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">নির্বাচিত সময়কালে</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
                  <span className="text-[11px] text-emerald-800 font-bold block">সফলভাবে জমা দিয়েছি</span>
                  <div className="text-xl font-black text-emerald-700 mt-1 flex items-baseline gap-1">
                    <span>{toBnNumber(personalHwReport.submittedCount)}</span>
                    <span className="text-xs font-normal text-slate-500">টি</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-1">জমার হার: {toBnNumber(personalHwReport.submissionRate)}%</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
                  <span className="text-[11px] text-rose-800 font-bold block">সময় পার / মিসড</span>
                  <div className="text-xl font-black text-rose-700 mt-1 flex items-baseline gap-1">
                    <span>{toBnNumber(personalHwReport.missedCount)}</span>
                    <span className="text-xs font-normal text-slate-500">টি</span>
                  </div>
                  <span className="text-[10px] text-rose-600 block mt-1">
                    {personalHwReport.missedCount === 0 ? 'সব সময়মতো জমা' : 'দেরি হওয়া কাজ'}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
                  <span className="text-[11px] text-indigo-800 font-bold block">মোট প্রাপ্ত নম্বর</span>
                  <div className="text-xl font-black text-indigo-700 mt-1 flex items-baseline gap-1">
                    <span>{toBnNumber(personalHwReport.obtainedMarks)}</span>
                    <span className="text-xs font-normal text-slate-500">/ {toBnNumber(personalHwReport.totalPossibleMarks)}</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 block mt-1">
                    {personalHwReport.percentage >= 80 ? 'চমৎকার মান (A+)' : 'নিয়মিত চর্চা করুন'}
                  </span>
                </div>
              </div>

              {/* SUBJECT-WISE PERSONAL PROGRESS CARDS */}
              {personalHwReport.subjectBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>আমার বিষয়ভিত্তিক পারফরম্যান্স অগ্রগতি (Subject-wise Performance)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {personalHwReport.subjectBreakdown.map((sub) => (
                      <div key={sub.subjectName} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <strong className="text-xs font-black text-slate-900 truncate">{sub.subjectName}</strong>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            sub.percentage >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.percentage >= 50
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {toBnNumber(sub.percentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${
                              sub.percentage >= 80 ? 'bg-emerald-500' : sub.percentage >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, sub.percentage)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>জমা: {toBnNumber(sub.submittedCount)}/{toBnNumber(sub.assignedCount)}</span>
                          <span className="font-bold text-slate-800">{toBnNumber(sub.obtainedMarks)} / {toBnNumber(sub.totalMarks)} নম্বর</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENT'S OWN HOMEWORK SUBMISSION HISTORY & MARKS TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>আমার জমাকৃত বাড়ির কাজ ও শিক্ষকের মূল্যায়ন তালিকা</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    মোট এন্ট্রি: {toBnNumber(personalHwReport.periodHomework.length)} টি
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-black text-[10px]">
                      <tr>
                        <th className="p-3">অ্যাসাইনমেন্ট শিরোনাম</th>
                        <th className="p-3">বিষয়</th>
                        <th className="p-3 text-center">শেষ তারিখ</th>
                        <th className="p-3 text-center">জমাদানের স্থিতি</th>
                        <th className="p-3 text-center">প্রাপ্ত নম্বর</th>
                        <th className="p-3">শিক্ষক ও এআই মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {personalHwReport.periodHomework.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                            এই সময়সীমায় কোনো অ্যাসাইনমেন্টের তথ্য পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        personalHwReport.periodHomework.map((hw) => {
                          const sub = personalHwReport.submissions.find((s) => s.homeworkId === hw.id);
                          const isSubmitted = !!sub;
                          const obtained = sub ? (sub.teacherMarks !== undefined ? sub.teacherMarks : sub.aiEvaluation?.suggestedMarks || 0) : 0;
                          const feedback = sub?.teacherFeedback || sub?.aiEvaluation?.feedback || (isSubmitted ? 'মূল্যায়নাধীন' : 'এখনও জমা দেওয়া হয়নি');

                          return (
                            <tr key={hw.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3">
                                <strong className="text-slate-900 text-xs block">{hw.title}</strong>
                                <span className="text-[10px] text-slate-400">{hw.description?.slice(0, 45)}...</span>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{hw.subjectName}</td>
                              <td className="p-3 text-center text-slate-600 font-mono text-[11px]">
                                {formatDate(hw.dueDate)}
                              </td>
                              <td className="p-3 text-center">
                                {isSubmitted ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    ✓ জমা দেওয়া হয়েছে
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    বাকি রয়েছে
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center font-black">
                                {isSubmitted ? (
                                  <span className="text-blue-700">
                                    {toBnNumber(obtained)} / {toBnNumber(hw.fullMarks || 10)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="p-3 max-w-xs truncate text-[11px] text-slate-600">
                                {feedback}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: ASSIGNMENTS & HOMEWORK SUBMISSION PORTAL */}
          {studentHwViewTab === 'assignments' && (
            <div className="space-y-4">
              {/* Accounting KPI Cards for Student's Homework */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-[11px] text-blue-700 font-bold block">মোট বাড়ির কাজ</span>
                  <div className="text-xl font-black text-blue-900 mt-1">
                    {toBnNumber(studentHwAccounting.total)} টি
                  </div>
                </div>
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[11px] text-emerald-700 font-bold block">সফলভাবে জমা সম্পন্ন</span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {toBnNumber(studentHwAccounting.submitted)} টি
                  </div>
                </div>
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-[11px] text-rose-700 font-bold block">সময় উত্তীর্ণ / মিসড (জমা বন্ধ)</span>
                  <div className="text-xl font-black text-rose-900 mt-1">
                    {toBnNumber(studentHwAccounting.expiredCount)} টি
                  </div>
                </div>
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <span className="text-[11px] text-amber-700 font-bold block">চলমান / জমা বাকি</span>
                  <div className="text-xl font-black text-amber-900 mt-1">
                    {toBnNumber(studentHwAccounting.activePendingCount)} টি
                  </div>
                </div>
              </div>

              {/* Blocked Submission Notice Banner if user tries to submit an expired task */}
              {submissionBlockReason && (
                <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submissionBlockReason}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmissionBlockReason('')}
                    className="p-1 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>আমার বাড়ির কাজ ও খাতা জমা ({student.className} - শাখা {student.section})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      নির্ধারিত বাড়ির কাজের তালিকা, ছবি আপলোড ও স্বয়ংক্রিয় এআই মূল্যায়ন
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-bold text-xs">
                    মোট কাজ: {toBnNumber(classHomework.length)} টি
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {classHomework.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      আপনার শ্রেণির জন্য কোনো বাড়ির কাজ দেওয়া হয়নি।
                    </div>
                  ) : (
                    classHomework.map((hw) => {
                      const sub = studentSubmissions.find((s) => s.homeworkId === hw.id);
                      const isExpired = !sub && hw.dueDate && todayCalendarDate > hw.dueDate;

                      return (
                        <div key={hw.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  {hw.subjectName}
                                </span>
                                <h4 className="font-extrabold text-slate-900 text-sm">{hw.title}</h4>
                              </div>
                              <p className="text-slate-600 text-xs">{hw.description}</p>
                              <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                                <span>শিক্ষক: <strong>{hw.teacherName}</strong></span>
                                <span>•</span>
                                <span>পূর্ণমান: <strong>{hw.fullMarks || 10} নম্বর</strong></span>
                                <span>•</span>
                                <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                                  জমার শেষ তারিখ: <strong>{formatDate(hw.dueDate)}</strong>
                                  {isExpired && ' (সময় উত্তীর্ণ)'}
                                </span>
                              </div>
                            </div>

                            <div>
                              {sub ? (
                                <div className="text-right">
                                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>জমা দেওয়া হয়েছে</span>
                                  </span>
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    তারিখ: {sub.submissionDate}
                                  </div>
                                </div>
                              ) : isExpired ? (
                                <div className="text-right">
                                  <span className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs">
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    <span>জমার সময় শেষ (Expired)</span>
                                  </span>
                                  <span className="text-[10px] text-rose-600 block mt-1 font-semibold">
                                    ডেডলাইন পার হওয়ায় জমা বন্ধ
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubmit(hw)}
                                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>উত্তর জমা দিন (Submit)</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Overdue/Expired Banner for this homework */}
                          {isExpired && (
                            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>
                                <strong>সময় উত্তীর্ণ:</strong> এই বাড়ির কাজের নির্ধারিত জমার শেষ তারিখ ({formatDate(hw.dueDate)}) পার হয়ে গেছে। নীতিমালা অনুযায়ী নির্দিষ্ট সময় পার হয়ে গেলে আর খাতা জমা দেওয়া যায় না।
                              </span>
                            </div>
                          )}

                        {/* AI Evaluation & Teacher Feedback Details */}
                        {sub && (
                          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>মূল্যায়ন ও প্রাপ্ত নম্বর:</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                                প্রাপ্ত নম্বর: {sub.teacherMarks !== undefined ? sub.teacherMarks : sub.aiEvaluation?.suggestedMarks || 0} / {hw.fullMarks || 10}
                              </span>
                            </div>

                            {sub.aiEvaluation?.feedback && (
                              <p className="text-indigo-900 font-medium">
                                <strong>এআই ফিডব্যাক:</strong> {sub.aiEvaluation.feedback}
                              </p>
                            )}

                            {sub.teacherFeedback && (
                              <p className="text-slate-800 font-medium pt-1 border-t border-indigo-100">
                                <strong>শিক্ষকের মন্তব্য:</strong> {sub.teacherFeedback}
                              </p>
                            )}

                            {sub.imageUrls && sub.imageUrls.length > 0 && (
                              <div className="pt-2 flex items-center space-x-2">
                                <span className="text-[11px] text-slate-600 font-bold">জমা দেওয়া খাতার ছবি:</span>
                                <div className="flex space-x-1.5">
                                  {sub.imageUrls.map((url, i) => (
                                    <img key={i} src={url} alt="Submission" className="w-10 h-10 object-cover rounded-lg border border-indigo-300" />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 3: CLASS ROUTINE (ক্লাস রুটিন)                                */}
      {/* ===================================================================== */}
      {activeSubTab === 'routine' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                  <span>সাপ্তাহিক ক্লাস রুটিন ({student.className} - শাখা {student.section} - {student.shift} Shift)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  আপনার নির্দিষ্ট শ্রেণি ও শাখার অনুমোদিত ক্লাস সময়সূচি
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SaturdayOffToggle compact={true} />
                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold">
                  সেশন ২০২৬
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {routineDays.map((day) => {
                const isSat = day === 'Saturday';
                const dayPeriods = studentRoutines.filter((r) => r.day === day);

                return (
                  <div key={day} className={`border rounded-xl overflow-hidden ${isSat && isSaturdayOff ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
                    <div className={`px-4 py-2 text-xs font-black flex items-center justify-between ${isSat && isSaturdayOff ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'}`}>
                      <div className="flex items-center space-x-2">
                        <span>{dayNamesBn[day]} ({day})</span>
                        {isSat && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isSaturdayOff ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}`}>
                            {isSaturdayOff ? '🏖️ সাপ্তাহিক ছুটি (School Weekend)' : '📖 নিয়মিত ক্লাস (Madrasha Open)'}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-normal">
                        {isSat && isSaturdayOff ? 'ছুটি (Off-day)' : `${toBnNumber(dayPeriods.length)} টি পিরিয়ড`}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {isSat && isSaturdayOff ? (
                        <div className="col-span-full py-5 text-center text-amber-800 text-xs font-semibold bg-amber-50/50 rounded-lg border border-amber-200/60">
                          🏖️ সাধারণ স্কুলে শনিবার সাপ্তাহিক ছুটি। মাদরাসা বা শনিবার ক্লাস চালু রাখতে ওপরের ১-ক্লিক বাটনে ক্লিক করুন।
                        </div>
                      ) : dayPeriods.length === 0 ? (
                        <div className="col-span-full py-3 text-center text-slate-400 text-xs">
                          এই দিনে কোনো নির্ধারিত ক্লাস নেই।
                        </div>
                      ) : (
                        dayPeriods.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                          >
                            <span className="text-[10px] font-bold text-indigo-600 block uppercase">
                              পিরিয়ড {toBnNumber(p.periodNumber)} ({p.startTime} - {p.endTime})
                            </span>
                            <h4 className="font-black text-slate-900 text-xs mt-1">{p.subjectName}</h4>
                            <p className="text-[11px] text-slate-600 font-medium">{p.teacherName}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">কক্ষ: {p.roomNo}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 4: NOTICE BOARD (নোটিশ বোর্ড)                                  */}
      {/* ===================================================================== */}
      {activeSubTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>আমার নোটিশ বোর্ড ({student.className})</span>
              </h3>
              <span className="text-xs text-slate-500">
                সর্বশেষ নোটিশ সংখ্যা: {toBnNumber(studentNotices.length)} টি
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {studentNotices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  বর্তমানে কোনো নতুন নোটিশ প্রকাশিত হয়নি।
                </div>
              ) : (
                studentNotices.map((n) => (
                  <div key={n.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                          {n.category || 'General'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">{n.title}</h4>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">{formatDate(n.date)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 5: EXAM MARKSHEET & CLASS MERIT LIST (মার্কশিট ও মেধা তালিকা)  */}
      {/* ===================================================================== */}
      {activeSubTab === 'exams' && (
        <div className="space-y-6">
          {/* Term Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-700">টার্ম পরীক্ষা নির্বাচন করুন:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-900"
              >
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nameBn || ex.nameEn} ({ex.session})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>মার্কশিট প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Student Marksheet Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    {student.nameBn || student.nameEn} - {currentExam?.nameBn || currentExam?.nameEn || 'পরীক্ষার গ্রেডশিট'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    রোল: {student.roll} • আইডি: {student.studentId} • শ্রেণি: {student.className}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">শ্রেণি মেধা স্থান</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-blue-950">
                    {toBnNumber(currentStudentRank)}ম স্থান
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">বিষয় (Subject)</th>
                      <th className="py-2.5 px-3">লিখিত</th>
                      <th className="py-2.5 px-3">এমসিকিউ</th>
                      <th className="py-2.5 px-3">মোট</th>
                      <th className="py-2.5 px-3">গ্রেড</th>
                      <th className="py-2.5 px-3">জিপিএ (GPA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {studentMarks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          এই পরীক্ষার জন্য এখনও মার্কস এন্ট্রি করা হয়নি।
                        </td>
                      </tr>
                    ) : (
                      studentMarks.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{m.subjectName}</td>
                          <td className="py-2.5 px-3 text-slate-700">{toBnNumber(m.written)}</td>
                          <td className="py-2.5 px-3 text-slate-700">{toBnNumber(m.mcq || 0)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{toBnNumber(m.total)}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                m.grade === 'A+' || m.grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.grade === 'F'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{m.gpa.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {studentMarks.length > 0 && (() => {
                    const hasFail = studentMarks.some((m) => m.grade === 'F');
                    const gpaRes = calculateTotalGPA(studentMarks.map((m) => m.gpa), hasFail);
                    const totalScore = studentMarks.reduce((sum, m) => sum + m.total, 0);
                    const isPassed = !hasFail && gpaRes.status === 'PASSED';

                    return (
                      <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200 text-xs">
                        <tr>
                          <td className="py-3 px-3">সর্বমোট / সামগ্রিক ফলাফল:</td>
                          <td colSpan={2} className="py-3 px-3 text-slate-600">
                            {studentMarks.length} টি বিষয়
                          </td>
                          <td className="py-3 px-3 text-emerald-700 font-black text-sm">
                            {toBnNumber(totalScore)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isPassed ? `${gpaRes.overallGrade} (উত্তীর্ণ)` : `${gpaRes.overallGrade} (অনুত্তীর্ণ)`}
                            </span>
                          </td>
                          <td className={`py-3 px-3 font-mono font-black text-sm ${isPassed ? 'text-indigo-700' : 'text-rose-600'}`}>
                            {gpaRes.totalGPA.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>
            </div>

            {/* Right: Student's Personal Exam Performance & Grade Analytics (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-white text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>আমার ফলাফল ও গ্রেড বিশ্লেষণ (My Performance)</span>
                  </h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    {student.nameBn || student.nameEn} • রোল: {student.roll} ({student.className})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-300 block font-bold uppercase">আমার মেধা স্থান</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-900 inline-block shadow-xs">
                    {toBnNumber(currentStudentRank)}ম স্থান
                  </span>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>🔒 প্রাতিষ্ঠানিক গোপনীয়তা রক্ষা: প্রতিটি শিক্ষার্থী শুধুমাত্র তার নিজের পরীক্ষার গ্রেড ও ফলাফল দেখতে পারে।</span>
              </div>

              {/* Subject Breakdown & Visual Progress */}
              <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-h-[380px]">
                <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>বিষয়ভিত্তিক নম্বর ও গ্রেড অর্জনের হার:</span>
                </h5>

                {studentMarks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    এখনও কোনো বিষয়ের নম্বর এন্ট্রি সম্পন্ন হয়নি।
                  </div>
                ) : (
                  studentMarks.map((m) => {
                    const pct = Math.min(100, Math.round(m.total));
                    return (
                      <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-black text-slate-900">{m.subjectName}</strong>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              m.grade === 'A+' || m.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.grade === 'F'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.grade} (GPA {m.gpa.toFixed(2)})
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {toBnNumber(m.total)} <span className="text-[10px] text-slate-400 font-normal">/ ১০০</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              m.grade === 'A+'
                                ? 'bg-emerald-500'
                                : m.grade === 'A'
                                ? 'bg-teal-500'
                                : m.grade === 'F'
                                ? 'bg-rose-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>লিখিত: {toBnNumber(m.written)} • MCQ: {toBnNumber(m.mcq || 0)}</span>
                          <span className="font-bold text-slate-700">অর্জিত: {toBnNumber(pct)}%</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Overall Performance Card */}
                {studentMarks.length > 0 && (() => {
                  const hasFail = studentMarks.some((m) => m.grade === 'F');
                  const gpaRes = calculateTotalGPA(studentMarks.map((m) => m.gpa), hasFail);
                  const isPassed = !hasFail && gpaRes.status === 'PASSED';

                  return (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-black text-slate-900">
                        <span>সামগ্রিক শিক্ষাবর্ষ ফলাফল:</span>
                        <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                          {isPassed ? `উত্তীর্ণ (GPA ${gpaRes.totalGPA.toFixed(2)})` : `অনুত্তীর্ণ (${gpaRes.overallGrade})`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {isPassed
                          ? 'অভিনন্দন! আপনার সার্বিক ফলাফল চমৎকার। এই ধারাবাহিকতা ধরে রাখতে নিয়মিত পড়াশোনা অব্যাহত রাখুন।'
                          : 'মনোযোগ দিয়ে দুর্বল বিষয়গুলোতে বিশেষ প্রস্তুতি ও শিক্ষক সহায়তার পরামর্শ দেওয়া হচ্ছে।'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FEATURE 6: FEE JOMAR STATEMENT (ফি স্টেটমেন্ট ও বকেয়া)                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'fees' && (
        <div className="space-y-6">
          {/* Fee Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">মোট নির্ধারিত ফি</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {formatTaka(totalFeeBilled)}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-xs text-emerald-700 font-bold block">মোট পরিশোধিত</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {formatTaka(totalFeePaid)}
              </span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-xs text-rose-700 font-bold block">মোট বকেয়া</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {formatTaka(totalFeeDue)}
              </span>
            </div>
          </div>

          {/* Section 1: বকেয়া ফি বিবরণী (Due Ledger) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-rose-50/40">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-rose-600" />
                  <span>বকেয়া ফি বিবরণী (Due Ledger) - {student.nameBn || student.nameEn}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  কোন কোন ফি খাতে কত টাকা বকেয়া রয়েছে ও জমার শেষ তারিখ
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                  {toBnNumber(studentDues.length)} টি বকেয়া
                </span>
                {totalFeeDue > 0 && (
                  <button
                    onClick={() => setPayingDue('all')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>সকল বকেয়া পরিশোধ ({formatTaka(totalFeeDue)})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ফি এর খাত (Fee Title)</th>
                    <th className="py-3 px-4">সেশন / মাস</th>
                    <th className="py-3 px-4">জমার শেষ তারিখ</th>
                    <th className="py-3 px-4">বকেয়ার পরিমাণ</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentDues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-emerald-700 font-bold">
                        🎉 আলহামদুলিল্লাহ! এই শিক্ষার্থীর কোনো বকেয়া ফি নেই।
                      </td>
                    </tr>
                  ) : (
                    studentDues.map((due) => (
                      <tr key={due.id} className="hover:bg-rose-50/30">
                        <td className="py-3 px-4 font-bold text-slate-900">{due.headName}</td>
                        <td className="py-3 px-4 text-slate-600">{due.month || '2026'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{formatDate(due.dueDate || '2026-10-30')}</td>
                        <td className="py-3 px-4 font-black text-rose-700 text-sm">{formatTaka(due.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            due.isOverdue
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {due.isOverdue ? 'মেয়াদোত্তীর্ণ' : 'বকেয়া'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setPayingDue(due)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                          >
                            জমা দিন
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {studentDues.length > 0 && (
              <div className="p-4 bg-rose-50/60 border-t border-rose-100 flex items-center justify-between text-xs font-black">
                <span className="text-slate-700">সর্বমোট বকেয়া (GRAND TOTAL DUE):</span>
                <span className="text-base text-rose-700">{formatTaka(totalFeeDue)}</span>
              </div>
            )}
          </div>

          {/* Section 1.5: অনলাইন পেমেন্ট রিকোয়েস্ট ও অনুমোদন স্থিতি (Online Payment Requests & Status) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    অনলাইন পেমেন্ট রিকোয়েস্ট ও অনুমোদন স্থিতি (bKash & Nagad Requests)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    বিকাশ বা নগদ-এ পেমেন্ট রিকোয়েস্ট দেওয়ার পর স্কুল প্রশাসন ট্রানজেকশন যাচাই করে অনুমোদন দিলে বকেয়া বাদ যাবে এবং মানি রসিদ সক্রিয় হবে।
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs self-start sm:self-auto">
                মোট আবেদন: {toBnNumber(studentOnlineRequests.length)}টি
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">রিকোয়েস্ট আইডি</th>
                    <th className="py-3 px-4">ফি এর বিবরণ</th>
                    <th className="py-3 px-4">মাধ্যম</th>
                    <th className="py-3 px-4">প্রেরক নম্বর</th>
                    <th className="py-3 px-4">ট্রানজেকশন আইডি (TrxID)</th>
                    <th className="py-3 px-4 text-right">টাকা</th>
                    <th className="py-3 px-4 text-center">অনুমোদন স্থিতি</th>
                    <th className="py-3 px-4 text-right">রসিদ / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {studentOnlineRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        এখনও বিকাশ বা নগদ-এ কোনো অনলাইন ফি জমার আবেদন করা হয়নি। বকেয়া ফি-এর পাশে 'জমা দিন' বাটনে ক্লিক করে বিকাশ/নগদে ফি জমা দিন।
                      </td>
                    </tr>
                  ) : (
                    studentOnlineRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-600">{formatDate(req.requestDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{req.receiptNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{req.feeTitle}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              req.paymentMethod === 'bKash'
                                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                : 'bg-orange-100 text-orange-700 border border-orange-200'
                            }`}
                          >
                            {req.paymentMethod === 'bKash' ? 'বিকাশ (bKash)' : 'নগদ (Nagad)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{req.senderPhone}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 select-all">{req.transactionId}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatTaka(req.amount)}</td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'pending' && (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                🟡 অপেক্ষমাণ (Pending)
                              </span>
                              <span className="text-[9px] text-amber-700 mt-0.5">স্কুল কর্তৃপক্ষ যাচাই করছে</span>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🟢 অনুমোদিত (Approved)
                              </span>
                              {req.approvedAt && (
                                <span className="text-[9px] text-emerald-600 mt-0.5">{formatDate(req.approvedAt)}</span>
                              )}
                            </div>
                          )}
                          {req.status === 'rejected' && (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                🔴 বাতিল (Rejected)
                              </span>
                              {req.rejectedReason && (
                                <span className="text-[10px] text-rose-700 font-bold mt-0.5 max-w-xs text-center">
                                  কারণ: {req.rejectedReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'approved' ? (
                            <button
                              onClick={() => {
                                setPaymentSuccessReceipt({
                                  receiptNo: req.receiptNo,
                                  amount: req.amount,
                                  feeTitle: req.feeTitle,
                                  date: req.approvedAt || req.requestDate,
                                  method: req.paymentMethod,
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                            >
                              রসিদ প্রিন্ট
                            </button>
                          ) : req.status === 'pending' ? (
                            <span className="text-[11px] text-amber-700 font-medium italic">অনুমোদনের অপেক্ষায়</span>
                          ) : (
                            <span className="text-[11px] text-rose-600 font-medium">প্রত্যাখ্যাত</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: পরিশোধিত ফি বিবরণী ও রসিদ (Invoices & Receipts) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>ফি জমার বিবরণী ও রসিদ ({student.nameBn || student.nameEn})</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                পরিশোধ সংখ্যা: {toBnNumber(unifiedPaidRecords.length)} টি
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ইনভয়েস / রসিদ নং</th>
                    <th className="py-3 px-4">ফি এর বিবরণ / মাস</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">পরিশোধিত টাকা</th>
                    <th className="py-3 px-4">মাধ্যম</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">রসিদ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {unifiedPaidRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        এখনও কোনো ফি জমা বা ইনভয়েস পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    unifiedPaidRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          <div>{item.receiptNo}</div>
                          {item.invoiceNo && item.invoiceNo !== item.receiptNo && (
                            <div className="text-[10px] text-slate-400 font-normal">ইনভয়েস: {item.invoiceNo}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.feeTitle}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">{formatTaka(item.amount)}</td>
                        <td className="py-3 px-4 text-slate-600">{item.method}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setPaymentSuccessReceipt({
                                receiptNo: item.receiptNo,
                                amount: item.amount,
                                feeTitle: item.feeTitle,
                                date: item.date,
                                method: item.method,
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                          >
                            রসিদ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: MY STUDENT DIGITAL ID CARD (FRONT & PURE WHITE BACK)           */}
      {/* ===================================================================== */}
      {activeSubTab === 'id_card' && (() => {
        const studentStyles = getStudentCardStyles();

        return (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
              {/* View Mode */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIdCardViewMode('both')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    idCardViewMode === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  উভয় অংশ (Front & Back)
                </button>
                <button
                  type="button"
                  onClick={() => setIdCardViewMode('front')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    idCardViewMode === 'front' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সামনের অংশ (Front)
                </button>
                <button
                  type="button"
                  onClick={() => setIdCardViewMode('back')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    idCardViewMode === 'back' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  পেছনের অংশ (Back Side - White & Black QR)
                </button>
              </div>

              {/* Theme Template */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 px-2 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>কালার থিম:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIdCardTemplate('classic_academic')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    idCardTemplate === 'classic_academic' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 bg-white/70'
                  }`}
                >
                  ১. ক্লাসিক ব্লু
                </button>
                <button
                  type="button"
                  onClick={() => setIdCardTemplate('executive_royal')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    idCardTemplate === 'executive_royal' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 bg-white/70'
                  }`}
                >
                  ২. রয়্যাল গোল্ড
                </button>
                <button
                  type="button"
                  onClick={() => setIdCardTemplate('modern_emerald')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    idCardTemplate === 'modern_emerald' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 bg-white/70'
                  }`}
                >
                  ৩. মডার্ন এমারেল্ড
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {myIdQrUrl && (
                  <a
                    href={myIdQrUrl}
                    download={`QR_Attendance_${student.studentId}_${student.nameEn.replace(/\s+/g, '_')}.png`}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>কিউআর ডাউনলোড</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  আপনার <strong>স্মার্ট স্টুডেন্ট আইডি কার্ড</strong>। গেট কিয়স্কে পেছনের অংশের কিউআর কোড স্ক্যান করে সহজেই স্বয়ংক্রিয় উপস্থিতি নিশ্চিত করতে পারবেন।
                </span>
              </div>
              <span className="font-mono font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full text-[11px]">
                ID: {student.studentId}
              </span>
            </div>

            {/* Cards Display Grid */}
            <div className="flex flex-wrap items-center justify-center gap-8 py-4">
              {/* 1. FRONT SIDE */}
              {(idCardViewMode === 'both' || idCardViewMode === 'front') && (
                <div className={`w-[320px] h-[490px] bg-white rounded-2xl overflow-hidden relative font-sans text-slate-900 flex flex-col justify-between transition-all ${studentStyles.cardBorder} print:shadow-none print:border-2 print:border-black`}>
                  {/* Header */}
                  <div>
                    <div className={`${studentStyles.headerBg} p-3 text-center relative`}>
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                          {school?.logoUrl ? (
                            <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Building className="w-5 h-5 text-blue-700" />
                          )}
                        </div>
                        <div className="text-left leading-tight">
                          <h4 className="font-extrabold text-[11px] text-white leading-tight">{school?.nameBn || 'বিদ্যালয়ের নাম'}</h4>
                          <h5 className="font-bold text-[9px] text-blue-100 uppercase">{school?.nameEn || 'SCHOOL NAME'}</h5>
                        </div>
                      </div>
                      <div className="text-[8px] opacity-85 flex items-center justify-center space-x-1.5 font-mono">
                        <span>EIIN: {school?.eiin || '108500'}</span>
                        <span>•</span>
                        <span>Session: {student.session || school?.currentSession || '2026'}</span>
                      </div>
                    </div>

                    {/* Ribbon */}
                    <div className={`${studentStyles.ribbonBg} py-0.5 text-center text-[9px] uppercase tracking-wider flex items-center justify-center space-x-1`}>
                      <User className="w-2.5 h-2.5" />
                      <span>STUDENT IDENTITY CARD</span>
                    </div>

                    {/* Body */}
                    <div className="p-3 flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className={`w-20 h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center ${studentStyles.photoBorder}`}>
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.nameEn} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center text-2xl font-black">
                              {student.nameEn.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center w-full pb-1 mb-1 border-b border-slate-200">
                        <h3 className={`font-black text-xs uppercase ${studentStyles.nameColor}`}>{student.nameEn}</h3>
                        <p className={`text-[10px] font-semibold text-slate-500`}>{student.nameBn}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <span className={`inline-block px-2 py-0.2 rounded-full font-bold text-[9px] border ${studentStyles.badgeBg}`}>
                            Class: {student.className} • Roll: {student.roll}
                          </span>
                          {student.section && (
                            <span className="inline-block px-2 py-0.2 rounded-full font-bold text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                              Section: {student.section}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full text-[10px] space-y-1 px-1">
                        <div className="flex justify-between py-0.2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Student ID:</span>
                          <span className="font-bold font-mono text-blue-900">{student.studentId}</span>
                        </div>

                        {['Class 9', 'Class 10'].includes(student.className) ? (
                          <div className="flex justify-between items-center py-0.5 px-1.5 bg-amber-50 rounded border border-amber-200">
                            <span className="text-amber-900 font-bold text-[9.5px]">Academic Group:</span>
                            <span className="px-2 py-0.2 bg-amber-500 text-slate-950 font-black rounded text-[9.5px] uppercase">
                              {student.group || 'Science'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between py-0.2 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Shift:</span>
                            <span className="font-semibold text-slate-800">{student.shift || 'Morning'}</span>
                          </div>
                        )}

                        <div className="flex justify-between py-0.2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Blood Group:</span>
                          <span className="font-bold text-rose-600">{student.bloodGroup || 'B+'}</span>
                        </div>
                        <div className="flex justify-between py-0.2 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Guardian Phone:</span>
                          <span className="font-mono text-slate-800 font-bold">{student.guardianPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Front Footer with Signatures */}
                  <div>
                    <div className="w-full px-3.5 pb-2 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-center">
                        <div className="font-serif italic text-[10px] text-slate-700 border-b border-slate-300 pb-0.5 w-20">
                          Cardholder
                        </div>
                        <span className="text-[7.5px] text-slate-500 block uppercase font-medium">
                          Cardholder Signature
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-serif italic text-[10px] text-blue-900 border-b border-slate-400 pb-0.5 w-24 truncate">
                          {school?.principalNameEn || 'Principal'}
                        </div>
                        <span className="text-[7.5px] text-slate-500 block uppercase font-medium">
                          Principal Signature
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-200 py-1 text-center text-[7.5px] text-slate-500">
                      Institutional Property • Helpline: {school?.phone || '+880 1700-000000'}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BACK SIDE: STRICTLY PURE WHITE BACKGROUND, SOLID BLACK TEXT, BLACK QR & GUARDIAN MOBILE */}
              {(idCardViewMode === 'both' || idCardViewMode === 'back') && (
                <div className="w-[320px] h-[490px] bg-white text-black rounded-2xl border-2 border-black shadow-xl overflow-hidden flex flex-col justify-between font-sans print:border-2 print:border-black p-3.5 relative">
                  {/* Back Top Header */}
                  <div className="border-b-2 border-black pb-2 text-center">
                    <h4 className="font-black text-[11px] uppercase tracking-wider text-black">
                      {school?.nameEn || 'INSTITUTION IDENTITY'}
                    </h4>
                    <p className="font-bold text-[8.5px] text-black tracking-widest uppercase">
                      STUDENT IDENTITY CARD • BACK SIDE
                    </p>
                  </div>

                  {/* Center: Pitch Black QR Code & Scan Info */}
                  <div className="flex flex-col items-center justify-center my-1 text-center">
                    <div className="p-1 bg-white rounded-xl border-2 border-black shadow-2xs">
                      {myIdQrUrl ? (
                        <img src={myIdQrUrl} alt="Attendance QR" className="w-28 h-28 object-contain" />
                      ) : (
                        <div className="w-28 h-28 bg-white border border-black flex items-center justify-center text-xs font-mono font-bold text-black">
                          QR CODE
                        </div>
                      )}
                    </div>
                    <span className="mt-1 font-mono font-black text-[11px] text-black tracking-wider">
                      STUDENT ID: {student.studentId}
                    </span>
                    <span className="text-[8px] font-bold text-black uppercase tracking-wider">
                      Scan at Smart Gate Kiosk for Attendance
                    </span>
                  </div>

                  {/* PROMINENT GUARDIAN MOBILE & EMERGENCY CONTACT BOX (User requested: QR Mobile thakbe) */}
                  <div className="bg-white border-2 border-black rounded-xl p-2 text-black space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-black" />
                        <span>Emergency Guardian Mobile:</span>
                      </span>
                      <span className="font-mono font-black text-[11px] text-black">{student.guardianPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-black">
                      <span className="text-black font-medium">Father's Name:</span>
                      <span className="font-bold text-black truncate max-w-[170px]">{student.fatherNameEn || student.fatherNameBn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-black font-medium">Mother's Name:</span>
                      <span className="font-bold text-black truncate max-w-[170px]">{student.motherNameEn || student.motherNameBn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[8.5px]">
                      <span className="text-black font-medium">Present Address:</span>
                      <span className="text-black font-semibold truncate max-w-[170px]">{student.presentAddress || 'Dhaka, Bangladesh'}</span>
                    </div>
                  </div>

                  {/* Student Card Rules & Return Note */}
                  <div className="space-y-1 text-[8px] text-black leading-tight border-t border-black pt-2">
                    <p className="font-bold uppercase tracking-wider text-[8.5px]">Terms & Conditions:</p>
                    <ol className="list-decimal pl-3 space-y-0.5">
                      <li>Carrying this identity card is mandatory within the school campus.</li>
                      <li>Scan QR code at the smart gate kiosk for automated daily attendance.</li>
                      <li>Institutional property and non-transferable. Report loss to office immediately.</li>
                    </ol>
                    <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7.5px] font-semibold">
                      <span>If found, return to: {school?.nameEn || 'School Office'}</span>
                      <span>Helpline: {school?.phone || '+880 1700-000000'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* STUDENT SUBMISSION MODAL                                              */}
      {/* ===================================================================== */}
      {submittingHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs text-slate-900 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>বাড়ির কাজ জমা দিন</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {submittingHw.title} ({submittingHw.subjectName})
                </p>
              </div>
              <button onClick={() => setSubmittingHw(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {submissionMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submissionMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitHomework} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  হস্তলিখিত খাতার ছবি তুলুন (ক্যামেরা):
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-md transition-all active:scale-95">
                    <Camera className="w-5 h-5 text-amber-300" />
                    <span className="text-sm">ক্যামেরা দিয়ে ছবি তুলুন (Take Photo with Camera)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {submissionImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                    {submissionImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group shadow-xs">
                        <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSubmissionImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md"
                          title="ছবি মুছুন"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                          পৃষ্ঠা {toBnNumber(idx + 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  লিখিত উত্তর (ঐচ্ছিক):
                </label>
                <textarea
                  rows={3}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="আপনার লিখিত সমাধান বা কোনো মন্তব্য এখানে লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSubmittingHw(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'জমা সম্পন্ন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ONLINE FEE PAYMENT MODAL (STRICTLY bKash & Nagad ONLY - NO CASH)     */}
      {/* ===================================================================== */}
      {payingDue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>অনলাইন ফি পরিশোধ (বিকাশ ও নগদ)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {payingDue === 'all' ? 'সকল বকেয়া ফি পরিশোধ' : payingDue.headName}
                </p>
              </div>
              <button onClick={() => setPayingDue(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rose-700 font-bold block uppercase">পরিশোধযোগ্য বকেয়া টাকা</span>
                  <span className="text-xl font-black text-rose-800">
                    {formatTaka(payingDue === 'all' ? totalFeeDue : payingDue.amount)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                  {payingDue === 'all' ? `${toBnNumber(studentDues.length)}টি ফি খাত` : 'একক ফি'}
                </span>
              </div>

              {/* MFS Method Selection - Only bKash & Nagad */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  অনলাইন মাধ্যম নির্বাচন করুন (বিকাশ / নগদ):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bKash')}
                    className={`p-3 rounded-xl border text-center font-black transition-all flex items-center justify-center space-x-2 ${
                      paymentMethod === 'bKash'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-400 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-pink-600 inline-block"></span>
                    <span className="text-sm">বিকাশ (bKash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Nagad')}
                    className={`p-3 rounded-xl border text-center font-black transition-all flex items-center justify-center space-x-2 ${
                      paymentMethod === 'Nagad'
                        ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span>
                    <span className="text-sm">নগদ (Nagad)</span>
                  </button>
                </div>
              </div>

              {/* School MFS Number and Instructions Card */}
              <div className={`p-3 rounded-xl border space-y-1.5 ${
                paymentMethod === 'bKash' ? 'bg-pink-50/70 border-pink-200' : 'bg-orange-50/70 border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">
                    স্কুলের নির্ধারিত {paymentMethod === 'bKash' ? 'বিকাশ' : 'নগদ'} নম্বর:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white border border-slate-200 text-slate-800">
                    {paymentMethod === 'bKash' ? mfsSettings.bkashType : mfsSettings.nagadType}
                  </span>
                </div>
                <div className="text-base font-black font-mono tracking-wider select-all text-slate-900">
                  {paymentMethod === 'bKash' ? mfsSettings.bkashNumber : mfsSettings.nagadNumber}
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                  {mfsSettings.instructionsBn ||
                    'উপরের নম্বরে টাকা পাঠানোর পর প্রেরক নম্বর ও ট্রানজেকশন আইডি (TrxID) নিচে লিখে সাবমিট করুন।'}
                </p>
              </div>

              {/* Sender Phone Number */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  যে নম্বর থেকে টাকা পাঠিয়েছেন (প্রেরক মোবাইল নম্বর) *:
                </label>
                <input
                  type="text"
                  required
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* TrxID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ট্রানজেকশন আইডি (TrxID) *:
                </label>
                <input
                  type="text"
                  required
                  value={paymentTrxId}
                  onChange={(e) => setPaymentTrxId(e.target.value)}
                  placeholder="যেমন: BK9281745 / 7G8X2K"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  পেমেন্ট জমা দেওয়ার সাথে সাথে এটি <strong>অপেক্ষমাণ (Pending)</strong> থাকবে। স্কুল প্রশাসন TrxID যাচাই করে অনুমোদন (Approve) দিলে আপনার বকেয়া বাদ যাবে এবং মানি রিসিট প্রিন্ট করতে পারবেন।
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayingDue(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isProcessingPayment ? 'আবেদন পাঠানো হচ্ছে...' : 'পেমেন্ট রিকোয়েস্ট পাঠান'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAYMENT REQUEST SUBMITTED SUCCESS MODAL                               */}
      {/* ===================================================================== */}
      {paymentRequestSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900 my-8 animate-in zoom-in-95">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Clock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-slate-900 text-base">পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে!</h3>
              <p className="text-[11px] text-slate-500">অনুমোদনের জন্য অপেক্ষমাণ (Pending Approval)</p>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">রিকোয়েস্ট আইডি:</span>
                <span className="font-mono font-bold text-blue-700">{paymentRequestSubmitted.receiptNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ফি এর বিবরণ:</span>
                <span className="font-bold text-slate-900">{paymentRequestSubmitted.feeTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>
                <span className="font-bold text-slate-900">{paymentRequestSubmitted.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">প্রেরক নম্বর:</span>
                <span className="font-mono text-slate-800">{paymentRequestSubmitted.senderPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ট্রানজেকশন আইডি:</span>
                <span className="font-mono font-bold text-blue-700 select-all">{paymentRequestSubmitted.trxId}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black">
                <span className="text-slate-800">আবেদনের পরিমাণ:</span>
                <span className="text-emerald-700 text-base">{formatTaka(paymentRequestSubmitted.amount)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
              ℹ️ স্কুল কর্তৃপক্ষ তথ্য যাচাই করে অনুমোদন (Approve) দিলে আপনার বকেয়া সমন্বয় হবে এবং মানি রিসিট প্রস্তুত হবে। আপনি এই ড্যাশবোর্ডের "অনলাইন পেমেন্ট রিকোয়েস্ট ও অনুমোদন স্থিতি" টেবিলে এর অগ্রগতি দেখতে পারবেন।
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPaymentRequestSubmitted(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                ঠিক আছে (বন্ধ করুন)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAYMENT SUCCESS RECEIPT MODAL                                         */}
      {/* ===================================================================== */}
      {paymentSuccessReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900 my-8">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="font-black text-slate-900 text-base">ফি পরিশোধ সফল হয়েছে!</h3>
              <p className="text-[11px] text-slate-500">ডিজিটাল মানি রিসিট ও ভাউচার</p>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">রসিদ নম্বর:</span>
                <span className="font-mono font-bold text-blue-700">{paymentSuccessReceipt.receiptNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">শিক্ষার্থী:</span>
                <span className="font-bold text-slate-900">{student.nameBn || student.nameEn} ({student.studentId})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">শ্রেণি ও রোল:</span>
                <span className="font-bold text-slate-900">{student.className} (রোল: {student.roll})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ফি এর বিবরণ:</span>
                <span className="font-bold text-slate-900">{paymentSuccessReceipt.feeTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>
                <span className="font-bold text-slate-900">{paymentSuccessReceipt.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">তারিখ:</span>
                <span className="font-mono text-slate-700">{formatDate(paymentSuccessReceipt.date)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black">
                <span className="text-slate-800">পরিশোধিত টাকা:</span>
                <span className="text-emerald-700 text-base">{formatTaka(paymentSuccessReceipt.amount)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPaymentSuccessReceipt(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
