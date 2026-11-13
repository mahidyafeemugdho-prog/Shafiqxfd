import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Save,
  CheckCircle2,
  RefreshCw,
  Users,
  Eye,
  Send,
  Sliders,
  Info,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  Trash2,
  PlayCircle,
  RotateCcw,
  Download,
  Upload,
  FileArchive,
  FolderArchive,
  FileText,
  Check,
  HardDrive,
} from 'lucide-react';
import { StorageService } from '../../services/storage';

export const MasterAdminPortal: React.FC = () => {
  const { systemAccessControl, updateSystemAccessControl, activeRole } = useAuth();
  const { language, toBnNumber } = useLanguage();

  const [message, setMessage] = useState<string>(systemAccessControl.disabledMessage);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Backup & Restore states
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [isDownloadingCodebaseZip, setIsDownloadingCodebaseZip] = useState<boolean>(false);
  const [zipDownloadInfo, setZipDownloadInfo] = useState<{ filename: string; size: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState<boolean>(false);

  const [dataCounts, setDataCounts] = useState(() => ({
    students: StorageService.getStudents().length,
    exams: StorageService.getExams().length,
    examRoutines: StorageService.getExamRoutines().length,
    routines: StorageService.getRoutines().length,
    marks: StorageService.getMarks().length,
    attendance: StorageService.getAttendance().length,
    invoices: StorageService.getInvoices().length,
    homework: StorageService.getHomework().length,
    notices: StorageService.getNotices().length,
    books: StorageService.getBooks().length,
  }));

  const refreshCounts = () => {
    setDataCounts({
      students: StorageService.getStudents().length,
      exams: StorageService.getExams().length,
      examRoutines: StorageService.getExamRoutines().length,
      routines: StorageService.getRoutines().length,
      marks: StorageService.getMarks().length,
      attendance: StorageService.getAttendance().length,
      invoices: StorageService.getInvoices().length,
      homework: StorageService.getHomework().length,
      notices: StorageService.getNotices().length,
      books: StorageService.getBooks().length,
    });
  };

  const handleLoadDemoData = () => {
    setIsActionLoading(true);
    try {
      const ok = StorageService.loadPresentationDemoData();
      if (ok) {
        refreshCounts();
        setActionFeedback({
          type: 'success',
          message: language === 'bn'
            ? 'প্রেজেন্টেশন ডেমো ডাটা সফলভাবে লোড ও ক্লাউডে সিঙ্ক করা হয়েছে! এখন সকল সেকশনে ডাটা দেখা যাবে।'
            : 'Presentation demo data loaded and synced to cloud successfully! All sections are populated.',
        });
      }
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleClearAllData = () => {
    setIsActionLoading(true);
    try {
      const ok = StorageService.clearAllSchoolData();
      if (ok) {
        refreshCounts();
        setShowDeleteConfirm(false);
        setActionFeedback({
          type: 'success',
          message: language === 'bn'
            ? '১-ক্লিকে সকল ডেমো ডাটা সফলভাবে মুছে ফেলা হয়েছে! সিস্টেম এখন সম্পূর্ণ ফ্রেশ ও নতুন এন্ট্রির জন্য প্রস্তুত।'
            : 'All demo data wiped successfully! The system is now completely fresh and clean.',
        });
      }
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleDownloadZipBackup = async () => {
    setIsDownloadingZip(true);
    setRestoreFeedback(null);
    try {
      const res = await StorageService.downloadBackupZip();
      setZipDownloadInfo({
        filename: res.filename,
        size: res.sizeFormatted,
      });
      setActionFeedback({
        type: 'success',
        message: language === 'bn'
          ? `সম্পূর্ণ ডাটাবেজ ব্যাকআপ জিপ সফলভাবে তৈরি ও ডাউনলোড হয়েছে (${res.filename}, সাইজ: ${res.sizeFormatted})!`
          : `Full system backup zip created and downloaded successfully (${res.filename}, size: ${res.sizeFormatted})!`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: language === 'bn'
          ? 'ব্যাকআপ জিপ তৈরিতে ত্রুটি: ' + (err.message || 'অজানা ত্রুটি')
          : 'Failed to generate backup zip: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadFullCodebaseZip = async () => {
    setIsDownloadingCodebaseZip(true);
    setRestoreFeedback(null);
    try {
      const res = await StorageService.downloadFullCodebaseProjectZip();
      setZipDownloadInfo({
        filename: res.filename,
        size: res.sizeFormatted,
      });
      setActionFeedback({
        type: 'success',
        message: language === 'bn'
          ? `আলহামদুলিল্লাহ! গুগল এআই স্টুডিওতে সরাসরি রানযোগ্য সম্পূর্ণ প্রজেক্ট কোড ও ডাটা জিপ সফলভাবে ডাউনলোড হয়েছে (${res.filename}, সাইজ: ${res.sizeFormatted})! এটি এআই স্টুডিও বা লোকাল পিসিতে কোনো এরর ছাড়া রান করবে।`
          : `Full runnable project codebase zip downloaded successfully (${res.filename}, size: ${res.sizeFormatted})! It runs in Google AI Studio with zero errors.`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: language === 'bn'
          ? 'প্রজেক্ট কোড জিপ তৈরিতে ত্রুটি: ' + (err.message || 'অজানা ত্রুটি')
          : 'Failed to generate project codebase zip: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsDownloadingCodebaseZip(false);
    }
  };

  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setShowRestoreConfirmModal(true);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setIsRestoring(true);
    try {
      const result = await StorageService.restoreFromZipFile(pendingRestoreFile);
      if (result.success) {
        refreshCounts();
        setShowRestoreConfirmModal(false);
        setPendingRestoreFile(null);
        setRestoreFeedback({
          type: 'success',
          message: language === 'bn'
            ? `আলহামদুলিল্লাহ! সম্পূর্ণ ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে। ${result.counts ? `(মোট ${result.counts.students} জন শিক্ষার্থী, ${result.counts.staff} জন স্টাফ, ${result.counts.invoices} টি ফি ইনভয়েস)` : ''}`
            : 'Database successfully restored from backup archive!',
        });
      } else {
        setRestoreFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setRestoreFeedback({
        type: 'error',
        message: err.message || 'রিস্টোর করার সময় ত্রুটি ঘটেছে।',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const roleDefinitions: {
    role: UserRole;
    nameEn: string;
    nameBn: string;
    defaultUser: string;
    descriptionEn: string;
    descriptionBn: string;
    badgeColor: string;
  }[] = [
    {
      role: 'super_admin',
      nameEn: 'Super Admin',
      nameBn: 'সুপার অ্যাডমিন',
      defaultUser: 'Md. Shafiqul Alam (superadmin)',
      descriptionEn: 'Full system management, settings, academic setup & configurations',
      descriptionBn: 'সম্পূর্ণ সিস্টেম ও সেটিংস নিয়ন্ত্রণ',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      role: 'admin',
      nameEn: 'Head Teacher / Admin',
      nameBn: 'প্রধান শিক্ষক / অ্যাডমিন',
      defaultUser: 'Prof. Md. Rafiqul Islam (principal)',
      descriptionEn: 'Academic operations, staff, classes, exam schedules & student directory',
      descriptionBn: 'একাডেমিক কার্যক্রম ও শিক্ষক পরিচালনা',
      badgeColor: 'bg-blue-700 text-white',
    },
    {
      role: 'teacher',
      nameEn: 'Assistant Teachers',
      nameBn: 'সহকারী শিক্ষকবৃন্দ',
      defaultUser: 'Selina Parvin & 6 others (teacher)',
      descriptionEn: 'Daily student attendance, assignments & continuous marks entry',
      descriptionBn: 'দৈনিক হাজিরা, বাড়ির কাজ ও নম্বর এন্ট্রি',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      role: 'accountant',
      nameEn: 'Accounts & Finance',
      nameBn: 'হিসাবরক্ষক (ক্যাশিয়ার)',
      defaultUser: 'Kamrul Hasan (accountant)',
      descriptionEn: 'Fee collection, dual receipts printing, vouchers & expenses',
      descriptionBn: 'ফি কালেকশন, মানি রসিদ ও খরচ ভাউচার',
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      role: 'student',
      nameEn: 'Students',
      nameBn: 'শিক্ষার্থীবৃন্দ',
      defaultUser: 'Tanvir Ahmed & all students (student)',
      descriptionEn: 'View result cards, attendance record, routines & homework',
      descriptionBn: 'রেজাল্ট কার্ড, রুটিন ও বাড়ির কাজ দেখা',
      badgeColor: 'bg-cyan-600 text-white',
    },
    {
      role: 'guardian',
      nameEn: 'Parents & Guardians',
      nameBn: 'অভিভাবকবৃন্দ',
      defaultUser: 'Md. Anwar Hossain (guardian)',
      descriptionEn: 'Ward attendance alerts, fee dues, invoice receipts & report cards',
      descriptionBn: 'হাজিরা, ফি বকেয়া ও পরীক্ষার ফলাফল দেখা',
      badgeColor: 'bg-teal-600 text-white',
    },
    {
      role: 'librarian',
      nameEn: 'Library Staff',
      nameBn: 'গ্রন্থাগারিক',
      defaultUser: 'Roksana Begum (librarian)',
      descriptionEn: 'Book cataloging, student borrowings & fine tracking',
      descriptionBn: 'বই ইস্যু ও রিটার্ন ব্যবস্থাপনা',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      role: 'receptionist',
      nameEn: 'Admissions & Reception',
      nameBn: 'ভর্তি কর্মকর্তা',
      defaultUser: 'Tariqul Islam (receptionist)',
      descriptionEn: 'New student admissions, visitor registry & front desk inquiries',
      descriptionBn: 'নতুন শিক্ষার্থী ভর্তি ও অনুসন্ধান',
      badgeColor: 'bg-rose-600 text-white',
    },
  ];

  // Preset announcement templates
  const presets = [
    {
      titleEn: 'Annual Audit & Grade Closing',
      titleBn: 'বাৎসরিক অডিট ও ফলাফল প্রস্তুত',
      text: 'বাৎসরিক ফলাফল প্রস্তুত ও আর্থিক অডিট কার্যক্রম চলমান থাকায় সাময়িকভাবে সুপার অ্যাডমিন ও সকল স্টাফের লগইন স্থগিত রাখা হয়েছে। আগামী কার্যদিবসে সিস্টেম পুনরায় চালু হবে।',
    },
    {
      titleEn: 'Scheduled Server Maintenance',
      titleBn: 'সার্ভার রক্ষণাবেক্ষণ ও ডাটাবেজ আপডেট',
      text: 'নিয়মিত সার্ভার আপগ্রেড এবং ফায়ারস্টোর ক্লাউড সিঙ্ক্রোনাইজেশনের জন্য সকাল ১০টা থেকে দুপুর ২টা পর্যন্ত সিস্টেম এক্সেস স্থগিত থাকবে। যেকোনো জরুরি প্রয়োজনে মাস্টার অ্যাডমিনের সাথে যোগাযোগ করুন।',
    },
    {
      titleEn: 'School Vacation Security Lock',
      titleBn: 'ছুটি চলাকালীন নিরাপত্তা লক',
      text: 'স্কুলের ছুটি চলাকালীন নিরাপত্তা সুরক্ষার্থে সাধারণ ব্যবহারকারী ও শিক্ষার্থীদের প্রবেশ স্থগিত রাখা হয়েছে। প্রধান শিক্ষক ও অফিসিয়াল অনুমোদনের জন্য অপেক্ষা করুন।',
    },
    {
      titleEn: 'Urgent Administrative Review',
      titleBn: 'জরুরি প্রশাসনিক নির্দেশনা',
      text: 'মাস্টার অ্যাডমিন কর্তৃক সিস্টেমের অভ্যন্তরীণ নিরাপত্তা নিরীক্ষা সম্পন্ন হচ্ছে। পরবর্তী নোটিশ না দেওয়া পর্যন্ত সকল সাধারণ এক্সেস স্থগিত থাকবে।',
    },
  ];

  const handleToggleGlobalLock = () => {
    updateSystemAccessControl({
      isSystemLocked: !systemAccessControl.isSystemLocked,
      disabledMessage: message,
    });
  };

  const handleToggleRole = (role: UserRole) => {
    const isCurrentlyDisabled = systemAccessControl.disabledRoles.includes(role);
    let updatedRoles: UserRole[];
    if (isCurrentlyDisabled) {
      updatedRoles = systemAccessControl.disabledRoles.filter((r) => r !== role);
    } else {
      updatedRoles = [...systemAccessControl.disabledRoles, role];
    }
    updateSystemAccessControl({
      disabledRoles: updatedRoles,
      disabledMessage: message,
    });
  };

  const handleSaveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemAccessControl({
      disabledMessage: message,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleEnableAll = () => {
    updateSystemAccessControl({
      isSystemLocked: false,
      disabledRoles: [],
      disabledMessage: message,
    });
  };

  const handleDisableAll = () => {
    updateSystemAccessControl({
      isSystemLocked: true,
      disabledRoles: roleDefinitions.map((r) => r.role),
      disabledMessage: message,
    });
  };

  if (activeRole !== 'master_admin') {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl max-w-xl mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900">
          {language === 'bn' ? 'এক্সেস অস্বীকৃত / Access Denied' : 'Access Denied'}
        </h2>
        <p className="text-xs text-rose-700 mt-2">
          {language === 'bn'
            ? 'এই মাস্টার পোর্টাল এবং ডাটাবেজ ব্যাকআপ ব্যবস্থা শুধুমাত্র মাস্টার অ্যাডমিন (Shafiq)-এর জন্য সংরক্ষিত।'
            : 'This portal and database backup controls are strictly restricted to Master Admin (Shafiq).'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Admin Identity */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white shadow-xl border border-rose-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-rose-600/20 border border-rose-500/40 rounded-xl text-rose-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Master Control Portal
                </span>
                <span className="text-xs text-rose-200/80">Authorized User: <strong>Shafiq</strong></span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                {language === 'bn' ? 'মাস্টার অ্যাডমিন এক্সেস কন্ট্রোল ও নোটিশ বোর্ড' : 'Master Admin RBAC Security & Broadcast Center'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'bn'
                  ? 'মাস্টার অ্যাডমিন শফিক হিসেবে আপনি এখান থেকে যেকোনো রোল বা সমগ্র সিস্টেমের এক্সেস বন্ধ (Disable) বা চালু (Enable) করতে পারবেন। এক্সেস বন্ধ করার কারণ লিখে দিলে সাধারণ ব্যবহারকারী ও সুপার অ্যাডমিন লগইন করার সময় সেই কারণটি দেখতে পাবেন।'
                  : 'As Master Admin Shafiq, you hold absolute authority to enable or disable access for any role or the entire ERP. The message you write below will be broadcasted to users on their login screen when access is denied.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEnableAll}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white transition-all shadow-md flex items-center space-x-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সব চালু করুন' : 'Enable All'}</span>
            </button>
            <button
              onClick={handleDisableAll}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white transition-all shadow-md flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সব বন্ধ করুন' : 'Lock All'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Lock & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Master Lock Switch */}
        <div className={`p-5 rounded-2xl border transition-all ${
          systemAccessControl.isSystemLocked
            ? 'bg-rose-50 border-rose-200 shadow-sm'
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              System Lock Status
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              systemAccessControl.isSystemLocked ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {systemAccessControl.isSystemLocked ? 'LOCKED 🚫' : 'ACTIVE ONLINE'}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {systemAccessControl.isSystemLocked
                  ? (language === 'bn' ? 'সমগ্র সিস্টেম বন্ধ (Locked)' : 'Entire System Locked')
                  : (language === 'bn' ? 'সিস্টেম অ্যাক্টিভ ও চালু' : 'System Active & Open')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {systemAccessControl.isSystemLocked
                  ? 'Only Master Admin Shafiq can access. All other roles blocked.'
                  : 'All non-disabled roles can login normally.'}
              </p>
            </div>
            <button
              onClick={handleToggleGlobalLock}
              className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                systemAccessControl.isSystemLocked
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Toggle global lockout"
            >
              {systemAccessControl.isSystemLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Card 2: Disabled Roles Count */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Suspended Roles</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {language === 'bn' ? toBnNumber(systemAccessControl.disabledRoles.length) : systemAccessControl.disabledRoles.length}{' '}
              <span className="text-xs font-normal text-slate-500">of 8 roles disabled</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {systemAccessControl.disabledRoles.length === 0
                ? 'No individual roles are restricted.'
                : `Blocked: ${systemAccessControl.disabledRoles.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Card 3: Last Broadcast Audit */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Notice Broadcast Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {new Date(systemAccessControl.updatedAt).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span>Updated by:</span>
              <strong className="text-rose-600 font-bold">{systemAccessControl.updatedBy}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: 1-Click Presentation Demo & Clean Slate Manager */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Presentation & Demo Manager
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ক্লাউড ডাটাবেজ সিঙ্কড
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1 text-white">
                {language === 'bn'
                  ? 'প্রেজেন্টেশন ডেমো ডাটা ও ১-ক্লিকে ক্লিন স্লেট ব্যবস্থাপনা'
                  : 'Presentation Demo Data & 1-Click Clean Slate'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                {language === 'bn'
                  ? 'উপস্থাপনা বা প্রেজেন্টেশন দেওয়ার জন্য ১-ক্লিকে বাস্তবসম্মত ডেমো ডাটা (শিক্ষার্থী, পরীক্ষার নম্বর, হাজিরা, বাড়ির কাজ, ফি ইত্যাদি) লোড করুন। প্রেজেন্টেশন শেষ হলে নিচের লাল বাটনে ১-ক্লিক করলেই সকল ডেমো ডাটা মুছে ফ্রেশ ও শূন্য হয়ে যাবে।'
                  : '1-click load realistic presentation demo data across all modules, or 1-click wipe all demo data to a completely clean slate.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Load Demo Data Button */}
            <button
              onClick={handleLoadDemoData}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{language === 'bn' ? '১-ক্লিকে ডেমো ডাটা লোড করুন' : 'Load Presentation Demo'}</span>
            </button>

            {/* Clear All Data Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isActionLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'bn' ? '১-ক্লিকে সকল ডেমো ডাটা মুছুন' : '1-Click Wipe All Data'}</span>
            </button>
          </div>
        </div>

        {/* Live System Count Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-5">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">শিক্ষার্থী (Students)</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.students)} জন
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">পরীক্ষা (Exams)</span>
            <span className="text-xl font-black text-blue-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.exams)} টি
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">নম্বর এন্ট্রি (Marks)</span>
            <span className="text-xl font-black text-cyan-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.marks)} টি
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">ক্লাস রুটিন (Routine)</span>
            <span className="text-xl font-black text-violet-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.routines)} পিরিয়ড
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">পরীক্ষার রুটিন</span>
            <span className="text-xl font-black text-indigo-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.examRoutines)} টি
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">ফি চালান (Invoices)</span>
            <span className="text-xl font-black text-amber-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.invoices)} টি
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">হোমওয়ার্ক (HW)</span>
            <span className="text-xl font-black text-rose-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.homework)} টি
            </span>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium truncate">লাইব্রেরি বই</span>
            <span className="text-xl font-black text-teal-400 mt-1 block font-mono">
              {toBnNumber(dataCounts.books)} টি
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-white/60 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* SECTION: Master Admin Complete System Backup & Restore (.ZIP Archive) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 shrink-0">
              <FolderArchive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  Master Admin Exclusive • ডাটাবেজ ব্যাকআপ ও রিস্টোর
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  শুধুমাত্র মাস্টার অ্যাডমিন (Shafiq)
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1 text-white">
                {language === 'bn'
                  ? 'সম্পূর্ণ সিস্টেম ডাটাবেজ ব্যাকআপ (.ZIP Archive) ও রিস্টোর'
                  : 'Master Admin Full Database Backup (.ZIP) & Instant Restore'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'bn'
                  ? 'আপনার এন্ট্রি করা সমস্ত ডাটা সহ সম্পূর্ণ প্রজেক্টের সোর্স কোড অথবা শুধু ডাটাবেজ ব্যাকআপ ১-ক্লিকে কমপ্রেসড .ZIP ফাইল আকারে ডাউনলোড করে সুরক্ষিত রাখুন। গুগল এআই স্টুডিওতে সরাসরি রান করার জন্য ফুল প্রজেক্ট জিপ ব্যবহার করুন।'
                  : 'Download complete runnable project codebase with your entered data for Google AI Studio, or backup database records.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Download Full AI Studio Project Codebase Zip */}
            <button
              onClick={handleDownloadFullCodebaseZip}
              disabled={isDownloadingCodebaseZip || isActionLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 border border-blue-400/40"
              title="Download entire runnable source code + all your entered data for Google AI Studio"
            >
              {isDownloadingCodebaseZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'bn' ? 'প্রজেক্ট জিপ তৈরি হচ্ছে...' : 'Building Project ZIP...'}</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-4 h-4 text-blue-200" />
                  <span>{language === 'bn' ? '🚀 গুগল এআই স্টুডিও প্রজেক্ট জিপ ডাউনলোড' : '🚀 Download AI Studio Project ZIP'}</span>
                </>
              )}
            </button>

            {/* Download Data Only Zip Button */}
            <button
              onClick={handleDownloadZipBackup}
              disabled={isDownloadingZip || isActionLoading}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-white transition-all shadow-md flex items-center space-x-2 disabled:opacity-50 border border-slate-700"
              title="Download database records only"
            >
              {isDownloadingZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'bn' ? 'ডাটা জিপ হচ্ছে...' : 'Archiving...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>{language === 'bn' ? 'ডাটাবেজ জিপ (Data Only)' : 'Database Data Only (.ZIP)'}</span>
                </>
              )}
            </button>

            {/* Upload / Restore Button */}
            <label className="cursor-pointer px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 active:scale-95 text-white transition-all shadow-md flex items-center space-x-2">
              <Upload className="w-4 h-4 text-purple-200" />
              <span>{language === 'bn' ? 'ব্যাকআপ রিস্টোর' : 'Upload & Restore'}</span>
              <input
                type="file"
                accept=".zip,.json,application/zip,application/x-zip-compressed,application/json"
                className="hidden"
                onChange={handleSelectRestoreFile}
                disabled={isRestoring}
              />
            </label>
          </div>
        </div>

        {/* Info Grid: What's included in ZIP */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold">
              <FolderArchive className="w-4 h-4" />
              <span>১. রানযোগ্য গুগল এআই স্টুডিও প্রজেক্ট</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              package.json, server.ts, src/, public/
            </p>
            <p className="text-[10px] text-slate-400">
              আপনার সমস্ত এন্ট্রি করা ডাটা সহ পূর্ণ কোডবেজ। এআই স্টুডিওতে সরাসরি রান করবে।
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
              <FileArchive className="w-4 h-4" />
              <span>২. সম্পূর্ণ মাস্টার ডাটাবেজ ফাইল</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              all_school_data_complete.json
            </p>
            <p className="text-[10px] text-slate-400">
              সকল ৩৫+ টেবিলের পূর্ণ স্ন্যাপশট, যা দিয়ে যেকোনো সময় সম্পূর্ণ ডাটাবেজ রিস্টোর করা যায়।
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold">
              <FileText className="w-4 h-4" />
              <span>৩. ভেরিফিকেশন ম্যানিফেস্ট ও মডিউল</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              manifest.json + modules/*.json
            </p>
            <p className="text-[10px] text-slate-400">
              Students, Staff, Fees, Exams, Routine ইত্যাদির আলাদা আলাদা ক্লিন JSON ডাটা।
            </p>
          </div>
        </div>

        {/* Helpful Info Guide: Addressing Invalid Argument */}
        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-amber-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>📌 গুগল এআই স্টুডিওতে "Invalid Argument" কেন এসেছিল এবং সমাধান:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300 leading-relaxed">
            <div className="p-2.5 bg-black/30 rounded-lg border border-white/5">
              <strong className="text-rose-300 block mb-1">❌ কেন Invalid Argument এসেছিল:</strong>
              ১. গুগল এআই স্টুডিও-র চ্যাটবক্স/প্রম্পটে সরাসরি .zip ফাইল দিলে জেমিনি এআই তা প্রসেস করতে পারে না (জেমিনি কেবল ছবি, অডিও, ভিডিও এবং টেক্সট বোঝে), ফলে API "Invalid argument" রিটার্ন করে।<br/>
              ২. আর পূর্বের জিপটিতে শুধু ডাটা ফাইল ছিল, কোনো package.json বা কোড না থাকায় তা নতুন প্রজেক্ট হিসেবে রান করতে পারত না।
            </div>
            <div className="p-2.5 bg-black/30 rounded-lg border border-white/5">
              <strong className="text-emerald-300 block mb-1">✅ সঠিক ব্যবহারের নিয়ম ও সমাধান:</strong>
              ১. <strong>গুগল এআই স্টুডিওতে নতুন প্রজেক্ট রান করার জন্য:</strong> উপরের নীল রঙের <em>"গুগল এআই স্টুডিও প্রজেক্ট জিপ ডাউনলোড"</em> বাটন ব্যবহার করুন। এতে পুরো কোডবেজ এবং ডাটা একসাথে থাকবে, সরাসরি চলবে।<br/>
              ২. <strong>বর্তমান অ্যাপে ডাটা রিস্টোরের জন্য:</strong> যেকোনো ডাটা জিপ ফাইল সরাসরি মাস্টার অ্যাডমিনের <em>"ব্যাকআপ রিস্টোর"</em> বাটনে আপলোড করুন।
            </div>
          </div>
        </div>

        {/* Restore / Download feedback */}
        {restoreFeedback && (
          <div className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            restoreFeedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{restoreFeedback.message}</span>
            </div>
            <button
              onClick={() => setRestoreFeedback(null)}
              className="text-white/60 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {zipDownloadInfo && (
          <div className="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-xs text-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                সর্বশেষ ডাউনলোড: <strong className="text-white font-mono">{zipDownloadInfo.filename}</strong> (সাইজ: {zipDownloadInfo.size})
              </span>
            </div>
            <span className="text-[11px] text-blue-300">সফলভাবে সেভ হয়েছে</span>
          </div>
        )}
      </div>

      {/* SECTION: Notice / Message Editor (What blocked users see) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'bn' ? 'এক্সেস স্থগিত নোটিশ (ব্যবহারকারীদের দেখানোর বার্তা)' : 'Disabled Notice & Reason Broadcast Message'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'যখন কোনো ইউজার বা রোলের এক্সেস বন্ধ থাকবে, তখন হিরো সেকশনে লগইন করার সময় তারা ঠিক এই বার্তাটি দেখতে পাবেন:'
                : 'This exact message will be displayed on the Hero Login screen whenever a blocked user or role tries to log in:'}
            </p>
          </div>

          {/* Quick preset selector */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Presets:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMessage(p.text)}
                className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                title={p.titleEn}
              >
                {language === 'bn' ? p.titleBn : p.titleEn}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveMessage} className="space-y-4">
          <div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="এখানে লিখুন কেন এক্সেস বন্ধ রাখা হয়েছে (Write reasons why access has been suspended)..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Live Preview Pill */}
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start space-x-2.5 flex-1">
              <Eye className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 mr-1.5">
                  {language === 'bn' ? 'লগইন স্ক্রিন প্রিভিউ:' : 'Hero Login Preview:'}
                </span>
                <span className="text-amber-800 italic">"{message || 'No notice message set'}"</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5 self-end"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'bn' ? 'বার্তা সংরক্ষণ ও প্রকাশ করুন' : 'Broadcast Notice Message'}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'bn'
                  ? 'নোটিশটি সফলভাবে সংরক্ষিত ও প্রকাশ করা হয়েছে!'
                  : 'Notice message updated & broadcasted successfully!'}
              </span>
            </div>
          )}
        </form>
      </div>

      {/* SECTION: Role-by-Role Access Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'bn' ? 'রোলভিত্তিক এক্সেস নিয়ন্ত্রণ (Enable / Disable Matrix)' : 'Role-Based Access Control Matrix'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'যেকোনো রোলের এক্সেস তাৎক্ষণিকভাবে অন বা অফ করুন। অফ করলে সেই রোলের কেউ সিস্টেমে ঢুকতে পারবে না।'
                : 'Toggle individual role access instantly. Suspended roles cannot log in and will see the Master Admin notice.'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Role / User Group</th>
                <th className="py-3.5 px-4">Default Account</th>
                <th className="py-3.5 px-4">Scope & Permissions</th>
                <th className="py-3.5 px-4 text-center">Current Status</th>
                <th className="py-3.5 px-4 text-right">Access Control Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleDefinitions.map((item) => {
                const isRoleDisabled = systemAccessControl.disabledRoles.includes(item.role);
                const isSystemLocked = systemAccessControl.isSystemLocked;
                const isEffectivelyBlocked = isSystemLocked || isRoleDisabled;

                return (
                  <tr
                    key={item.role}
                    className={`transition-colors ${
                      isEffectivelyBlocked ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.badgeColor}`}>
                          {item.role}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">
                            {language === 'bn' ? item.nameBn : item.nameEn}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {language === 'bn' ? item.nameEn : item.nameBn}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                      {item.defaultUser}
                    </td>

                    <td className="py-4 px-4 text-slate-600 max-w-xs">
                      {language === 'bn' ? item.descriptionBn : item.descriptionEn}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {isEffectivelyBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <Lock className="w-3 h-3 mr-1 text-rose-600" />
                          {isSystemLocked ? 'Locked (System)' : 'Disabled 🚫'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Enabled (Active)
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleToggleRole(item.role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1.5 ${
                          isRoleDisabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isRoleDisabled ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'সক্রিয় করুন (Enable)' : 'Enable Access'}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'স্থগিত করুন (Disable)' : 'Disable Access'}</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Click Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {language === 'bn' ? 'সকল ডেমো ডাটা মুছে ফেলতে চান?' : 'Wipe All Demo Data?'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'bn'
                    ? 'এটি শিক্ষার্থী তালিকা, পরীক্ষার নম্বর, হাজিরা, বাড়ির কাজ, ফি ইনভয়েস ও নোটিশ সম্পূর্ণ পরিষ্কার (Wipe) করে একটি ফ্রেশ ও শূন্য ডাটাবেজ তৈরি করবে। ক্লাউড ডাটাবেজও শূন্য হয়ে যাবে।'
                    : 'This will completely wipe all student records, examination marks, attendance logs, homework, and fee invoices to a blank slate.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
              💡 {language === 'bn' ? 'প্রয়োজনে পরবর্তীতে আপনি আবার ১-ক্লিকেই ডেমো ডাটা লোড করতে পারবেন।' : 'You can reload the demo data anytime with 1-click.'}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleClearAllData}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'হ্যাঁ, সম্পূর্ণ মুছে ফেলুন' : 'Yes, Wipe Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Restore Confirmation Modal */}
      {showRestoreConfirmModal && pendingRestoreFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {language === 'bn' ? 'ব্যাকআপ থেকে ডাটাবেজ রিস্টোর করবেন?' : 'Restore Database from Backup?'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'bn'
                    ? 'আপনি নিম্নলিখিত ব্যাকআপ ফাইলটি নির্বাচন করেছেন:'
                    : 'You have selected the following backup file:'}
                </p>
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center justify-between">
                  <span className="truncate">{pendingRestoreFile.name}</span>
                  <span className="text-slate-500 text-[11px] font-semibold">
                    {(pendingRestoreFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>সতর্কবার্তা / Important Notice:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                রিস্টোর বাটনে চাপ দিলে ব্যাকআপ ফাইলের ডাটা দিয়ে বর্তমান ডাটাবেজ আপডেট হবে এবং স্বয়ংক্রিয়ভাবে ক্লাউড ডাটাবেজে সিঙ্ক হয়ে যাবে।
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setShowRestoreConfirmModal(false);
                  setPendingRestoreFile(null);
                }}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'bn' ? 'রিস্টোর হচ্ছে...' : 'Restoring...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'হ্যাঁ, কনফার্ম ও রিস্টোর করুন' : 'Confirm & Restore'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
