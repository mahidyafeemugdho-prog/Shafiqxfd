export type Language = 'en' | 'bn';

const BN_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => BN_NUMERALS[parseInt(digit, 10)]);
}

export function formatTaka(amount: number, lang: Language = 'en'): string {
  const formatted = amount.toLocaleString('en-IN');
  if (lang === 'bn') {
    return `৳ ${toBnNumber(formatted)}`;
  }
  return `৳ ${formatted}`;
}

export function formatDate(dateStr: string, lang: Language = 'en'): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // YYYY-MM-DD to DD/MM/YYYY
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      return lang === 'bn' ? toBnNumber(formatted) : formatted;
    }
    return lang === 'bn' ? toBnNumber(dateStr) : dateStr;
  } catch {
    return dateStr;
  }
}

export function amountInWords(amount: number, lang: Language = 'en'): string {
  const n = Math.floor(Math.max(0, amount));
  if (n === 0) return lang === 'bn' ? 'শূন্য টাকা মাত্র' : 'Zero Taka Only';

  if (lang === 'bn') {
    const onesBn = [
      '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
      'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
      'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'ঊনত্রিশ', 'ত্রিশ',
      'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
      'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
      'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
      'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
      'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আঠাত্তর', 'ঊনআশি', 'আশি',
      'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
      'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'
    ];

    const convertLessThanThousand = (num: number): string => {
      let res = '';
      if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        res += (hundreds === 1 ? 'এক শত ' : onesBn[hundreds] + ' শত ');
        num %= 100;
      }
      if (num > 0) {
        res += onesBn[num] + ' ';
      }
      return res.trim();
    };

    let rem = n;
    let parts: string[] = [];

    const crore = Math.floor(rem / 10000000);
    if (crore > 0) {
      parts.push(`${convertLessThanThousand(crore)} কোটি`);
      rem %= 10000000;
    }
    const lakh = Math.floor(rem / 100000);
    if (lakh > 0) {
      parts.push(`${convertLessThanThousand(lakh)} লক্ষ`);
      rem %= 100000;
    }
    const thousand = Math.floor(rem / 1000);
    if (thousand > 0) {
      parts.push(`${convertLessThanThousand(thousand)} হাজার`);
      rem %= 1000;
    }
    if (rem > 0) {
      parts.push(convertLessThanThousand(rem));
    }

    return `${parts.join(' ')} টাকা মাত্র`.trim();
  } else {
    // English words
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertEn = (num: number): string => {
      if (num === 0) return '';
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convertEn(num % 100) : '');
    };

    let rem = n;
    let parts: string[] = [];

    const crore = Math.floor(rem / 10000000);
    if (crore > 0) {
      parts.push(`${convertEn(crore)} Crore`);
      rem %= 10000000;
    }
    const lakh = Math.floor(rem / 100000);
    if (lakh > 0) {
      parts.push(`${convertEn(lakh)} Lakh`);
      rem %= 100000;
    }
    const thousand = Math.floor(rem / 1000);
    if (thousand > 0) {
      parts.push(`${convertEn(thousand)} Thousand`);
      rem %= 1000;
    }
    if (rem > 0) {
      parts.push(convertEn(rem));
    }

    return `${parts.join(' ')} Taka Only`;
  }
}

export function formatGroupName(group?: string, lang: Language = 'en'): string {
  if (!group || group === 'General') {
    return lang === 'bn' ? 'সাধারণ (General)' : 'General';
  }
  if (group === 'Science') {
    return lang === 'bn' ? 'বিজ্ঞান বিভাগ (Science)' : 'Science';
  }
  if (group === 'Commerce') {
    return lang === 'bn' ? 'ব্যবসায় শিক্ষা (Business Studies)' : 'Business Studies';
  }
  if (group === 'Humanities' || group === 'Arts') {
    return lang === 'bn' ? 'মানবিক বিভাগ (Humanities)' : 'Humanities';
  }
  if (group === 'Vocational') {
    return lang === 'bn' ? 'ভোকেশনাল শাখা (Vocational)' : 'Vocational';
  }
  return group;
}

export const translations = {
  en: {
    // Brand
    schoolErp: 'AmarSchool ERP',
    tagline: 'Professional School Management System',
    bengali: 'বাংলা',
    english: 'English',
    switchRole: 'Switch Role',
    currentRole: 'Active Role',
    session: 'Session',
    online: 'Online',
    offline: 'Local Mode',
    synced: 'Synced with Firestore',
    syncing: 'Syncing...',

    // Roles
    master_admin: 'Master Admin',
    super_admin: 'Super Admin',
    admin: 'Head Teacher / Admin',
    teacher: 'Teacher',
    accountant: 'Accountant',
    student: 'Student',
    guardian: 'Parent / Guardian',
    librarian: 'Librarian',
    receptionist: 'Admission Officer',

    // Nav
    masterPortal: 'Master Admin Portal',
    dashboard: 'Dashboard',
    students: 'Students',
    studentList: 'Student Directory',
    admissions: 'Admissions & Enquiries',
    idCards: 'ID Cards',
    bulkImport: 'Bulk Import',
    teachersAndStaff: 'Teachers & Staff',
    attendance: 'Attendance',
    qrAttendance: 'QR Attendance',
    studentAttendance: 'Student Attendance',
    staffAttendance: 'Staff Attendance',
    attendanceSummary: 'Attendance Summary',
    academic: 'Academic Setup',
    classesAndSections: 'Classes & Sections',
    subjects: 'Subjects',
    routine: 'Class Routine',
    examinations: 'Examinations & Results',
    examList: 'Exam List',
    marksEntry: 'Marks Entry',
    reportCards: 'Report Cards / Marksheets',
    tabulationSheet: 'Tabulation Sheet',
    feesAndAccounts: 'Fees & Accounts',
    feeCollection: 'Fee Collection',
    invoices: 'Fee Invoices',
    expenses: 'Expenses & Vouchers',
    cashbook: 'Cashbook & Reports',
    homework: 'Homework',
    library: 'Library',
    transport: 'Transport',
    inventory: 'Inventory & Assets',
    certificates: 'Certificates & Documents',
    notices: 'Notice Board',
    schoolBlog: 'School Blog & Articles',
    websitePreview: 'Hero Website & Blog',
    reports: 'Reports & Exports',
    analytics: 'AI Student Analytics',
    settings: 'School Settings',

    // Common Actions
    add: 'Add New',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search...',
    filter: 'Filter',
    exportCsv: 'Export CSV',
    print: 'Print',
    view: 'View',
    status: 'Status',
    actions: 'Actions',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    details: 'Details',
    all: 'All',
    submit: 'Submit',
    selectClass: 'Select Class',
    selectSection: 'Select Section',
    selectShift: 'Select Shift',
    selectExam: 'Select Exam',
    selectSubject: 'Select Subject',
    date: 'Date',

    // Academic & Grading
    nursery: 'Nursery',
    kg: 'KG',
    class1: 'Class 1',
    class2: 'Class 2',
    class3: 'Class 3',
    class4: 'Class 4',
    class5: 'Class 5',
    class6: 'Class 6',
    class7: 'Class 7',
    class8: 'Class 8',
    class9: 'Class 9',
    class10: 'Class 10',
    morning: 'Morning',
    day: 'Day',
    general: 'General',
    science: 'Science',
    commerce: 'Business Studies',
    arts: 'Humanities',

    // Metrics
    totalStudents: 'Total Students',
    totalStaff: 'Total Teachers & Staff',
    todaysAttendance: "Today's Attendance",
    todaysCollection: "Today's Collection",
    totalDues: 'Outstanding Dues',
    passRate: 'Average Pass Rate',

    // Attendance
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    markAllPresent: 'Mark All Present',
    sendSmsAlerts: 'Send Absentee SMS',

    // Fees
    receiptNo: 'Receipt No',
    amount: 'Amount',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    collectFee: 'Collect Fee',
    paymentMethod: 'Payment Method',
  },
  bn: {
    // Brand
    schoolErp: 'আমারস্কুল ইআরপি',
    tagline: 'ডিজিটাল স্কুল ম্যানেজমেন্ট সিস্টেম',
    bengali: 'বাংলা',
    english: 'English',
    switchRole: 'রোল পরিবর্তন করুন',
    currentRole: 'বর্তমান রোল',
    session: 'শিক্ষাবর্ষ',
    online: 'অনলাইন',
    offline: 'লোকাল ডেটাবেজ',
    synced: 'ফায়ারস্টোরে সংরক্ষিত',
    syncing: 'সিঙ্ক হচ্ছে...',

    // Roles
    master_admin: 'মাস্টার অ্যাডমিন',
    super_admin: 'সুপার অ্যাডমিন',
    admin: 'প্রধান শিক্ষক / অ্যাডমিন',
    teacher: 'সহকারী শিক্ষক',
    accountant: 'হিসাবরক্ষক (Accountant)',
    student: 'শিক্ষার্থী (Student)',
    guardian: 'অভিভাবক (Guardian)',
    librarian: 'গ্রন্থাগারিক (Librarian)',
    receptionist: 'ভর্তি কর্মকর্তা',

    // Nav
    masterPortal: 'মাস্টার অ্যাডমিন পোর্টাল',
    dashboard: 'ড্যাশবোর্ড',
    students: 'শিক্ষার্থী তথ্য',
    studentList: 'শিক্ষার্থী তালিকা',
    admissions: 'ভর্তি ও আবেদন',
    idCards: 'আইডি কার্ড',
    bulkImport: 'বাল্ক ইমপোর্ট',
    teachersAndStaff: 'শিক্ষক ও কর্মচারী',
    attendance: 'হাজিরা খাতা',
    qrAttendance: 'কিউআর হাজিরা (QR Attendance)',
    studentAttendance: 'শিক্ষার্থী হাজিরা',
    staffAttendance: 'শিক্ষক হাজিরা',
    attendanceSummary: 'হাজিরা রিপোর্ট',
    academic: 'একাডেমিক কাঠামো',
    classesAndSections: 'শ্রেণি ও শাখা',
    subjects: 'বিষয়সমূহ',
    routine: 'ক্লাস রুটিন',
    examinations: 'পরীক্ষা ও ফলাফল',
    examList: 'পরীক্ষার তালিকা',
    marksEntry: 'নম্বর এন্ট্রি',
    reportCards: 'নম্বরপত্র / মার্কশিট',
    tabulationSheet: 'ট্যাবুলেশন শিট',
    feesAndAccounts: 'ফি ও হিসাবরক্ষণ',
    feeCollection: 'ফি আদায়',
    invoices: 'ইনভয়েস তালিকা',
    expenses: 'ব্যয় ও ভাউচার',
    cashbook: 'ক্যাশ বুক ও হিসাব',
    homework: 'বাড়ির কাজ (Homework)',
    library: 'লাইব্রেরি',
    transport: 'পরিবহন ও বাস',
    inventory: 'সম্পদ ও স্টক',
    certificates: 'সনদপত্র ও প্রত্যায়ন',
    notices: 'নোটিশ বোর্ড',
    schoolBlog: 'স্কুল ব্লগ ও আর্টিকেলের পাতা',
    websitePreview: 'ওয়েবসাইট ও হিরো সেকশন',
    reports: 'রিপোর্ট ও এক্সপোর্ট',
    analytics: 'এআই পারফরম্যান্স বিশ্লেষণ',
    settings: 'বিদ্যালয় সেটিংস',

    // Common Actions
    add: 'নতুন যোগ করুন',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    search: 'খুঁজুন...',
    filter: 'ফিল্টার',
    exportCsv: 'এক্সপোর্ট / CSV ডাউনলোড',
    print: 'প্রিন্ট করুন',
    view: 'দেখুন',
    status: 'অবস্থা',
    actions: 'অ্যাকশন',
    confirm: 'নিশ্চিত করুন',
    yes: 'হ্যাঁ',
    no: 'না',
    details: 'বিস্তারিত',
    all: 'সকল',
    submit: 'সাবমিট করুন',
    selectClass: 'শ্রেণি নির্বাচন করুন',
    selectSection: 'শাখা নির্বাচন করুন',
    selectShift: 'শিফট নির্বাচন করুন',
    selectExam: 'পরীক্ষা নির্বাচন করুন',
    selectSubject: 'বিষয় নির্বাচন করুন',
    date: 'তারিখ',

    // Academic & Grading
    nursery: 'প্লে / নার্সারি',
    kg: 'কেজি (KG)',
    class1: '১ম শ্রেণি',
    class2: '২য় শ্রেণি',
    class3: '৩য় শ্রেণি',
    class4: '৪র্থ শ্রেণি',
    class5: '৫ম শ্রেণি',
    class6: '৬ষ্ঠ শ্রেণি',
    class7: '৭ম শ্রেণি',
    class8: '৮ম শ্রেণি',
    class9: '৯ম শ্রেণি',
    class10: '১০ম শ্রেণি',
    morning: 'প্রভাতি শিফট',
    day: 'দিবা শিফট',
    general: 'সাধারণ',
    science: 'বিজ্ঞান বিভাগ',
    commerce: 'ব্যবসায় শিক্ষা',
    arts: 'মানবিক বিভাগ',

    // Metrics
    totalStudents: 'মোট শিক্ষার্থী',
    totalStaff: 'মোট শিক্ষক ও স্টাফ',
    todaysAttendance: 'আজকের উপস্থিতির হার',
    todaysCollection: 'আজকের ফি আদায়',
    totalDues: 'বকেয়া ফি',
    passRate: 'গড় পাসের হার',

    // Attendance
    present: 'উপস্থিত',
    absent: 'অনুপস্থিত',
    late: 'দেরি',
    excused: 'ছুটি',
    markAllPresent: 'সবাইকে উপস্থিত করুন',
    sendSmsAlerts: 'অনুপস্থিতদের SMS পাঠান',

    // Fees
    receiptNo: 'রসিদ নং',
    amount: 'পরিমাণ',
    paid: 'পরিশোধিত',
    unpaid: 'বকেয়া',
    partial: 'আংশিক',
    collectFee: 'ফি গ্রহণ করুন',
    paymentMethod: 'পেমেন্ট মেথড',
  },
};
