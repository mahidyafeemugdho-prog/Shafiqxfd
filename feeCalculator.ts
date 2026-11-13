import { Appointment, Chamber, FeeCalculationResult, FeeConfig, Patient, VisitType } from '../types';

/**
 * Calculates the appropriate fee and visit type automatically based on patient history.
 * Core business rule requested:
 * - 1st visit fee
 * - Follow-up fee within 2 months (60 days)
 * - Automatically checks previous visit date, applies appropriate fee, and provides human-readable explanation.
 * - Allows doctor or chamber-specific overrides.
 */
export function calculateAutoFee(
  phone: string,
  targetDateStr: string,
  patients: Patient[],
  appointments: Appointment[],
  feeConfig: FeeConfig,
  chamber?: Chamber
): FeeCalculationResult {
  const cleanPhone = phone.replace(/[\s\-\+]/g, '').trim();

  // Determine base fees (chamber specific override or global config)
  const firstVisitFee = chamber?.chamberSpecificFeeOverride?.firstVisitFee ?? feeConfig.firstVisitFee;
  const followUpFee = chamber?.chamberSpecificFeeOverride?.followUpFee ?? feeConfig.followUpFee;
  const windowDays = feeConfig.followUpWindowDays; // default 60 days (2 months)

  if (!cleanPhone || cleanPhone.length < 5) {
    return {
      visitType: 'FIRST_VISIT',
      fee: firstVisitFee,
      daysSinceLastVisit: null,
      lastVisitDate: null,
      isFollowUpEligible: false,
      remainingFollowUpDays: null,
      explanation: 'Enter patient phone number to auto-calculate fee based on visit history.',
      explanationBn: 'রোগীর মোবাইল নম্বর দিন, পূর্ববর্তী ভিজিটের ইতিহাস অনুযায়ী স্বয়ংক্রিয়ভাবে ফি হিসাব করা হবে।',
    };
  }

  // Find patient record
  const patient = patients.find((p) => p.phone.replace(/[\s\-\+]/g, '') === cleanPhone);

  // Also check prior appointments for this phone
  const priorAppointments = appointments
    .filter((a) => {
      const aPhone = a.patientPhone.replace(/[\s\-\+]/g, '');
      return aPhone === cleanPhone && a.date <= targetDateStr;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Find the most recent visit date
  let mostRecentDateStr: string | null = null;

  if (priorAppointments.length > 0) {
    mostRecentDateStr = priorAppointments[0].date;
  } else if (patient?.lastVisitDate) {
    mostRecentDateStr = patient.lastVisitDate;
  }

  // Case 1: Brand new patient
  if (!mostRecentDateStr) {
    return {
      visitType: 'FIRST_VISIT',
      fee: firstVisitFee,
      daysSinceLastVisit: null,
      lastVisitDate: null,
      isFollowUpEligible: false,
      remainingFollowUpDays: null,
      explanation: `New Patient: No prior visit found. Standard 1st visit fee (${feeConfig.currencySymbol}${firstVisitFee}) auto-applied.`,
      explanationBn: `নতুন রোগী: পূর্বে কোনো ভিজিটের তথ্য পাওয়া যায়নি। নির্ধারিত ১ম সাক্ষাতের ফি (${feeConfig.currencySymbol}${firstVisitFee}) স্বয়ংক্রিয়ভাবে প্রযোজ্য।`,
    };
  }

  // Calculate days difference
  const targetDate = new Date(targetDateStr);
  const lastDate = new Date(mostRecentDateStr);
  const diffTime = targetDate.getTime() - lastDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Case 2: Within 2 months (windowDays) -> Follow-up Fee
  if (diffDays <= windowDays) {
    const remainingDays = windowDays - diffDays;
    return {
      visitType: 'FOLLOW_UP_2M',
      fee: followUpFee,
      daysSinceLastVisit: diffDays,
      lastVisitDate: mostRecentDateStr,
      isFollowUpEligible: true,
      remainingFollowUpDays: remainingDays,
      explanation: `Follow-up Eligible (2 Months Rule): Last visit was ${diffDays === 0 ? 'today' : `${diffDays} days ago`} (Valid for ${remainingDays} more days). Follow-up fee (${feeConfig.currencySymbol}${followUpFee}) auto-applied!`,
      explanationBn: `২ মাসের ফলো-আপ প্রযোজ্য: পূর্ববর্তী ভিজিট ছিল ${diffDays === 0 ? 'আজ' : `${diffDays} দিন আগে`} (আরও ${remainingDays} দিন মেয়াদ বাকি)। ফলো-আপ ফি (${feeConfig.currencySymbol}${followUpFee}) স্বয়ংক্রিয়ভাবে কার্যকর হয়েছে!`,
    };
  }

  // Case 3: More than 2 months -> Reverts to 1st Visit Fee
  const expiredDays = diffDays - windowDays;
  return {
    visitType: 'FIRST_VISIT',
    fee: firstVisitFee,
    daysSinceLastVisit: diffDays,
    lastVisitDate: mostRecentDateStr,
    isFollowUpEligible: false,
    remainingFollowUpDays: 0,
    explanation: `2-Month Follow-up Expired: Last visit was ${diffDays} days ago (${expiredDays} days past the ${windowDays}-day limit). Automatically classified as 1st Visit fee (${feeConfig.currencySymbol}${firstVisitFee}).`,
    explanationBn: `২ মাসের ফলো-আপ মেয়াদ উত্তীর্ণ: বিগত ভিজিট ছিল ${diffDays} দিন পূর্বে (মেয়াদ ৬০ দিনের চেয়ে ${expiredDays} দিন বেশি)। স্বয়ংক্রিয়ভাবে নতুন ভিজিট ফি (${feeConfig.currencySymbol}${firstVisitFee}) প্রযোজ্য হয়েছে।`,
  };
}

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDatePretty(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
