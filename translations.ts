export interface Translations {
  appTitle: string;
  appSubtitle: string;
  bookAppointment: string;
  doctorAdmin: string;
  myBooking: string;
  selectChamber: string;
  selectDate: string;
  patientDetails: string;
  firstVisitFeeLabel: string;
  followUpFeeLabel: string;
  followUpRuleBadge: string;
  autoFeeCalculated: string;
  serialToken: string;
  room: string;
  timeSlot: string;
  hospital: string;
  status: string;
  payment: string;
  paid: string;
  unpaid: string;
  editFee: string;
  editChamber: string;
  doctorQueue: string;
  todayPatients: string;
  totalChambers: string;
  manageChambers: string;
  feeSettings: string;
  phonePlaceholder: string;
  namePlaceholder: string;
  agePlaceholder: string;
  complaintPlaceholder: string;
  confirmBooking: string;
  printSlip: string;
  resetDemo: string;
}

export const translations: Record<'en' | 'bn', Translations> = {
  en: {
    appTitle: 'DocChamber Specialist Portal',
    appSubtitle: 'Multi-Hospital Chamber & Smart Appointment Fee Engine',
    bookAppointment: 'Book Appointment',
    doctorAdmin: 'Doctor & Chamber Management',
    myBooking: 'Check My Serial / History',
    selectChamber: '1. Select Hospital / Chamber',
    selectDate: '2. Select Appointment Date & Slot',
    patientDetails: '3. Patient Information',
    firstVisitFeeLabel: '1st Visit Fee',
    followUpFeeLabel: 'Follow-up Fee (Within 2 Months)',
    followUpRuleBadge: 'Smart Fee Rule: Auto-detected by phone visit history',
    autoFeeCalculated: 'Automated Fee Engine Active',
    serialToken: 'Serial Token #',
    room: 'Room / OPD',
    timeSlot: 'Visiting Time',
    hospital: 'Hospital / Clinic',
    status: 'Visit Status',
    payment: 'Payment Status',
    paid: 'Paid',
    unpaid: 'Unpaid / Due',
    editFee: 'Configure Fee Rules',
    editChamber: 'Manage Chambers',
    doctorQueue: "Today's Live Queue",
    todayPatients: "Today's Patient Serials",
    totalChambers: 'Hospital Chambers',
    manageChambers: 'Manage Hospital Chambers',
    feeSettings: 'Fee & Follow-up Rules',
    phonePlaceholder: 'e.g. 01711000111',
    namePlaceholder: 'Full Name of Patient',
    agePlaceholder: 'Age (Years)',
    complaintPlaceholder: 'Chief complaint or reason for visit (e.g. Chest pain, High BP check)',
    confirmBooking: 'Confirm & Generate Serial Slip',
    printSlip: 'Print / Save Appointment Slip',
    resetDemo: 'Reset Demo Data',
  },
  bn: {
    appTitle: 'ডকচেম্বার স্পেশালিস্ট পোর্টাল',
    appSubtitle: 'বহু-হাসপাতাল চেম্বার ও স্বয়ংক্রিয় ২ মাসের ফলো-আপ ফি সফটওয়্যার',
    bookAppointment: 'সিরিয়াল বুক করুন',
    doctorAdmin: 'ডাক্তার ও চেম্বার ড্যাশবোর্ড',
    myBooking: 'সিরিয়াল বা পূর্বের ইতিহাস দেখুন',
    selectChamber: '১. হাসপাতাল / চেম্বার নির্বাচন করুন',
    selectDate: '২. তারিখ ও সময় নির্বাচন করুন',
    patientDetails: '৩. রোগীর বিবরণ ও ফি',
    firstVisitFeeLabel: '১ম ভিজিট ফি (নতুন রোগী)',
    followUpFeeLabel: '২ মাসের ফলো-আপ ফি (পুরাতন রোগী)',
    followUpRuleBadge: 'স্বয়ংক্রিয় ফি নিয়ম: মোবাইল নম্বর দিয়ে বিগত ভিজিটের ভিত্তিতে স্বয়ংক্রিয় হিসাব',
    autoFeeCalculated: 'অটো ফি ইঞ্জিন সক্রিয়',
    serialToken: 'সিরিয়াল টোকেন নং',
    room: 'রুম নং / ওপিডি',
    timeSlot: 'সাক্ষাতের সময়',
    hospital: 'হাসপাতাল / ডায়াগনস্টিক',
    status: 'অবস্থা',
    payment: 'পেমেন্ট',
    paid: 'পরিশোধিত',
    unpaid: 'বকেয়া',
    editFee: 'ফি ও নিয়ম পরিবর্তন',
    editChamber: 'চেম্বার ম্যানেজ করুন',
    doctorQueue: 'আজকের লাইভ রোগী সিরিয়াল',
    todayPatients: 'আজকের রোগী সংখ্যা',
    totalChambers: 'মোট চেম্বার',
    manageChambers: 'হাসপাতাল চেম্বারসমূহ',
    feeSettings: 'ভিজিট ফি ও ফলো-আপ নিয়ম',
    phonePlaceholder: 'যেমনঃ 01711000111',
    namePlaceholder: 'রোগীর পূর্ণ নাম',
    agePlaceholder: 'বয়স',
    complaintPlaceholder: 'প্রধান সমস্যা বা শারীরিক অসুবিধা (যেমনঃ বুকে ব্যথা, প্রেশার চেক)',
    confirmBooking: 'নিশ্চিত করুন ও সিরিয়াল স্লিপ নিন',
    printSlip: 'সিরিয়াল স্লিপ প্রিন্ট করুন',
    resetDemo: 'ডেমো রিসেট',
  },
};
