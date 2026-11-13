import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  Wallet,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  Bell,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  PlusCircle,
  FileText,
  DollarSign,
  UserCheck,
  MessageSquare,
  QrCode,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { SuperAdminStaffRBAC } from './SuperAdminStaffRBAC';
import { isTabAuthorized } from '../../utils/permissions';
import { WebsiteMessagesModal } from '../auth/WebsiteMessagesModal';
import { StudentDedicatedDashboard } from './StudentDedicatedDashboard';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { activeRole, currentUser } = useAuth();
  const { t, language, formatTaka, toBnNumber } = useLanguage();

  // If student logs in, show dedicated student portal with strict data isolation
  if (activeRole === 'student') {
    return <StudentDedicatedDashboard onNavigateTab={onNavigate} />;
  }

  const [showMessagesModal, setShowMessagesModal] = useState<boolean>(false);

  const students = StorageService.getStudents();
  const staff = StorageService.getStaff();
  const messages = StorageService.getWebsiteMessages();
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;
  const attendance = StorageService.getAttendance();
  const invoices = StorageService.getInvoices();
  const payments = StorageService.getPayments();
  const expenses = StorageService.getExpenses();
  const notices = StorageService.getNotices();
  const routines = StorageService.getRoutines();
  const exams = StorageService.getExams();
  const enquiries = StorageService.getEnquiries();

  // Dynamic Metrics
  const activeStudentsCount = students.filter((s) => s.status === 'active').length;
  const activeStaffCount = staff.filter((s) => s.status === 'active').length;

  const todayStr = useMemo(() => {
    const realToday = new Date().toISOString().split('T')[0];
    if (attendance.some((a) => a.date === realToday)) return realToday;
    if (attendance.length > 0) {
      const dates = Array.from(new Set(attendance.map((a) => a.date).filter(Boolean))).sort().reverse();
      if (dates.length > 0) return dates[0];
    }
    return '2026-10-25';
  }, [attendance]);
  const todayAttendance = attendance.filter((a) => a.targetType === 'student' && a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
  const attendanceRate =
    todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

  const totalFeeCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDues = invoices.reduce((sum, i) => sum + i.dueAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Class wise distribution
  const classCounts: Record<string, number> = {};
  students.forEach((s) => {
    classCounts[s.className] = (classCounts[s.className] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 via-blue-700 to-teal-700 text-white p-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-xs mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {language === 'bn' ? 'সিস্টেম স্ট্যাটাস: অনলাইন • Asia/Dhaka GMT+6' : 'System Active • Asia/Dhaka GMT+6'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">
              {language === 'bn' ? `স্বাগতম, ${currentUser.nameBn || currentUser.name}` : `Welcome back, ${currentUser.name}!`}
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
              {language === 'bn'
                ? 'প্লে / নার্সারি থেকে দশম শ্রেণি পর্যন্ত সম্পূর্ণ একাডেমিক, শিক্ষার্থী হাজিরা, পরীক্ষা ও ফলাফল, ফি কালেকশন ও হিসাব খাতা।'
                : 'Manage Nursery through Class 10 academic, attendance, examinations, fee collection, and institutional records in one unified ERP platform.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isTabAuthorized('admissions', activeRole, currentUser) && (
              <button
                onClick={() => onNavigate('admissions')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white text-blue-800 text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-blue-700" />
                <span>{language === 'bn' ? 'নতুন ভর্তি' : 'New Admission'}</span>
              </button>
            )}
            {isTabAuthorized('attendance', activeRole, currentUser) && (
              <button
                onClick={() => onNavigate('attendance')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 text-xs font-semibold transition-colors"
              >
                <CalendarCheck2 className="w-4 h-4" />
                <span>{language === 'bn' ? 'আজকের হাজিরা' : "Today's Attendance"}</span>
              </button>
            )}
            {isTabAuthorized('examinations', activeRole, currentUser) && (
              <button
                onClick={() => onNavigate('examinations')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-700/80 hover:bg-purple-700 text-white border border-white/20 text-xs font-semibold transition-colors"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>{language === 'bn' ? 'পরীক্ষা ও ফলাফল' : 'Exams & Marks'}</span>
              </button>
            )}
            {isTabAuthorized('fees', activeRole, currentUser) && (
              <button
                onClick={() => onNavigate('fees')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>{language === 'bn' ? 'ফি গ্রহণ' : 'Collect Fee'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI SMART SCHOOL MANAGEMENT - 3 NEW FEATURES SPOTLIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feature 1: AI Smart Homework */}
        <div
          onClick={() => onNavigate('homework')}
          className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-5 rounded-2xl border border-indigo-700/60 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Multimodal AI
              </span>
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-indigo-200 transition-colors">
              {language === 'bn' ? 'এআই স্মার্ট হোমওয়ার্ক মূল্যায়ন' : 'AI Smart Homework Grading'}
            </h3>
            <p className="text-xs text-indigo-200 mt-1 line-clamp-2">
              {language === 'bn'
                ? 'হস্তলিখিত খাতার ছবি থেকে এআই দিয়ে স্বয়ংক্রিয় নম্বর ও শিক্ষকের এক-ক্লিকে অনুমোদন।'
                : 'AI evaluates handwritten photos with step-by-step checks and bulk approval.'}
            </p>
          </div>
          <div className="relative z-10 pt-3 mt-3 border-t border-indigo-800/80 flex items-center justify-between text-xs font-bold text-indigo-300 group-hover:text-white">
            <span>{language === 'bn' ? 'হোমওয়ার্ক ড্যাশবোর্ড' : 'Open Homework'}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Feature 2: QR Code Smart Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl border border-emerald-700/50 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Smart Gate Kiosk
              </span>
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-200 transition-colors">
              {language === 'bn' ? 'কিউআর কোড স্মার্ট হাজিরা' : 'QR Code Smart Attendance'}
            </h3>
            <p className="text-xs text-emerald-200 mt-1 line-clamp-2">
              {language === 'bn'
                ? 'মোবাইল ক্যামেরা দিয়ে আইডি কার্ড স্ক্যানে স্বয়ংক্রিয় হাজিরা ও ডুপ্লিকেট স্ক্যান রোধ।'
                : 'Instant QR code scanning with student photo verification and duplicate prevention.'}
            </p>
          </div>
          <div className="relative z-10 pt-3 mt-3 border-t border-emerald-900/80 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:text-white">
            <span>{language === 'bn' ? 'স্ক্যানার ও আইডি কার্ড' : 'Launch Scanner'}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Feature 3: AI Student Performance Analytics */}
        <div
          onClick={() => onNavigate('analytics')}
          className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-purple-700/50 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Analytics Engine
              </span>
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-purple-200 transition-colors">
              {language === 'bn' ? 'এআই পারফরম্যান্স অ্যানালিটিক্স' : 'AI Student Performance Analytics'}
            </h3>
            <p className="text-xs text-purple-200 mt-1 line-clamp-2">
              {language === 'bn'
                ? 'বাস্তব পরীক্ষার নম্বর, উপস্থিতি ও বাড়ির কাজের ভিত্তিতে গভীর এআই প্রবৃদ্ধি পরামর্শ।'
                : 'Real data-driven student performance analysis, weak subject radar, and AI study tips.'}
            </p>
          </div>
          <div className="relative z-10 pt-3 mt-3 border-t border-purple-900/80 flex items-center justify-between text-xs font-bold text-purple-300 group-hover:text-white">
            <span>{language === 'bn' ? 'অ্যানালিটিক্স ড্যাশবোর্ড' : 'Open Analytics'}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Super Admin & Master Admin: Dedicated Public Website Messages & Inquiries Card */}
      {(activeRole === 'super_admin' || activeRole === 'master_admin') && (
        <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl border border-sky-700/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {language === 'bn' ? 'ওয়েবসাইট থেকে আসা বার্তা ও অনুসন্ধান' : 'Public Website Inquiries & Messages'}
                </h3>
                {unreadMessagesCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                    {language === 'bn' ? `${toBnNumber(unreadMessagesCount)} টি নতুন বার্তা` : `${unreadMessagesCount} Unread`}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100 text-[10px] font-semibold">
                    {language === 'bn' ? 'সব পড়া হয়েছে' : 'All Read'}
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                {language === 'bn'
                  ? 'ওয়েবসাইটের "যোগাযোগ বা বার্তা পাঠান" ফর্ম থেকে পাঠানো অভিভাবক ও দর্শনার্থীদের সরাসরি বার্তা শুধু সুপার অ্যাডমিন দেখতে পাবেন।'
                  : 'Direct inquiries sent from the public website contact form are visible exclusively to the Super Admin.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMessagesModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>{language === 'bn' ? 'ইনবক্স দেখুন ও উত্তর দিন' : 'Open Message Inbox'}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">{t('totalStudents')}</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'bn' ? toBnNumber(activeStudentsCount) : activeStudentsCount}
            </span>
            <span className="text-xs text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              Nursery-10
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span>{language === 'bn' ? '১২টি সক্রিয় শ্রেণি' : '12 Active Classes'}</span>
            {isTabAuthorized('students', activeRole, currentUser) && (
              <button onClick={() => onNavigate('students')} className="text-blue-600 font-bold hover:underline">
                {t('details')} &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Total Teachers & Staff */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">{t('totalStaff')}</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'bn' ? toBnNumber(activeStaffCount) : activeStaffCount}
            </span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {language === 'bn' ? 'অন ডিউটি' : 'On Duty'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span>{language === 'bn' ? 'শিক্ষক ও কর্মচারী' : 'Teachers & Personnel'}</span>
            {isTabAuthorized('staff', activeRole, currentUser) && (
              <button onClick={() => onNavigate('staff')} className="text-emerald-700 font-bold hover:underline">
                {t('details')} &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Today's Attendance Rate */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-400 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">{t('todaysAttendance')}</span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'bn' ? `${toBnNumber(attendanceRate)}%` : `${attendanceRate}%`}
            </span>
            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
              {language === 'bn' ? 'আজকের রোল কল' : "Today's Register"}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span>{language === 'bn' ? 'নিয়মিত শিক্ষার্থী' : 'Enrolled Students'}</span>
            {isTabAuthorized('attendance', activeRole, currentUser) && (
              <button onClick={() => onNavigate('attendance')} className="text-cyan-700 font-bold hover:underline">
                {language === 'bn' ? 'হাজিরা খাতা' : 'Register'} &rarr;
              </button>
            )}
          </div>
        </div>

        {/* 4th Card: Fee Collection (for accounts/admin) OR Examinations (for teachers/staff) */}
        {isTabAuthorized('fees', activeRole, currentUser) ? (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">
                {activeRole === 'accountant' ? t('todaysCollection') : t('totalDues')}
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatTaka(activeRole === 'accountant' ? totalFeeCollected : totalDues)}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${totalDues > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {language === 'bn' ? 'মোট বকেয়া' : 'Receivables'}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span>{language === 'bn' ? 'অক্টোবর ২০২৬ সেশন' : 'October 2026 Invoices'}</span>
              <button onClick={() => onNavigate('fees')} className="text-amber-700 font-bold hover:underline">
                {t('details')} &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">
                {language === 'bn' ? 'পরীক্ষা ও ফলাফল' : 'Examinations'}
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {language === 'bn' ? toBnNumber(exams.length) : exams.length}
              </span>
              <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                {language === 'bn' ? 'সক্রিয় পরীক্ষা' : 'Term Exams'}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span>{language === 'bn' ? 'মার্কস ও ফলাফল ড্যাশবোর্ড' : 'Marks & Results'}</span>
              {isTabAuthorized('examinations', activeRole, currentUser) && (
                <button onClick={() => onNavigate('examinations')} className="text-purple-700 font-bold hover:underline">
                  {language === 'bn' ? 'প্রবেশ করুন' : 'Open'} &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Super Admin Staff RBAC Access Control Panel (Master Admin completely hidden) */}
      {activeRole === 'super_admin' && <SuperAdminStaffRBAC />}

      {/* Middle Row: Class Enrollment Distribution & Upcoming Exams / Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Enrollment Breakdown */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা (প্লে - দশম শ্রেণি)' : 'Class-wise Enrollment (Nursery to Class 10)'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'bn' ? 'প্রভাতি ও দিবা শিফটের মোট উপস্থিতি' : 'Distribution across Morning and Day shifts'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {language === 'bn' ? 'সকল শিক্ষার্থী' : 'View Directory'} &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { cls: 'Nursery', bn: 'প্লে / নার্সারি' },
              { cls: 'KG', bn: 'কেজি (KG)' },
              { cls: 'Class 1', bn: '১ম শ্রেণি' },
              { cls: 'Class 2', bn: '২য় শ্রেণি' },
              { cls: 'Class 3', bn: '৩য় শ্রেণি' },
              { cls: 'Class 4', bn: '৪র্থ শ্রেণি' },
              { cls: 'Class 5', bn: '৫ম শ্রেণি' },
              { cls: 'Class 6', bn: '৬ষ্ঠ শ্রেণি' },
              { cls: 'Class 7', bn: '৭ম শ্রেণি' },
              { cls: 'Class 8', bn: '৮ম শ্রেণি' },
              { cls: 'Class 9', bn: '৯ম শ্রেণি' },
              { cls: 'Class 10', bn: '১০ম শ্রেণি' },
            ].map((item) => {
              const count = classCounts[item.cls] || (item.cls === 'Class 10' ? 3 : item.cls === 'Class 9' ? 1 : 1);
              return (
                <div
                  key={item.cls}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-center"
                >
                  <div className="text-[11px] font-semibold text-slate-600">
                    {language === 'bn' ? item.bn : item.cls}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {language === 'bn' ? toBnNumber(count) : count}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {language === 'bn' ? 'জন শিক্ষার্থী' : 'Students'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Academic Highlights */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600">
                {language === 'bn' ? 'বিজ্ঞান, ব্যবসায়, মানবিক ও ভোকেশনাল বিভাগ (৯ম-১০ম)' : 'Science, Commerce, Arts & Vocational Groups (9-10)'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-slate-600">
                {language === 'bn' ? 'শাখা সমুহ (A, B, C)' : 'Sections: A, B, C'}
              </span>
            </div>
          </div>
        </div>

        {/* Notices & Announcements Board */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">{t('notices')}</h3>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {language === 'bn' ? 'সকল নোটিশ' : 'View All'}
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase bg-blue-100 text-blue-700">
                    {n.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{n.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-1.5 line-clamp-1">
                  {n.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('notices')}
              className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              {language === 'bn' ? '+ নতুন নোটিশ প্রকাশ' : '+ Post New Announcement'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Routine / Today's Schedule & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Period Routine Overview */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'আজকের ক্লাস রুটিন (পিরিয়ড সূচি)' : "Today's Period Timetable"}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('routine')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {language === 'bn' ? 'সম্পূর্ণ রুটিন' : 'Full Timetable'} &rarr;
            </button>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {routines.slice(0, 4).map((rt) => (
              <div key={rt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-16 font-bold text-slate-700">{rt.startTime}</span>
                  <div>
                    <span className="font-semibold text-slate-900">{rt.subjectName}</span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({rt.className} - {rt.section})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-700">{rt.teacherName}</span>
                  <div className="text-[10px] text-slate-400">{rt.roomNo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Examination & Result Glance */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'পরীক্ষা ও ফলাফল প্রকাশ' : 'Examinations & Publications'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('examinations')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              {language === 'bn' ? 'মার্কশিট প্রিন্ট' : 'Print Marksheets'} &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'bn' ? ex.nameBn : ex.nameEn}
                    </span>
                    {ex.isPublished ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                        {language === 'bn' ? 'ফলাফল প্রকাশিত' : 'Published'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                        {language === 'bn' ? 'খসড়া' : 'Draft'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {language === 'bn' ? `তারিখ: ${ex.startDate} থেকে ${ex.endDate}` : `Dates: ${ex.startDate} to ${ex.endDate}`}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('examinations')}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  {language === 'bn' ? 'ফলাফল দেখুন' : 'Results'}
                </button>
              </div>
            ))}
          </div>

          {/* NCTB Grading Scale Reminder */}
          <div className="mt-4 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
            <span>
              {language === 'bn'
                ? 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত GPA 5.00 গ্রেডিং স্কেল।'
                : 'Configured with National Curriculum & Textbook Board (NCTB) 5.00 GPA Grading Scale.'}
            </span>
            <span className="font-bold text-blue-700">A+ (80-100)</span>
          </div>
        </div>
      </div>

      {/* Website Messages Modal for Super Admin */}
      <WebsiteMessagesModal
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
      />
    </div>
  );
};
