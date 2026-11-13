import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { StorageService } from '../../services/storage';
import { Student, FeePayment, FeeInvoice, FeeItem } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import {
  Search,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  User,
  Phone,
  Calendar,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Bus,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';

interface StudentFeeStatementTabProps {
  onGoToCounter?: (student: Student, dueItems?: FeeItem[]) => void;
  preselectedStudentId?: string;
}

export const StudentFeeStatementTab: React.FC<StudentFeeStatementTabProps> = ({
  onGoToCounter,
  preselectedStudentId,
}) => {
  const { language, formatTaka, toBnNumber, formatDate, amountInWords } = useLanguage();
  const { schoolProfile } = useSchool();
  const students = useMemo(() => StorageService.getStudents(), []);
  
  // Search query state (student ID, admission No, Roll, or Name)
  const [searchQuery, setSearchQuery] = useState<string>(preselectedStudentId || '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    if (preselectedStudentId) {
      const found = students.find((s) => s.studentId === preselectedStudentId || s.id === preselectedStudentId);
      if (found) return found;
    }
    return students[0] || null;
  });

  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<FeePayment | null>(null);

  // Filter students based on query
  const matchingStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.admissionNo?.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.nameBn.includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.guardianPhone?.includes(q) ||
        s.fatherPhone?.includes(q)
    );
  }, [students, searchQuery]);

  // Handle select student
  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSearchQuery(st.studentId);
  };

  // Get payments (জমা) for the selected student
  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    const allPayments = StorageService.getPayments();
    return allPayments.filter(
      (p) =>
        p.studentId === selectedStudent.id ||
        p.studentId === selectedStudent.studentId ||
        p.studentName.toLowerCase() === selectedStudent.nameEn.toLowerCase()
    );
  }, [selectedStudent]);

  // Get dues (বকেয়া) for the selected student
  const studentDues = useMemo(() => {
    if (!selectedStudent) return [];
    return StorageService.getStudentDueFees(selectedStudent);
  }, [selectedStudent]);

  // Calculations
  const totalPaid = useMemo(() => {
    return studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [studentPayments]);

  const totalDue = useMemo(() => {
    return studentDues.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [studentDues]);

  const totalAssessed = totalPaid + totalDue;

  // Student transport details if enrolled
  const transportInfo = useMemo(() => {
    if (!selectedStudent) return null;
    return StorageService.getStudentTransportByStudentId(selectedStudent.id);
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      {/* Search Bar & Quick Student Picker */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center">
              <Search className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              {language === 'bn'
                ? 'শিক্ষার্থী আইডি (Student ID) বা রোল নম্বর দিন'
                : 'Enter Student ID Number, Roll, or Name'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: S-2026-0001, S-2026-0004 বা রোল নম্বর টাইপ করুন...'
                    : 'e.g. S-2026-0001, S-2026-0004 or type roll number...'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Print & Collect Actions */}
          <div className="flex items-center space-x-2 pt-2 md:pt-6">
            <button
              onClick={() => setShowPrintModal(true)}
              disabled={!selectedStudent}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>{language === 'bn' ? 'স্টেটমেন্ট প্রিন্ট' : 'Print Statement'}</span>
            </button>
            {onGoToCounter && selectedStudent && (
              <button
                onClick={() => onGoToCounter(selectedStudent, studentDues)}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>{language === 'bn' ? 'ফি কাউন্টারে জমা নিন' : 'Collect Fee at Desk'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick select chips for easy testing */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">
            {language === 'bn' ? 'দ্রুত নির্বাচন করুন:' : 'Quick Select Students:'}
          </span>
          {students.slice(0, 6).map((st) => (
            <button
              key={st.id}
              onClick={() => handleSelectStudent(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center space-x-1 ${
                selectedStudent?.id === st.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">{st.studentId}</span>
              <span>•</span>
              <span>{language === 'bn' ? st.nameBn : st.nameEn}</span>
              <span className="text-[10px] opacity-75">({st.className})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Student Banner & Key Metrics */}
      {selectedStudent ? (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-800/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-blue-200 shrink-0 shadow-inner">
                  {selectedStudent.nameEn.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">
                      {language === 'bn' ? selectedStudent.nameBn : selectedStudent.nameEn}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                      ID: {selectedStudent.studentId}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-blue-200/90 font-medium mt-1">
                    {language === 'bn' ? selectedStudent.nameEn : selectedStudent.nameBn} • Roll: #{selectedStudent.roll}
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                    <span>
                      <strong>Class:</strong> {selectedStudent.className} ({selectedStudent.section})
                    </span>
                    <span>
                      <strong>Shift:</strong> {selectedStudent.shift}
                    </span>
                    <span>
                      <strong>Session:</strong> 2026
                    </span>
                    <span>
                      <strong>Father:</strong> {language === 'bn' ? selectedStudent.fatherNameBn || selectedStudent.fatherNameEn : selectedStudent.fatherNameEn}
                    </span>
                    <span>
                      <strong>Phone:</strong> {selectedStudent.guardianPhone || selectedStudent.fatherPhone}
                    </span>
                    {transportInfo && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded font-semibold text-[10px]">
                        Bus: {transportInfo.routeName} ({formatTaka(transportInfo.monthlyFare)}/mo)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-left md:text-right shrink-0">
                <div className="text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                  {language === 'bn' ? 'হালনাগাদ ফি স্ট্যাটাস' : 'Fee Status'}
                </div>
                {totalDue === 0 ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>{language === 'bn' ? 'সকল ফি পরিশোধিত (All Clear)' : 'All Fees Cleared'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {language === 'bn' ? 'বকেয়া ফি রয়েছে' : 'Pending Fees Due'} (৳ {toBnNumber(totalDue)})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Paid (মোট জমা) */}
            <div className="p-5 bg-white rounded-2xl border-2 border-emerald-200/80 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  {language === 'bn' ? 'সর্বমোট ফি জমা (Total Paid)' : 'Total Fee Paid'}
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2 tracking-tight">
                  {formatTaka(totalPaid)}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-1">
                  {language === 'bn'
                    ? `${toBnNumber(studentPayments.length)} টি রসিদে জমা প্রদান করা হয়েছে`
                    : `Deposited via ${studentPayments.length} money receipts`}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ৳
              </div>
            </div>

            {/* Total Due (মোট বকেয়া) */}
            <div className="p-5 bg-white rounded-2xl border-2 border-rose-200/80 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1 text-rose-600" />
                  {language === 'bn' ? 'সর্বমোট বকেয়া ফি (Total Due)' : 'Total Due Fees'}
                </div>
                <div className="text-2xl font-black text-rose-700 mt-2 tracking-tight">
                  {formatTaka(totalDue)}
                </div>
                <div className="text-[11px] text-rose-800 font-medium mt-1">
                  {language === 'bn'
                    ? `${toBnNumber(studentDues.length)} টি ফি খাত এখনও অপরিশোধিত`
                    : `${studentDues.length} pending fee heads`}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                ৳
              </div>
            </div>

            {/* Total Net Billed (মোট ধার্যকৃত ফি) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center">
                  <Receipt className="w-4 h-4 mr-1 text-blue-600" />
                  {language === 'bn' ? 'মোট ধার্য ফি (Total Net Payable)' : 'Total Assessed Fee'}
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                  {formatTaka(totalAssessed)}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {language === 'bn' ? 'জমা + বকেয়ার সর্বমোট সমন্বয়' : 'Total Paid + Total Pending Due'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                ৳
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE 2-COLUMN LEDGER: LEFT = JOMA, RIGHT = DUE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ================= LEFT COLUMN: JOMA (ফি জমার ইতিহাস) ================= */}
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-tight">
                      {language === 'bn' ? 'বাম পাশ: ফি জমা বিবরণী (Paid Ledger)' : 'LEFT: Payment History (Joma)'}
                    </h4>
                    <p className="text-[10px] text-emerald-100">
                      {language === 'bn'
                        ? 'তারিখভিত্তিক পরিশোধিত সকল ফি ও মানি রিসিট'
                        : 'Date-wise payment deposits and receipts'}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-800">
                  {toBnNumber(studentPayments.length)} {language === 'bn' ? 'টি জমা' : 'Deposits'}
                </div>
              </div>

              {/* Payments List / Table */}
              <div className="p-4 space-y-3 flex-1 min-h-[300px]">
                {studentPayments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {language === 'bn'
                      ? 'এই শিক্ষার্থীর কোনো পূর্ববর্তী ফি জমার রেকর্ড নেই।'
                      : 'No payment deposit records found for this student.'}
                  </div>
                ) : (
                  studentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-colors text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                              {payment.receiptNo}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                              {formatDate(payment.paidDate)}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 mt-2 text-xs">
                            {payment.items && payment.items.length > 0
                              ? payment.items.map((it) => it.headName).join(' + ')
                              : 'Monthly Tuition / Exam / School Fee'}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center">
                              <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                              <strong>Method:</strong>&nbsp;{payment.paymentMethod}
                            </span>
                            {payment.transactionId && (
                              <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded">
                                TXN: {payment.transactionId}
                              </span>
                            )}
                            <span>
                              <strong>By:</strong>&nbsp;{payment.collectedBy}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className="font-black text-emerald-700 text-base block font-mono">
                            {formatTaka(payment.amount)}
                          </span>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                            {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                          </span>
                        </div>
                      </div>

                      {/* Receipt Action */}
                      <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 text-[10px]">
                          {payment.notes || 'Official Cash Receipt'}
                        </span>
                        <button
                          onClick={() => setSelectedReceiptPayment(payment)}
                          className="font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>{language === 'bn' ? 'রসিদ দেখুন' : 'View Receipt'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Grand Total Paid */}
              <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900 uppercase">
                    {language === 'bn' ? 'সর্বমোট পরিশোধিত জমা (Total Paid)' : 'Grand Total Paid'}
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    {amountInWords(totalPaid)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-800 font-mono tracking-tight">
                    {formatTaka(totalPaid)}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: DUE (বকেয়া ফি বিবরণী) ================= */}
            <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-tight">
                      {language === 'bn' ? 'ডান পাশ: বকেয়া ফি বিবরণী (Due Ledger)' : 'RIGHT: Outstanding Dues'}
                    </h4>
                    <p className="text-[10px] text-rose-100">
                      {language === 'bn'
                        ? 'কোন কোন ফি খাতে কত টাকা বকেয়া রয়েছে ও শেষ তারিখ'
                        : 'Unpaid fee heads, due dates and pending amounts'}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-rose-800">
                  {toBnNumber(studentDues.length)} {language === 'bn' ? 'টি বকেয়া' : 'Dues'}
                </div>
              </div>

              {/* Dues List / Cards */}
              <div className="p-4 space-y-3 flex-1 min-h-[300px]">
                {studentDues.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                    <div className="font-bold text-emerald-700 text-sm">
                      {language === 'bn' ? 'আলহামদুলিল্লাহ, কোনো বকেয়া নেই!' : 'No Due Fees!'}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1">
                      {language === 'bn'
                        ? 'এই শিক্ষার্থীর সকল ধার্যকৃত ফি সম্পূর্ণরূপে পরিশোধ করা হয়েছে।'
                        : 'All scheduled and monthly fees for this student have been cleared.'}
                    </p>
                  </div>
                ) : (
                  studentDues.map((due, idx) => (
                    <div
                      key={due.id || idx}
                      className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-colors text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {due.headName}
                            </span>
                          </div>
                          {due.month && (
                            <div className="text-[11px] text-slate-600 font-medium mt-1">
                              <strong>Session / Month:</strong> {due.month}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-1.5">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-slate-400" />
                              <strong>Due Date:</strong>&nbsp;{formatDate(due.dueDate || '2026-10-31')}
                            </span>
                            {due.isOverdue && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                                {language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className="font-black text-rose-700 text-base block font-mono">
                            {formatTaka(due.amount)}
                          </span>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                            {language === 'bn' ? 'বকেয়া' : 'Due'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Grand Total Due & 1-Click Collect */}
              <div className="p-4 bg-rose-50 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-900 uppercase">
                    {language === 'bn' ? 'সর্বমোট বকেয়া (Grand Total Due)' : 'Grand Total Due'}
                  </div>
                  <div className="text-[11px] text-rose-800 mt-0.5">
                    {amountInWords(totalDue)}
                  </div>
                </div>
                <div className="flex items-center space-x-3 justify-between sm:justify-end">
                  <div className="text-xl font-black text-rose-800 font-mono tracking-tight">
                    {formatTaka(totalDue)}
                  </div>
                  {onGoToCounter && totalDue > 0 && (
                    <button
                      onClick={() => onGoToCounter(selectedStudent, studentDues)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1"
                    >
                      <span>{language === 'bn' ? 'জমা নিন' : 'Pay Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h4 className="font-bold text-slate-700 text-sm">
            {language === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select or Search a Student'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'bn'
              ? 'উপরের সার্চ বক্সে শিক্ষার্থী আইডি (যেমন: S-2026-0001) লিখে সার্চ করুন বা কুইক বাটন চাপুন।'
              : 'Enter a student ID or select from quick list above to view complete fee statement.'}
          </p>
        </div>
      )}

      {/* Official Printable Statement Modal */}
      {showPrintModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-8 text-xs my-8 print:p-0 print:border-none print:shadow-none">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>
                  {language === 'bn'
                    ? 'শিক্ষার্থীর অফিসিয়াল ফি বিবরণী (Official Statement)'
                    : 'Official Student Fee Statement'}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE BODY */}
            <div className="border border-slate-300 p-6 rounded-xl bg-white space-y-6">
              {/* Institution Header */}
              <div className="text-center border-b pb-4 border-slate-200">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={schoolProfile.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-14 h-14 object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {schoolProfile.nameEn}
                    </h2>
                    <h3 className="text-sm font-bold text-blue-800">{schoolProfile.nameBn}</h3>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  {schoolProfile.addressEn} • Phone: {schoolProfile.phone} • EIIN: {schoolProfile.eiin}
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-slate-900 text-white rounded font-bold uppercase text-[11px] tracking-wider">
                  STUDENT FEE STATEMENT & LEDGER (ফি জমার ও বকেয়ার বিবরণী)
                </div>
              </div>

              {/* Student Metadata Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <div className="space-y-1">
                    <div>
                      <strong>Student Name:</strong> {selectedStudent.nameEn} ({selectedStudent.nameBn})
                    </div>
                    <div>
                      <strong>Student ID:</strong> <span className="font-mono font-bold text-blue-900">{selectedStudent.studentId}</span>
                    </div>
                    <div>
                      <strong>Class & Section:</strong> {selectedStudent.className} - {selectedStudent.section}
                    </div>
                    <div>
                      <strong>Class Roll:</strong> #{selectedStudent.roll}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-1">
                    <div>
                      <strong>Father's Name:</strong> {selectedStudent.fatherNameEn} {selectedStudent.fatherNameBn ? `(${selectedStudent.fatherNameBn})` : ''}
                    </div>
                    <div>
                      <strong>Guardian Contact:</strong> {selectedStudent.guardianPhone || selectedStudent.fatherPhone}
                    </div>
                    <div>
                      <strong>Academic Session:</strong> 2026
                    </div>
                    <div>
                      <strong>Statement Date:</strong> {new Date().toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Ledger in Print Document */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Left: Joma Table */}
                <div className="border border-emerald-300 rounded-lg overflow-hidden">
                  <div className="bg-emerald-700 text-white p-2 font-bold flex justify-between items-center text-[11px]">
                    <span>পরিশোধিত ফি (Paid History - Joma)</span>
                    <span>Total: {formatTaka(totalPaid)}</span>
                  </div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 font-semibold">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Receipt</th>
                        <th className="p-2">Particulars</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            No payment deposits
                          </td>
                        </tr>
                      ) : (
                        studentPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono">{p.paidDate}</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{p.receiptNo}</td>
                            <td className="p-2">
                              {p.items?.map((it) => it.headName).join(', ') || 'School Fee'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-800">
                              {formatTaka(p.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-emerald-100/60 font-bold border-t border-emerald-200">
                      <tr>
                        <td colSpan={3} className="p-2 text-emerald-900">
                          Total Paid Amount:
                        </td>
                        <td className="p-2 text-right text-emerald-950 font-mono">
                          {formatTaka(totalPaid)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Right: Due Table */}
                <div className="border border-rose-300 rounded-lg overflow-hidden">
                  <div className="bg-rose-700 text-white p-2 font-bold flex justify-between items-center text-[11px]">
                    <span>বকেয়া ফি তালিকা (Outstanding Dues)</span>
                    <span>Total: {formatTaka(totalDue)}</span>
                  </div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-rose-50 border-b border-rose-200 text-rose-900 font-semibold">
                      <tr>
                        <th className="p-2">Particulars / Head</th>
                        <th className="p-2">Month</th>
                        <th className="p-2">Due Date</th>
                        <th className="p-2 text-right">Due Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentDues.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-emerald-600 font-bold">
                            All fees cleared (No dues)
                          </td>
                        </tr>
                      ) : (
                        studentDues.map((d, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold text-slate-800">{d.headName}</td>
                            <td className="p-2">{d.month || '-'}</td>
                            <td className="p-2 font-mono">{d.dueDate || '2026-10-31'}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-800">
                              {formatTaka(d.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-rose-100/60 font-bold border-t border-rose-200">
                      <tr>
                        <td colSpan={3} className="p-2 text-rose-900">
                          Total Outstanding Due:
                        </td>
                        <td className="p-2 text-right text-rose-950 font-mono">
                          {formatTaka(totalDue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
                <div>
                  Net Assessed: <span className="font-mono">{formatTaka(totalAssessed)}</span>
                </div>
                <div>
                  Total Collected (Joma): <span className="font-mono text-emerald-800">{formatTaka(totalPaid)}</span>
                </div>
                <div>
                  Current Balance Due: <span className="font-mono text-rose-800">{formatTaka(totalDue)}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold text-slate-700">
                    Student / Guardian Signature
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold text-slate-700">
                    Accounts Officer
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-semibold text-slate-700">
                    Headmaster / Principal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Money Receipt View Modal */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Money Receipt: {selectedReceiptPayment.receiptNo}</span>
              </h3>
              <button
                onClick={() => setSelectedReceiptPayment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceiptPayment.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Date:</span>
                <span className="font-mono text-slate-800">{formatDate(selectedReceiptPayment.paidDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{selectedReceiptPayment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-blue-700">{selectedReceiptPayment.paymentMethod}</span>
              </div>
              {selectedReceiptPayment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono text-slate-700">{selectedReceiptPayment.transactionId}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-1">Fee Heads:</div>
                <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                  {selectedReceiptPayment.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.headName}</span>
                      <span className="font-mono font-bold text-slate-800">{formatTaka(it.amount)}</span>
                    </div>
                  )) || <div>General Fee Deposit: {formatTaka(selectedReceiptPayment.amount)}</div>}
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center text-sm font-bold text-emerald-800">
                <span>Total Paid:</span>
                <span className="font-mono text-base">{formatTaka(selectedReceiptPayment.amount)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedReceiptPayment(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
