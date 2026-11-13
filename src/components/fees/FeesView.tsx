import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { StorageService } from '../../services/storage';
import { FeeInvoice, FeePayment, Expense, Student, FeeItem, ClassFeeConfig, OnlinePaymentRequest, MfsPaymentSettings } from '../../types';
import { ClassFeeSetupTab } from './ClassFeeSetupTab';
import { ScheduledFeesTab } from './ScheduledFeesTab';
import { TransportStudentsTab } from './TransportStudentsTab';
import { StudentFeeStatementTab } from './StudentFeeStatementTab';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import { formatGroupName } from '../../utils/i18n';
import {
  Wallet,
  Search,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  X,
  CreditCard,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  UserCheck,
  Sparkles,
  Calendar,
  Check,
  ChevronRight,
  User,
  Phone,
  Tag,
  BookOpen,
  Bus,
  Award,
  Layers,
  HelpCircle,
  CalendarDays,
  ShieldCheck,
  Zap,
  CheckSquare,
  UserPlus,
  Smartphone,
  Settings,
  MessageSquare,
  Edit2,
} from 'lucide-react';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAMES_BN: Record<string, string> = {
  January: 'জানুয়ারি',
  February: 'ফেব্রুয়ারি',
  March: 'মার্চ',
  April: 'এপ্রিল',
  May: 'মে',
  June: 'জুন',
  July: 'জুলাই',
  August: 'আগস্ট',
  September: 'সেপ্টেম্বর',
  October: 'অক্টোবর',
  November: 'নভেম্বর',
  December: 'ডিসেম্বর',
};

// Preset standard fee heads for quick adding
const QUICK_PRESETS = [
  { id: 'tuition', nameEn: 'Monthly Tuition Fee', nameBn: 'মাসিক বেতন', defaultAmount: 800, icon: BookOpen },
  { id: 'session', nameEn: 'Session Charge', nameBn: 'বাৎসরিক সেশন ফি', defaultAmount: 3000, icon: Building },
  { id: 'exam_mt1', nameEn: '1st Model Test Fee', nameBn: '১ম মডেল টেস্ট ফি', defaultAmount: 300, icon: Award },
  { id: 'exam_sem1', nameEn: '1st Semester Exam Fee', nameBn: '১ম সেমিস্টার পরীক্ষা ফি', defaultAmount: 400, icon: Award },
  { id: 'exam_mt2', nameEn: '2nd Model Test Fee', nameBn: '২য় মডেল টেস্ট ফি', defaultAmount: 300, icon: Award },
  { id: 'exam_sem2', nameEn: '2nd Semester Exam Fee', nameBn: '২য় সেমিস্টার পরীক্ষা ফি', defaultAmount: 400, icon: Award },
  { id: 'exam_mt3', nameEn: '3rd Model Test Fee', nameBn: '৩য় মডেল টেস্ট ফি', defaultAmount: 300, icon: Award },
  { id: 'exam_sem3', nameEn: '3rd Semester Exam Fee', nameBn: '৩য় সেমিস্টার পরীক্ষা ফি', defaultAmount: 500, icon: Award },
  { id: 'transport', nameEn: 'Transport Bus Fee', nameBn: 'পরিবহন বাস ফি', defaultAmount: 1500, icon: Bus },
  { id: 'tour', nameEn: 'Educational Study Tour', nameBn: 'শিক্ষা সফর ফি', defaultAmount: 1500, icon: Sparkles },
  { id: 'sports', nameEn: 'Sports & Cultural Fee', nameBn: 'ক্রীড়া ও সাংস্কৃতিক ফি', defaultAmount: 500, icon: Sparkles },
];

export const FeesView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { t, language, formatTaka, toBnNumber, formatDate, amountInWords } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'counter' | 'statement' | 'online_approvals' | 'class_fees' | 'scheduled_fees' | 'transport_fees' | 'collection' | 'invoices' | 'dues' | 'expenses' | 'cashbook'
  >('counter');

  const students = StorageService.getStudents();
  const { schoolProfile } = useSchool();
  const school = schoolProfile;
  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => StorageService.getInvoices());
  const [payments, setPayments] = useState<FeePayment[]>(() => StorageService.getPayments());
  const [expenses, setExpenses] = useState<Expense[]>(() => StorageService.getExpenses());
  const [classFeeConfigs, setClassFeeConfigs] = useState<ClassFeeConfig[]>(() => StorageService.getClassFeeConfigs());

  // Online Fee Payments & Approvals State
  const [onlineRequests, setOnlineRequests] = useState<OnlinePaymentRequest[]>(() =>
    StorageService.getOnlinePaymentRequests()
  );
  const [onlineStatusFilter, setOnlineStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [onlineMethodFilter, setOnlineMethodFilter] = useState<'all' | 'bKash' | 'Nagad'>('all');
  const [onlineSearch, setOnlineSearch] = useState<string>('');

  // Rejection modal
  const [rejectingRequest, setRejectingRequest] = useState<OnlinePaymentRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // MFS Payment Settings Modal State
  const [showMfsModal, setShowMfsModal] = useState<boolean>(false);
  const [mfsSettings, setMfsSettings] = useState<MfsPaymentSettings>(() =>
    StorageService.getMfsSettings()
  );
  const [bkashNumberInput, setBkashNumberInput] = useState<string>(mfsSettings.bkashNumber || '01711234567');
  const [bkashTypeInput, setBkashTypeInput] = useState<'Personal' | 'Merchant' | 'Agent'>(mfsSettings.bkashType || 'Personal');
  const [nagadNumberInput, setNagadNumberInput] = useState<string>(mfsSettings.nagadNumber || '01911234567');
  const [nagadTypeInput, setNagadTypeInput] = useState<'Personal' | 'Merchant' | 'Agent'>(mfsSettings.nagadType || 'Personal');
  const [mfsInstructionsInput, setMfsInstructionsInput] = useState<string>(
    mfsSettings.instructionsBn || 'বিকাশ অথবা নগদ নম্বরে সেন্ড মানি বা পেমেন্ট করে নিচে ট্রানজেকশন আইডি (TrxID) ও আপনার ফোন নম্বর দিন।'
  );
  const [mfsSavedSuccess, setMfsSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleOnlineUpdate = () => {
      setOnlineRequests(StorageService.getOnlinePaymentRequests());
      setInvoices(StorageService.getInvoices());
      setPayments(StorageService.getPayments());
    };
    const handleMfsUpdate = () => {
      const latest = StorageService.getMfsSettings();
      setMfsSettings(latest);
      setBkashNumberInput(latest.bkashNumber || '');
      setBkashTypeInput(latest.bkashType || 'Personal');
      setNagadNumberInput(latest.nagadNumber || '');
      setNagadTypeInput(latest.nagadType || 'Personal');
      setMfsInstructionsInput(latest.instructionsBn || '');
    };
    window.addEventListener('online_payments_updated', handleOnlineUpdate);
    window.addEventListener('mfs_settings_updated', handleMfsUpdate);
    return () => {
      window.removeEventListener('online_payments_updated', handleOnlineUpdate);
      window.removeEventListener('mfs_settings_updated', handleMfsUpdate);
    };
  }, []);

  const pendingRequestsCount = useMemo(() => {
    return onlineRequests.filter((r) => r.status === 'pending').length;
  }, [onlineRequests]);

  // Search & Filter for tables
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // COUNTER STATE
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [deskSelectedClass, setDeskSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => students[0] || null);

  // Line items for the new invoice
  const [invoiceItems, setInvoiceItems] = useState<FeeItem[]>([
    {
      id: `item_${Date.now()}_1`,
      headName: 'Monthly Tuition Fee (মাসিক বেতন)',
      month: 'October 2026',
      amount: 1200,
    },
    {
      id: `item_${Date.now()}_2`,
      headName: 'Examination Fee (পরীক্ষা ফি)',
      month: '2nd Term 2026',
      amount: 700,
    },
  ]);

  // Selected multi-months for quick tuition fee addition
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['October']);
  const [academicYear, setAcademicYear] = useState<string>(() => schoolProfile.currentSession || '2026');
  const [monthlyTuitionRate, setMonthlyTuitionRate] = useState<number>(() => {
    const s = students[0];
    return s ? StorageService.getClassFee(s.className).tuitionFee : 1200;
  });

  // Custom Item Inputs
  const [customItemTitle, setCustomItemTitle] = useState<string>('');
  const [customItemPeriod, setCustomItemPeriod] = useState<string>('');
  const [customItemAmount, setCustomItemAmount] = useState<number>(500);
  const [counterLayoutMode, setCounterLayoutMode] = useState<'side_by_side' | 'stacked'>('side_by_side');

  // Financial adjustments
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [lateFineAmount, setLateFineAmount] = useState<number>(0);
  const [paidNowAmount, setPaidNowAmount] = useState<number>(0);
  // DEFAULT PAYMENT METHOD IS CASH (নগদ গ্রহণ)
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('Cash');
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isManualPaidAmount, setIsManualPaidAmount] = useState<boolean>(false);

  // Single collect modal
  const [showCollectModal, setShowCollectModal] = useState<boolean>(false);
  const [targetInvoice, setTargetInvoice] = useState<FeeInvoice | null>(null);
  const [singleCollectAmount, setSingleCollectAmount] = useState<number>(0);

  // Printable Official Money Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<FeeInvoice | null>(null);

  // Expense Modal State (Create & Edit)
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Electricity & Utilities');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expensePaidTo, setExpensePaidTo] = useState<string>('');
  const [expenseMethod, setExpenseMethod] = useState<'Cash' | 'bKash' | 'Bank'>('Cash');

  // Edit Receipt Modal State
  const [editingReceipt, setEditingReceipt] = useState<FeePayment | null>(null);
  const [showEditReceiptModal, setShowEditReceiptModal] = useState<boolean>(false);
  const [editReceiptAmount, setEditReceiptAmount] = useState<number>(0);
  const [editReceiptDate, setEditReceiptDate] = useState<string>('');
  const [editReceiptMethod, setEditReceiptMethod] = useState<string>('Cash');
  const [editReceiptTrxId, setEditReceiptTrxId] = useState<string>('');
  const [editReceiptNotes, setEditReceiptNotes] = useState<string>('');

  // Edit Due / Invoice Modal State
  const [editingInvoice, setEditingInvoice] = useState<FeeInvoice | null>(null);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState<boolean>(false);
  const [editInvoiceFeeType, setEditInvoiceFeeType] = useState<string>('');
  const [editInvoiceNetAmount, setEditInvoiceNetAmount] = useState<number>(0);
  const [editInvoiceDueDate, setEditInvoiceDueDate] = useState<string>('');
  const [editInvoiceDiscount, setEditInvoiceDiscount] = useState<number>(0);

  // Online Payment Approval State & Handler
  const [approvingRequest, setApprovingRequest] = useState<OnlinePaymentRequest | null>(null);
  const [approvalFeedbackNotice, setApprovalFeedbackNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleOpenApproveModal = (req: OnlinePaymentRequest) => {
    setApprovingRequest(req);
  };

  const handleExecuteApproval = (req: OnlinePaymentRequest) => {
    try {
      const officialReceiptNo = `MR-${Date.now().toString().slice(-6)}`;
      const nowIso = new Date().toISOString();
      const todayStr = nowIso.split('T')[0];

      // 1. Create matching FeePayment
      const newPayment: FeePayment = {
        id: `pay_${Date.now()}`,
        receiptNo: officialReceiptNo,
        invoiceId: `inv_${Date.now()}`,
        studentId: req.studentId,
        studentName: req.studentName,
        className: req.className as any,
        roll: req.studentRoll,
        amount: req.amount,
        paidDate: todayStr,
        paymentMethod: req.paymentMethod as any,
        transactionId: req.transactionId,
        collectedBy: `${req.paymentMethod} Online (Approved by ${currentUser.name})`,
        notes: `${req.feeTitle} - অনলাইন পেমেন্ট অনুমোদন। প্রেরক: ${req.senderPhone}, TrxID: ${req.transactionId}`,
      };
      StorageService.addPayment(newPayment);

      // 2. Settle existing unpaid invoice or create matching paid FeeInvoice
      const allInvs = StorageService.getInvoices();
      const existingUnpaid = allInvs.find(
        (inv) =>
          inv.studentId === req.studentId &&
          (inv.status === 'Unpaid' || inv.status === 'Partial') &&
          (inv.feeType === req.feeTitle || inv.dueAmount === req.amount)
      );

      if (existingUnpaid) {
        existingUnpaid.paidAmount = (existingUnpaid.paidAmount || 0) + req.amount;
        existingUnpaid.dueAmount = Math.max(0, existingUnpaid.netAmount - existingUnpaid.paidAmount);
        existingUnpaid.status = existingUnpaid.dueAmount === 0 ? 'Paid' : 'Partial';
        StorageService.updateInvoice(existingUnpaid);
      } else {
        const newInvoice: FeeInvoice = {
          id: `inv_${Date.now()}`,
          invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
          studentId: req.studentId,
          studentNameEn: req.studentName,
          studentNameBn: req.studentName,
          className: req.className as any,
          section: req.section as any,
          roll: req.studentRoll,
          session: schoolProfile.currentSession || '2026',
          feeType: req.feeTitle,
          dueDate: todayStr,
          amount: req.amount,
          discount: 0,
          netAmount: req.amount,
          paidAmount: req.amount,
          dueAmount: 0,
          status: 'Paid',
        };
        StorageService.addInvoice(newInvoice);
      }

      // 3. Mark Online Request as Approved
      StorageService.updateOnlinePaymentRequest(req.id, {
        status: 'approved',
        approvedAt: nowIso,
        approvedBy: currentUser.name,
        receiptNo: officialReceiptNo,
      });

      // Update local states
      setOnlineRequests(StorageService.getOnlinePaymentRequests());
      setInvoices(StorageService.getInvoices());
      setPayments(StorageService.getPayments());
      setApprovingRequest(null);

      setApprovalFeedbackNotice({
        message: language === 'bn'
          ? `✓ ${req.studentName} এর ${formatTaka(req.amount)} টাকার অনলাইন পেমেন্ট সফলভাবে অনুমোদিত হয়েছে এবং মানি রসিদ (${officialReceiptNo}) তৈরি হয়েছে।`
          : `✓ Successfully approved ${formatTaka(req.amount)} for ${req.studentName}. Receipt #${officialReceiptNo} issued.`,
        type: 'success',
      });
      setTimeout(() => setApprovalFeedbackNotice(null), 6000);
    } catch (err: any) {
      console.error('Error approving payment request:', err);
      setApprovalFeedbackNotice({
        message: language === 'bn' ? 'পেমেন্ট অনুমোদন করতে ত্রুটি হয়েছে।' : 'Error approving payment request.',
        type: 'error',
      });
    }
  };

  const handleOpenRejectModal = (req: OnlinePaymentRequest) => {
    setRejectingRequest(req);
    setRejectionReasonInput('ট্রানজেকশন আইডি সঠিক নয় / একাউন্টে টাকা জমা হয়নি');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;
    const reason =
      rejectionReasonInput.trim() ||
      (language === 'bn' ? 'ট্রানজেকশন তথ্য যাচাই করা সম্ভব হয়নি' : 'Transaction could not be verified');

    StorageService.updateOnlinePaymentRequest(rejectingRequest.id, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: currentUser.name,
      rejectedReason: reason,
    });

    setOnlineRequests(StorageService.getOnlinePaymentRequests());
    setRejectingRequest(null);
    setRejectionReasonInput('');

    setApprovalFeedbackNotice({
      message: language === 'bn'
        ? 'পেমেন্ট রিকোয়েস্টটি বাতিল করা হয়েছে এবং কারণ সংরক্ষণ করা হয়েছে।'
        : 'Payment request rejected with reason.',
      type: 'success',
    });
    setTimeout(() => setApprovalFeedbackNotice(null), 5000);
  };

  const handleSaveMfsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MfsPaymentSettings = {
      ...mfsSettings,
      bkashNumber: bkashNumberInput.trim(),
      bkashType: bkashTypeInput,
      nagadNumber: nagadNumberInput.trim(),
      nagadType: nagadTypeInput,
      instructionsBn: mfsInstructionsInput.trim(),
    };
    StorageService.saveMfsSettings(updated);
    setMfsSettings(updated);
    setMfsSavedSuccess(true);
    setTimeout(() => {
      setMfsSavedSuccess(false);
      setShowMfsModal(false);
    }, 1200);
  };

  const canManage = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'accountant';

  // Financial Totals
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDues = invoices.reduce((sum, i) => sum + i.dueAmount, 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netCashInHand = totalCollected - totalExpensesAmount;

  // Selected student's active transport mapping if any
  const selectedStudentTransport = useMemo(() => {
    if (!selectedStudent) return undefined;
    return StorageService.getStudentTransportByStudentId(selectedStudent.id);
  }, [selectedStudent]);

  // Selected student's comprehensive dues (unpaid invoices + overdue scheduled fees + transport)
  const studentAllDues = useMemo(() => {
    if (!selectedStudent) return [];
    return StorageService.getStudentDueFees(selectedStudent);
  }, [selectedStudent, invoices]);

  // Filter out dues that are ALREADY included in current invoice builder
  const pendingDuesToDisplay = useMemo(() => {
    return studentAllDues.filter((due) => {
      return !invoiceItems.some((item) => {
        if (item.id === due.id) return true;
        const cleanDue = due.headName.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
        const cleanItem = item.headName.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');

        // Safe ordinal check for Model Tests
        const isDueMt = cleanDue.includes('মডেলটেস্ট') || cleanDue.includes('modeltest');
        const isItemMt = cleanItem.includes('মডেলটেস্ট') || cleanItem.includes('modeltest');
        if (isDueMt && isItemMt) {
          const due1 = cleanDue.includes('১ম') || cleanDue.includes('1st') || cleanDue.includes('mt1');
          const item1 = cleanItem.includes('১ম') || cleanItem.includes('1st') || cleanItem.includes('mt1');
          const due2 = cleanDue.includes('২য়') || cleanDue.includes('২য়') || cleanDue.includes('2nd') || cleanDue.includes('mt2');
          const item2 = cleanItem.includes('২য়') || cleanItem.includes('২য়') || cleanItem.includes('2nd') || cleanItem.includes('mt2');
          const due3 = cleanDue.includes('৩য়') || cleanDue.includes('৩য়') || cleanDue.includes('3rd') || cleanDue.includes('mt3');
          const item3 = cleanItem.includes('৩য়') || cleanItem.includes('৩য়') || cleanItem.includes('3rd') || cleanItem.includes('mt3');
          return (due1 && item1) || (due2 && item2) || (due3 && item3);
        }

        // Safe ordinal check for Semester Exams
        const isDueSem = cleanDue.includes('সেমিস্টার') || cleanDue.includes('semester');
        const isItemSem = cleanItem.includes('সেমিস্টার') || cleanItem.includes('semester');
        if (isDueSem && isItemSem) {
          const due1 = cleanDue.includes('১ম') || cleanDue.includes('1st') || cleanDue.includes('sem1');
          const item1 = cleanItem.includes('১ম') || cleanItem.includes('1st') || cleanItem.includes('sem1');
          const due2 = cleanDue.includes('২য়') || cleanDue.includes('২য়') || cleanDue.includes('2nd') || cleanDue.includes('sem2');
          const item2 = cleanItem.includes('২য়') || cleanItem.includes('২য়') || cleanItem.includes('2nd') || cleanItem.includes('sem2');
          const due3 = cleanDue.includes('৩য়') || cleanDue.includes('৩য়') || cleanDue.includes('3rd') || cleanDue.includes('sem3');
          const item3 = cleanItem.includes('৩য়') || cleanItem.includes('৩য়') || cleanItem.includes('3rd') || cleanItem.includes('sem3');
          return (due1 && item1) || (due2 && item2) || (due3 && item3);
        }

        return cleanDue === cleanItem || (cleanDue.length > 5 && cleanItem.includes(cleanDue)) || (cleanItem.length > 5 && cleanDue.includes(cleanItem));
      });
    });
  }, [studentAllDues, invoiceItems]);

  // Total student dues
  const studentTotalDueAmount = studentAllDues.reduce((sum, d) => sum + d.amount, 0);

  // Compute which months student has already paid
  const paidMonthsForSelectedStudent = useMemo(() => {
    if (!selectedStudent) return new Set<string>();
    const paidSet = new Set<string>();
    const studentInvoices = invoices.filter(
      (i) => (i.studentId === selectedStudent.id || i.studentId === selectedStudent.studentId) && (i.status === 'Paid' || i.paidAmount > 0)
    );
    studentInvoices.forEach((inv) => {
      MONTH_NAMES.forEach((m) => {
        const mBn = MONTH_NAMES_BN[m] || '';
        const matchInType = inv.feeType.includes(m) || inv.feeType.includes(mBn);
        const matchInMonth = (inv.month || '').includes(m) || (inv.month || '').includes(mBn);
        const matchInItems = inv.items && inv.items.some((it) => it.headName.includes(m) || it.headName.includes(mBn) || (it.month && (it.month.includes(m) || it.month.includes(mBn))));
        if (matchInType || matchInMonth || matchInItems) {
          paidSet.add(m);
        }
      });
    });
    return paidSet;
  }, [selectedStudent, invoices]);

  // Duplicate Fee Alert State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    feeItemName: string;
    month?: string;
    amount?: number;
    existingRecord: {
      feeName: string;
      invoiceNo: string;
      date: string;
      amount: number;
      status: string;
    };
    onConfirmAdd: () => void;
  } | null>(null);

  // Helper to check duplicate fee before adding
  const checkDuplicateFee = (feeTitle: string, period?: string): { isDuplicate: boolean; record?: any } => {
    if (!selectedStudent) return { isDuplicate: false };
    const studentInvoices = invoices.filter(
      (i) => i.studentId === selectedStudent.id || i.studentId === selectedStudent.studentId
    );

    const cleanFee = feeTitle.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
    const cleanPeriod = (period || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');

    for (const inv of studentInvoices) {
      if (inv.items && inv.items.length > 0) {
        for (const it of inv.items) {
          const itName = it.headName.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
          const itMonth = (it.month || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');

          if (cleanPeriod && itMonth && (itMonth.includes(cleanPeriod) || cleanPeriod.includes(itMonth))) {
            if (cleanFee.includes('tuition') || cleanFee.includes('বেতন') || itName.includes('tuition') || itName.includes('বেতন')) {
              return {
                isDuplicate: true,
                record: {
                  feeName: it.headName,
                  month: it.month,
                  amount: it.amount,
                  invoiceNo: inv.invoiceNo,
                  date: inv.dueDate || '2026',
                  status: inv.status,
                },
              };
            }
          }

          // Model Test explicit ordinal matching (1st, 2nd, 3rd)
          const isFeeMt = cleanFee.includes('মডেলটেস্ট') || cleanFee.includes('modeltest');
          const isItMt = itName.includes('মডেলটেস্ট') || itName.includes('modeltest');
          if (isFeeMt && isItMt) {
            const fee1 = cleanFee.includes('১ম') || cleanFee.includes('1st') || cleanFee.includes('mt1');
            const it1 = itName.includes('১ম') || itName.includes('1st') || itName.includes('mt1');
            const fee2 = cleanFee.includes('২য়') || cleanFee.includes('২য়') || cleanFee.includes('2nd') || cleanFee.includes('mt2');
            const it2 = itName.includes('২য়') || itName.includes('২য়') || itName.includes('2nd') || itName.includes('mt2');
            const fee3 = cleanFee.includes('৩য়') || cleanFee.includes('৩য়') || cleanFee.includes('3rd') || cleanFee.includes('mt3');
            const it3 = itName.includes('৩য়') || itName.includes('৩য়') || itName.includes('3rd') || itName.includes('mt3');

            if ((fee1 && it1) || (fee2 && it2) || (fee3 && it3)) {
              return {
                isDuplicate: true,
                record: {
                  feeName: it.headName,
                  month: it.month,
                  amount: it.amount,
                  invoiceNo: inv.invoiceNo,
                  date: inv.dueDate || '2026',
                  status: inv.status,
                },
              };
            }
            // If both are Model Tests but different numbers (e.g. 1st vs 3rd), they DO NOT match!
            continue;
          }

          // Semester Exam explicit ordinal matching (1st, 2nd, 3rd)
          const isFeeSem = cleanFee.includes('সেমিস্টার') || cleanFee.includes('semester');
          const isItSem = itName.includes('সেমিস্টার') || itName.includes('semester');
          if (isFeeSem && isItSem) {
            const fee1 = cleanFee.includes('১ম') || cleanFee.includes('1st') || cleanFee.includes('sem1');
            const it1 = itName.includes('১ম') || itName.includes('1st') || itName.includes('sem1');
            const fee2 = cleanFee.includes('২য়') || cleanFee.includes('২য়') || cleanFee.includes('2nd') || cleanFee.includes('sem2');
            const it2 = itName.includes('২য়') || itName.includes('২য়') || itName.includes('2nd') || itName.includes('sem2');
            const fee3 = cleanFee.includes('৩য়') || cleanFee.includes('৩য়') || cleanFee.includes('3rd') || cleanFee.includes('sem3');
            const it3 = itName.includes('৩য়') || itName.includes('৩য়') || itName.includes('3rd') || itName.includes('sem3');

            if ((fee1 && it1) || (fee2 && it2) || (fee3 && it3)) {
              return {
                isDuplicate: true,
                record: {
                  feeName: it.headName,
                  month: it.month,
                  amount: it.amount,
                  invoiceNo: inv.invoiceNo,
                  date: inv.dueDate || '2026',
                  status: inv.status,
                },
              };
            }
            // If both are Semesters but different numbers, they DO NOT match!
            continue;
          }

          const isNameMatch =
            (cleanFee.length > 5 && itName.includes(cleanFee)) ||
            (itName.length > 5 && cleanFee.includes(itName)) ||
            (cleanFee.includes('শিক্ষাসফর') && itName.includes('শিক্ষাসফর')) ||
            (cleanFee.includes('ক্রীড়া') && itName.includes('ক্রীড়া')) ||
            (cleanFee.includes('ভর্তি') && itName.includes('ভর্তি')) ||
            (cleanFee.includes('সেশন') && itName.includes('সেশন'));

          if (isNameMatch) {
            return {
              isDuplicate: true,
              record: {
                feeName: it.headName,
                month: it.month,
                amount: it.amount,
                invoiceNo: inv.invoiceNo,
                date: inv.dueDate || '2026',
                status: inv.status,
              },
            };
          }
        }
      }

      const invType = (inv.feeType || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      const invMonth = (inv.month || '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      if (cleanPeriod && invMonth && (invMonth.includes(cleanPeriod) || cleanPeriod.includes(invMonth))) {
        return {
          isDuplicate: true,
          record: {
            feeName: inv.feeType,
            month: inv.month,
            amount: inv.paidAmount > 0 ? inv.paidAmount : inv.netAmount,
            invoiceNo: inv.invoiceNo,
            date: inv.dueDate || '2026',
            status: inv.status,
          },
        };
      }
    }

    return { isDuplicate: false };
  };

  // AUTO-SET CLASS TUITION RATE & RECALCULATE ON STUDENT CHANGE
  useEffect(() => {
    if (selectedStudent) {
      const classFee = StorageService.getClassFee(selectedStudent.className);
      setMonthlyTuitionRate(classFee.tuitionFee);

      // Auto update current tuition items with this student's class fee
      setInvoiceItems((prev) => {
        const hasTuition = prev.some((it) => it.headName.includes('Monthly Tuition Fee') || it.headName.includes('মাসিক বেতন'));
        if (hasTuition) {
          return prev.map((item) =>
            item.headName.includes('Monthly Tuition Fee') || item.headName.includes('মাসিক বেতন')
              ? { ...item, amount: classFee.tuitionFee }
              : item
          );
        }
        return [
          {
            id: `item_${Date.now()}_1`,
            headName: `Monthly Tuition Fee (মাসিক বেতন - ${selectedStudent.className})`,
            month: 'October 2026',
            amount: classFee.tuitionFee,
          },
        ];
      });
      setIsManualPaidAmount(false);
    }
  }, [selectedStudent?.id, selectedStudent?.className]);

  // Search filtered students for Counter selection
  const searchedStudents = useMemo(() => {
    return students.filter((s) => {
      if (deskSelectedClass !== 'all' && s.className !== deskSelectedClass) return false;
      if (!studentSearchQuery.trim()) return true;
      const q = studentSearchQuery.toLowerCase().trim();
      return (
        s.nameEn.toLowerCase().includes(q) ||
        s.nameBn.includes(q) ||
        (s.admissionNo || s.studentId || '').toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.guardianPhone.includes(q) ||
        s.fatherNameBn.includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, studentSearchQuery, deskSelectedClass]);

  // Itemized calculations for new invoice
  const subTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netPayable = Math.max(0, subTotal + lateFineAmount - discountAmount);

  // Sync paidNowAmount with netPayable unless manually overridden
  const effectivePaidAmount = isManualPaidAmount ? paidNowAmount : netPayable;
  const balanceDue = Math.max(0, netPayable - effectivePaidAmount);

  const executeToggleMonth = (month: string) => {
    let updatedMonths: string[];
    if (selectedMonths.includes(month)) {
      updatedMonths = selectedMonths.filter((m) => m !== month);
    } else {
      updatedMonths = [...selectedMonths, month];
    }
    setSelectedMonths(updatedMonths);

    const otherItems = invoiceItems.filter(
      (item) => !item.headName.includes('Monthly Tuition Fee') && !item.headName.includes('মাসিক বেতন')
    );
    const newTuitionItems: FeeItem[] = updatedMonths.map((m) => ({
      id: `tuition_${m}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      headName: `Monthly Tuition Fee (${MONTH_NAMES_BN[m] || m} - মাসিক বেতন)`,
      month: `${m} ${academicYear}`,
      amount: monthlyTuitionRate,
    }));

    setInvoiceItems([...otherItems, ...newTuitionItems]);
    setIsManualPaidAmount(false);
  };

  // Quick toggle month for tuition fee with duplicate check
  const handleToggleMonth = (month: string) => {
    if (!selectedMonths.includes(month)) {
      // Check if this month is already paid
      if (paidMonthsForSelectedStudent.has(month)) {
        const dup = checkDuplicateFee(`মাসিক বেতন (${MONTH_NAMES_BN[month] || month})`, `${month} ${academicYear}`);
        setDuplicateWarning({
          isOpen: true,
          feeItemName: `মাসিক বেতন (${MONTH_NAMES_BN[month] || month} ${academicYear})`,
          month: `${month} ${academicYear}`,
          amount: monthlyTuitionRate,
          existingRecord: dup.record || {
            feeName: `মাসিক বেতন (${MONTH_NAMES_BN[month] || month})`,
            invoiceNo: 'পূর্ববর্তী ইনভয়েস',
            date: '2026',
            amount: monthlyTuitionRate,
            status: 'Paid',
          },
          onConfirmAdd: () => {
            executeToggleMonth(month);
            setDuplicateWarning(null);
          },
        });
        return;
      }
    }
    executeToggleMonth(month);
  };

  // Dynamic presets that reflect current student's class, admission fee, custom fees, and transport
  const dynamicPresets = useMemo(() => {
    if (!selectedStudent) return QUICK_PRESETS;
    const classFee = StorageService.getClassFee(selectedStudent.className);
    const transport = StorageService.getStudentTransportByStudentId(selectedStudent.id);

    // Read custom fee columns configured
    let customCols: { id: string; nameEn: string; nameBn: string; defaultAmount: number }[] = [];
    try {
      const saved = localStorage.getItem('school_erp_custom_class_fee_columns');
      if (saved) customCols = JSON.parse(saved);
    } catch {}

    const baseList = [
      { id: 'admission', nameEn: 'Admission Fee', nameBn: 'নতুন ভর্তি ফি', defaultAmount: classFee.admissionFee ?? 1500, icon: UserPlus },
      { id: 'tuition', nameEn: 'Monthly Tuition Fee', nameBn: 'মাসিক বেতন', defaultAmount: classFee.tuitionFee, icon: BookOpen },
      { id: 'session', nameEn: 'Session Charge', nameBn: 'বাৎসরিক সেশন ফি', defaultAmount: classFee.sessionFee, icon: Building },
      { id: 'exam_mt1', nameEn: '1st Model Test Fee', nameBn: '১ম মডেল টেস্ট ফি', defaultAmount: classFee.examFee1stModelTest ?? classFee.examFee1stTest ?? 250, icon: Award },
      { id: 'exam_sem1', nameEn: '1st Semester Exam Fee', nameBn: '১ম সেমিস্টার পরীক্ষা ফি', defaultAmount: classFee.examFee1stSemester ?? classFee.examFeeHalfYearly ?? 350, icon: Award },
      { id: 'exam_mt2', nameEn: '2nd Model Test Fee', nameBn: '২য় মডেল টেস্ট ফি', defaultAmount: classFee.examFee2ndModelTest ?? classFee.examFeeModelTest ?? 250, icon: Award },
      { id: 'exam_sem2', nameEn: '2nd Semester Exam Fee', nameBn: '২য় সেমিস্টার পরীক্ষা ফি', defaultAmount: classFee.examFee2ndSemester ?? classFee.examFeeHalfYearly ?? 350, icon: Award },
      { id: 'exam_mt3', nameEn: '3rd Model Test Fee', nameBn: '৩য় মডেল টেস্ট ফি', defaultAmount: classFee.examFee3rdModelTest ?? classFee.examFeeModelTest ?? 250, icon: Award },
      { id: 'exam_sem3', nameEn: '3rd Semester Exam Fee', nameBn: '৩য় সেমিস্টার পরীক্ষা ফি', defaultAmount: classFee.examFee3rdSemester ?? classFee.examFeeAnnual ?? 400, icon: Award },
      { id: 'transport', nameEn: 'Transport Bus Fee', nameBn: 'পরিবহন বাস ফি', defaultAmount: transport ? transport.monthlyFare : 1500, icon: Bus },
      { id: 'tour', nameEn: 'Educational Study Tour', nameBn: 'শিক্ষা সফর ফি', defaultAmount: 1500, icon: Sparkles },
      { id: 'sports', nameEn: 'Sports & Cultural Fee', nameBn: 'ক্রীড়া ও সাংস্কৃতিক ফি', defaultAmount: 500, icon: Sparkles },
    ];

    // Add any custom defined fee columns
    customCols.forEach((col) => {
      const amt = classFee.customFees?.[col.id] ?? col.defaultAmount;
      baseList.push({
        id: `custom_${col.id}`,
        nameEn: col.nameEn,
        nameBn: col.nameBn,
        defaultAmount: amt,
        icon: Tag,
      });
    });

    return baseList;
  }, [selectedStudent]);

  const executeAddPreset = (preset: typeof dynamicPresets[0]) => {
    const newItem: FeeItem = {
      id: `preset_${preset.id}_${Date.now()}`,
      headName: `${preset.nameEn} (${preset.nameBn})`,
      month: `${academicYear} Session`,
      amount: preset.defaultAmount,
    };
    setInvoiceItems((prev) => [...prev, newItem]);
    setIsManualPaidAmount(false);
  };

  // Quick add preset fee with duplicate alert
  const handleAddPreset = (preset: typeof dynamicPresets[0]) => {
    const dup = checkDuplicateFee(preset.nameBn, `${academicYear} Session`);
    if (dup.isDuplicate && dup.record) {
      setDuplicateWarning({
        isOpen: true,
        feeItemName: `${preset.nameBn} (${preset.nameEn})`,
        month: `${academicYear} Session`,
        amount: preset.defaultAmount,
        existingRecord: dup.record,
        onConfirmAdd: () => {
          executeAddPreset(preset);
          setDuplicateWarning(null);
        },
      });
      return;
    }
    executeAddPreset(preset);
  };

  // Include single due into current invoice
  const handleIncludeSingleDue = (due: FeeItem) => {
    if (invoiceItems.some((it) => it.id === due.id || it.headName === due.headName)) {
      alert(language === 'bn' ? 'এই ফি আইটেমটি ইতিমধ্যে ইনভয়েসে যুক্ত রয়েছে!' : 'This fee item is already in invoice!');
      return;
    }
    setInvoiceItems((prev) => [...prev, due]);
    setIsManualPaidAmount(false);
  };

  // Include all pending dues into current invoice
  const handleIncludeAllDues = () => {
    const existingIds = new Set(invoiceItems.map((it) => it.id));
    const missing = pendingDuesToDisplay.filter((d) => !existingIds.has(d.id));
    if (missing.length === 0) {
      alert(language === 'bn' ? 'সকল বকেয়া ইতিমধ্যে ইনভয়েসে যুক্ত রয়েছে!' : 'All dues are already added!');
      return;
    }
    setInvoiceItems((prev) => [...prev, ...missing]);
    setIsManualPaidAmount(false);
  };

  // Add custom line item
  const executeAddCustomItem = () => {
    const newItem: FeeItem = {
      id: `custom_${Date.now()}`,
      headName: customItemTitle.trim(),
      month: customItemPeriod.trim() || `${academicYear} Session`,
      amount: customItemAmount,
    };
    setInvoiceItems((prev) => [...prev, newItem]);
    setCustomItemTitle('');
    setCustomItemPeriod('');
    setCustomItemAmount(500);
    setIsManualPaidAmount(false);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemTitle.trim() || customItemAmount <= 0) return;
    const dup = checkDuplicateFee(customItemTitle.trim(), customItemPeriod.trim() || `${academicYear} Session`);
    if (dup.isDuplicate && dup.record) {
      setDuplicateWarning({
        isOpen: true,
        feeItemName: customItemTitle.trim(),
        month: customItemPeriod.trim() || `${academicYear} Session`,
        amount: customItemAmount,
        existingRecord: dup.record,
        onConfirmAdd: () => {
          executeAddCustomItem();
          setDuplicateWarning(null);
        },
      });
      return;
    }
    executeAddCustomItem();
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
    setIsManualPaidAmount(false);
  };

  // Update item amount
  const handleItemAmountChange = (id: string, newAmt: number) => {
    setInvoiceItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, amount: Math.max(0, newAmt) } : i))
    );
    setIsManualPaidAmount(false);
  };

  // Include existing pending due invoice into invoice items
  const handleIncludePendingDue = (inv: FeeInvoice) => {
    const dueItem: FeeItem = {
      id: `due_${inv.id}_${Date.now()}`,
      headName: `Previous Due (${inv.invoiceNo}) - ${inv.feeType}`,
      month: inv.month || inv.session,
      amount: inv.dueAmount,
    };
    setInvoiceItems((prev) => [...prev, dueItem]);
    setIsManualPaidAmount(false);
  };

  // Submit Fee Collection and Generate Official Receipt
  const handleSubmitFeeCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert(language === 'bn' ? 'অনুগ্রহ করে প্রথমে একজন শিক্ষার্থী নির্বাচন করুন!' : 'Please select a student first!');
      return;
    }
    if (invoiceItems.length === 0) {
      alert(language === 'bn' ? 'কমপক্ষে একটি ফি আইটেম যুক্ত করুন!' : 'Please add at least one fee item!');
      return;
    }
    if (effectivePaidAmount < 0) {
      alert('Paid amount cannot be negative');
      return;
    }

    const curSess = school.currentSession || academicYear || '2026';
    const invoiceNo = `INV-${curSess}-${Math.floor(10000 + Math.random() * 90000)}`;
    const receiptNo = `REC-${curSess}-${Math.floor(10000 + Math.random() * 90000)}`;
    const today = new Date().toISOString().split('T')[0];

    const feeDescription = invoiceItems.map((i) => i.headName).join(' + ');

    const newInvoice: FeeInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNo,
      studentId: selectedStudent.id,
      studentNameEn: selectedStudent.nameEn,
      studentNameBn: selectedStudent.nameBn,
      className: selectedStudent.className,
      section: selectedStudent.section,
      roll: selectedStudent.roll,
      session: academicYear,
      feeType: feeDescription.length > 80 ? `${feeDescription.slice(0, 77)}...` : feeDescription,
      month: selectedMonths.length > 0 ? selectedMonths.join(', ') + ` ${academicYear}` : `${academicYear} Session`,
      items: invoiceItems,
      amount: subTotal,
      discount: discountAmount,
      netAmount: netPayable,
      paidAmount: 0,
      dueAmount: netPayable,
      dueDate: today,
      status: 'Unpaid',
    };

    const newPayment: FeePayment = {
      id: `pay_${Date.now()}`,
      receiptNo,
      invoiceId: newInvoice.id,
      studentId: selectedStudent.id,
      studentName: selectedStudent.nameEn,
      className: `${selectedStudent.className} (${selectedStudent.section})`,
      roll: selectedStudent.roll,
      amount: effectivePaidAmount,
      items: invoiceItems,
      paidDate: today,
      paymentMethod,
      transactionId: transactionId || (paymentMethod !== 'Cash' ? `TXN-${Date.now().toString().slice(-6)}` : undefined),
      collectedBy: currentUser.name,
      notes: paymentNotes || `${invoiceItems.length} items collected (Discount: ৳ ${discountAmount})`,
    };

    StorageService.addInvoice(newInvoice);
    if (effectivePaidAmount > 0) {
      StorageService.addPayment(newPayment);
    }

    setInvoices(StorageService.getInvoices());
    setPayments(StorageService.getPayments());

    setSelectedReceipt(newPayment);
    setSelectedReceiptInvoice(newInvoice);
    setShowReceiptModal(true);

    // Reset items for next collection
    setInvoiceItems([
      {
        id: `item_${Date.now()}_1`,
        headName: 'Monthly Tuition Fee (মাসিক বেতন)',
        month: 'November 2026',
        amount: 1800,
      },
    ]);
    setSelectedMonths(['November']);
    setDiscountAmount(0);
    setDiscountReason('');
    setLateFineAmount(0);
    setTransactionId('');
    setPaymentNotes('');
    setIsManualPaidAmount(false);
  };

  const handleOpenSingleCollect = (inv: FeeInvoice) => {
    setTargetInvoice(inv);
    setSingleCollectAmount(inv.dueAmount);
    setPaymentMethod('bKash');
    setTransactionId('');
    setPaymentNotes('');
    setShowCollectModal(true);
  };

  const handleConfirmSinglePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoice || singleCollectAmount <= 0) return;

    const curSess = school.currentSession || academicYear || '2026';
    const receiptNo = `REC-${curSess}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPayment: FeePayment = {
      id: `pay_${Date.now()}`,
      receiptNo,
      invoiceId: targetInvoice.id,
      studentId: targetInvoice.studentId,
      studentName: targetInvoice.studentNameEn,
      className: `${targetInvoice.className} (${targetInvoice.section})`,
      roll: targetInvoice.roll,
      amount: singleCollectAmount,
      items: targetInvoice.items || [
        {
          id: `item_${Date.now()}`,
          headName: targetInvoice.feeType,
          month: targetInvoice.month,
          amount: singleCollectAmount,
        },
      ],
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionId: transactionId || (paymentMethod !== 'Cash' ? `TXN-${Date.now().toString().slice(-6)}` : undefined),
      collectedBy: currentUser.name,
      notes: paymentNotes || 'Fee Collection Desk',
    };

    StorageService.addPayment(newPayment);
    setInvoices(StorageService.getInvoices());
    setPayments(StorageService.getPayments());
    setShowCollectModal(false);

    setSelectedReceipt(newPayment);
    setSelectedReceiptInvoice(targetInvoice);
    setShowReceiptModal(true);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) return;

    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        category: expenseCategory,
        title: expenseTitle,
        amount: expenseAmount,
        paidTo: expensePaidTo,
        paymentMethod: expenseMethod,
      };
      StorageService.updateExpense(updatedExpense);
      setExpenses(StorageService.getExpenses());
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseTitle('');
      setExpenseAmount(0);
      setExpensePaidTo('');
      return;
    }

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      voucherNo: `VOUCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: expenseCategory,
      title: expenseTitle,
      amount: expenseAmount,
      date: new Date().toISOString().split('T')[0],
      paidTo: expensePaidTo,
      paymentMethod: expenseMethod,
      approvedBy: currentUser.name,
    };

    StorageService.addExpense(newExpense);
    setExpenses(StorageService.getExpenses());
    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount(0);
    setExpensePaidTo('');
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseCategory(exp.category);
    setExpenseAmount(exp.amount);
    setExpensePaidTo(exp.paidTo);
    setExpenseMethod((exp.paymentMethod as any) || 'Cash');
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = (exp: Expense) => {
    if (
      window.confirm(
        language === 'bn'
          ? `আপনি কি নিশ্চিত ভাউচার "${exp.voucherNo}" (${exp.title} - ৳${exp.amount}) মুছে ফেলতে চান?`
          : `Are you sure you want to delete voucher "${exp.voucherNo}"?`
      )
    ) {
      StorageService.deleteExpense(exp.id);
      setExpenses(StorageService.getExpenses());
    }
  };

  const handleOpenEditReceipt = (payment: FeePayment) => {
    setEditingReceipt(payment);
    setEditReceiptAmount(payment.amount);
    setEditReceiptDate(payment.paidDate || new Date().toISOString().split('T')[0]);
    setEditReceiptMethod(payment.paymentMethod || 'Cash');
    setEditReceiptTrxId(payment.transactionId || '');
    setEditReceiptNotes(payment.notes || '');
    setShowEditReceiptModal(true);
  };

  const handleSaveEditReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;
    const updated: FeePayment = {
      ...editingReceipt,
      amount: Number(editReceiptAmount),
      paidDate: editReceiptDate,
      paymentMethod: editReceiptMethod as any,
      transactionId: editReceiptTrxId.trim() || undefined,
      notes: editReceiptNotes.trim() || undefined,
    };
    StorageService.updatePayment(updated);
    setPayments(StorageService.getPayments());
    setInvoices(StorageService.getInvoices());
    setShowEditReceiptModal(false);
    setEditingReceipt(null);
  };

  const handleDeletePayment = (payment: FeePayment) => {
    if (
      window.confirm(
        language === 'bn'
          ? `আপনি কি নিশ্চিত রসিদ "${payment.receiptNo}" (${payment.studentName} - ৳${payment.amount}) মুছে ফেলতে চান? এটি মুছে ফেললে সংশ্লিষ্ট ইনভয়েসের বকেয়া সমন্বয় হবে।`
          : `Are you sure you want to delete receipt "${payment.receiptNo}"? This will restore the due amount.`
      )
    ) {
      StorageService.deletePayment(payment.id);
      setPayments(StorageService.getPayments());
      setInvoices(StorageService.getInvoices());
    }
  };

  const handleOpenEditInvoice = (inv: FeeInvoice) => {
    setEditingInvoice(inv);
    setEditInvoiceFeeType(inv.feeType);
    setEditInvoiceNetAmount(inv.netAmount);
    setEditInvoiceDueDate(inv.dueDate);
    setEditInvoiceDiscount(inv.discount || 0);
    setShowEditInvoiceModal(true);
  };

  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const newNet = Number(editInvoiceNetAmount);
    const newPaid = editingInvoice.paidAmount;
    const newDue = Math.max(0, newNet - newPaid);
    const newStatus = newDue === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

    const updated: FeeInvoice = {
      ...editingInvoice,
      feeType: editInvoiceFeeType,
      netAmount: newNet,
      dueAmount: newDue,
      status: newStatus,
      dueDate: editInvoiceDueDate,
      discount: Number(editInvoiceDiscount),
    };
    StorageService.updateInvoice(updated);
    setInvoices(StorageService.getInvoices());
    setShowEditInvoiceModal(false);
    setEditingInvoice(null);
  };

  const handleDeleteInvoice = (inv: FeeInvoice) => {
    if (
      window.confirm(
        language === 'bn'
          ? `আপনি কি নিশ্চিত ইনভয়েস "${inv.invoiceNo}" (${inv.studentNameEn} - ৳${inv.netAmount}) মুছে ফেলতে চান?`
          : `Are you sure you want to delete invoice "${inv.invoiceNo}"?`
      )
    ) {
      StorageService.deleteInvoice(inv.id);
      setInvoices(StorageService.getInvoices());
    }
  };

  const handleClearAllOnlineRequests = () => {
    if (
      window.confirm(
        language === 'bn'
          ? 'আপনি কি নিশ্চিত সকল অনলাইন পেমেন্ট রিকোয়েস্ট তালিকা মুছে সম্পূর্ণ খালি করতে চান?'
          : 'Are you sure you want to clear all online payment requests?'
      )
    ) {
      StorageService.clearOnlinePaymentRequests();
      setOnlineRequests([]);
      setApprovalFeedbackNotice({
        type: 'success',
        message:
          language === 'bn'
            ? 'অনলাইন পেমেন্ট রিকোয়েস্ট তালিকা সম্পূর্ণ খালি করা হয়েছে।'
            : 'Online payment requests list has been cleared.',
      });
    }
  };

  const handleDeleteOnlineRequest = (req: OnlinePaymentRequest) => {
    if (
      window.confirm(
        language === 'bn'
          ? `আপনি কি নিশ্চিত রিকোয়েস্ট "${req.receiptNo}" (${req.studentName} - TrxID: ${req.transactionId}) মুছে ফেলতে চান?`
          : `Are you sure you want to delete request "${req.receiptNo}"?`
      )
    ) {
      StorageService.deleteOnlinePaymentRequest(req.id);
      setOnlineRequests(StorageService.getOnlinePaymentRequests());
      setApprovalFeedbackNotice({
        type: 'success',
        message:
          language === 'bn'
            ? `রিকোয়েস্ট "${req.receiptNo}" সফলভাবে মুছে ফেলা হয়েছে।`
            : `Request "${req.receiptNo}" deleted.`,
      });
    }
  };

  const [selectedSessionFilter, setSelectedSessionFilter] = useState<'all' | '2026' | '2027' | '2028'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedClass !== 'all' && inv.className !== selectedClass) return false;
    if (selectedSessionFilter !== 'all') {
      const invSession = (inv as any).session || (inv.invoiceNo?.includes('2027') ? '2027' : '2026');
      if (invSession !== selectedSessionFilter) return false;
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        inv.studentNameEn.toLowerCase().includes(q) ||
        inv.studentNameBn.includes(q) ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.roll.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'bn' ? 'ফি গ্রহণ ও প্রাতিষ্ঠানিক হিসাবরক্ষণ' : 'Fee Collection & Accounts Management'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              {language === 'bn' ? 'মাল্টি-আইটেম ইনভয়েস' : 'Multi-Item Invoicing'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn'
              ? 'শিক্ষার্থী নির্বাচন করে ২-৩ মাসের বেতন, পরীক্ষা ফি, বাসের ভাড়া একসাথে ইনভয়েস তৈরি ও ডুপ্লিকেট মানি রসিদ প্রিন্ট'
              : 'Search & select students, combine 2-3 months tuition, exam, transport & other fees in 1 invoice with duplicate receipts'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subtabs */}
          <div className="p-1 bg-slate-100 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('counter')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'counter' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ফি কাউন্টার' : 'Fee Desk'}</span>
            </button>
            <button
              onClick={() => setActiveTab('statement')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'statement' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'bn' ? 'শিক্ষার্থী স্টেটমেন্ট (জমা ও বকেয়া)' : 'Student Statement'}</span>
            </button>
            <button
              onClick={() => setActiveTab('class_fees')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'class_fees' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শ্রেণিভিত্তিক ফি' : 'Class Rates'}</span>
            </button>
            <button
              onClick={() => setActiveTab('scheduled_fees')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'scheduled_fees' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'bn' ? 'ফি শিডিউল (শেষ তারিখ)' : 'Fee Deadlines'}</span>
            </button>
            <button
              onClick={() => setActiveTab('transport_fees')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'transport_fees' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'পরিবহন শিক্ষার্থী ও ফি' : 'Bus Users'}</span>
            </button>
            <button
              onClick={() => setActiveTab('online_approvals')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 relative ${
                activeTab === 'online_approvals' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-500" />
              <span>{language === 'bn' ? 'অনলাইন পেমেন্ট অনুমোদন' : 'Online Approvals'}</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {toBnNumber(pendingRequestsCount)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'collection' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ইনভয়েস তালিকা' : 'Invoices'}
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'invoices' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'রসিদ রেজিস্ট্রি' : 'Receipts'}
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'dues' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'বকেয়া তালিকা' : 'Due List'}
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'expenses' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ব্যয় ও ভাউচার' : 'Expenses'}
            </button>
            <button
              onClick={() => setActiveTab('cashbook')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'cashbook' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ক্যাশ বুক' : 'Cashbook'}
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => setShowMfsModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              title="Configure school bKash and Nagad payment numbers and accounts"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>{language === 'bn' ? 'বিকাশ ও নগদ সেটিংস' : 'bKash/Nagad Settings'}</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => {
                setActiveTab('counter');
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'ফি গ্রহণ করুন' : 'Collect Fee'}</span>
            </button>
          )}

          {canManage && activeTab === 'expenses' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন ভাউচার' : 'New Voucher'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'bn' ? 'মোট সংগৃহীত ফি' : 'Total Fee Collections'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {formatTaka(totalCollected)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'ক্যাশ, বিকাশ ও ব্যাংক প্রাপ্তি' : 'Cash, bKash & Bank receipts'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'bn' ? 'মোট বকেয়া পাওনা' : 'Outstanding Dues'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-amber-600">
            {formatTaka(totalDues)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'অপরিশোধিত শিক্ষার্থী ইনভয়েস' : 'Unpaid student invoices'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'bn' ? 'মোট প্রাতিষ্ঠানিক ব্যয়' : 'Total Expenses'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {formatTaka(totalExpensesAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'অনুমোদিত ভাউচার সমূহ' : 'Approved operational vouchers'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'bn' ? 'হাতে নগদ উদ্বৃত্ত (Net Balance)' : 'Net Cashbook Balance'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-blue-700">
            {formatTaka(netCashInHand)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'বর্তমান ক্যাশ ব্যালেন্স' : 'Net institutional funds'}
          </div>
        </div>
      </div>

      {/* TAB: COUNTER */}
      {activeTab === 'counter' && (
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs mt-0.5">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'স্মার্ট ফি কাউন্টার (Smart Fee Desk)' : 'Smart Student Fee Collection Counter'}
                </h3>
                <p className="text-slate-600 mt-0.5">
                  {language === 'bn'
                    ? '১. যেকোনো শিক্ষার্থীকে খুঁজুন ও সিলেক্ট করুন • ২. একসাথে ২-৩ মাসের বেতন, পরীক্ষা বা পরিবহন ফি যোগ করুন • ৩. পেমেন্ট গ্রহণ করে ডুপ্লিকেট মানি রসিদ প্রিন্ট করুন।'
                    : '1. Search & pick student • 2. Select 2-3 months tuition, exam, transport & custom items in 1 invoice • 3. Receive payment & print duplicate receipt.'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">Session:</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-800"
              >
                <option value="2026">2026 Session</option>
                <option value="2027">2027 Session</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Student Search & Selection */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? '১. শিক্ষার্থী খুঁজুন ও নির্বাচন করুন' : '1. Search & Select Student'}</span>
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {searchedStudents.length} Found
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        language === 'bn'
                          ? 'নাম, আইডি (S-xxxx), রোল বা মোবাইল...'
                          : 'Search by Name, Student ID, Roll, Phone...'
                      }
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={deskSelectedClass}
                      onChange={(e) => setDeskSelectedClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white font-medium"
                    >
                      <option value="all">{language === 'bn' ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
                      {['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Class 4', 'Class 3', 'Class 2', 'Class 1', 'KG', 'Nursery'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Students list */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {searchedStudents.map((st) => {
                    const isSelected = selectedStudent?.id === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStudent(st)}
                        className={`w-full text-left p-2.5 transition-colors flex items-center space-x-3 text-xs ${
                          isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {st.nameEn.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">{st.nameEn}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 font-bold text-slate-600 rounded">
                              Roll: {st.roll}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                            <span>{st.className} ({st.section})</span>
                            <span className="font-mono text-[10px] text-blue-600">{st.admissionNo || st.studentId}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                  {searchedStudents.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      {language === 'bn' ? 'কোনো শিক্ষার্থী মেলেনি' : 'No students found'}
                    </div>
                  )}
                </div>

                {/* Selected Student Card */}
                {selectedStudent && (
                  <div className="p-3.5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                        {language === 'bn' ? 'নির্বাচিত শিক্ষার্থী' : 'Selected Student'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full font-mono">
                        {selectedStudent.admissionNo || selectedStudent.studentId}
                      </span>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {selectedStudent.nameEn.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-sm truncate">{selectedStudent.nameEn}</h5>
                        <p className="text-xs text-blue-200 truncate">{selectedStudent.nameBn}</p>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-300 mt-1 flex-wrap gap-y-1">
                          <span className="font-semibold">{selectedStudent.className} ({selectedStudent.section})</span>
                          <span>•</span>
                          <span>Roll: {selectedStudent.roll}</span>
                          <span>•</span>
                          <span className="capitalize">{selectedStudent.shift}</span>
                        </div>
                        {/* Class 9 & 10 Group Badge */}
                        {(selectedStudent.className === 'Class 9' || selectedStudent.className === 'Class 10') && (
                          <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 shadow-2xs">
                            <Award className="w-3 h-3 mr-1 text-slate-950" />
                            <span>{formatGroupName(selectedStudent.group, language)}</span>
                          </div>
                        )}
                        {/* Transport User Badge */}
                        {selectedStudentTransport && (
                          <div className="mt-1.5 block">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Bus className="w-3 h-3 text-emerald-400" />
                              <span>
                                {language === 'bn'
                                  ? `বাস যাত্রী: ${selectedStudentTransport.routeName} (${formatTaka(selectedStudentTransport.monthlyFare)}/মাস)`
                                  : `Bus User: ${selectedStudentTransport.routeName} (${formatTaka(selectedStudentTransport.monthlyFare)}/mo)`}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selectedStudent.guardianPhone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                          {language === 'bn' ? `বেতন: ${formatTaka(monthlyTuitionRate)}` : `Rate: ${formatTaka(monthlyTuitionRate)}`}
                        </span>
                        <div>
                          {studentTotalDueAmount > 0 ? (
                            <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                              {language === 'bn' ? 'মোট বকেয়া:' : 'Due:'} {formatTaka(studentTotalDueAmount)}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{language === 'bn' ? 'বকেয়ামুক্ত' : 'No Dues'}</span>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('statement')}
                          className="inline-flex items-center space-x-1 text-[10px] bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/40 font-semibold transition-colors"
                          title="View Complete Fee Deposit & Due Statement"
                        >
                          <FileText className="w-3 h-3 text-indigo-300" />
                          <span>{language === 'bn' ? 'স্টেটমেন্ট দেখুন' : 'Statement'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPREHENSIVE ACTIVE & OVERDUE DUES FOR SELECTED STUDENT */}
                {selectedStudent && (
                  <>
                    {pendingDuesToDisplay.length > 0 ? (
                      <div className="p-3.5 bg-rose-50/90 border-2 border-rose-300 rounded-2xl text-xs space-y-2.5 shadow-xs animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-bold text-rose-950 border-b border-rose-200 pb-2">
                          <div className="flex items-center space-x-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {language === 'bn'
                                ? `সক্রিয় ও বকেয়া ফিস (${pendingDuesToDisplay.length}টি বাকি)`
                                : `Outstanding & Due Fees (${pendingDuesToDisplay.length} pending)`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleIncludeAllDues}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center space-x-1 self-start sm:self-auto transition-colors"
                            title="Include all overdue and pending fees in current invoice"
                          >
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>{language === 'bn' ? 'সব বকেয়া যুক্ত করুন' : 'Include All Dues'}</span>
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {pendingDuesToDisplay.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-200 shadow-2xs hover:border-rose-400 transition-colors"
                            >
                              <div className="min-w-0 flex-1 mr-2">
                                <div className="font-bold text-slate-900 text-[11px] truncate">{d.headName}</div>
                                <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                  <span>{d.month || '2026 Session'}</span>
                                  {d.dueDate && (
                                    <span className={`font-mono ${d.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                      • {language === 'bn' ? 'শেষ তারিখ:' : 'Last Date:'} {d.dueDate}
                                    </span>
                                  )}
                                  {d.isOverdue && (
                                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold text-[9px]">
                                      {language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="font-black text-rose-700 text-xs">{formatTaka(d.amount)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleIncludeSingleDue(d)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors flex items-center space-x-0.5"
                                  title="Add to current bill"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{language === 'bn' ? 'যোগ' : 'Add'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : studentAllDues.length > 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs flex items-center space-x-2.5 text-emerald-900 animate-in fade-in">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold">{language === 'bn' ? 'সকল সক্রিয় ও বকেয়া ফি ইনভয়েসে যুক্ত হয়েছে' : 'All Due Fees Included in Invoice'}</div>
                          <div className="text-[11px] text-emerald-700">{language === 'bn' ? 'ডান পাশের ইনভয়েস আইটেমাইজড ব্রেকডাউনে সকল ফি দেখতে পাবেন।' : 'Review fee items in the breakdown table on the right.'}</div>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Invoice Builder */}
            <div className="lg:col-span-8 space-y-4">
              <form onSubmit={handleSubmitFeeCollection} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
                {/* Step 2: Multi-Item Fee Selection */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === 'bn'
                          ? '২. ফি আইটেম নির্বাচন ও ইনভয়েস ব্রেকডাউন'
                          : '2. Fee Item Selection & Invoice Breakdown'}
                      </span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold text-slate-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {invoiceItems.length} {language === 'bn' ? 'টি আইটেম যুক্ত' : 'Items in Invoice'}
                      </span>
                      {/* Mobile layout view switcher */}
                      <div className="flex md:hidden items-center bg-slate-100 rounded-lg p-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCounterLayoutMode('stacked')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            counterLayoutMode === 'stacked'
                              ? 'bg-white shadow-2xs font-bold text-blue-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {language === 'bn' ? 'বাম: নির্বাচন' : 'Left: Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounterLayoutMode('side_by_side')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            counterLayoutMode === 'side_by_side'
                              ? 'bg-white shadow-2xs font-bold text-blue-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {language === 'bn' ? 'ডান: ব্রেকডাউন' : 'Right: Breakdown'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2-COLUMN SPLIT: LEFT = Selected Item (Selectors) | RIGHT = Invoice Itemized Breakdown */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* LEFT COLUMN: Selected Item / Fee Selection Tools */}
                    <div className={`space-y-3.5 ${counterLayoutMode === 'side_by_side' ? 'block md:block' : 'block'}`}>
                      <div className="flex items-center justify-between px-1 border-b border-slate-100 pb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>{language === 'bn' ? 'ফি আইটেম নির্বাচন (Selected Item / Select)' : 'Fee Item Selection (Left Side)'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {language === 'bn' ? 'বেতন, পরীক্ষা বা প্রিসেট বেছে নিন' : 'Pick items to add'}
                        </span>
                      </div>

                      {/* Multi-Month Tuition Selector */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {language === 'bn' ? 'মাসিক বেতন (১ বা একাধিক মাস সিলেক্ট করুন):' : 'Monthly Tuition (Multi-Month):'}
                            </span>
                          </span>
                          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                            <span className="text-[10px] text-slate-500">{language === 'bn' ? 'হার/মাস:' : 'Rate/mo:'}</span>
                            <input
                              type="number"
                              value={monthlyTuitionRate}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMonthlyTuitionRate(val);
                                setInvoiceItems((prev) =>
                                  prev.map((item) =>
                                    item.headName.includes('Monthly Tuition Fee') || item.headName.includes('মাসিক বেতন')
                                      ? { ...item, amount: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-18 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded bg-white text-right"
                            />
                            <span className="text-[10px] font-bold text-slate-600">৳</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                          {MONTH_NAMES.map((m) => {
                            const isSelected = selectedMonths.includes(m);
                            const isAlreadyPaid = paidMonthsForSelectedStudent.has(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleToggleMonth(m)}
                                className={`px-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border text-center flex flex-col items-center justify-center relative ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : isAlreadyPaid
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/80 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                                }`}
                                title={isAlreadyPaid ? `${m} - পূর্বে পরিশোধিত (Already Paid)` : m}
                              >
                                <span className="leading-tight">{language === 'bn' ? MONTH_NAMES_BN[m] : m.slice(0, 3)}</span>
                                {isAlreadyPaid && !isSelected && (
                                  <span className="text-[8px] font-black text-emerald-700 leading-none mt-0.5">✓ পরিশোধিত</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Preset Buttons (Dynamic based on selected student's class, admission, custom & bus) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>
                              {language === 'bn'
                                ? `শ্রেণি প্রিসেট (${selectedStudent?.className || 'Class'}):`
                                : `Class Presets for ${selectedStudent?.className || 'Student'}:`}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {dynamicPresets.map((preset) => {
                            const Icon = preset.icon || Sparkles;
                            const isDup = checkDuplicateFee(preset.nameBn, `${academicYear} Session`).isDuplicate;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleAddPreset(preset)}
                                className={`flex items-center space-x-1 px-2.5 py-1 border rounded-lg font-semibold transition-colors shadow-2xs text-[11px] ${
                                  isDup
                                    ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100'
                                    : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50'
                                }`}
                                title={isDup ? 'পূর্বে পরিশোধিত ফি - ক্লিক করলে নিশ্চিতকরণ সতর্কতা আসবে' : preset.nameEn}
                              >
                                <Icon className={`w-3 h-3 shrink-0 ${isDup ? 'text-amber-600' : 'text-emerald-600'}`} />
                                <span className="truncate">{language === 'bn' ? preset.nameBn : preset.nameEn}</span>
                                <span className="text-[10px] text-blue-700 font-bold font-mono">({preset.defaultAmount}৳)</span>
                                {isDup && (
                                  <span className="text-[8px] bg-amber-200/90 text-amber-800 px-1 rounded font-bold">পূর্বে প্রদত্ত</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Add Custom Fee Item */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center space-x-1">
                          <Plus className="w-3 h-3 text-blue-600" />
                          <span>{language === 'bn' ? 'কাস্টম ফি যুক্ত করুন' : 'Add Custom Fee Item'}</span>
                        </span>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder={language === 'bn' ? 'কাস্টম ফি-এর নাম (যেমন: বিজ্ঞান মেলা, জরিমানা...)' : 'Custom Fee Title (e.g. Science Fair...)'}
                            value={customItemTitle}
                            onChange={(e) => setCustomItemTitle(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder={language === 'bn' ? 'সেশন / বিবরণ' : 'Session / Period'}
                              value={customItemPeriod}
                              onChange={(e) => setCustomItemPeriod(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                            <input
                              type="number"
                              placeholder="৳"
                              value={customItemAmount || ''}
                              onChange={(e) => setCustomItemAmount(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-white text-right"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomItem}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 flex items-center justify-center space-x-1 text-xs shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{language === 'bn' ? 'যোগ' : 'Add'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Invoice Itemized Breakdown */}
                    <div className={`space-y-2.5 ${counterLayoutMode === 'stacked' ? 'hidden md:block' : 'block'}`}>
                      <div className="flex items-center justify-between px-1 border-b border-slate-100 pb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'bn' ? 'ইনভয়েস আইটেমাইজড ব্রেকডাউন' : 'Invoice Itemized Breakdown'}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {language === 'bn' ? 'মোট:' : 'Total:'} {formatTaka(subTotal)}
                        </span>
                      </div>

                      {/* Current Invoice Items Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                        <div className="bg-gradient-to-r from-slate-100 to-emerald-50/70 px-3 py-1.5 font-bold text-slate-700 flex items-center justify-between text-xs border-b border-slate-200">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{language === 'bn' ? 'ইনভয়েসভুক্ত আইটেম তালিকা' : 'Invoice Items List'}</span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {language === 'bn' ? 'টাকার পরিমাণ পরিবর্তনযোগ্য' : 'Editable amounts'}
                          </span>
                        </div>
                        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                                <th className="py-2 px-2 w-7 text-center">#</th>
                                <th className="py-2 px-2">{language === 'bn' ? 'ফি বিবরণ' : 'Fee Description'}</th>
                                <th className="py-2 px-1.5 text-center">{language === 'bn' ? 'মাস' : 'Month'}</th>
                                <th className="py-2 px-2 text-right w-24">{language === 'bn' ? 'টাকা (৳)' : 'Amount (৳)'}</th>
                                <th className="py-2 px-1 text-center w-7"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoiceItems.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                  <td className="py-2 px-2 font-semibold text-slate-900 leading-tight">
                                    <div className="line-clamp-2">{item.headName}</div>
                                  </td>
                                  <td className="py-2 px-1.5 text-center text-slate-500 text-[10px] whitespace-nowrap">
                                    {item.month || '-'}
                                  </td>
                                  <td className="py-2 px-2 text-right">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.amount}
                                      onChange={(e) => handleItemAmountChange(item.id, Number(e.target.value))}
                                      className="w-18 px-1.5 py-1 border border-slate-200 rounded font-bold text-slate-900 text-right text-xs bg-slate-50 focus:bg-white focus:border-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                      title="Remove Item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {invoiceItems.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                      <Receipt className="w-6 h-6 text-slate-300" />
                                      <span className="text-xs font-medium">
                                        {language === 'bn'
                                          ? '← বাম পাশের মেনু থেকে ফি সিলেক্ট করুন'
                                          : '← Select fee items from the left side'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50/90 border-t-2 border-slate-200 font-bold sticky bottom-0">
                                <td colSpan={3} className="py-2.5 px-2 text-right text-slate-700">
                                  {language === 'bn' ? 'সর্বমোট গ্রস ফি:' : 'Subtotal Gross:'}
                                </td>
                                <td className="py-2.5 px-2 text-right text-xs sm:text-sm text-slate-900 font-extrabold">
                                  {formatTaka(subTotal)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Breakdown Summary footer note */}
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">
                          {language === 'bn' ? 'মোট যুক্ত আইটেম:' : 'Total Items:'}{' '}
                          <span className="font-bold text-slate-900">{invoiceItems.length}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-500">{language === 'bn' ? 'বর্তমান নিট:' : 'Current Net:'}</span>
                          <span className="font-bold text-emerald-700">{formatTaka(netPayable)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Financial Calculations, Waivers & Payment Details */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? '৩. ছাড়, আদায় ও পেমেন্ট বিবরণ' : '3. Discount, Collection & Payment Details'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'বিশেষ ছাড় / ওয়েভার (৳)' : 'Discount / Waiver (৳)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={subTotal}
                        value={discountAmount || ''}
                        onChange={(e) => {
                          setDiscountAmount(Number(e.target.value));
                          setIsManualPaidAmount(false);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'ছাড়ের কারণ' : 'Waiver Reason'}
                      </label>
                      <input
                        type="text"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder={language === 'bn' ? 'যেমন: ভাই-বোন ছাড় / দরিদ্র তহবিল' : 'e.g. Sibling concession / Poor fund'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'বিলম্ব ফি / জরিমানা (৳)' : 'Late Fine (৳)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={lateFineAmount || ''}
                        onChange={(e) => {
                          setLateFineAmount(Number(e.target.value));
                          setIsManualPaidAmount(false);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Highlighted Net Payable & Amount Paid Card */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                        {language === 'bn' ? 'সর্বমোট প্রদেয় (Net Payable):' : 'Net Payable Amount:'}
                      </span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {formatTaka(netPayable)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Subtotal {subTotal} {discountAmount > 0 ? `- Discount ${discountAmount}` : ''} {lateFineAmount > 0 ? `+ Fine ${lateFineAmount}` : ''}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-emerald-900 mb-1">
                        {language === 'bn' ? 'এখন আদায় হচ্ছে (৳) *' : 'Amount Being Paid (৳) *'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={netPayable}
                        value={effectivePaidAmount}
                        onChange={(e) => {
                          setPaidNowAmount(Number(e.target.value));
                          setIsManualPaidAmount(true);
                        }}
                        className="w-full px-3 py-1.5 border-2 border-emerald-500 rounded-lg font-extrabold text-emerald-800 text-base bg-white"
                      />
                      <span className="text-[10px] text-emerald-700">
                        {effectivePaidAmount === netPayable ? (
                          language === 'bn' ? 'সম্পূর্ণ পরিশোধ (Full Paid)' : 'Full Payment'
                        ) : (
                          language === 'bn' ? 'আংশিক পরিশোধ (Partial)' : 'Partial Payment'
                        )}
                      </span>
                    </div>

                    <div className="border-l border-emerald-200/80 pl-4">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                        {language === 'bn' ? 'অবশিষ্ট বকেয়া (Balance Due):' : 'Remaining Balance Due:'}
                      </span>
                      <div className={`text-xl font-extrabold mt-0.5 ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatTaka(balanceDue)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {balanceDue === 0 ? 'Nil' : 'Will be tracked in dues'}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method & TrxID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'পেমেন্ট মেথড *' : 'Payment Method *'}
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 bg-white"
                      >
                        <option value="Cash">Cash (নগদ গ্রহণ)</option>
                        <option value="bKash">bKash (বিকাশ)</option>
                        <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                        <option value="Rocket">Rocket (রকেট)</option>
                        <option value="Bank">Bank Deposit (ব্যাংক)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'ট্রানজ্যাকশন আইডি (TrxID) / স্লিপ নং' : 'TrxID / Bank Slip No'}
                      </label>
                      <input
                        type="text"
                        placeholder={paymentMethod === 'Cash' ? 'Not required for cash' : 'e.g. BK98231940'}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        {language === 'bn' ? 'বিশেষ মন্তব্য' : 'Receipt Remarks'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'bn' ? 'প্রয়োজনে কোনো মন্তব্য লিখুন...' : 'Optional notes...'}
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === 'bn' ? 'আদায়কারী:' : 'Cashier:'} <strong>{currentUser.name}</strong> ({currentUser.email})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceItems([]);
                          setSelectedMonths([]);
                        }}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                      >
                        {language === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedStudent || invoiceItems.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20 transition-all text-sm"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>{language === 'bn' ? 'ফি গ্রহণ ও রসিদ প্রিন্ট করুন' : 'Confirm & Print Official Receipt'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ONLINE PAYMENT APPROVALS (অনলাইন পেমেন্ট অনুমোদন) */}
      {activeTab === 'online_approvals' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Approval Feedback Banner */}
          {approvalFeedbackNotice && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs ${
                approvalFeedbackNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{approvalFeedbackNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setApprovalFeedbackNotice(null)}
                className="text-slate-500 hover:text-slate-800 p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    {language === 'bn' ? 'মোট অনলাইন আবেদন' : 'Total Online Requests'}
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {toBnNumber(onlineRequests.length)} টি
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {formatTaka(onlineRequests.reduce((sum, r) => sum + r.amount, 0))}
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase">
                    {language === 'bn' ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Verification'}
                  </span>
                  <div className="text-xl font-black text-amber-900 mt-1 flex items-center space-x-1.5">
                    <span>{toBnNumber(onlineRequests.filter((r) => r.status === 'pending').length)} টি</span>
                    {pendingRequestsCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">
                    {formatTaka(
                      onlineRequests
                        .filter((r) => r.status === 'pending')
                        .reduce((sum, r) => sum + r.amount, 0)
                    )} (যাচাই প্রয়োজন)
                  </div>
                </div>
                <div className="p-2.5 bg-amber-200 text-amber-800 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">
                    {language === 'bn' ? 'অনুমোদিত আদায়' : 'Approved & Collected'}
                  </span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {toBnNumber(onlineRequests.filter((r) => r.status === 'approved').length)} টি
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-bold">
                    {formatTaka(
                      onlineRequests
                        .filter((r) => r.status === 'approved')
                        .reduce((sum, r) => sum + r.amount, 0)
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-200 text-emerald-800 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-800 uppercase">
                    {language === 'bn' ? 'প্রত্যাখ্যাত / বাতিল' : 'Rejected Requests'}
                  </span>
                  <div className="text-xl font-black text-rose-900 mt-1">
                    {toBnNumber(onlineRequests.filter((r) => r.status === 'rejected').length)} টি
                  </div>
                  <div className="text-[10px] text-rose-700 mt-0.5">
                    মন্তব্য সহ বাতিলকৃত আবেদন
                  </div>
                </div>
                <div className="p-2.5 bg-rose-200 text-rose-800 rounded-xl">
                  <X className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'bn'
                    ? 'শিক্ষার্থীর নাম, রোল, TrxID বা মোবাইল নম্বর দিয়ে খুঁজুন...'
                    : 'Search by student name, roll, TrxID or phone...'
                }
                value={onlineSearch}
                onChange={(e) => setOnlineSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOnlineStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    onlineStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  সকল ({onlineRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    onlineStatusFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-2xs font-bold'
                      : 'text-amber-800 hover:text-amber-900'
                  }`}
                >
                  অপেক্ষমাণ ({onlineRequests.filter((r) => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineStatusFilter('approved')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    onlineStatusFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-emerald-800 hover:text-emerald-900'
                  }`}
                >
                  অনুমোদিত ({onlineRequests.filter((r) => r.status === 'approved').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineStatusFilter('rejected')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    onlineStatusFilter === 'rejected'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-800 hover:text-rose-900'
                  }`}
                >
                  বাতিল ({onlineRequests.filter((r) => r.status === 'rejected').length})
                </button>
              </div>

              {/* Method Filter */}
              <select
                value={onlineMethodFilter}
                onChange={(e) => setOnlineMethodFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold text-slate-700"
              >
                <option value="all">সকল মাধ্যম (bKash/Nagad)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
              </select>

              {canManage && (
                <button
                  type="button"
                  onClick={handleClearAllOnlineRequests}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                  title="অনলাইন পেমেন্ট রিকোয়েস্ট তালিকা সম্পূর্ণ খালি করুন"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === 'bn' ? 'তালিকা খালি করুন' : 'Clear All'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMfsModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center space-x-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>MFS সেটিংস</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">রিকোয়েস্ট নং</th>
                    <th className="py-3 px-4">শিক্ষার্থী ও শ্রেণি</th>
                    <th className="py-3 px-4">ফি এর খাত</th>
                    <th className="py-3 px-4">মাধ্যম</th>
                    <th className="py-3 px-4">প্রেরক নম্বর</th>
                    <th className="py-3 px-4">ট্রানজেকশন আইডি (TrxID)</th>
                    <th className="py-3 px-4 text-right">টাকা</th>
                    <th className="py-3 px-4 text-center">অনুমোদন স্থিতি</th>
                    <th className="py-3 px-4 text-right">কার্যক্রম / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {onlineRequests
                    .filter((r) => {
                      if (onlineStatusFilter !== 'all' && r.status !== onlineStatusFilter) return false;
                      if (onlineMethodFilter !== 'all' && r.paymentMethod !== onlineMethodFilter) return false;
                      if (onlineSearch.trim() !== '') {
                        const q = onlineSearch.toLowerCase();
                        return (
                          r.studentName.toLowerCase().includes(q) ||
                          r.studentRoll.includes(q) ||
                          r.className.toLowerCase().includes(q) ||
                          r.transactionId.toLowerCase().includes(q) ||
                          r.senderPhone.includes(q) ||
                          r.receiptNo.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{formatDate(req.requestDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{req.receiptNo}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.studentName}</div>
                          <div className="text-[10px] text-slate-500">
                            {req.className} ({req.section}) • রোল: {req.studentRoll}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate" title={req.feeTitle}>
                          {req.feeTitle}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              req.paymentMethod === 'bKash'
                                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                : 'bg-orange-100 text-orange-700 border border-orange-200'
                            }`}
                          >
                            {req.paymentMethod === 'bKash' ? 'বিকাশ' : 'নগদ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 select-all font-semibold">
                          {req.senderPhone}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700 select-all">
                          {req.transactionId}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                          {formatTaka(req.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              🟡 অপেক্ষমাণ
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🟢 অনুমোদিত
                              </span>
                              {req.approvedBy && (
                                <div className="text-[9px] text-slate-500 mt-0.5">{req.approvedBy}</div>
                              )}
                            </div>
                          )}
                          {req.status === 'rejected' && (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                🔴 বাতিলকৃত
                              </span>
                              {req.rejectedReason && (
                                <div className="text-[10px] text-rose-700 font-bold mt-0.5 max-w-xs truncate" title={req.rejectedReason}>
                                  {req.rejectedReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenApproveModal(req)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1"
                                  title="Approve payment & issue official receipt"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>অনুমোদন</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(req)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1"
                                  title="Reject payment with reason comment"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>বাতিল</span>
                                </button>
                              </>
                            )}
                            {req.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const foundPayment = payments.find((p) => p.receiptNo === req.receiptNo || p.transactionId === req.transactionId);
                                  setSelectedReceipt(foundPayment || {
                                    id: `pay_${req.id}`,
                                    receiptNo: req.receiptNo,
                                    invoiceId: `inv_${req.id}`,
                                    studentId: req.studentId,
                                    studentName: req.studentName,
                                    className: req.className as any,
                                    roll: req.studentRoll,
                                    amount: req.amount,
                                    paidDate: req.approvedAt?.split('T')[0] || req.requestDate,
                                    paymentMethod: req.paymentMethod as any,
                                    transactionId: req.transactionId,
                                    collectedBy: req.approvedBy || 'Admin',
                                    notes: req.feeTitle,
                                  });
                                  setShowReceiptModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>রসিদ</span>
                              </button>
                            )}
                            {req.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(req)}
                                className="px-2 py-1 text-slate-500 hover:text-slate-700 text-[11px] underline"
                              >
                                কারণ দেখুন
                              </button>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOnlineRequest(req)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="এই রিকোয়েস্ট মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {onlineRequests.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        এখনও কোনো শিক্ষার্থী বিকাশ বা নগদে অনলাইন ফি জমার আবেদন পাঠায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INVOICES TABLE */}
      {activeTab === 'collection' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'শিক্ষার্থী, ইনভয়েস নং বা রোল দিয়ে খুঁজুন...' : 'Search student name, invoice, roll...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="sm:w-56">
              <select
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-blue-900"
              >
                <option value="all">{language === 'bn' ? 'সকল শিক্ষাবর্ষ (All Sessions)' : 'All Sessions'}</option>
                <option value="2026">সেশন ২০২৬ (বর্তমান)</option>
                <option value="2027">সেশন ২০২৭ (অগ্রিম ভর্তি)</option>
                <option value="2028">সেশন ২০২৮</option>
              </select>
            </div>
            <div className="sm:w-56">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">{language === 'bn' ? 'সকল শ্রেণি' : 'All Classes'}</option>
                {['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Class 4', 'Class 3', 'Class 2', 'Class 1', 'KG', 'Nursery'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Student & Class</th>
                    <th className="py-3 px-4">Fee Head / Description</th>
                    <th className="py-3 px-4 text-right">Net Amount</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-700">{inv.invoiceNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.studentNameEn}</div>
                        <div className="text-[11px] text-slate-500">
                          {inv.className} ({inv.section}) • Roll: {inv.roll}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate" title={inv.feeType}>
                        {inv.feeType}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{formatTaka(inv.netAmount)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatTaka(inv.paidAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {formatTaka(inv.dueAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {inv.dueAmount > 0 && canManage ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSingleCollect(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                            >
                              Collect
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const pay = payments.find((p) => p.invoiceId === inv.id);
                                if (pay) {
                                  setSelectedReceipt(pay);
                                  setSelectedReceiptInvoice(inv);
                                  setShowReceiptModal(true);
                                } else {
                                  const previewPay: FeePayment = {
                                    id: `preview_${inv.id}`,
                                    receiptNo: `REC-${inv.invoiceNo.replace('INV-', '')}`,
                                    invoiceId: inv.id,
                                    studentId: inv.studentId,
                                    studentName: inv.studentNameEn,
                                    className: `${inv.className} (${inv.section})`,
                                    roll: inv.roll,
                                    amount: inv.paidAmount,
                                    items: inv.items,
                                    paidDate: inv.dueDate,
                                    paymentMethod: 'Cash',
                                    collectedBy: currentUser.name,
                                    notes: inv.feeType,
                                  };
                                  setSelectedReceipt(previewPay);
                                  setSelectedReceiptInvoice(inv);
                                  setShowReceiptModal(true);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Print Money Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditInvoice(inv)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="ইনভয়েস এডিট"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="ইনভয়েস মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {language === 'bn' ? 'কোনো ফি ইনভয়েস পাওয়া যায়নি' : 'No fee invoices found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STUDENT FEE STATEMENT (LEFT JOMA & RIGHT DUE) */}
      {activeTab === 'statement' && (
        <StudentFeeStatementTab
          preselectedStudentId={selectedStudent?.studentId}
          onGoToCounter={(student, dues) => {
            setSelectedStudent(student);
            if (dues && dues.length > 0) {
              setInvoiceItems(dues);
            }
            setActiveTab('counter');
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }}
        />
      )}

      {/* TAB: CLASS FEE SETUP */}
      {activeTab === 'class_fees' && (
        <ClassFeeSetupTab
          onConfigsUpdated={(newConfigs) => {
            setClassFeeConfigs(newConfigs);
            if (selectedStudent) {
              const currentClassConfig = newConfigs.find((c) => c.className === selectedStudent.className);
              if (currentClassConfig) {
                setMonthlyTuitionRate(currentClassConfig.tuitionFee);
              }
            }
          }}
        />
      )}

      {/* TAB: SCHEDULED FEES & PAYMENT DEADLINES */}
      {activeTab === 'scheduled_fees' && <ScheduledFeesTab />}

      {/* TAB: TRANSPORT STUDENTS & FARES */}
      {activeTab === 'transport_fees' && <TransportStudentsTab />}

      {/* TAB: PAID RECEIPTS */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              {language === 'bn' ? 'পরিশোধিত ফি রসিদ খাতা' : 'Official Fee Payment Receipts Registry'}
            </span>
            <span className="text-slate-500 font-semibold">
              Total Receipts: {payments.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">TrxID / Note</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-blue-700">{p.receiptNo}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.studentName}</div>
                      <div className="text-[11px] text-slate-500">{p.className} • Roll {p.roll}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {p.transactionId ? <span className="font-mono text-blue-600">{p.transactionId}</span> : p.notes}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.paidDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                      {formatTaka(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const inv = invoices.find((i) => i.id === p.invoiceId);
                            setSelectedReceipt(p);
                            setSelectedReceiptInvoice(inv || null);
                            setShowReceiptModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="মানি রসিদ প্রিন্ট করুন"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditReceipt(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="রসিদ এডিট / সংশোধন করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="রসিদ মুছে ফেলুন (Delete Receipt)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: OUTSTANDING DUES LIST */}
      {activeTab === 'dues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {language === 'bn' ? 'শিক্ষার্থীদের বকেয়া ফি তালিকা' : 'Student Outstanding Dues List'}
              </span>
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'তাত্ক্ষণিকভাবে বকেয়া গ্রহণ করতে "Collect" বাটনে চাপুন' : 'Click "Collect" to immediately receive dues'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-blue-900"
              >
                <option value="all">{language === 'bn' ? 'সকল শিক্ষাবর্ষ (All Sessions)' : 'All Sessions'}</option>
                <option value="2026">সেশন ২০২৬</option>
                <option value="2027">সেশন ২০২৭ (অগ্রিম ভর্তি)</option>
                <option value="2028">সেশন ২০২৮</option>
              </select>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Print Due List
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Roll</th>
                  <th className="py-3 px-4">Fee Month / Type</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.filter((i) => i.dueAmount > 0).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inv.studentNameEn}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.className} ({inv.section}) • Roll {inv.roll}</td>
                    <td className="py-3 px-4">{inv.month || inv.feeType}</td>
                    <td className="py-3 px-4 text-rose-600 font-medium">{inv.dueDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                      {formatTaka(inv.dueAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleOpenSingleCollect(inv)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                          >
                            Collect
                          </button>
                        )}
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="বকেয়া এডিট বা মওকুফ করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="বকেয়া ইনভয়েস মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 text-sm">
              {language === 'bn' ? 'বিদ্যালয়ের পরিচালনা ও প্রাতিষ্ঠানিক ব্যয়' : 'Institutional Operational Expenses'}
            </span>
            <span className="text-slate-500 font-semibold">
              Total Expenses: {formatTaka(totalExpensesAmount)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action / অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800">{e.voucherNo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{e.title}</td>
                    <td className="py-3 px-4 text-slate-700">{e.paidTo}</td>
                    <td className="py-3 px-4 text-slate-500">{e.date}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                      {formatTaka(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ভাউচার এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(e)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ভাউচার মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CASHBOOK */}
      {activeTab === 'cashbook' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'bn' ? 'দৈনিক ক্যাশ বই ও আয়-ব্যয় খাতা' : 'Daily Cashbook & Financial Summary'}
              </h3>
              <p className="text-xs text-slate-500">{school.nameBn} • {academicYear} Session</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cashbook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <h4 className="font-bold text-emerald-800 border-b border-emerald-200 pb-2 mb-3 flex items-center justify-between">
                <span>INCOME (আদায়)</span>
                <span className="text-sm">{formatTaka(totalCollected)}</span>
              </h4>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 hover:bg-white/80 px-2 rounded-lg transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800">{p.studentName} ({p.receiptNo})</div>
                      <div className="text-[10px] text-slate-400">{p.paidDate} • {p.paymentMethod}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-700">{formatTaka(p.amount)}</span>
                      {canManage && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditReceipt(p)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="রসিদ এডিট"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="রসিদ মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <h4 className="font-bold text-rose-800 border-b border-rose-200 pb-2 mb-3 flex items-center justify-between">
                <span>EXPENDITURE (ব্যয়)</span>
                <span className="text-sm">{formatTaka(totalExpensesAmount)}</span>
              </h4>
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 hover:bg-white/80 px-2 rounded-lg transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800">{e.title}</div>
                      <div className="text-[10px] text-slate-400">{e.date} • {e.voucherNo}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-rose-600">{formatTaka(e.amount)}</span>
                      {canManage && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="ব্যয় ভাউচার এডিট"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="ব্যয় ভাউচার মুছে ফেলুন"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE INVOICE COLLECT MODAL */}
      {showCollectModal && targetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Collect Student Fee</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmSinglePayment} className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="font-bold text-slate-900">{targetInvoice.studentNameEn}</div>
                <div className="text-[11px] text-slate-600">
                  {targetInvoice.className} ({targetInvoice.section}) • Roll {targetInvoice.roll}
                </div>
                <div className="text-[11px] text-blue-700 font-semibold mt-1">
                  Due Amount: {formatTaka(targetInvoice.dueAmount)} ({targetInvoice.feeType})
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Amount to Collect (৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={targetInvoice.dueAmount}
                  value={singleCollectAmount}
                  onChange={(e) => setSingleCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="Cash">Cash (নগদ)</option>
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Bank">Bank Deposit (ব্যাংক)</option>
                </select>
              </div>

              {paymentMethod !== 'Cash' && (
                <div>
                  <label className="block font-semibold mb-1">Transaction ID (TrxID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK98721XA"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm & Print Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL DUPLICATE PRINTABLE MONEY RECEIPT MODAL */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:my-0">
            {/* Header controls (hidden when printing) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'bn' ? 'অফিসিয়াল মানি রসিদ (Duplicate Money Receipt)' : 'Official Money Receipt'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? 'রসিদ প্রিন্ট' : 'Print Receipt'}</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body: Student Copy + Office Copy */}
            <div className="mt-4 space-y-6 text-xs text-slate-900 print:mt-0 print:space-y-4">
              {[
                { copy: 'STUDENT COPY (শিক্ষার্থী কপি)', bg: 'bg-blue-50/30' },
                { copy: 'OFFICE COPY (অফিস কপি)', bg: 'bg-slate-50/40' },
              ].map(({ copy, bg }, idx) => (
                <div
                  key={idx}
                  className={`p-5 border-2 border-dashed border-slate-300 rounded-2xl ${bg} print:border-slate-400 print:p-4 print:rounded-none`}
                >
                  {/* School Header */}
                  <div className="flex items-start justify-between border-b border-slate-300 pb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                        alt="School Logo"
                        className="w-12 h-12 object-contain shrink-0 rounded-lg p-0.5 bg-white border border-slate-200 shadow-2xs print:border-none"
                      />
                      <div className="space-y-0.5">
                        <h2 className="text-base font-extrabold text-slate-900">{school.nameBn}</h2>
                        <h3 className="text-xs font-bold text-slate-700">{school.nameEn}</h3>
                        <p className="text-[10px] text-slate-600">
                          {school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider print:bg-black">
                        {copy}
                      </span>
                      <div className="text-xs font-bold text-blue-800 mt-1.5 font-mono">
                        Receipt: {selectedReceipt.receiptNo}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Date: {formatDate(selectedReceipt.paidDate)}
                      </div>
                    </div>
                  </div>

                  {/* Student Info Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5 py-2 px-3 bg-white border border-slate-200 rounded-xl text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Student Name:</span>
                      <strong className="text-slate-900">{selectedReceipt.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Class & Roll:</span>
                      <strong>{selectedReceipt.className} • Roll {selectedReceipt.roll}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Payment Method:</span>
                      <strong className="text-emerald-700">
                        {selectedReceipt.paymentMethod} {selectedReceipt.transactionId ? `(${selectedReceipt.transactionId})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Academic Session:</span>
                      <strong>{school.currentSession || selectedReceiptInvoice?.session || '2026'} Session</strong>
                    </div>
                  </div>

                  {/* Itemized Table Breakdown */}
                  <div className="my-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                          <th className="py-1.5 px-3 w-8 text-center">SL</th>
                          <th className="py-1.5 px-3">Description / Fee Head (ফি-এর খাত)</th>
                          <th className="py-1.5 px-3">Month / Period (মাস / বিবরণ)</th>
                          <th className="py-1.5 px-3 text-right w-24">Amount (টাকা)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReceipt.items && selectedReceipt.items.length > 0 ? (
                          selectedReceipt.items.map((it, i) => (
                            <tr key={it.id || i}>
                              <td className="py-1 px-3 text-center text-slate-400 font-mono text-[10px]">{i + 1}</td>
                              <td className="py-1 px-3 font-medium text-slate-900">{it.headName}</td>
                              <td className="py-1 px-3 text-slate-500">{it.month || '-'}</td>
                              <td className="py-1 px-3 text-right font-bold">{it.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-1 px-3 text-center text-slate-400 font-mono text-[10px]">1</td>
                            <td className="py-1 px-3 font-medium text-slate-900">{selectedReceipt.notes || 'School Tuition Fee'}</td>
                            <td className="py-1 px-3 text-slate-500">2026</td>
                            <td className="py-1 px-3 text-right font-bold">{selectedReceipt.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Amount in Words */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 items-center">
                    <div className="p-2.5 bg-slate-100/80 rounded-lg border border-slate-200 text-[11px]">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">
                        Amount in Words (কথায়):
                      </span>
                      <strong className="text-slate-900 font-serif">
                        {amountInWords(selectedReceipt.amount)}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-right flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs">
                        Total Amount Received (মোট প্রাপ্ত অর্থ):
                      </span>
                      <span className="text-base font-extrabold text-emerald-800">
                        {formatTaka(selectedReceipt.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Signature lines */}
                  <div className="pt-6 grid grid-cols-2 text-center text-[10px] text-slate-600">
                    <div>
                      <div className="w-36 mx-auto border-t border-slate-400 pt-1">
                        Student / Guardian Signature
                      </div>
                    </div>
                    <div>
                      <div className="w-48 mx-auto border-t border-slate-400 pt-1 font-bold text-slate-800">
                        Authorized Cashier ({selectedReceipt.collectedBy})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL (CREATE & EDIT) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingExpense
                  ? language === 'bn'
                    ? 'ব্যয় ভাউচার সংশোধন / এডিট'
                    : 'Edit Expense Voucher'
                  : language === 'bn'
                  ? 'নতুন প্রাতিষ্ঠানিক ব্যয় ভাউচার'
                  : 'Create New Expense Voucher'}
              </h3>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'ব্যয়ের বিবরণ / খাত *' : 'Expense Title / Description *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Chemical Purchase"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="Electricity & Utilities">Electricity & Utilities</option>
                  <option value="Printing & Stationery">Printing & Stationery</option>
                  <option value="Science Laboratory">Science Laboratory</option>
                  <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                  <option value="Sports & Cultural">Sports & Cultural</option>
                  <option value="Teacher Welfare">Teacher Welfare</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank">Bank / Cheque (ব্যাংক)</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'প্রাপক (Vendor / Person) *' : 'Paid To (Vendor / Person) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengal Scientific Co."
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingExpense
                    ? language === 'bn'
                      ? 'পরিবর্তন সংরক্ষণ করুন'
                      : 'Save Changes'
                    : language === 'bn'
                    ? 'ভাউচার অনুমোদন করুন'
                    : 'Approve Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECEIPT MODAL */}
      {showEditReceiptModal && editingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'ফি রসিদ সংশোধন / এডিট' : 'Edit Fee Receipt'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  রসিদ নং: <span className="font-mono text-blue-700 font-bold">{editingReceipt.receiptNo}</span> • {editingReceipt.studentName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditReceiptModal(false);
                  setEditingReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditReceipt} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'পরিশোধিত টাকার পরিমাণ (৳) *' : 'Paid Amount (৳) *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editReceiptAmount}
                  onChange={(e) => setEditReceiptAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={editReceiptMethod}
                    onChange={(e) => setEditReceiptMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Cash">Cash (নগদ টাকা)</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                    <option value="Bank">Bank (ব্যাংক)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'জমার তারিখ *' : 'Payment Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editReceiptDate}
                    onChange={(e) => setEditReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK8B5544MN"
                  value={editReceiptTrxId}
                  onChange={(e) => setEditReceiptTrxId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'মন্তব্য / খাত বিবরণ' : 'Notes / Description'}
                </label>
                <input
                  type="text"
                  placeholder="বিবরণ বা নোট..."
                  value={editReceiptNotes}
                  onChange={(e) => setEditReceiptNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditReceiptModal(false);
                    setEditingReceipt(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVOICE / DUE MODAL */}
      {showEditInvoiceModal && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'ফি ইনভয়েস ও বকেয়া সংশোধন' : 'Edit Fee Invoice & Due'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ইনভয়েস: <span className="font-mono text-blue-700 font-bold">{editingInvoice.invoiceNo}</span> • {editingInvoice.studentNameEn}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditInvoiceModal(false);
                  setEditingInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditInvoice} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">
                  {language === 'bn' ? 'ফি এর খাত / বিবরণ *' : 'Fee Head / Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={editInvoiceFeeType}
                  onChange={(e) => setEditInvoiceFeeType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'নিট ফি পরিমাণ (৳) *' : 'Net Fee Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editInvoiceNetAmount}
                    onChange={(e) => setEditInvoiceNetAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'ছাড় / ওয়েভার (৳)' : 'Discount / Waiver (৳)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editInvoiceDiscount}
                    onChange={(e) => setEditInvoiceDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    {language === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editInvoiceDueDate}
                    onChange={(e) => setEditInvoiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {language === 'bn' ? 'পরিশোধিত:' : 'Paid:'}
                  </div>
                  <div className="text-emerald-700 font-bold">{formatTaka(editingInvoice.paidAmount)}</div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    {language === 'bn' ? 'সংশোধিত বকেয়া:' : 'Revised Due:'}
                  </div>
                  <div className="text-rose-600 font-black">
                    {formatTaka(Math.max(0, editInvoiceNetAmount - editingInvoice.paidAmount))}
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditInvoiceModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Fee Warning Modal */}
      {duplicateWarning && duplicateWarning.isOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-400 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-white animate-pulse" />
                <h3 className="font-extrabold text-sm">
                  {language === 'bn' ? 'সতর্কতা: ফি ইতোমধ্যেই পরিশোধিত!' : 'Alert: Fee Already Paid!'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="font-bold text-slate-800 text-sm">
                  {selectedStudent.nameBn} ({selectedStudent.nameEn})
                </div>
                <div className="text-slate-600 space-y-1 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500">{language === 'bn' ? 'শ্রেণি ও রোল:' : 'Class & Roll:'} </span>
                    <span className="font-bold text-slate-800">{selectedStudent.className} ({selectedStudent.section}) - রোল {selectedStudent.roll}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">{language === 'bn' ? 'ফি আইটেম:' : 'Fee Item:'} </span>
                    <span className="font-extrabold text-rose-700">{duplicateWarning.feeItemName}</span>
                  </div>
                </div>
              </div>

              {/* Existing Payment Record Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 flex items-center space-x-1">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'পূর্বে পরিশোধিত রেকর্ডের তথ্য:' : 'Previous Payment Record:'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'ইনভয়েস নম্বর:' : 'Invoice No:'}</span>
                    <span className="font-mono font-bold text-blue-700">#{duplicateWarning.existingRecord.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'পরিশোধের তারিখ:' : 'Paid Date:'}</span>
                    <span className="font-mono font-semibold text-slate-700">{duplicateWarning.existingRecord.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'পূর্বে আদায়কৃত টাকা:' : 'Amount Paid:'}</span>
                    <span className="font-bold text-emerald-700 font-mono">৳ {duplicateWarning.existingRecord.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{language === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                      {duplicateWarning.existingRecord.status === 'Paid' ? 'পরিশোধিত (Paid)' : duplicateWarning.existingRecord.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-rose-700 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200 leading-relaxed">
                {language === 'bn'
                  ? '⚠️ এই শিক্ষার্থী ইতোমধ্যে উক্ত ফি পরিশোধ করেছে। ভুলবশত কি আবার এটি ইনভয়েসে যোগ করতে চাচ্ছেন?'
                  : '⚠️ This student has already paid this fee. Are you sure you want to add it again to the invoice?'}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  {language === 'bn' ? 'না, বাদ দিন (Cancel)' : 'No, Cancel'}
                </button>
                <button
                  type="button"
                  onClick={duplicateWarning.onConfirmAdd}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1"
                >
                  <span>{language === 'bn' ? 'হ্যাঁ, পুনরায় যোগ করুন' : 'Yes, Add Anyway'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONLINE PAYMENT APPROVE CONFIRMATION MODAL */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-sm">অনলাইন পেমেন্ট অনুমোদন নিশ্চিতকরণ</h3>
                  <p className="text-[11px] text-emerald-100">অফিশিয়াল মানি রসিদ তৈরি ও বকেয়া সমন্বয় করা হবে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">শিক্ষার্থী:</span>
                  <span className="font-bold text-slate-900 text-sm">{approvingRequest.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">শ্রেণি ও রোল:</span>
                  <span className="font-bold text-slate-900">{approvingRequest.className} (রোল: {approvingRequest.studentRoll})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ফি বিবরণ:</span>
                  <span className="font-bold text-blue-900">{approvingRequest.feeTitle}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200/80 pt-1.5">
                  <span className="text-slate-700 font-bold">টাকার পরিমাণ:</span>
                  <span className="font-black text-emerald-700 text-base">{formatTaka(approvingRequest.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">পেমেন্ট মাধ্যম:</span>
                  <span className="font-bold text-slate-900">{approvingRequest.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">প্রেরক মোবাইল:</span>
                  <span className="font-mono font-bold text-slate-800">{approvingRequest.senderPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">ট্রানজেকশন আইডি (TrxID):</span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{approvingRequest.transactionId}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                💡 "হ্যাঁ, অনুমোদন করুন" বাটনে ক্লিক করলে শিক্ষার্থীর বকেয়া সমন্বয় হবে এবং সফটওয়্যারে স্বয়ংক্রিয় অফিশিয়াল মানি রসিদ (MR No.) ইস্যু হবে।
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteApproval(approvingRequest)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>হ্যাঁ, অনুমোদন করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON COMMENT MODAL */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">অনলাইন পেমেন্ট রিকোয়েস্ট বাতিল / প্রত্যাখ্যান</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  {rejectingRequest.studentName} ({rejectingRequest.className}, রোল: {rejectingRequest.studentRoll})
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>ফি: <strong>{rejectingRequest.feeTitle}</strong></span>
                  <span>টাকা: <strong className="text-rose-700">{formatTaka(rejectingRequest.amount)}</strong></span>
                  <span>মাধ্যম: <strong>{rejectingRequest.paymentMethod}</strong></span>
                  <span>TrxID: <strong className="font-mono">{rejectingRequest.transactionId}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রত্যাখ্যানের সুনির্দিষ্ট কারণ / কমেন্ট লিখুন *:
                </label>
                <div className="space-y-1.5 mb-2">
                  {[
                    'ট্রানজেকশন আইডি সঠিক নয় / একাউন্টে টাকা জমা হয়নি',
                    'প্রেরক মোবাইল নম্বর বা স্টেটমেন্টের সাথে মেলেনি',
                    'টাকার পরিমাণ কম পাঠানো হয়েছে',
                    'ডুপ্লিকেট ট্রানজেকশন আইডি ব্যবহার করা হয়েছে',
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => setRejectionReasonInput(quickReason)}
                      className="block w-full text-left p-1.5 text-[11px] rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                    >
                      • {quickReason}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="শিক্ষার্থীর ড্যাশবোর্ডে প্রদর্শনের জন্য প্রত্যাখ্যানের কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  এই কারণটি শিক্ষার্থী তার ড্যাশবোর্ডে লাল রঙে দেখতে পাবে যাতে সে সঠিক তথ্য দিয়ে পুনরায় জমা দিতে পারে।
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>প্রত্যাখ্যান নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MFS PAYMENT SETTINGS MODAL (bKash & Nagad Numbers Configuration) */}
      {showMfsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs max-h-[92vh] overflow-y-auto">
            <div className="p-4 bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Smartphone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">বিকাশ ও নগদ পেমেন্ট সেটিংস</h3>
                  <p className="text-[11px] text-pink-100">
                    শিক্ষার্থী পোর্টালে অনলাইন ফি গ্রহণের জন্য স্কুলের বিকাশ ও নগদ নম্বর কনফিগার করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMfsModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                ✕
              </button>
            </div>

            {mfsSavedSuccess && (
              <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-2 font-bold animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>বিকাশ ও নগদ নম্বর সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <form onSubmit={handleSaveMfsSettings} className="p-5 space-y-4">
              {/* bKash Settings Card */}
              <div className="p-4 bg-pink-50/70 border border-pink-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 font-bold text-pink-900">
                  <div className="w-3 h-3 rounded-full bg-pink-600"></div>
                  <span>বিকাশ (bKash) সেটিংস</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">বিকাশ নম্বর *</label>
                    <input
                      type="text"
                      required
                      value={bkashNumberInput}
                      onChange={(e) => setBkashNumberInput(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 border border-pink-300 rounded-xl font-mono text-sm font-bold bg-white focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                    <select
                      value={bkashTypeInput}
                      onChange={(e) => setBkashTypeInput(e.target.value as any)}
                      className="w-full px-3 py-2 border border-pink-300 rounded-xl text-xs font-semibold bg-white"
                    >
                      <option value="Personal">পার্সোনাল (Personal - Send Money)</option>
                      <option value="Merchant">মার্চেন্ট (Merchant - Payment)</option>
                      <option value="Agent">এজেন্ট (Agent - Cash In)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Nagad Settings Card */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 font-bold text-orange-900">
                  <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                  <span>নগদ (Nagad) সেটিংস</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">নগদ নম্বর *</label>
                    <input
                      type="text"
                      required
                      value={nagadNumberInput}
                      onChange={(e) => setNagadNumberInput(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 border border-orange-300 rounded-xl font-mono text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                    <select
                      value={nagadTypeInput}
                      onChange={(e) => setNagadTypeInput(e.target.value as any)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-xl text-xs font-semibold bg-white"
                    >
                      <option value="Personal">পার্সোনাল (Personal - Send Money)</option>
                      <option value="Merchant">মার্চেন্ট (Merchant - Payment)</option>
                      <option value="Agent">এজেন্ট (Agent - Cash In)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  শিক্ষার্থীদের জন্য নির্দেশনাবলী (Instructions for Students)
                </label>
                <textarea
                  rows={2}
                  value={mfsInstructionsInput}
                  onChange={(e) => setMfsInstructionsInput(e.target.value)}
                  placeholder="বিকাশ বা নগদ অ্যাপ থেকে Send Money / Payment করার পর..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                💡 এখানে নম্বর পরিবর্তন করলে সাথে সাথে শিক্ষার্থী পোর্টালে এই নম্বর দৃশ্যমান হবে। শিক্ষার্থীরা টাকা পাঠিয়ে ট্রানজেকশন আইডি দিলে আপনি "অনলাইন পেমেন্ট অনুমোদন" ট্যাবে অনুমোদন করতে পারবেন।
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMfsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>সেটিংস সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
