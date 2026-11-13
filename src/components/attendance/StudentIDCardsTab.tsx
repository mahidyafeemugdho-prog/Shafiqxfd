import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Student, Staff } from '../../types';
import {
  QrCode,
  Printer,
  Download,
  Search,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  CreditCard,
  User,
  Users,
  Briefcase,
  Building,
  RotateCw,
  Layers,
  PhoneCall,
  MapPin,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import QRCode from 'qrcode';
import { formatGroupName } from '../../utils/i18n';

export const StudentIDCardsTab: React.FC = () => {
  const { language, toBnNumber } = useLanguage();
  const { schoolProfile: school } = useSchool();
  const [targetAudience, setTargetAudience] = useState<'students' | 'staff'>('students');
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [staffList, setStaffList] = useState<Staff[]>(() => StorageService.getStaff());

  // Student Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Staff Filter
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Common Search & Card View Mode (Front Side, Back Side, or Both)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cardViewMode, setCardViewMode] = useState<'both' | 'front' | 'back'>('both');
  const [cardTemplate, setCardTemplate] = useState<'classic_academic' | 'executive_royal' | 'modern_emerald'>('classic_academic');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [staffQrUrls, setStaffQrUrls] = useState<Record<string, string>>({});

  // Dynamic template color styles for Front Side (Back side is strictly pure white per user requirements)
  const getTemplateStyles = (isStaff: boolean) => {
    if (cardTemplate === 'executive_royal') {
      return {
        cardBorder: isStaff
          ? 'border-2 border-amber-600 shadow-xl ring-2 ring-amber-200'
          : 'border-2 border-amber-700 shadow-xl ring-2 ring-amber-200',
        headerBg: isStaff
          ? 'bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white'
          : 'bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 text-white',
        ribbonBg: isStaff ? 'bg-amber-500 text-slate-950 font-black' : 'bg-amber-400 text-slate-950 font-black',
        photoBorder: isStaff ? 'border-2 border-amber-500 shadow-sm' : 'border-2 border-amber-600 shadow-sm',
        badgeBg: isStaff ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-100 text-amber-900 border-amber-300',
        accentText: isStaff ? 'text-amber-800' : 'text-amber-800',
        nameColor: isStaff ? 'text-amber-950' : 'text-amber-950',
        tagBg: 'bg-amber-50 text-amber-900 border-amber-300',
      };
    } else if (cardTemplate === 'modern_emerald') {
      return {
        cardBorder: isStaff
          ? 'border-2 border-emerald-600 shadow-xl ring-2 ring-emerald-200'
          : 'border-2 border-teal-600 shadow-xl ring-2 ring-teal-200',
        headerBg: isStaff
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white'
          : 'bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-800 text-white',
        ribbonBg: isStaff ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-teal-300 text-slate-950 font-black',
        photoBorder: isStaff ? 'border-2 border-emerald-500 shadow-sm' : 'border-2 border-teal-500 shadow-sm',
        badgeBg: isStaff ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-teal-100 text-teal-900 border-teal-200',
        accentText: isStaff ? 'text-emerald-800' : 'text-teal-800',
        nameColor: isStaff ? 'text-emerald-950' : 'text-teal-950',
        tagBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      };
    } else {
      // Classic Academic (Blue / Navy)
      return {
        cardBorder: isStaff ? 'border-2 border-slate-300 shadow-md' : 'border-2 border-blue-400 shadow-md',
        headerBg: isStaff
          ? 'bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white'
          : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white',
        ribbonBg: isStaff ? 'bg-indigo-600 text-white font-black' : 'bg-amber-400 text-slate-900 font-bold',
        photoBorder: isStaff ? 'border-2 border-indigo-600' : 'border-2 border-blue-600',
        badgeBg: isStaff ? 'bg-indigo-50 text-indigo-900 border-indigo-200' : 'bg-blue-50 text-blue-900 border-blue-200',
        accentText: isStaff ? 'text-indigo-700' : 'text-blue-700',
        nameColor: isStaff ? 'text-slate-900' : 'text-slate-900',
        tagBg: 'bg-blue-50 text-blue-900 border-blue-200',
      };
    }
  };

  const ALL_CLASSES = [
    'Nursery',
    'KG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const DEPARTMENTS = [
    'Administration',
    'Mathematics & Science',
    'Languages',
    'Science',
    'Accounts & Finance',
    'Library',
    'Front Office',
  ];

  // Refresh lists on mount
  useEffect(() => {
    setStudents(StorageService.getStudents());
    setStaffList(StorageService.getStaff());
  }, []);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.className === selectedClass;
    const matchSection = selectedSection === 'all' || s.section === selectedSection;
    const matchSearch =
      !searchQuery ||
      s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nameBn.includes(searchQuery) ||
      s.roll.includes(searchQuery) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchClass && matchSection && matchSearch;
  });

  // Filter staff
  const filteredStaff = staffList.filter((st) => {
    const matchDept = selectedDept === 'all' || st.department === selectedDept;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      st.nameEn.toLowerCase().includes(q) ||
      st.nameBn.includes(searchQuery) ||
      st.employeeId.toLowerCase().includes(q) ||
      st.designation.toLowerCase().includes(q) ||
      st.phone.includes(searchQuery);
    return matchDept && matchSearch;
  });

  // Generate QR Code data URLs for students in view (Strictly Pitch Black on White #000000 on #ffffff)
  useEffect(() => {
    if (targetAudience === 'students') {
      filteredStudents.forEach(async (student) => {
        if (!qrCodeUrls[student.id]) {
          try {
            const qrData = StorageService.generateStudentQRData(student);
            const url = await QRCode.toDataURL(qrData, {
              errorCorrectionLevel: 'H',
              margin: 1,
              width: 220,
              color: { dark: '#000000', light: '#ffffff' },
            });
            setQrCodeUrls((prev) => ({ ...prev, [student.id]: url }));
          } catch (e) {
            console.error('Failed generating QR code for student:', student.id, e);
          }
        }
      });
    }
  }, [targetAudience, filteredStudents, qrCodeUrls]);

  // Generate QR Code data URLs for teachers/staff in view (Strictly Pitch Black on White #000000 on #ffffff)
  useEffect(() => {
    if (targetAudience === 'staff') {
      filteredStaff.forEach(async (member) => {
        if (!staffQrUrls[member.id]) {
          try {
            const qrData = StorageService.generateStaffQRData(member);
            const url = await QRCode.toDataURL(qrData, {
              errorCorrectionLevel: 'H',
              margin: 1,
              width: 220,
              color: { dark: '#000000', light: '#ffffff' },
            });
            setStaffQrUrls((prev) => ({ ...prev, [member.id]: url }));
          } catch (e) {
            console.error('Failed generating QR code for staff:', member.id, e);
          }
        }
      });
    }
  }, [targetAudience, filteredStaff, staffQrUrls]);

  const handlePrintAll = () => {
    window.print();
  };

  const handleDownloadStudentQR = (student: Student) => {
    const url = qrCodeUrls[student.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Attendance_${student.studentId}_${student.nameEn.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleDownloadStaffQR = (member: Staff) => {
    const url = staffQrUrls[member.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Attendance_${member.employeeId}_${member.nameEn.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Target Audience Switcher: Students vs Teachers/Staff */}
      <div className="p-2 bg-slate-100 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setTargetAudience('students')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              targetAudience === 'students'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>
              {language === 'bn'
                ? `শিক্ষার্থী আইডি কার্ড (${toBnNumber(students.length)} জন)`
                : `Student ID Cards (${students.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTargetAudience('staff')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              targetAudience === 'staff'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {language === 'bn'
                ? `শিক্ষক ও স্টাফ আইডি কার্ড (${toBnNumber(staffList.length)} জন)`
                : `Teacher & Staff ID Cards (${staffList.length})`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrintAll}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সবগুলো প্রিন্ট করুন' : 'Print All Cards'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Card Mode Switcher Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
        {/* Card View Mode Selector (Front Side, Back Side, or Both) */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setCardViewMode('both')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
              cardViewMode === 'both'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>উভয় অংশ (Front & Back Side)</span>
          </button>

          <button
            type="button"
            onClick={() => setCardViewMode('front')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
              cardViewMode === 'front'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>সামনের অংশ (Front Side)</span>
          </button>

          <button
            type="button"
            onClick={() => setCardViewMode('back')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
              cardViewMode === 'back'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>পেছনের অংশ (Back Side - White & Black QR)</span>
          </button>
        </div>

        {/* Template Selector (3 Customizable Professional Templates) */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-700 px-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>কালার থিম:</span>
          </span>
          <button
            type="button"
            onClick={() => setCardTemplate('classic_academic')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cardTemplate === 'classic_academic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/70'
            }`}
          >
            ১. ক্লাসিক ব্লু
          </button>
          <button
            type="button"
            onClick={() => setCardTemplate('executive_royal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cardTemplate === 'executive_royal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/70'
            }`}
          >
            ২. রয়্যাল মেরুন/গোল্ড
          </button>
          <button
            type="button"
            onClick={() => setCardTemplate('modern_emerald')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cardTemplate === 'modern_emerald'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/70'
            }`}
          >
            ৩. মডার্ন এমারেল্ড
          </button>
        </div>

        {/* Dynamic Filters depending on Student vs Staff */}
        <div className="flex flex-wrap items-center gap-3">
          {targetAudience === 'students' ? (
            <>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">শ্রেণি:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="all">সব শ্রেণি ({students.length} জন)</option>
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c} ({students.filter((s) => s.className === c).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">শাখা:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="all">সব শাখা</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-700">বিভাগ:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="all">সব বিভাগ ({staffList.length} জন)</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d} ({staffList.filter((st) => st.department === d).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={
                targetAudience === 'students'
                  ? 'নাম, রোল বা আইডি দিয়ে খুঁজুন...'
                  : 'নাম, পদবি বা এমপ্লয়ি আইডি...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs w-56"
            />
          </div>
        </div>
      </div>

      {/* Notice info banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {targetAudience === 'students' ? (
              <>
                প্রতিটি শিক্ষার্থীর জন্য <strong>সামনের অংশ (Front)</strong> এবং <strong>পেছনের অংশ (Back)</strong> স্বয়ংক্রিয়ভাবে জেনারেট হচ্ছে। পেছনের অংশটি সম্পূর্ণ সাদা ব্যাকগ্রাউন্ডে ঝকঝকে কালো কিউআর ও জরুরি অভিভাবক মোবাইল নম্বরসহ প্রস্তুত।
              </>
            ) : (
              <>
                প্রতিটি শিক্ষক ও কর্মচারীর জন্য <strong>অফিসিয়াল ফ্যাকাল্টি কার্ড (Front)</strong> এবং <strong>সাদা ব্যাকগ্রাউন্ডে কালো কিউআর ও জরুরি মোবাইলযুক্ত ব্যাক পার্ট (Back)</strong> সংযুক্ত রয়েছে।
              </>
            )}
          </span>
        </div>
        <span className="font-bold text-blue-700 shrink-0">
          মোট কার্ড: {toBnNumber(targetAudience === 'students' ? filteredStudents.length : filteredStaff.length)} জন
        </span>
      </div>

      {/* ======================================================== */}
      {/* 1. TEACHERS & STAFF ID CARDS GRID                       */}
      {/* ======================================================== */}
      {targetAudience === 'staff' && (
        <div className="space-y-8">
          {filteredStaff.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
              কোনো শিক্ষক বা কর্মচারী পাওয়া যায়নি। সার্চ ফিল্টার পরিবর্তন করুন।
            </div>
          ) : (
            filteredStaff.map((member) => {
              const qrUrl = staffQrUrls[member.id];
              const staffStyles = getTemplateStyles(true);

              return (
                <div
                  key={member.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none"
                >
                  {/* Staff Mini Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 print:hidden">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {member.nameBn || member.nameEn} ({member.nameEn})
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                        ID: {member.employeeId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {member.designation} • {member.department}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        onClick={() => handleDownloadStaffQR(member)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg font-bold"
                      >
                        <Download className="w-3 h-3" />
                        <span>কিউআর ডাউনলোড</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <Printer className="w-3 h-3" />
                        <span>প্রিন্ট</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Card Row for Staff (Front Side & Pure White Back Side) */}
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {/* 1. FRONT SIDE: OFFICIAL FACULTY & STAFF ID CARD */}
                    {(cardViewMode === 'both' || cardViewMode === 'front') && (
                      <div className={`w-[320px] h-[490px] bg-white rounded-2xl overflow-hidden relative font-sans text-slate-900 flex flex-col justify-between transition-all ${staffStyles.cardBorder} print:shadow-none print:border-2 print:border-black`}>
                        {/* Header */}
                        <div>
                          <div className={`${staffStyles.headerBg} p-3 text-center relative`}>
                            <div className="flex items-center justify-center space-x-2 mb-1">
                              <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                                {school.logoUrl ? (
                                  <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                  <Building className="w-5 h-5 text-indigo-700" />
                                )}
                              </div>
                              <div className="text-left leading-tight">
                                <h4 className="font-extrabold text-[11px] text-white leading-tight uppercase">{school.nameEn || 'SMART MODEL SCHOOL & COLLEGE'}</h4>
                                <h5 className="font-bold text-[9px] text-slate-200">{school.nameBn}</h5>
                              </div>
                            </div>
                            <div className="text-[8px] opacity-85 flex items-center justify-center space-x-1.5 font-mono">
                              <span>EIIN: {school.eiin}</span>
                              <span>•</span>
                              <span>Session: {school.currentSession || '2026'}</span>
                            </div>
                          </div>

                          {/* Ribbon */}
                          <div className={`${staffStyles.ribbonBg} py-0.5 text-center text-[9px] uppercase tracking-wider flex items-center justify-center space-x-1`}>
                            <Briefcase className="w-2.5 h-2.5" />
                            <span>FACULTY & STAFF IDENTITY CARD</span>
                          </div>

                          {/* Body */}
                          <div className="p-3 flex flex-col items-center">
                            <div className="relative mb-2">
                              <div className={`w-20 h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center ${staffStyles.photoBorder}`}>
                                {member.photoUrl ? (
                                  <img src={member.photoUrl} alt={member.nameEn} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-indigo-800 to-slate-900 text-white flex items-center justify-center text-2xl font-black">
                                    {member.nameEn.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-center w-full pb-1 mb-1 border-b border-slate-200">
                              <h3 className={`font-black text-xs uppercase ${staffStyles.nameColor}`}>{member.nameEn}</h3>
                              <p className={`text-[11px] font-bold ${staffStyles.accentText}`}>{member.nameBn}</p>
                              <span className={`mt-0.5 inline-block px-2.5 py-0.5 rounded-full font-black text-[9px] border ${staffStyles.badgeBg}`}>
                                🎖️ {member.designation}
                              </span>
                            </div>

                            <div className="w-full text-[10px] space-y-1 px-1">
                              <div className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Employee ID:</span>
                                <span className="font-bold font-mono text-slate-900">{member.employeeId}</span>
                              </div>
                              <div className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Department:</span>
                                <span className="font-semibold text-slate-800">{member.department}</span>
                              </div>
                              <div className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Blood Group:</span>
                                <span className="font-black text-rose-600">{member.bloodGroup || 'B+'}</span>
                              </div>
                              <div className="flex justify-between py-0.5 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Official Mobile:</span>
                                <span className="font-mono text-slate-900 font-bold">{member.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Front Footer with Signatures */}
                        <div>
                          <div className="w-full px-3.5 pb-2 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                            <div className="text-center">
                              <div className="font-serif italic text-[10px] text-slate-700 border-b border-slate-300 pb-0.5 w-20">
                                Employee
                              </div>
                              <span className="text-[7.5px] text-slate-500 block uppercase font-medium">
                                Employee Signature
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="font-serif italic text-[10px] text-blue-900 border-b border-slate-400 pb-0.5 w-24 truncate">
                                {school.principalNameEn || 'Principal'}
                              </div>
                              <span className="text-[7.5px] text-slate-500 block uppercase font-medium">
                                Principal Signature
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 border-t border-slate-200 py-1 text-center text-[7.5px] text-slate-500">
                            Institutional Staff ID • Verification Helpline: {school.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. BACK SIDE: STRICTLY PURE WHITE BACKGROUND, SOLID BLACK TEXT, BLACK QR & PROMINENT MOBILE */}
                    {(cardViewMode === 'both' || cardViewMode === 'back') && (
                      <div className="w-[320px] h-[490px] bg-white text-black rounded-2xl border-2 border-black shadow-xl overflow-hidden flex flex-col justify-between font-sans print:border-2 print:border-black p-3.5 relative">
                        {/* Back Top Header (Black on White) */}
                        <div className="border-b-2 border-black pb-2 text-center">
                          <h4 className="font-black text-[11px] uppercase tracking-wider text-black">
                            {school.nameEn || 'INSTITUTION IDENTITY'}
                          </h4>
                          <p className="font-bold text-[8.5px] text-black tracking-widest uppercase">
                            FACULTY & STAFF IDENTITY CARD • BACK SIDE
                          </p>
                        </div>

                        {/* Center: High-Definition Pitch Black QR Code & Scan Info */}
                        <div className="flex flex-col items-center justify-center my-1">
                          <div className="p-1 bg-white rounded-xl border-2 border-black shadow-2xs">
                            {qrUrl ? (
                              <img src={qrUrl} alt="Attendance QR" className="w-28 h-28 object-contain" />
                            ) : (
                              <div className="w-28 h-28 bg-white border border-black flex items-center justify-center text-xs font-mono font-bold text-black">
                                QR CODE
                              </div>
                            )}
                          </div>
                          <span className="mt-1 font-mono font-black text-[11px] text-black tracking-wider">
                            EMP ID: {member.employeeId}
                          </span>
                          <span className="text-[8px] font-bold text-black uppercase tracking-wider">
                            Digital Gate Kiosk Attendance QR Code
                          </span>
                        </div>

                        {/* PROMINENT MOBILE & EMERGENCY CONTACT BOX (User requested: QR Mobile thakbe) */}
                        <div className="bg-white border-2 border-black rounded-xl p-2 text-black space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-black" />
                              <span>Official Mobile:</span>
                            </span>
                            <span className="font-mono font-black text-[11px] text-black">{member.phone}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-black">
                            <span className="font-bold">Emergency Contact:</span>
                            <span className="font-mono font-bold text-black">{member.emergencyContact || member.phone}</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-black">Blood Group: <strong>{member.bloodGroup || 'B+'}</strong></span>
                            <span className="text-black">National ID (NID): <strong>{member.nid || 'N/A'}</strong></span>
                          </div>
                        </div>

                        {/* Cardholder Rules & Return Note */}
                        <div className="space-y-1 text-[8px] text-black leading-tight border-t border-black pt-2">
                          <p className="font-bold uppercase tracking-wider text-[8.5px]">Rules & Regulations:</p>
                          <ol className="list-decimal pl-3 space-y-0.5">
                            <li>Carrying this identity card is mandatory within the institutional campus.</li>
                            <li>Scan QR code at the gate kiosk for automatic faculty attendance check-in/out.</li>
                            <li>This card is non-transferable and remains institutional property.</li>
                          </ol>
                          <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7.5px] font-semibold">
                            <span>If found, return to: {school.nameEn}</span>
                            <span>Helpline: {school.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STUDENTS ID CARDS GRID                                */}
      {/* ======================================================== */}
      {targetAudience === 'students' && (
        <div className="space-y-8">
          {filteredStudents.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
              কোনো শিক্ষার্থী পাওয়া যায়নি। সার্চ ফিল্টার পরিবর্তন করুন।
            </div>
          ) : (
            filteredStudents.map((student) => {
              const qrUrl = qrCodeUrls[student.id];
              const studentStyles = getTemplateStyles(false);

              return (
                <div
                  key={student.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none"
                >
                  {/* Student Mini Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 print:hidden">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {student.nameBn || student.nameEn} ({student.nameEn})
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        ID: {student.studentId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        শ্রেণি: {student.className} • রোল: {student.roll}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        onClick={() => handleDownloadStudentQR(student)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg font-bold"
                      >
                        <Download className="w-3 h-3" />
                        <span>কিউআর ডাউনলোড</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <Printer className="w-3 h-3" />
                        <span>প্রিন্ট</span>
                      </button>
                    </div>
                  </div>

                  {/* Dual Card Row (Front Side & Pure White Back Side) */}
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {/* 1. FRONT SIDE: ACADEMIC STUDENT ID CARD */}
                    {(cardViewMode === 'both' || cardViewMode === 'front') && (
                      <div className={`w-[320px] h-[490px] bg-white rounded-2xl overflow-hidden relative font-sans text-slate-900 flex flex-col justify-between transition-all ${studentStyles.cardBorder} print:shadow-none print:border-2 print:border-black`}>
                        {/* Header */}
                        <div>
                          <div className={`${studentStyles.headerBg} p-3 text-center relative`}>
                            <div className="flex items-center justify-center space-x-2 mb-1">
                              <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                                {school.logoUrl ? (
                                  <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                  <Building className="w-5 h-5 text-blue-700" />
                                )}
                              </div>
                              <div className="text-left leading-tight">
                                <h4 className="font-extrabold text-[11px] text-white leading-tight uppercase">{school.nameEn || 'SMART MODEL SCHOOL & COLLEGE'}</h4>
                                <h5 className="font-bold text-[9px] text-blue-100">{school.nameBn}</h5>
                              </div>
                            </div>
                            <div className="text-[8px] opacity-85 flex items-center justify-center space-x-1.5 font-mono">
                              <span>EIIN: {school.eiin}</span>
                              <span>•</span>
                              <span>Session: {student.session || school.currentSession || '2026'}</span>
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
                              <p className={`text-[11px] font-bold ${studentStyles.accentText}`}>{student.nameBn}</p>
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

                              {/* Class 9 & 10 Group Badge */}
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
                                {school.principalNameEn || 'Principal'}
                              </div>
                              <span className="text-[7.5px] text-slate-500 block uppercase font-medium">
                                Principal Signature
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 border-t border-slate-200 py-1 text-center text-[7.5px] text-slate-500">
                            Institutional Property • Helpline: {school.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. BACK SIDE: STRICTLY PURE WHITE BACKGROUND, SOLID BLACK TEXT, BLACK QR & GUARDIAN MOBILE */}
                    {(cardViewMode === 'both' || cardViewMode === 'back') && (
                      <div className="w-[320px] h-[490px] bg-white text-black rounded-2xl border-2 border-black shadow-xl overflow-hidden flex flex-col justify-between font-sans print:border-2 print:border-black p-3.5 relative">
                        {/* Back Top Header (Black on White) */}
                        <div className="border-b-2 border-black pb-2 text-center">
                          <h4 className="font-black text-[11px] uppercase tracking-wider text-black">
                            {school.nameEn || 'INSTITUTION IDENTITY'}
                          </h4>
                          <p className="font-bold text-[8.5px] text-black tracking-widest uppercase">
                            STUDENT IDENTITY CARD • BACK SIDE
                          </p>
                        </div>

                        {/* Center: High-Definition Pitch Black QR Code & Scan Info */}
                        <div className="flex flex-col items-center justify-center my-1">
                          <div className="p-1 bg-white rounded-xl border-2 border-black shadow-2xs">
                            {qrUrl ? (
                              <img src={qrUrl} alt="Student Attendance QR" className="w-28 h-28 object-contain" />
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
                            <li>This card must be displayed or carried while on school campus.</li>
                            <li>Scan QR code at the smart gate kiosk for automatic daily attendance.</li>
                            <li>Institutional property and non-transferable. Report loss immediately to office.</li>
                          </ol>
                          <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7.5px] font-semibold">
                            <span>If found, return to: {school.nameEn}</span>
                            <span>Helpline: {school.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
