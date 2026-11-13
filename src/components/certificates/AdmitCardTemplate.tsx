import React from 'react';
import { SchoolProfile, Student, Exam, ExamScheduleItem } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import { formatGroupName } from '../../utils/i18n';

export type AdmitCardFormat = 'a4_full' | 'half_a4' | 'two_per_page';
export type InstructionMode = 'full' | 'compact' | 'minimal' | 'none';
export type TableDensity = 'auto' | 'standard' | 'compact';

interface AdmitCardTemplateProps {
  school: SchoolProfile;
  student: Student;
  exam: Exam;
  routines: ExamScheduleItem[];
  issueDate?: string;
  format?: AdmitCardFormat;
  instructionMode?: InstructionMode;
  density?: TableDensity;
  copyLabel?: string; // e.g. "STUDENT COPY" or "OFFICE COPY"
  language?: 'bn' | 'en';
}

export const SingleAdmitCard: React.FC<AdmitCardTemplateProps> = ({
  school,
  student,
  exam,
  routines,
  issueDate = '2026-06-10',
  format = 'a4_full',
  instructionMode = 'auto' as any,
  density = 'auto',
  copyLabel,
  language = 'bn',
}) => {
  const subjectCount = routines.length;
  const isHighSubjectCount = subjectCount >= 8;
  const isUltraHigh = subjectCount >= 11;
  const isHalfA4 = format === 'half_a4' || format === 'two_per_page';

  // Determine effective density
  const effectiveDensity: 'standard' | 'compact' =
    density === 'compact' || isHalfA4 || (density === 'auto' && isHighSubjectCount)
      ? 'compact'
      : 'standard';

  // Determine effective instruction mode
  let effectiveInstructions: InstructionMode = instructionMode;
  if (instructionMode === ('auto' as any) || !instructionMode) {
    if (isHalfA4 && subjectCount > 6) {
      effectiveInstructions = 'minimal';
    } else if (isHalfA4) {
      effectiveInstructions = 'compact';
    } else if (isUltraHigh) {
      effectiveInstructions = 'minimal';
    } else if (isHighSubjectCount) {
      effectiveInstructions = 'compact';
    } else {
      effectiveInstructions = 'full';
    }
  }

  return (
    <div
      className={`bg-white text-slate-900 border border-slate-900 print:border-black print:shadow-none flex flex-col justify-between ${
        isHalfA4
          ? 'p-3 sm:p-4 rounded-xl max-h-[138mm] overflow-hidden'
          : 'p-4 sm:p-6 md:p-8 rounded-2xl max-h-[280mm]'
      }`}
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* 1. HEADER */}
      <div className={`text-center relative ${isHalfA4 ? 'pb-1 border-b' : 'pb-2.5 border-b-2'} border-slate-900`}>
        {/* Copy Label Badge (if student or office copy) */}
        {copyLabel && (
          <div className="absolute right-0 top-0 px-2 py-0.5 bg-slate-100 border border-slate-400 rounded text-[9px] font-black uppercase tracking-wider text-slate-800 print:border-black">
            {copyLabel}
          </div>
        )}

        <div className="flex items-center justify-center space-x-2.5">
          <img
            src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
            alt="School Logo"
            className={`${isHalfA4 ? 'w-9 h-9' : isHighSubjectCount ? 'w-11 h-11' : 'w-14 h-14'} object-contain shrink-0`}
          />
          <div className="text-left leading-tight">
            <h1
              className={`font-black text-slate-950 tracking-tight ${
                isHalfA4 ? 'text-sm' : isHighSubjectCount ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
              }`}
            >
              {school.nameBn}
            </h1>
            <h2
              className={`font-bold text-slate-700 uppercase tracking-wider ${
                isHalfA4 ? 'text-[9px]' : 'text-[11px]'
              }`}
            >
              {school.nameEn}
            </h2>
          </div>
        </div>

        <p className={`text-slate-600 ${isHalfA4 ? 'text-[8px] mt-0.5' : 'text-[10px] mt-0.5'}`}>
          EIIN: {school.eiin} • {school.addressBn} • Tel: {school.phone}
        </p>

        <div
          className={`inline-flex items-center space-x-1.5 bg-slate-900 text-white font-extrabold uppercase tracking-wider rounded print:bg-black ${
            isHalfA4 ? 'mt-1 px-2.5 py-0.5 text-[9px]' : 'mt-1.5 px-3 py-1 text-[11px]'
          }`}
        >
          <span>EXAMINATION ADMIT CARD • {exam.nameEn}</span>
          <span className="text-amber-300">({exam.nameBn})</span>
        </div>
      </div>

      {/* 2. STUDENT CREDENTIALS & PHOTO BLOCK */}
      <div
        className={`bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between gap-3 print:bg-transparent print:border-slate-400 ${
          isHalfA4 ? 'my-1.5 p-2' : isHighSubjectCount ? 'my-2 p-2.5' : 'my-3 p-3.5'
        }`}
      >
        <div
          className={`grid grid-cols-3 gap-x-3 gap-y-1 flex-1 w-full ${
            isHalfA4 ? 'text-[10px]' : isHighSubjectCount ? 'text-[11px]' : 'text-xs'
          }`}
        >
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Student Name:</span>
            <strong className="text-slate-950 font-bold block truncate">{student.nameEn}</strong>
            <span className="text-slate-600 text-[10px] block truncate">{student.nameBn}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Student ID (আইডি):</span>
            <strong className="text-blue-900 font-mono font-black block print:text-black">
              {student.studentId || student.admissionNo}
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Class & Sec:</span>
            <strong className="text-slate-900 block font-bold">
              {student.className} • Sec: {student.section}
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Roll (রোল):</span>
            <span className="inline-block px-2 py-0.2 bg-slate-900 text-white font-black rounded font-mono text-xs print:bg-black">
              {student.roll}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Group / Dept:</span>
            {['Class 9', 'Class 10'].includes(student.className) ? (
              <span className="inline-block px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase border border-amber-500 print:border-black print:bg-transparent">
                {formatGroupName(student.group || 'Science', language)}
              </span>
            ) : (
              <strong className="text-slate-800 block font-semibold">General</strong>
            )}
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold">Session & Blood:</span>
            <span className="text-slate-800 font-semibold">
              {student.session || school.currentSession || '2026'} • <strong className="text-rose-700 print:text-black">{student.bloodGroup || 'N/A'}</strong>
            </span>
          </div>
        </div>

        {/* Candidate Photo */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className={`border border-slate-800 bg-white rounded p-0.5 shadow-2xs overflow-hidden flex items-center justify-center print:border-black print:shadow-none ${
              isHalfA4 ? 'w-16 h-18' : isHighSubjectCount ? 'w-18 h-22' : 'w-22 h-26'
            }`}
          >
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.nameEn} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <span className="font-extrabold text-base text-slate-600">{student.nameEn.charAt(0)}</span>
                <span className="text-[8px] font-semibold text-slate-400">Photo</span>
              </div>
            )}
          </div>
          <span className="text-[8px] font-bold text-slate-600 mt-0.5 uppercase tracking-wider">
            Photo
          </span>
        </div>
      </div>

      {/* 3. EXAM ROUTINE SCHEDULE TABLE */}
      <div className={isHalfA4 ? 'my-1' : isHighSubjectCount ? 'my-1.5' : 'my-2'}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-extrabold text-slate-900 uppercase tracking-wider ${isHalfA4 ? 'text-[10px]' : 'text-xs'}`}>
            Routine for {student.className} {['Class 9', 'Class 10'].includes(student.className) ? `(${student.group || 'Science'})` : ''} (পরীক্ষার সময়সূচি)
          </h3>
          <span className="text-[9px] font-semibold text-slate-500">
            {routines.length} Subject(s) Scheduled
          </span>
        </div>

        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-400 uppercase text-[9px] print:bg-slate-100">
              <th className="py-1 px-1.5 border-r border-slate-400 text-center w-6">Sl</th>
              <th className="py-1 px-1.5 border-r border-slate-400 text-center w-12">Code</th>
              <th className="py-1 px-2 border-r border-slate-400">Subject Name (বিষয়)</th>
              <th className="py-1 px-2 border-r border-slate-400 text-center w-28">Exam Date & Day</th>
              <th className="py-1 px-2 border-r border-slate-400 text-center w-24">Time</th>
              <th className="py-1 px-1.5 border-r border-slate-400 text-center w-16">Room</th>
              <th className="py-1 px-1.5 text-center w-20">Invigilator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {routines.length > 0 ? (
              routines.map((routine, idx) => (
                <tr
                  key={routine.id || idx}
                  className={`border-b border-slate-300 ${
                    effectiveDensity === 'compact' ? 'text-[10px] leading-tight' : 'text-xs leading-normal'
                  }`}
                >
                  <td className={`border-r border-slate-400 text-center font-bold text-slate-500 ${effectiveDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-1.5'}`}>
                    {idx + 1}
                  </td>
                  <td className={`border-r border-slate-400 text-center font-mono font-bold text-blue-900 print:text-black ${effectiveDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-1.5'}`}>
                    {routine.subjectCode}
                  </td>
                  <td className={`border-r border-slate-400 font-medium ${effectiveDensity === 'compact' ? 'py-0.5 px-1.5' : 'py-1 px-2'}`}>
                    <span className="font-bold text-slate-900">{routine.subjectNameEn}</span>
                    {routine.subjectNameBn && (
                      <span className="text-slate-600 text-[10px] ml-1">({routine.subjectNameBn})</span>
                    )}
                  </td>
                  <td className={`border-r border-slate-400 text-center ${effectiveDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-2'}`}>
                    <strong className="text-slate-950 font-bold">{routine.examDate}</strong>
                    <span className="text-[9px] text-slate-500 ml-1">({routine.dayOfWeek?.slice(0, 3)})</span>
                  </td>
                  <td className={`border-r border-slate-400 text-center font-medium ${effectiveDensity === 'compact' ? 'py-0.5 px-1 text-[9px]' : 'py-1 px-2 text-[10px]'}`}>
                    {routine.startTime} - {routine.endTime}
                  </td>
                  <td className={`border-r border-slate-400 text-center text-slate-700 font-semibold ${effectiveDensity === 'compact' ? 'py-0.5 px-1 text-[9px]' : 'py-1 px-1.5 text-[10px]'}`}>
                    {routine.roomNo || 'Hall'}
                  </td>
                  <td className={`text-center text-slate-300 font-mono ${effectiveDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-1.5'}`}>
                    _______
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-3 text-center text-slate-500 italic bg-amber-50/50">
                  {language === 'bn'
                    ? `এই শ্রেণির (${student.className}) কোনো পরীক্ষার রুটিন নির্ধারিত হয়নি।`
                    : `No exam routine configured yet for ${student.className}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. EXAM HALL INSTRUCTIONS */}
      {effectiveInstructions !== 'none' && (
        <div
          className={`bg-slate-50 border border-slate-300 rounded text-slate-700 print:bg-transparent print:border-slate-400 ${
            isHalfA4 ? 'p-1.5 my-1 text-[9px]' : isHighSubjectCount ? 'p-1.5 my-1 text-[9px]' : 'p-2.5 my-2 text-[10px]'
          }`}
        >
          {effectiveInstructions === 'minimal' ? (
            <p className="text-[8.5px] leading-tight text-slate-800">
              <strong>জরুরি নির্দেশনাবলী:</strong> ১. পরীক্ষা শুরুর ৩০ মিনিট পূর্বে আসন গ্রহণ বাধ্যতামূলক • ২. প্রবেশপত্র (Admit Card) ব্যতিরেকে পরীক্ষায় অংশগ্রহণ নিষিদ্ধ • ৩. মোবাইল ফোন ও অপ্রয়োজনীয় কাগজ সম্পূর্ণ নিষিদ্ধ।
            </p>
          ) : effectiveInstructions === 'compact' ? (
            <div>
              <strong className="block text-slate-900 uppercase font-bold text-[9px] mb-0.5">
                পরীক্ষার্থীদের জন্য বিশেষ নির্দেশনাবলী (Instructions):
              </strong>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] leading-tight">
                <p>১. পরীক্ষা শুরুর ৩০ মিনিট পূর্বে আসন গ্রহণ করতে হবে।</p>
                <p>২. প্রবেশপত্র (Admit Card) ব্যতিরেকে কক্ষে প্রবেশ নিষিদ্ধ।</p>
                <p>৩. মোবাইল ফোন, ক্যালকুলেটর বা অপ্রয়োজনীয় কাগজ নিষিদ্ধ।</p>
                <p>৪. উত্তরপত্রের কভার পৃষ্ঠায় রোল ও বিষয় কোড বৃত্ত ভরাট করুন।</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5 leading-normal">
              <strong className="block text-slate-900 uppercase font-bold text-[10px] mb-0.5">
                পরীক্ষার্থীদের জন্য বিশেষ নির্দেশনাবলী (Exam Hall Instructions):
              </strong>
              <p>১. পরীক্ষা শুরুর ৩০ মিনিট পূর্বে পরীক্ষার্থীদের অবশ্যই পরীক্ষা কক্ষে আসন গ্রহণ করতে হবে।</p>
              <p>২. প্রবেশপত্র (Admit Card) ব্যতিরেকে কাউকে পরীক্ষা কক্ষে প্রবেশ করতে দেওয়া হবে না।</p>
              <p>৩. পরীক্ষা কক্ষে মোবাইল ফোন, ক্যালকুলেটর (অননুমোদিত) বা যেকোনো অপ্রয়োজনীয় কাগজ আনা সম্পূর্ণ নিষিদ্ধ।</p>
              <p>৪. উত্তরপত্রের কভার পৃষ্ঠায় রোল, রেজিস্ট্রেশন ও বিষয় কোড সঠিকভাবে লিখতে ও বৃত্ত ভরাট করতে হবে।</p>
            </div>
          )}
        </div>
      )}

      {/* 5. SIGNATURES & VERIFICATION */}
      <div
        className={`border-t border-slate-400 flex items-end justify-between ${
          isHalfA4 ? 'mt-1.5 pt-1.5 text-[9px]' : isHighSubjectCount ? 'mt-2 pt-2 text-[10px]' : 'mt-4 pt-3 text-xs'
        }`}
      >
        <div className="text-center w-36">
          <div className="border-t border-slate-800 pt-0.5 font-bold text-slate-800">
            Candidate's Signature
            <span className="block text-[8px] text-slate-500 font-normal">(পরীক্ষার্থীর স্বাক্ষর)</span>
          </div>
        </div>

        <div className="text-center">
          <div className="h-6 bg-slate-900 text-white font-mono text-[9px] px-3 flex items-center justify-center tracking-widest rounded print:bg-black">
            *{student.studentId || student.admissionNo}*
          </div>
          <span className="text-[8px] text-slate-500 block mt-0.2 font-mono">
            VERIFIED • {school.eiin} • {issueDate}
          </span>
        </div>

        <div className="text-center w-44">
          <div className="border-t border-slate-800 pt-0.5 font-bold text-slate-900">
            Controller / Principal
            <span className="block text-[8px] text-slate-500 font-normal">(পরীক্ষা নিয়ন্ত্রক / অধ্যক্ষ)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdmitCardTemplate: React.FC<{
  school: SchoolProfile;
  student: Student;
  exam: Exam;
  routines: ExamScheduleItem[];
  issueDate?: string;
  format: AdmitCardFormat;
  instructionMode?: InstructionMode;
  density?: TableDensity;
  twoPerPageMode?: 'duplicate' | 'two_students';
  pairedStudent?: Student;
  pairedRoutines?: ExamScheduleItem[];
  language?: 'bn' | 'en';
}> = ({
  school,
  student,
  exam,
  routines,
  issueDate = '2026-06-10',
  format,
  instructionMode = 'auto' as any,
  density = 'auto',
  twoPerPageMode = 'duplicate',
  pairedStudent,
  pairedRoutines,
  language = 'bn',
}) => {
  // Case 1: Standard A4 Full Page
  if (format === 'a4_full') {
    return (
      <div className="w-full max-w-3xl mx-auto print:max-w-none print:w-full print:m-0">
        <SingleAdmitCard
          school={school}
          student={student}
          exam={exam}
          routines={routines}
          issueDate={issueDate}
          format="a4_full"
          instructionMode={instructionMode}
          density={density}
          language={language}
        />
      </div>
    );
  }

  // Case 2: Half A4 Single Card
  if (format === 'half_a4') {
    return (
      <div className="w-full max-w-3xl mx-auto print:max-w-none print:w-full print:m-0">
        <SingleAdmitCard
          school={school}
          student={student}
          exam={exam}
          routines={routines}
          issueDate={issueDate}
          format="half_a4"
          instructionMode={instructionMode}
          density={density}
          copyLabel={language === 'bn' ? 'প্রবেশপত্র' : 'ADMIT CARD'}
          language={language}
        />
        {/* Scissor Cutting Guide */}
        <div className="my-3 text-center text-slate-400 font-mono text-[10px] flex items-center justify-center space-x-2 print:my-2">
          <span>✂ - - - - - - - - - - - - - - - - - - - -</span>
          <span className="font-bold text-slate-500 uppercase">{language === 'bn' ? 'কাটার দাগ / Cut Here' : 'Cut Here'}</span>
          <span>- - - - - - - - - - - - - - - - - - - - ✂</span>
        </div>
      </div>
    );
  }

  // Case 3: 2 Admit Cards per A4 Page (Paper Saver)
  const secondStudent = twoPerPageMode === 'two_students' && pairedStudent ? pairedStudent : student;
  const secondRoutines = twoPerPageMode === 'two_students' && pairedRoutines ? pairedRoutines : routines;
  const firstLabel = twoPerPageMode === 'duplicate' ? (language === 'bn' ? 'শিক্ষার্থী কপি (Student Copy)' : 'STUDENT COPY') : undefined;
  const secondLabel = twoPerPageMode === 'duplicate' ? (language === 'bn' ? 'অফিস কপি (Office Copy)' : 'OFFICE COPY') : undefined;

  return (
    <div className="w-full max-w-3xl mx-auto print:max-w-none print:w-full print:m-0 space-y-3 print:space-y-2">
      {/* Top Card */}
      <SingleAdmitCard
        school={school}
        student={student}
        exam={exam}
        routines={routines}
        issueDate={issueDate}
        format="two_per_page"
        instructionMode={instructionMode}
        density={density}
        copyLabel={firstLabel}
        language={language}
      />

      {/* Scissor Cutting Line */}
      <div className="py-1 text-center text-slate-400 font-mono text-[10px] flex items-center justify-center space-x-2 print:py-0.5">
        <span className="flex-1 border-b border-dashed border-slate-400"></span>
        <span className="px-2 font-bold text-slate-600 uppercase text-[9px] bg-white">
          ✂ {language === 'bn' ? 'কাটার দাগ (Cut Here)' : 'Cut Line'} ✂
        </span>
        <span className="flex-1 border-b border-dashed border-slate-400"></span>
      </div>

      {/* Bottom Card */}
      <SingleAdmitCard
        school={school}
        student={secondStudent}
        exam={exam}
        routines={secondRoutines}
        issueDate={issueDate}
        format="two_per_page"
        instructionMode={instructionMode}
        density={density}
        copyLabel={secondLabel}
        language={language}
      />
    </div>
  );
};
