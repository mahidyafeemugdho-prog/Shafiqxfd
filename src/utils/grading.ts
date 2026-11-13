export interface GradeInfo {
  grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
  gpa: number;
  remarksEn: string;
  remarksBn: string;
}

export function calculateSubjectGrade(marks: number, fullMarks: number = 100): GradeInfo {
  // Normalize to 100 scale
  const percentage = fullMarks > 0 ? (marks / fullMarks) * 100 : marks;
  if (percentage >= 80) {
    return { grade: 'A+', gpa: 5.0, remarksEn: 'Outstanding', remarksBn: 'অসাধারণ' };
  } else if (percentage >= 70) {
    return { grade: 'A', gpa: 4.0, remarksEn: 'Excellent', remarksBn: 'খুব ভালো' };
  } else if (percentage >= 60) {
    return { grade: 'A-', gpa: 3.5, remarksEn: 'Very Good', remarksBn: 'উত্তম' };
  } else if (percentage >= 50) {
    return { grade: 'B', gpa: 3.0, remarksEn: 'Good', remarksBn: 'ভালো' };
  } else if (percentage >= 40) {
    return { grade: 'C', gpa: 2.0, remarksEn: 'Satisfactory', remarksBn: 'সন্তোষজনক' };
  } else if (percentage >= 33) {
    return { grade: 'D', gpa: 1.0, remarksEn: 'Pass', remarksBn: 'উত্তীর্ণ' };
  } else {
    return { grade: 'F', gpa: 0.0, remarksEn: 'Fail', remarksBn: 'অনুত্তীর্ণ' };
  }
}

export function calculateTotalGPA(subjectGPAs: number[], hasAnyFail: boolean): { totalGPA: number; overallGrade: string; status: 'PASSED' | 'FAILED' } {
  if (hasAnyFail || subjectGPAs.length === 0) {
    return { totalGPA: 0.0, overallGrade: 'F', status: 'FAILED' };
  }
  const sum = subjectGPAs.reduce((acc, curr) => acc + curr, 0);
  const avg = Number((sum / subjectGPAs.length).toFixed(2));
  const capped = Math.min(5.0, avg);
  let overallGrade = 'F';
  if (capped >= 5.0) overallGrade = 'A+';
  else if (capped >= 4.0) overallGrade = 'A';
  else if (capped >= 3.5) overallGrade = 'A-';
  else if (capped >= 3.0) overallGrade = 'B';
  else if (capped >= 2.0) overallGrade = 'C';
  else if (capped >= 1.0) overallGrade = 'D';

  return { totalGPA: capped, overallGrade, status: 'PASSED' };
}
