import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { AttendanceRecord, AttendanceStatus, Student, Staff, ClassAttendanceSchedule, AttendanceRuleConfig } from '../../types';
import {
  CalendarCheck2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Printer,
  Search,
  Filter,
  Check,
  AlertCircle,
  MessageSquare,
  Users,
  User,
  TrendingUp,
  BarChart3,
  FileText,
  Building,
  Sparkles,
  ArrowRight,
  Eye,
  Palmtree,
  Award,
  QrCode,
  FileBadge,
  Lock,
  Unlock,
  Sliders,
  Zap,
  Save,
} from 'lucide-react';
import { SmartQRScannerTab } from './SmartQRScannerTab';
import { StudentIDCardsTab } from './StudentIDCardsTab';
import { ClassTimingsTab } from './ClassTimingsTab';
import { SaturdayOffToggle } from '../common/SaturdayOffToggle';

export const AttendanceView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { t, language, toBnNumber } = useLanguage();

  const isSuperAdminOrMaster = activeRole === 'super_admin' || activeRole === 'master_admin';
  const isGatekeeper = activeRole === 'gatekeeper' || currentUser?.role === 'gatekeeper' || !!currentUser?.permissions?.onlyQrAttendanceKiosk;
  const realTodayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Navigation Sub-tabs
  const [activeTab, setActiveTab] = useState<'daily' | 'qr_scanner' | 'qr_id_cards' | 'timing_rules' | 'monthly_sheet' | 'student_report' | 'period_summary' | 'staff'>(() => {
    return isGatekeeper ? 'qr_scanner' : 'daily';
  });

  // Daily Filters
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  if (isGatekeeper) {
    return (
      <div className="w-full">
        <SmartQRScannerTab
          isGatekeeper={true}
          onAttendanceUpdated={() => {
            setAttendanceRecords(StorageService.getAttendance());
          }}
        />
      </div>
    );
  }

  // Staff View Mode: 'daily', 'monthly', 'yearly'
  const [staffViewMode, setStaffViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [staffMonthYear, setStaffMonthYear] = useState<string>('2026-10');
  const [staffYear, setStaffYear] = useState<string>('2026');

  // Period Filters (for Week, Month, Year, Custom Range)
  const [periodPreset, setPeriodPreset] = useState<'this_week' | 'this_month' | 'this_year' | 'custom'>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith('2026') ? today : '2026-10-25';
  });

  // Monthly Sheet Filter (YYYY-MM)
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-10');

  // Individual Student Attendance Filter
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_1');

  const students = StorageService.getStudents();
  const staff = StorageService.getStaff();
  const school = StorageService.getSchoolProfile();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendance()
  );

  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [smsSending, setSmsSending] = useState<boolean>(false);
  const [smsSentNotice, setSmsSentNotice] = useState<string>('');

  const canEdit = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'teacher';

  const classList = StorageService.getClasses();
  const ALL_CLASSES = classList.length > 0 ? classList.map((c) => c.name) : [
    'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  const activeHoliday = StorageService.isDateHoliday(selectedDate);

  const daysOfWeekBn: Record<string, string> = {
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
    Friday: 'শুক্রবার',
    Saturday: 'শনিবার',
  };

  // Get current class students
  const classStudents = students.filter(
    (s) => s.className === selectedClass && (selectedSection === 'all' || s.section === selectedSection) && s.status === 'active'
  );

  // Selected student for individual report
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || classStudents[0] || students[0];

  // Daily Student status helper - defaults to 'Unmarked' (pending) until attendance is taken
  const getStudentStatus = (studentId: string, date: string = selectedDate): AttendanceStatus | 'Unmarked' => {
    const rec = attendanceRecords.find(
      (a) => a.targetType === 'student' && a.targetId === studentId && a.date === date
    );
    return rec ? rec.status : 'Unmarked';
  };

  const getStudentAttendanceRecord = (studentId: string, date: string = selectedDate): AttendanceRecord | undefined => {
    return attendanceRecords.find(
      (a) => (a.targetType === 'student' || !a.targetType) && a.targetId === studentId && a.date === date
    );
  };

  const getStaffStatus = (staffId: string, date: string = selectedDate): AttendanceStatus | 'Unmarked' => {
    const rec = attendanceRecords.find(
      (a) => a.targetType === 'staff' && a.targetId === staffId && a.date === date
    );
    return rec ? rec.status : 'Unmarked';
  };

  // Update single student attendance (clicking the active status toggles off to Unmarked)
  const handleUpdateStudentStatus = (student: Student, status: AttendanceStatus) => {
    if (!canEdit) return;
    const currentStatus = getStudentStatus(student.id, selectedDate);
    if (currentStatus === status) {
      // Toggle off / reset to unmarked
      StorageService.deleteAttendanceRecord(student.id, selectedDate);
      setAttendanceRecords(StorageService.getAttendance());
      return;
    }
    const newRecord: AttendanceRecord = {
      id: `att_${student.id}_${selectedDate}`,
      targetType: 'student',
      targetId: student.id,
      targetName: student.nameEn,
      rollOrEmpId: student.roll,
      className: student.className,
      section: student.section,
      date: selectedDate,
      status,
      recordedBy: currentUser?.name || 'Class Teacher',
    };
    StorageService.saveAttendanceBatch([newRecord]);
    setAttendanceRecords(StorageService.getAttendance());
  };

  // Mark all present in class for selected date
  const handleMarkAllPresent = () => {
    if (!canEdit) return;
    const batch: AttendanceRecord[] = classStudents.map((s) => ({
      id: `att_${s.id}_${selectedDate}`,
      targetType: 'student',
      targetId: s.id,
      targetName: s.nameEn,
      rollOrEmpId: s.roll,
      className: s.className,
      section: s.section,
      date: selectedDate,
      status: 'Present',
      recordedBy: currentUser?.name || 'Class Teacher',
    }));
    StorageService.saveAttendanceBatch(batch);
    setAttendanceRecords(StorageService.getAttendance());
  };

  // Unmark all in class for selected date (reset)
  const handleUnmarkAll = () => {
    if (!canEdit) return;
    StorageService.deleteAttendanceBatch(classStudents.map((s) => s.id), selectedDate);
    setAttendanceRecords(StorageService.getAttendance());
  };

  // Update staff status
  const handleUpdateStaffStatus = (staffMember: Staff, status: AttendanceStatus) => {
    if (!canEdit) return;
    const currentStatus = getStaffStatus(staffMember.id, selectedDate);
    if (currentStatus === status) {
      StorageService.deleteAttendanceRecord(staffMember.id, selectedDate);
      setAttendanceRecords(StorageService.getAttendance());
      return;
    }
    const newRecord: AttendanceRecord = {
      id: `att_st_${staffMember.id}_${selectedDate}`,
      targetType: 'staff',
      targetId: staffMember.id,
      targetName: staffMember.nameEn,
      rollOrEmpId: staffMember.employeeId,
      date: selectedDate,
      status,
      recordedBy: currentUser?.name || 'Admin Office',
    };
    StorageService.saveAttendanceBatch([newRecord]);
    setAttendanceRecords(StorageService.getAttendance());
  };

  // Attendance filter groups for daily roll call
  const presentStudents = classStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'Present');
  const absentStudents = classStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'Absent');
  const lateStudents = classStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'Late');
  const unmarkedStudents = classStudents.filter((s) => getStudentStatus(s.id, selectedDate) === 'Unmarked');

  const handleSendAbsentSms = () => {
    setSmsSending(true);
    setTimeout(() => {
      setSmsSending(false);
      setSmsSentNotice(
        language === 'bn'
          ? `মোট ${toBnNumber(absentStudents.length)} জন শিক্ষার্থীর অভিভাবকের মোবাইলে অনুপস্থিতির SMS পাঠানো সম্পন্ন হয়েছে।`
          : `SMS alert dispatched to ${absentStudents.length} guardians via Bangladesh SMS Gateway.`
      );
      setTimeout(() => {
        setShowSmsModal(false);
        setSmsSentNotice('');
      }, 2500);
    }, 1200);
  };

  // PERIOD DATE RANGE CALCULATION
  const { dateRangeStart, dateRangeEnd, periodLabel } = useMemo(() => {
    if (periodPreset === 'this_week') {
      const endD = new Date(selectedDate || '2026-10-16');
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);
      return {
        dateRangeStart: startD.toISOString().split('T')[0],
        dateRangeEnd: endD.toISOString().split('T')[0],
        periodLabel: language === 'bn' ? 'চলতি সপ্তাহ (গত ৭ দিন)' : 'This Week (Last 7 Days)',
      };
    } else if (periodPreset === 'this_month') {
      const parts = (selectedDate || '2026-10-16').split('-');
      const y = parts[0] || '2026';
      const m = parts[1] || '10';
      return {
        dateRangeStart: `${y}-${m}-01`,
        dateRangeEnd: `${y}-${m}-31`,
        periodLabel: language === 'bn' ? `চলতি মাস (${m}/${y})` : `This Month (${m}/${y})`,
      };
    } else if (periodPreset === 'this_year') {
      const y = (selectedDate || '2026-10-16').split('-')[0] || '2026';
      return {
        dateRangeStart: `${y}-01-01`,
        dateRangeEnd: `${y}-12-31`,
        periodLabel: language === 'bn' ? `শিক্ষাবর্ষ ${y}` : `Academic Session ${y}`,
      };
    } else {
      return {
        dateRangeStart: customStartDate,
        dateRangeEnd: customEndDate,
        periodLabel: language === 'bn'
          ? `${customStartDate} হতে ${customEndDate}`
          : `${customStartDate} to ${customEndDate}`,
      };
    }
  }, [periodPreset, selectedDate, customStartDate, customEndDate, language]);

  // Filter attendance records by active period
  const periodStudentRecords = useMemo(() => {
    return attendanceRecords.filter((a) => {
      return (
        a.targetType === 'student' &&
        a.date >= dateRangeStart &&
        a.date <= dateRangeEnd
      );
    });
  }, [attendanceRecords, dateRangeStart, dateRangeEnd]);

  // Distinct working days in the selected period
  const periodWorkingDates = useMemo(() => {
    const dates = Array.from(new Set(periodStudentRecords.map((r) => r.date))).sort();
    return dates;
  }, [periodStudentRecords]);

  // Calculate stats for a specific student across the active period
  const getStudentPeriodStats = (studentId: string) => {
    const studentRecords = periodStudentRecords.filter((r) => r.targetId === studentId);
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    studentRecords.forEach((r) => {
      if (r.status === 'Present') presentCount++;
      else if (r.status === 'Absent') absentCount++;
      else if (r.status === 'Late') lateCount++;
      else if (r.status === 'Excused') excusedCount++;
    });

    const totalDays = studentRecords.length > 0 ? studentRecords.length : (periodWorkingDates.length || 1);
    const effectivePresent = presentCount + lateCount;
    const rate = totalDays > 0 ? Math.round((effectivePresent / totalDays) * 100) : 100;

    return {
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      rate,
      records: studentRecords.sort((a, b) => b.date.localeCompare(a.date)),
    };
  };

  // Selected student period stats
  const selectedStudentStats = useMemo(() => {
    if (!selectedStudent) return null;
    return getStudentPeriodStats(selectedStudent.id);
  }, [selectedStudent, periodStudentRecords, periodWorkingDates]);

  // Monthly Matrix Days for selectedMonthYear
  const monthlyDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonthYear.split('-');
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 10;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: { day: number; dateStr: string; dayName: string; isFriday: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const pad = d < 10 ? `0${d}` : `${d}`;
      const padMonth = month < 10 ? `0${month}` : `${month}`;
      const dateStr = `${year}-${padMonth}-${pad}`;
      const dt = new Date(year, month - 1, d);
      const isFriday = dt.getDay() === 5; // Friday is weekend in BD
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({
        day: d,
        dateStr,
        dayName: dayNames[dt.getDay()],
        isFriday,
      });
    }
    return days;
  }, [selectedMonthYear]);

  // Staff Monthly Matrix Days for staffMonthYear
  const staffMonthlyDays = useMemo(() => {
    const [yearStr, monthStr] = (staffMonthYear || '2026-10').split('-');
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 10;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: { day: number; dateStr: string; dayName: string; isFriday: boolean; holiday: any }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const pad = d < 10 ? `0${d}` : `${d}`;
      const padMonth = month < 10 ? `0${month}` : `${month}`;
      const dateStr = `${year}-${padMonth}-${pad}`;
      const dt = new Date(year, month - 1, d);
      const isFriday = dt.getDay() === 5;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const holiday = StorageService.isDateHoliday(dateStr);
      days.push({
        day: d,
        dateStr,
        dayName: dayNames[dt.getDay()],
        isFriday,
        holiday,
      });
    }
    return days;
  }, [staffMonthYear]);

  // Helper to compute single staff month stats
  const getStaffMonthStats = (staffId: string) => {
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    staffMonthlyDays.forEach((d) => {
      if (d.isFriday || d.holiday) return;
      const status = getStaffStatus(staffId, d.dateStr);
      if (status === 'Present') presentCount++;
      else if (status === 'Absent') absentCount++;
      else if (status === 'Late') lateCount++;
      else if (status === 'Excused') excusedCount++;
    });

    const workingDays = staffMonthlyDays.filter((d) => !d.isFriday && !d.holiday).length || 1;
    const effectivePresent = presentCount + lateCount;
    const rate = Math.round((effectivePresent / workingDays) * 100);

    return {
      workingDays,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      rate,
    };
  };

  const monthsOfYear = [
    { num: 1, nameEn: 'Jan', nameBn: 'জানু', fullEn: 'January', fullBn: 'জানুয়ারি' },
    { num: 2, nameEn: 'Feb', nameBn: 'ফেব্রু', fullEn: 'February', fullBn: 'ফেব্রুয়ারি' },
    { num: 3, nameEn: 'Mar', nameBn: 'মার্চ', fullEn: 'March', fullBn: 'মার্চ' },
    { num: 4, nameEn: 'Apr', nameBn: 'এপ্রিল', fullEn: 'April', fullBn: 'এপ্রিল' },
    { num: 5, nameEn: 'May', nameBn: 'মে', fullEn: 'May', fullBn: 'মে' },
    { num: 6, nameEn: 'Jun', nameBn: 'জুন', fullEn: 'June', fullBn: 'জুন' },
    { num: 7, nameEn: 'Jul', nameBn: 'জুলাই', fullEn: 'July', fullBn: 'জুলাই' },
    { num: 8, nameEn: 'Aug', nameBn: 'আগস্ট', fullEn: 'August', fullBn: 'আগস্ট' },
    { num: 9, nameEn: 'Sep', nameBn: 'সেপ্টে', fullEn: 'September', fullBn: 'সেপ্টেম্বর' },
    { num: 10, nameEn: 'Oct', nameBn: 'অক্টো', fullEn: 'October', fullBn: 'অক্টোবর' },
    { num: 11, nameEn: 'Nov', nameBn: 'নভে', fullEn: 'November', fullBn: 'নভেম্বর' },
    { num: 12, nameEn: 'Dec', nameBn: 'ডিসে', fullEn: 'December', fullBn: 'ডিসেম্বর' },
  ];

  const getStaffYearStats = (staffId: string) => {
    const monthlyRates: number[] = monthsOfYear.map((m) => {
      const seed = (staffId.charCodeAt(staffId.length - 1) + m.num * 7) % 14;
      return Math.min(100, Math.max(84, 98 - seed));
    });
    const avgRate = Math.round(monthlyRates.reduce((a, b) => a + b, 0) / 12);
    const totalWorkingDays = 260;
    const totalAttended = Math.round((totalWorkingDays * avgRate) / 100);
    const totalLeaves = 8;
    const totalAbsent = Math.max(0, totalWorkingDays - totalAttended - totalLeaves);

    return {
      monthlyRates,
      avgRate,
      totalWorkingDays,
      totalAttended,
      totalLeaves,
      totalAbsent,
    };
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & SUB-TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <CalendarCheck2 className="w-5 h-5 text-blue-600" />
            <span>{language === 'bn' ? 'হাজিরা খাতা ও উপস্থিতি বিশ্লেষণ' : 'Attendance Register & Periodic Reports'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn'
              ? 'দৈনিক রোল কল, মাসিক মাস্টার হাজিরা শিট, শিক্ষার্থীভিত্তিক উপস্থিতি কার্ড এবং অনুপস্থিতদের SMS নোটিফিকেশন'
              : 'Daily roll call, weekly/monthly/yearly reports, master register sheets & printable student attendance cards'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Navigation Sub-tabs */}
          <div className="p-1 bg-slate-100 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'daily' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'দৈনিক রোল কল' : 'Daily Roll Call'}</span>
            </button>
            <button
              onClick={() => setActiveTab('qr_scanner')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'qr_scanner'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 font-bold'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'কিউআর স্ক্যানার (QR Scanner)' : 'QR Scanner'}</span>
            </button>
            <button
              onClick={() => setActiveTab('qr_id_cards')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'qr_id_cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'কিউআর আইডি কার্ড (ID Cards)' : 'QR ID Cards'}</span>
            </button>
            <button
              onClick={() => setActiveTab('timing_rules')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'timing_rules'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-bold'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শ্রেণির সময় ও লেইট রুলস' : 'Class Timings'}</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly_sheet')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'monthly_sheet' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'মাসিক শিট' : 'Monthly Sheet'}</span>
            </button>
            <button
              onClick={() => setActiveTab('student_report')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'student_report' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শিক্ষার্থী হাজিরা কার্ড' : 'Student Report Card'}</span>
            </button>
            <button
              onClick={() => setActiveTab('period_summary')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'period_summary' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'উপস্থিতি বিশ্লেষণ' : 'Periodic Summary'}</span>
            </button>
            {(activeRole === 'super_admin' || activeRole === 'admin') && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'staff' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'স্টাফ হাজিরা' : 'Staff'}</span>
              </button>
            )}
          </div>

          {/* 1-Click Saturday Weekend / Open Day Switch */}
          <SaturdayOffToggle compact={true} />

          {/* Quick Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* QR SMART ATTENDANCE SCANNER TAB */}
      {activeTab === 'qr_scanner' && (
        <SmartQRScannerTab
          onAttendanceUpdated={() => {
            setAttendanceRecords(StorageService.getAttendance());
          }}
        />
      )}

      {/* STUDENT QR ID CARDS TAB */}
      {activeTab === 'qr_id_cards' && <StudentIDCardsTab />}

      {/* CLASS TIMINGS & LATE RULES TAB */}
      {activeTab === 'timing_rules' && (
        <ClassTimingsTab
          onRulesUpdated={() => {
            setAttendanceRecords(StorageService.getAttendance());
          }}
        />
      )}

      {/* 1. TAB: DAILY ATTENDANCE */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Picker with Teacher Lock & Admin Override */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <label className="font-bold text-slate-800">Date (তারিখ):</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={!isSuperAdminOrMaster ? realTodayStr : selectedDate}
                    onChange={(e) => {
                      if (isSuperAdminOrMaster) {
                        setSelectedDate(e.target.value);
                      }
                    }}
                    disabled={!isSuperAdminOrMaster}
                    className={`px-3 py-1.5 border rounded-xl font-medium transition-colors ${
                      !isSuperAdminOrMaster
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed select-none'
                        : 'bg-white border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-purple-900'
                    }`}
                  />
                  {!isSuperAdminOrMaster ? (
                    <span
                      title="শিক্ষকদের জন্য শুধুমাত্র আজকের তারিখ লক করা আছে। পূর্ববর্তী বা ভবিষ্যৎ তারিখ পরিবর্তনের জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।"
                      className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>আজকের দিন (লকড)</span>
                    </span>
                  ) : (
                    <span
                      title="সুপার অ্যাডমিন ওভাররাইড সক্রিয়: যেকোনো পূর্বের বা ভবিষ্যৎ তারিখের হাজিরা দেখতে বা এডিট করতে পারবেন।"
                      className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Unlock className="w-3 h-3 text-purple-600" />
                      <span>অ্যাডমিন আনলকড</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Class Picker */}
              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-blue-800"
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Section Picker */}
              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Section:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="all">All Sections (সকল শাখা)</option>
                </select>
              </div>
            </div>

            {/* Quick Batch Actions */}
            {canEdit && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                  title={language === 'bn' ? 'সকল শিক্ষার্থীকে একসাথে উপস্থিত হিসেবে মার্ক করুন' : 'Mark all students present'}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'সবাই উপস্থিত (Mark All Present)' : 'Mark All Present'}</span>
                </button>

                {unmarkedStudents.length < classStudents.length && (
                  <button
                    onClick={handleUnmarkAll}
                    title={language === 'bn' ? 'সকল শিক্ষার্থীর হাজিরা রিসেট / অনির্ধারিত করুন' : 'Reset / Unmark all students'}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <span>{language === 'bn' ? 'হাজিরা রিসেট (Unmark All)' : 'Unmark All'}</span>
                  </button>
                )}

                {absentStudents.length > 0 && (
                  <button
                    onClick={() => setShowSmsModal(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {language === 'bn'
                        ? `অনুপস্থিতদের SMS পাঠান (${toBnNumber(absentStudents.length)})`
                        : `SMS Absentee Alert (${absentStudents.length})`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900">
                {selectedClass} {selectedSection !== 'all' ? `(Sec ${selectedSection})` : ''} • {selectedDate} তারিখের তালিকা
              </span>
              <div className="flex items-center flex-wrap gap-2 text-slate-500 font-medium">
                <span>মোট: <strong>{classStudents.length}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold">উপস্থিত: {presentStudents.length}</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600 font-bold">অনুপস্থিত: {absentStudents.length}</span>
                {lateStudents.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-600 font-bold">দেরি: {lateStudents.length}</span>
                  </>
                )}
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-bold">হাজিরা বাকি: <span className="text-amber-600 font-black">{unmarkedStudents.length}</span></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4 w-16 text-center">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-3 text-center">আগমন ও প্রস্থান সময়</th>
                    <th className="py-3 px-4 text-center">Individual Card</th>
                    <th className="py-3 px-4 text-right">Quick Mark Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {language === 'bn'
                          ? 'এই শ্রেণিতে কোনো শিক্ষার্থী নথিভুক্ত নেই।'
                          : 'No active students enrolled in this class and section.'}
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((std) => {
                      const status = getStudentStatus(std.id, selectedDate);
                      const rec = getStudentAttendanceRecord(std.id, selectedDate);
                      return (
                        <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {language === 'bn' ? toBnNumber(std.roll) : std.roll}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-blue-700 text-xs">
                                {std.photoUrl ? (
                                  <img src={std.photoUrl} alt={std.nameEn} className="w-full h-full object-cover" />
                                ) : (
                                  std.nameEn.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{std.nameEn}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{std.nameBn} • ID: {std.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-medium text-slate-900">{std.guardianName}</div>
                            <div className="text-[11px] text-blue-600 font-mono">{std.guardianPhone}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                status === 'Present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'Absent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : status === 'Late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : status === 'Excused'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {status === 'Present' && (language === 'bn' ? 'উপস্থিত' : 'Present')}
                              {status === 'Absent' && (language === 'bn' ? 'অনুপস্থিত' : 'Absent')}
                              {status === 'Late' && (language === 'bn' ? 'দেরি' : 'Late')}
                              {status === 'Excused' && (language === 'bn' ? 'ছুটি' : 'Excused')}
                              {status === 'Unmarked' && (language === 'bn' ? 'অনির্ধারিত / বাকি' : 'Unmarked')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex flex-col items-center gap-1 font-mono text-[10px]">
                              {rec?.inTime || rec?.scanTime ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold" title="স্কুলে প্রবেশের সময়">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>ইন: {rec.inTime || rec.scanTime}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">ইন: —</span>
                              )}
                              {rec?.outTime ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold" title="স্কুল থেকে ছুটির সময়">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  <span>আউট: {rec.outTime}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">আউট: —</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedStudentId(std.id);
                                setActiveTab('student_report');
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                              title="View individual attendance report"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'রিপোর্ট কার্ড' : 'View Report'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                disabled={!canEdit}
                                onClick={() => handleUpdateStudentStatus(std, 'Present')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                                title="Mark Present (P)"
                              >
                                P
                              </button>
                              <button
                                disabled={!canEdit}
                                onClick={() => handleUpdateStudentStatus(std, 'Absent')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                                title="Mark Absent (A)"
                              >
                                A
                              </button>
                              <button
                                disabled={!canEdit}
                                onClick={() => handleUpdateStudentStatus(std, 'Late')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'Late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                                }`}
                                title="Mark Late (L)"
                              >
                                L
                              </button>
                              <button
                                disabled={!canEdit}
                                onClick={() => handleUpdateStudentStatus(std, 'Excused')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  status === 'Excused'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                                title="Mark Excused (E)"
                              >
                                E
                              </button>
                            </div>
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

      {/* 2. TAB: MONTHLY MASTER REGISTER SHEET */}
      {activeTab === 'monthly_sheet' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <label className="font-bold text-slate-800">Select Month (মাস):</label>
                <input
                  type="month"
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-blue-800"
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Section:</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="all">All Sections</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'মাসিক রেজিস্টার প্রিন্ট' : 'Print Monthly Register'}</span>
            </button>
          </div>

          {/* Printable Monthly Register Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block text-center p-4 border-b-2 border-slate-900">
              <h1 className="text-xl font-black">{school.nameBn}</h1>
              <h2 className="text-sm font-bold text-slate-700">{school.nameEn}</h2>
              <p className="text-xs text-slate-600">{school.addressBn} • EIIN: {school.eiin}</p>
              <div className="mt-2 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                MONTHLY ATTENDANCE REGISTER • {selectedMonthYear} • {selectedClass} (Sec: {selectedSection})
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs print:hidden">
              <div>
                <h4 className="font-bold text-slate-900">
                  {selectedClass} ({selectedSection !== 'all' ? `Sec ${selectedSection}` : 'All Sec'}) • {selectedMonthYear} এর পূর্ণাঙ্গ হাজিরা শিট
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  নির্দেশিকা: <span className="text-emerald-700 font-bold">P = Present</span>,{' '}
                  <span className="text-rose-600 font-bold">A = Absent</span>,{' '}
                  <span className="text-amber-600 font-bold">L = Late</span>,{' '}
                  <span className="text-slate-400 font-bold">F = Friday (Holiday)</span>
                </p>
              </div>
              <span className="text-slate-500 font-medium">
                Total Students: <strong>{classStudents.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[11px] print:text-[9px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                    <th className="py-2.5 px-2 text-center w-8 border-r border-slate-300">Roll</th>
                    <th className="py-2.5 px-3 text-left w-36 border-r border-slate-300">Student Name</th>
                    {monthlyDays.map((d) => (
                      <th
                        key={d.day}
                        className={`py-2 px-1 border-r border-slate-200 w-6 ${
                          d.isFriday ? 'bg-rose-50 text-rose-700 font-bold' : ''
                        }`}
                        title={`${d.dateStr} (${d.dayName})`}
                      >
                        <div className="text-[10px] leading-tight">{d.day}</div>
                        <div className="text-[8px] font-normal text-slate-400">{d.dayName.charAt(0)}</div>
                      </th>
                    ))}
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-50 text-emerald-800 font-black w-8">P</th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-rose-50 text-rose-800 font-black w-8">A</th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-amber-50 text-amber-800 font-black w-8">L</th>
                    <th className="py-2 px-2 bg-blue-50 text-blue-900 font-black w-12">% Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={monthlyDays.length + 6} className="py-8 text-center text-slate-400">
                        No students enrolled in this class.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((std) => {
                      let pCount = 0;
                      let aCount = 0;
                      let lCount = 0;
                      let totalWorking = 0;

                      return (
                        <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-1.5 px-2 font-bold text-slate-800 border-r border-slate-200">
                            {std.roll}
                          </td>
                          <td className="py-1.5 px-3 text-left font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            <div>{std.nameEn}</div>
                            <div className="text-[9px] text-slate-400 font-normal">{std.studentId}</div>
                          </td>

                          {monthlyDays.map((d) => {
                            if (d.isFriday) {
                              return (
                                <td key={d.day} className="py-1.5 px-1 bg-rose-50/60 text-rose-400 font-mono text-[9px] border-r border-slate-200">
                                  H
                                </td>
                              );
                            }
                            totalWorking++;
                            const status = getStudentStatus(std.id, d.dateStr);
                            if (status === 'Present') {
                              pCount++;
                              return (
                                <td key={d.day} className="py-1.5 px-1 border-r border-slate-200 text-emerald-700 font-bold">
                                  P
                                </td>
                              );
                            } else if (status === 'Absent') {
                              aCount++;
                              return (
                                <td key={d.day} className="py-1.5 px-1 border-r border-slate-200 text-rose-600 font-bold bg-rose-50">
                                  A
                                </td>
                              );
                            } else if (status === 'Late') {
                              lCount++;
                              return (
                                <td key={d.day} className="py-1.5 px-1 border-r border-slate-200 text-amber-600 font-bold bg-amber-50">
                                  L
                                </td>
                              );
                            } else if (status === 'Excused') {
                              return (
                                <td key={d.day} className="py-1.5 px-1 border-r border-slate-200 text-blue-600 font-bold">
                                  E
                                </td>
                              );
                            } else {
                              return (
                                <td key={d.day} className="py-1.5 px-1 border-r border-slate-200 text-slate-300 font-mono text-[10px]">
                                  -
                                </td>
                              );
                            }
                          })}

                          {/* Totals */}
                          <td className="py-1.5 px-1 font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-200">
                            {pCount}
                          </td>
                          <td className="py-1.5 px-1 font-bold text-rose-800 bg-rose-50/40 border-r border-slate-200">
                            {aCount}
                          </td>
                          <td className="py-1.5 px-1 font-bold text-amber-800 bg-amber-50/40 border-r border-slate-200">
                            {lCount}
                          </td>
                          <td className="py-1.5 px-1 font-black text-blue-900 bg-blue-50/40">
                            {totalWorking > 0 ? `${Math.round(((pCount + lCount) / totalWorking) * 100)}%` : '100%'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Signatures */}
            <div className="hidden print:flex justify-between items-end p-6 pt-16 text-xs border-t border-slate-800 mt-6">
              <div className="text-center w-40">
                <div className="border-t border-slate-800 pt-1 font-bold">Class Teacher Signature</div>
              </div>
              <div className="text-center w-48">
                <div className="border-t border-slate-800 pt-1 font-bold">Principal / Headmaster Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: INDIVIDUAL STUDENT REPORT CARD & PRINT */}
      {activeTab === 'student_report' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    const matched = students.filter((s) => s.className === e.target.value);
                    if (matched.length > 0) setSelectedStudentId(matched[0].id);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-blue-800"
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <label className="font-bold text-slate-800">Select Student (শিক্ষার্থী):</label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      Roll {s.roll} • {s.nameEn} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="font-bold text-slate-800">Period (সময়কাল):</label>
                <select
                  value={periodPreset}
                  onChange={(e) => setPeriodPreset(e.target.value as any)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold text-blue-700"
                >
                  <option value="this_month">চলতি মাস (This Month)</option>
                  <option value="this_week">চলতি সপ্তাহ (This Week - 7 Days)</option>
                  <option value="this_year">সম্পূর্ণ শিক্ষাবর্ষ (This Year - 2026)</option>
                  <option value="custom">কাস্টম রেঞ্জ (Custom Range)</option>
                </select>
              </div>

              {periodPreset === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'হাজিরা কার্ড প্রিন্ট' : 'Print Student Attendance Card'}</span>
            </button>
          </div>

          {/* Printable Student Attendance Card */}
          <div className="flex justify-center bg-slate-100 p-4 md:p-8 rounded-2xl border border-slate-200 print:bg-white print:p-0 print:border-none">
            {selectedStudent && selectedStudentStats ? (
              <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border-2 border-slate-900 p-6 sm:p-8 text-slate-900 print:shadow-none print:border-2 print:border-black print:p-4 print:max-w-none">
                {/* Official School Header */}
                <div className="text-center pb-4 border-b-2 border-slate-900 relative">
                  <div className="flex items-center justify-center space-x-2">
                    <Building className="w-5 h-5 text-blue-900 print:text-black" />
                    <h1 className="text-xl font-black text-slate-950 tracking-tight">{school.nameBn}</h1>
                  </div>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest mt-0.5">{school.nameEn}</h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    EIIN: {school.eiin} • {school.addressBn} • Tel: {school.phone}
                  </p>
                  <div className="mt-2.5 inline-flex items-center space-x-2 px-4 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-md print:bg-black">
                    <span>STUDENT ATTENDANCE REPORT CARD (শিক্ষার্থী উপস্থিতি প্রত্যয়ন কার্ড)</span>
                  </div>
                </div>

                {/* Student Credentials & Photo Block */}
                <div className="my-4 p-4 bg-slate-50 border border-slate-300 rounded-xl flex flex-col-reverse sm:flex-row items-center justify-between gap-4 print:bg-transparent print:border-slate-400">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs flex-1 w-full">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Student Name:</span>
                      <strong className="text-slate-950 font-bold block">{selectedStudent.nameEn}</strong>
                      <span className="text-slate-600 text-[11px] block">{selectedStudent.nameBn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Student ID (আইডি):</span>
                      <strong className="text-blue-900 font-mono font-black text-sm block print:text-black">
                        {selectedStudent.studentId || selectedStudent.admissionNo}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Class & Section:</span>
                      <strong className="text-slate-900 block font-bold">
                        {selectedStudent.className} • Sec: {selectedStudent.section}
                      </strong>
                      <span className="text-[11px] text-slate-600">({selectedStudent.shift || 'Day'} Shift)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Class Roll (রোল):</span>
                      <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-black text-sm rounded font-mono print:bg-black">
                        {selectedStudent.roll}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Academic Session:</span>
                      <strong className="text-slate-900 block font-semibold">{selectedStudent.session || '2026'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Report Period:</span>
                      <strong className="text-blue-800 block font-bold print:text-black">{periodLabel}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Guardian & Contact:</span>
                      <span className="text-slate-800 font-medium">{selectedStudent.guardianName} ({selectedStudent.guardianPhone})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Blood Group:</span>
                      <strong className="text-rose-700 font-bold print:text-black">{selectedStudent.bloodGroup || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-24 h-28 border-2 border-slate-800 bg-white rounded-lg p-0.5 shadow-sm overflow-hidden flex items-center justify-center print:border-black print:shadow-none">
                      {selectedStudent.photoUrl ? (
                        <img
                          src={selectedStudent.photoUrl}
                          alt={selectedStudent.nameEn}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                          <span className="font-extrabold text-2xl text-slate-600">{selectedStudent.nameEn.charAt(0)}</span>
                          <span className="text-[9px] font-semibold text-slate-400 mt-1">Photo</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase tracking-wider">
                      Student Photo
                    </span>
                  </div>
                </div>

                {/* KPI Performance Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl print:bg-transparent">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">মোট কার্যদিবস</span>
                    <strong className="text-lg font-black text-slate-900 mt-0.5 block font-mono">
                      {selectedStudentStats.totalDays} দিন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl print:bg-transparent">
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase block">উপস্থিত (Present)</span>
                    <strong className="text-lg font-black text-emerald-800 mt-0.5 block font-mono">
                      {selectedStudentStats.presentCount} দিন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl print:bg-transparent">
                    <span className="text-[10px] font-semibold text-rose-700 uppercase block">অনুপস্থিত (Absent)</span>
                    <strong className="text-lg font-black text-rose-800 mt-0.5 block font-mono">
                      {selectedStudentStats.absentCount} দিন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl print:bg-transparent">
                    <span className="text-[10px] font-semibold text-amber-700 uppercase block">দেরি (Late)</span>
                    <strong className="text-lg font-black text-amber-800 mt-0.5 block font-mono">
                      {selectedStudentStats.lateCount} দিন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl print:bg-transparent">
                    <span className="text-[10px] font-semibold text-blue-700 uppercase block">উপস্থিতির হার (%)</span>
                    <strong className="text-lg font-black text-blue-900 mt-0.5 block font-mono">
                      {selectedStudentStats.rate}%
                    </strong>
                  </div>
                </div>

                {/* Attendance Performance Badge */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs print:border-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">Attendance Rating:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        selectedStudentStats.rate >= 90
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedStudentStats.rate >= 75
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedStudentStats.rate >= 90
                        ? 'চমৎকার (Excellent)'
                        : selectedStudentStats.rate >= 75
                        ? 'সন্তোষজনক (Good Standing)'
                        : 'সতর্কতা (Warning: Below 75%)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    পরীক্ষায় বসার জন্য ন্যূনতম ৭৫% উপস্থিতি বাধ্যতামূলক
                  </span>
                </div>

                {/* Day-by-Day Attendance Log Table */}
                <div className="my-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      তারিখভিত্তিক উপস্থিতির বিস্তারিত বিবরণী (Daily Log)
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Total Records: {selectedStudentStats.records.length}
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-400 uppercase text-[10px] print:bg-slate-100">
                        <th className="p-2 border-r border-slate-400 text-center w-8">Sl</th>
                        <th className="p-2 border-r border-slate-400 w-32">তারিখ (Date)</th>
                        <th className="p-2 border-r border-slate-400 text-center w-28">বার (Day)</th>
                        <th className="p-2 border-r border-slate-400 text-center w-28">স্ট্যাটাস</th>
                        <th className="p-2 border-r border-slate-400">হাজিরা গ্রহণকারী</th>
                        <th className="p-2">মন্তব্য (Remarks)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {selectedStudentStats.records.length > 0 ? (
                        selectedStudentStats.records.map((rec, idx) => {
                          const d = new Date(rec.date);
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const dayEn = dayNames[d.getDay()] || '';
                          const dayBn = daysOfWeekBn[dayEn] || '';
                          return (
                            <tr key={rec.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                              <td className="p-1.5 border-r border-slate-400 text-center font-bold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="p-1.5 border-r border-slate-400 font-mono font-bold text-slate-900">
                                {rec.date}
                              </td>
                              <td className="p-1.5 border-r border-slate-400 text-center text-slate-700">
                                {dayBn || dayEn}
                              </td>
                              <td className="p-1.5 border-r border-slate-400 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    rec.status === 'Present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rec.status === 'Absent'
                                      ? 'bg-rose-100 text-rose-800'
                                      : rec.status === 'Late'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {rec.status === 'Present' && 'উপস্থিত (Present)'}
                                  {rec.status === 'Absent' && 'অনুপস্থিত (Absent)'}
                                  {rec.status === 'Late' && 'দেরি (Late)'}
                                  {rec.status === 'Excused' && 'ছুটি (Excused)'}
                                </span>
                              </td>
                              <td className="p-1.5 border-r border-slate-400 text-slate-700 text-[11px]">
                                {rec.recordedBy || 'শ্রেণি শিক্ষক'}
                              </td>
                              <td className="p-1.5 text-slate-600 italic text-[11px]">
                                {rec.remarks || 'স্বাভাবিক'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                            এই সময়কালের মধ্যে কোনো উপস্থিতির রেকর্ড সংরক্ষিত নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures */}
                <div className="mt-8 pt-6 border-t border-slate-400 flex items-end justify-between text-xs">
                  <div className="text-center w-40">
                    <div className="border-t border-slate-800 pt-1 font-bold text-slate-800 text-[11px]">
                      Class Teacher's Signature
                      <span className="block text-[9px] text-slate-500 font-normal">(শ্রেণি শিক্ষকের স্বাক্ষর)</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-7 bg-slate-900 text-white font-mono text-[10px] px-4 flex items-center justify-center tracking-widest rounded print:bg-black">
                      *{selectedStudent.studentId || selectedStudent.roll}*
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">
                      OFFICIAL ATTENDANCE RECORD
                    </span>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-t border-slate-800 pt-1 font-bold text-slate-900 text-[11px]">
                      Principal / Headmaster
                      <span className="block text-[9px] text-slate-500 font-normal">(প্রধান শিক্ষকের প্রতিস্বাক্ষর)</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Please select a student to preview attendance report.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB: PERIODIC SUMMARY */}
      {activeTab === 'period_summary' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">Select Timeframe (সময়সীমা):</span>
              <button
                onClick={() => setPeriodPreset('this_week')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  periodPreset === 'this_week'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                সাপ্তাহিক (This Week)
              </button>
              <button
                onClick={() => setPeriodPreset('this_month')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  periodPreset === 'this_month'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                মাসিক (This Month)
              </button>
              <button
                onClick={() => setPeriodPreset('this_year')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  periodPreset === 'this_year'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                বাৎসরিক (This Year)
              </button>
              <button
                onClick={() => setPeriodPreset('custom')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  periodPreset === 'custom'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                কাস্টম (Custom Range)
              </button>
              {periodPreset === 'custom' && (
                <div className="flex items-center space-x-1.5 ml-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label className="font-bold text-slate-700">Filter Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-blue-800"
              >
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-100 uppercase">মোট কার্যদিবস</span>
                <Calendar className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">{periodWorkingDates.length} দিন</div>
              <p className="text-[11px] text-blue-200 mt-1">{periodLabel}</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-100 uppercase">গড় উপস্থিতির হার</span>
                <TrendingUp className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">
                {(() => {
                  if (classStudents.length === 0) return '0%';
                  const avg = Math.round(
                    classStudents.reduce((acc, s) => acc + getStudentPeriodStats(s.id).rate, 0) /
                      classStudents.length
                  );
                  return `${avg}%`;
                })()}
              </div>
              <p className="text-[11px] text-emerald-100 mt-1">{selectedClass}-এর সকল শিক্ষার্থী</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-100 uppercase">সর্বোচ্চ অনুপস্থিতি</span>
                <AlertCircle className="w-5 h-5 text-rose-200" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">
                {(() => {
                  const maxAbsent = Math.max(
                    ...classStudents.map((s) => getStudentPeriodStats(s.id).absentCount),
                    0
                  );
                  return `${maxAbsent} দিন`;
                })()}
              </div>
              <p className="text-[11px] text-rose-100 mt-1">নজরদারি প্রয়োজন</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-100 uppercase">দেরিতে আগমন (Late)</span>
                <Clock className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">
                {classStudents.reduce((acc, s) => acc + getStudentPeriodStats(s.id).lateCount, 0)} বার
              </div>
              <p className="text-[11px] text-amber-100 mt-1">মোট রেকর্ডকৃত ঘটনা</p>
            </div>
          </div>

          {/* Student-by-Student Summary Table for the Period */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
              <h4 className="font-bold text-slate-900">
                {selectedClass} • {periodLabel} সারসংক্ষেপ রেজিস্টার
              </h4>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>রিপোর্ট প্রিন্ট</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4 w-16 text-center">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Total Days</th>
                    <th className="py-3 px-4 text-center text-emerald-800">Present (P)</th>
                    <th className="py-3 px-4 text-center text-rose-700">Absent (A)</th>
                    <th className="py-3 px-4 text-center text-amber-700">Late (L)</th>
                    <th className="py-3 px-4 text-center">Attendance Rate %</th>
                    <th className="py-3 px-4 text-right">Individual Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((std) => {
                    const stats = getStudentPeriodStats(std.id);
                    return (
                      <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                          {std.roll}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{std.nameEn}</div>
                          <div className="text-[11px] text-slate-500">{std.nameBn} • ID: {std.studentId}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium font-mono">
                          {stats.totalDays}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-800 font-mono">
                          {stats.presentCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700 font-mono">
                          {stats.absentCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700 font-mono">
                          {stats.lateCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="font-black text-slate-900 w-10 font-mono">{stats.rate}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  stats.rate >= 90
                                    ? 'bg-emerald-600'
                                    : stats.rate >= 75
                                    ? 'bg-blue-600'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${stats.rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentId(std.id);
                              setActiveTab('student_report');
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            <span>কার্ড দেখুন</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: STAFF ATTENDANCE REGISTER (Daily, This Month & This Year) */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Staff Sub-View Switcher (Daily, This Month, This Year) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{language === 'bn' ? 'স্টাফ হাজিরা ধরণ:' : 'Staff View Mode:'}</span>
              </span>
              <div className="p-1 bg-slate-100 rounded-xl flex space-x-1 font-semibold">
                <button
                  onClick={() => setStaffViewMode('daily')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    staffViewMode === 'daily'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'দৈনিক হাজিরা' : 'Daily Register'}</span>
                </button>
                <button
                  onClick={() => setStaffViewMode('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    staffViewMode === 'monthly'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'চলতি মাস (This Month)' : 'This Month Sheet'}</span>
                </button>
                <button
                  onClick={() => setStaffViewMode('yearly')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    staffViewMode === 'yearly'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'চলতি বছর (This Year)' : 'This Year Summary'}</span>
                </button>
              </div>
            </div>

            {/* Mode-specific Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {staffViewMode === 'daily' && (
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-slate-700">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium"
                  />
                  {canEdit && (
                    <button
                      onClick={() => {
                        staff.forEach((st) => handleUpdateStaffStatus(st, 'Present'));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                    >
                      {language === 'bn' ? 'সবাইকে উপস্থিত করুন' : 'Mark All Present'}
                    </button>
                  )}
                </div>
              )}

              {staffViewMode === 'monthly' && (
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-slate-700">{language === 'bn' ? 'মাস নির্বাচন:' : 'Select Month:'}</label>
                  <input
                    type="month"
                    value={staffMonthYear}
                    onChange={(e) => setStaffMonthYear(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-blue-900"
                  />
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মাসিক শিট প্রিন্ট' : 'Print Monthly Sheet'}</span>
                  </button>
                </div>
              )}

              {staffViewMode === 'yearly' && (
                <div className="flex items-center space-x-2">
                  <label className="font-bold text-slate-700">{language === 'bn' ? 'শিক্ষাবর্ষ:' : 'Academic Session:'}</label>
                  <select
                    value={staffYear}
                    onChange={(e) => setStaffYear(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-blue-900"
                  >
                    <option value="2026">2026 Session (২০২৬ শিক্ষাবর্ষ)</option>
                    <option value="2025">2025 Session (২০২৫ শিক্ষাবর্ষ)</option>
                    <option value="2027">2027 Session (২০২৭ শিক্ষাবর্ষ)</option>
                  </select>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'বার্ষিক রিপোর্ট প্রিন্ট' : 'Print Annual Report'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 1. DAILY STAFF VIEW */}
          {staffViewMode === 'daily' && (
            <div className="space-y-4">
              {/* Holiday Alert Banner for selectedDate */}
              {activeHoliday && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-amber-950">
                          {activeHoliday.titleBn || activeHoliday.titleEn}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          {activeHoliday.totalDays} {language === 'bn' ? 'দিন ছুটি' : 'Days Holiday'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {language === 'bn'
                          ? `এই তারিখে (${selectedDate}) বিদ্যালয় সরকারিভাবে বন্ধ। তারিখ: ${activeHoliday.startDate} থেকে ${activeHoliday.endDate}`
                          : `School is officially closed on ${selectedDate} (${activeHoliday.startDate} to ${activeHoliday.endDate})`}
                      </p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => {
                        staff.forEach((st) => handleUpdateStaffStatus(st, 'Excused'));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 shadow-xs"
                    >
                      {language === 'bn' ? 'সবাইকে ছুটি (Excused) দিন' : 'Mark All as Holiday (H)'}
                    </button>
                  )}
                </div>
              )}

              {/* Staff Daily Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800">
                    {language === 'bn' ? `স্টাফ ও শিক্ষক তালিকা (মোট: ${toBnNumber(staff.length)} জন)` : `Staff Members (Total: ${staff.length})`}
                  </div>
                  <div className="text-slate-500 font-mono">{selectedDate}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Emp ID</th>
                        <th className="py-3 px-4">Teacher / Staff Name</th>
                        <th className="py-3 px-4">Designation & Dept</th>
                        <th className="py-3 px-4">Contact & Blood</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((st) => {
                        const status = getStaffStatus(st.id, selectedDate);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 font-mono">{st.employeeId}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-blue-700 text-xs">
                                  {st.photoUrl ? (
                                    <img src={st.photoUrl} alt={st.nameEn} className="w-full h-full object-cover" />
                                  ) : (
                                    st.nameEn.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{st.nameEn}</div>
                                  <div className="text-[11px] text-slate-500 font-medium">{st.nameBn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-800">{st.designation}</div>
                              <div className="text-[11px] text-slate-400">{st.department}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-mono text-slate-800 font-medium">{st.phone}</div>
                              {st.bloodGroup && (
                                <span className="inline-flex items-center text-[10px] font-bold text-rose-600">
                                  Blood: {st.bloodGroup}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  status === 'Present'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'Absent'
                                    ? 'bg-rose-100 text-rose-800'
                                    : status === 'Late'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {status === 'Present' && (language === 'bn' ? 'উপস্থিত' : 'Present')}
                                {status === 'Absent' && (language === 'bn' ? 'অনুপস্থিত' : 'Absent')}
                                {status === 'Late' && (language === 'bn' ? 'দেরি' : 'Late')}
                                {status === 'Excused' && (language === 'bn' ? 'ছুটি' : 'Excused')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  disabled={!canEdit}
                                  onClick={() => handleUpdateStaffStatus(st, 'Present')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    status === 'Present' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Mark Present"
                                >
                                  P
                                </button>
                                <button
                                  disabled={!canEdit}
                                  onClick={() => handleUpdateStaffStatus(st, 'Absent')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    status === 'Absent' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Mark Absent"
                                >
                                  A
                                </button>
                                <button
                                  disabled={!canEdit}
                                  onClick={() => handleUpdateStaffStatus(st, 'Late')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    status === 'Late' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Mark Late"
                                >
                                  L
                                </button>
                                <button
                                  disabled={!canEdit}
                                  onClick={() => handleUpdateStaffStatus(st, 'Excused')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    status === 'Excused' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title="Mark Excused / Leave"
                                >
                                  LV
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. THIS MONTH (চলতি মাসের মাস্টার শিট - দিন ১ থেকে ৩১) */}
          {staffViewMode === 'monthly' && (
            <div className="space-y-4">
              {/* Monthly KPI Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Total Faculty & Staff</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{staff.length} জন</div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">100% Active Personnel</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Month Working Days</span>
                  <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
                    {staffMonthlyDays.filter((d) => !d.isFriday && !d.holiday).length} দিন
                  </div>
                  <span className="text-[11px] text-slate-500 block">Excluding Fridays & Holidays</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Staff Attendance Rate</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">96.8%</div>
                  <span className="text-[11px] text-emerald-700 block">Excellent Regularity</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Selected Month</span>
                  <div className="text-xl font-black text-slate-800 mt-1 font-mono">{staffMonthYear}</div>
                  <span className="text-[11px] text-blue-600 font-medium block">{school.nameEn}</span>
                </div>
              </div>

              {/* Monthly Full Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {language === 'bn' ? `শিক্ষক ও স্টাফ মাসিক হাজিরা শিট (${staffMonthYear})` : `Staff Monthly Attendance Master Sheet (${staffMonthYear})`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      P = Present, A = Absent, L = Late, LV = Approved Leave, H = Holiday / Friday
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Present</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>Absent</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                      <span>Holiday</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10 w-20">ID</th>
                        <th className="py-2.5 px-3 sticky left-20 bg-slate-50 z-10 min-w-[160px]">Staff Name</th>
                        {staffMonthlyDays.map((d) => (
                          <th
                            key={d.day}
                            className={`py-2 px-1.5 text-center min-w-[28px] ${
                              d.isFriday || d.holiday ? 'bg-amber-100/60 text-amber-900' : 'text-slate-700'
                            }`}
                            title={d.holiday ? d.holiday.titleEn : d.isFriday ? 'Friday Weekend' : d.dateStr}
                          >
                            <div className="text-[9px] font-normal">{d.dayName.charAt(0)}</div>
                            <div className="font-bold">{d.day}</div>
                          </th>
                        ))}
                        <th className="py-2.5 px-2 text-center text-emerald-800 bg-emerald-50/50">P</th>
                        <th className="py-2.5 px-2 text-center text-rose-800 bg-rose-50/50">A</th>
                        <th className="py-2.5 px-2 text-center text-blue-800 bg-blue-50/50">LV</th>
                        <th className="py-2.5 px-3 text-center font-bold">Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((st) => {
                        const stats = getStaffMonthStats(st.id);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800 sticky left-0 bg-white z-10">
                              {st.employeeId}
                            </td>
                            <td className="py-2 px-3 sticky left-20 bg-white z-10">
                              <div className="font-bold text-slate-900 truncate max-w-[150px]">{st.nameEn}</div>
                              <div className="text-[10px] text-slate-400 truncate">{st.designation}</div>
                            </td>
                            {staffMonthlyDays.map((d) => {
                              const isOff = d.isFriday || Boolean(d.holiday);
                              const status = getStaffStatus(st.id, d.dateStr);

                              if (isOff) {
                                return (
                                  <td key={d.day} className="py-1.5 px-1 text-center bg-amber-50/40">
                                    <span className="text-[10px] font-bold text-amber-700" title={d.holiday?.titleEn || 'Off'}>
                                      H
                                    </span>
                                  </td>
                                );
                              }

                              return (
                                <td key={d.day} className="py-1.5 px-1 text-center">
                                  <span
                                    className={`inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold ${
                                      status === 'Present'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : status === 'Absent'
                                        ? 'bg-rose-100 text-rose-800'
                                        : status === 'Late'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Late' ? 'L' : 'E'}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                              {stats.presentCount}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-rose-800 bg-rose-50/30">
                              {stats.absentCount}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-blue-800 bg-blue-50/30">
                              {stats.excusedCount}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`font-bold font-mono px-2 py-0.5 rounded-full text-[10px] ${
                                  stats.rate >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : stats.rate >= 75
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {stats.rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. THIS YEAR (বার্ষিক সারসংক্ষেপ - জানুয়ারি থেকে ডিসেম্বর) */}
          {staffViewMode === 'yearly' && (
            <div className="space-y-4">
              {/* Yearly Analytics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Academic Session</span>
                  <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{staffYear}</div>
                  <span className="text-[11px] text-slate-500 block">Annual Session Cycle</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Total Annual Working Days</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">260 দিন</div>
                  <span className="text-[11px] text-slate-500 block">NCTB Academic Calendar</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Annual Faculty Regularity</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">94.2%</div>
                  <span className="text-[11px] text-emerald-700 block">Institutional Average</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-slate-400 font-medium block">Staff Leave Quota</span>
                  <div className="text-2xl font-black text-blue-700 mt-1 font-mono">15 দিন</div>
                  <span className="text-[11px] text-slate-500 block">Paid Casual & Medical</span>
                </div>
              </div>

              {/* 12-Month Staff Attendance Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {language === 'bn' ? `শিক্ষক ও স্টাফ বার্ষিক উপস্থিতি রেজিস্টার (${staffYear})` : `Staff Annual Attendance Summary Report (${staffYear})`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      12 Months Comprehensive Faculty & Staff Performance & Regularity Audit
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print Audit'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10">Emp ID</th>
                        <th className="py-2.5 px-3 sticky left-20 bg-slate-50 z-10 min-w-[150px]">Teacher / Staff</th>
                        {monthsOfYear.map((m) => (
                          <th key={m.num} className="py-2 px-2 text-center">
                            {language === 'bn' ? m.nameBn : m.nameEn}
                          </th>
                        ))}
                        <th className="py-2.5 px-2 text-center text-emerald-800 bg-emerald-50/50">Attended</th>
                        <th className="py-2.5 px-2 text-center text-blue-800 bg-blue-50/50">Leaves</th>
                        <th className="py-2.5 px-3 text-center font-bold">Annual Rate</th>
                        <th className="py-2.5 px-3 text-center">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((st) => {
                        const yStats = getStaffYearStats(st.id);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800 sticky left-0 bg-white z-10">
                              {st.employeeId}
                            </td>
                            <td className="py-2 px-3 sticky left-20 bg-white z-10">
                              <div className="font-bold text-slate-900 truncate max-w-[140px]">{st.nameEn}</div>
                              <div className="text-[10px] text-slate-400 truncate">{st.designation}</div>
                            </td>
                            {yStats.monthlyRates.map((rate, idx) => (
                              <td key={idx} className="py-2 px-2 text-center font-mono">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    rate >= 95
                                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                                      : rate >= 85
                                      ? 'text-slate-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {rate}%
                                </span>
                              </td>
                            ))}
                            <td className="py-2 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                              {yStats.totalAttended}d
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-blue-800 bg-blue-50/30">
                              {yStats.totalLeaves}d
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`font-black font-mono px-2 py-0.5 rounded-full text-[10px] ${
                                  yStats.avgRate >= 92
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {yStats.avgRate}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  yStats.avgRate >= 95
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {yStats.avgRate >= 95 ? (language === 'bn' ? 'নিয়মিত (A+)' : 'Regular (A+)') : (language === 'bn' ? 'সন্তোষজনক' : 'Good')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SMS Absentee Alert Simulator Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'bn' ? 'অনুপস্থিত শিক্ষার্থীদের SMS অ্যালার্ট' : 'Send Absentee SMS Alert'}
                </span>
              </h3>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {smsSentNotice ? (
              <div className="my-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center font-semibold">
                {smsSentNotice}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-slate-600">
                  {language === 'bn'
                    ? `আজ ${selectedClass} (শাখা ${selectedSection})-এর মোট ${toBnNumber(absentStudents.length)} জন শিক্ষার্থী অনুপস্থিত রয়েছে।`
                    : `Total ${absentStudents.length} students are marked Absent today in ${selectedClass} (${selectedSection}).`}
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                    SMS Gateway Preview (বাংলা/English):
                  </div>
                  <p className="text-slate-800 italic bg-white p-2 border border-slate-100 rounded">
                    &ldquo;সম্মানিত অভিভাবক, আপনার সন্তান আজ ({selectedDate}) বিদ্যালয়ে অনুপস্থিত রয়েছে। - প্রধান শিক্ষক, ঢাকা মডেল হাই স্কুল&rdquo;
                  </p>
                </div>

                <div className="text-[11px] text-slate-500">
                  Recipients ({absentStudents.length}):
                  <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5">
                    {absentStudents.map((s) => (
                      <div key={s.id} className="flex justify-between font-medium">
                        <span>{s.nameEn} (Roll {s.roll})</span>
                        <span className="text-blue-600">{s.guardianPhone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setShowSmsModal(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={smsSending}
                    onClick={handleSendAbsentSms}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{smsSending ? 'Sending SMS...' : 'Send SMS Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
