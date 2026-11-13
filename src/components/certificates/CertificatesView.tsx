import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { StorageService } from '../../services/storage';
import { Student } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import { formatGroupName } from '../../utils/i18n';
import QRCode from 'qrcode';
import {
  FileBadge,
  Printer,
  Search,
  CreditCard,
  Award,
  CheckCircle,
  FileCheck2,
  Calendar,
  X,
  Building,
  Layers,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  Users,
  Check,
  Phone,
  Wifi,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import {
  AdmitCardTemplate,
  AdmitCardFormat,
  InstructionMode,
  TableDensity,
} from './AdmitCardTemplate';

export const CertificatesView: React.FC = () => {
  const { language, toBnNumber } = useLanguage();
  const { schoolProfile } = useSchool();
  const school = schoolProfile;
  const students = StorageService.getStudents();
  const exams = StorageService.getExams();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std_1');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [docType, setDocType] = useState<'id_card' | 'admit_card' | 'testimonial' | 'transfer' | 'character' | 'bonafide'>('admit_card');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'ex_1');
  const [issueDate, setIssueDate] = useState<string>('2026-06-10');
  const [certificateSerial, setCertificateSerial] = useState<string>('AC-2026-0842');

  // Advanced Admit Card Settings & Layouts
  const [admitFormat, setAdmitFormat] = useState<AdmitCardFormat>('a4_full');
  const [admitTwoPerPageMode, setAdmitTwoPerPageMode] = useState<'duplicate' | 'two_students'>('duplicate');
  const [admitDensity, setAdmitDensity] = useState<TableDensity>('auto');
  const [admitInstructionMode, setAdmitInstructionMode] = useState<InstructionMode>('auto' as any);
  const [bulkPrintAll, setBulkPrintAll] = useState<boolean>(false);

  // Institutional Certificate Size (14x11 Inch vs A4) and Templates (Classic Academic vs Modern Executive)
  const [certSize, setCertSize] = useState<'fourteen_by_eleven' | 'a4'>('fourteen_by_eleven');
  const [certTemplate, setCertTemplate] = useState<'classic' | 'modern'>('classic');

  const filteredStudents = selectedClassFilter === 'all'
    ? students
    : students.filter((s) => s.className === selectedClassFilter);

  const student = filteredStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0] || students[0];
  const exam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const [studentQrUrl, setStudentQrUrl] = useState<string>('');

  useEffect(() => {
    if (student) {
      try {
        const qrData = StorageService.generateStudentQRData(student);
        QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 200,
          color: { dark: '#000000', light: '#ffffff' },
        }).then(setStudentQrUrl).catch(console.error);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
  }, [student]);

  // Helper to fetch routines strictly matching student's class and group
  const getRoutinesForStudent = (std: Student) => {
    if (!std) return [];
    let all = StorageService.getRoutinesForClassAndExam(selectedExamId, std.className);
    if (all.length === 0) {
      all = StorageService.autoGenerateRoutineFromSubjects(selectedExamId, std.className);
    }
    return all.filter((item) => {
      if (!['Class 9', 'Class 10'].includes(std.className)) return true;
      const sGroup = (std.group || 'Science').toLowerCase();
      if (!item.group || item.group.toLowerCase() === 'all' || item.group.toLowerCase() === 'general') return true;
      const iGroup = item.group.toLowerCase();
      if (sGroup.includes('science') && iGroup.includes('science')) return true;
      if ((sGroup.includes('commerce') || sGroup.includes('business')) && (iGroup.includes('commerce') || iGroup.includes('business'))) return true;
      if ((sGroup.includes('humanities') || sGroup.includes('arts')) && (iGroup.includes('humanities') || iGroup.includes('arts'))) return true;
      if (sGroup.includes('vocational') && iGroup.includes('vocational')) return true;
      return iGroup === sGroup;
    });
  };

  const classRoutines = student ? getRoutinesForStudent(student) : [];

  // Paired student for two_per_page mode
  const currentIdx = filteredStudents.findIndex((s) => s.id === student?.id);
  const pairedStudent = filteredStudents[currentIdx + 1] || filteredStudents[0];
  const pairedRoutines = pairedStudent ? getRoutinesForStudent(pairedStudent) : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'সনদপত্র ও প্রত্যয়নপত্র প্রিন্ট' : 'Official Certificates & Document Generator'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'আইডি কার্ড, অ্যাডমিট কার্ড, প্রশংসাপত্র, ছাড়পত্র (TC), চারিত্রিক সনদ ও প্রত্যয়নপত্র'
              : 'Printable ID cards, admit cards, testimonials, transfer certificates & bonafide letters'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Document'}</span>
        </button>
      </div>

      {/* Control Panel (Hidden on Print) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5 print:hidden">
        {/* Main Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Certificate Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Type:</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-blue-700"
            >
              <option value="admit_card">Exam Admit Card (প্রবেশপত্র)</option>
              <option value="id_card">Student ID Card (Front & Back)</option>
              <option value="testimonial">Testimonial (প্রশংসাপত্র)</option>
              <option value="transfer">Transfer Certificate (ছাড়পত্র / TC)</option>
              <option value="character">Character Certificate (চারিত্রিক সনদ)</option>
              <option value="bonafide">Bonafide Student Certificate</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Filter by Class:</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                const matching = e.target.value === 'all'
                  ? students
                  : students.filter((s) => s.className === e.target.value);
                if (matching.length > 0) {
                  setSelectedStudentId(matching[0].id);
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
            >
              <option value="all">All Classes (সকল শ্রেণি)</option>
              {['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Student:</label>
            <select
              value={student?.id || selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              disabled={bulkPrintAll}
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.roll} - {s.nameEn} ({s.className})
                </option>
              ))}
              {filteredStudents.length === 0 && (
                <option value="">No students in this class</option>
              )}
            </select>
          </div>

          {/* Exam (if Admit Card) */}
          {docType === 'admit_card' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Examination:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.nameEn}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Serial Number:</label>
              <input
                type="text"
                value={certificateSerial}
                onChange={(e) => setCertificateSerial(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono"
              />
            </div>
          )}

          {/* Issue Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Date:</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
            />
          </div>
        </div>

        {/* Specialized Toolbar for Admit Card (Page Size, Half A4, Density, Instructions, Bulk Print) */}
        {docType === 'admit_card' && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Format / Page Size Buttons */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'প্রবেশপত্র সাইজ / লেআউট:' : 'Page Layout Size:'}</span>
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdmitFormat('a4_full')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      admitFormat === 'a4_full'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? 'A4 পূর্ণ পাতা (Single A4)' : 'A4 Full Page'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdmitFormat('half_a4')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      admitFormat === 'half_a4'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? 'হাফ A4 / A5 সাইজ' : 'Half A4 (A5)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdmitFormat('two_per_page')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all flex items-center space-x-1 ${
                      admitFormat === 'two_per_page'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Scissors className="w-3 h-3 text-amber-300" />
                    <span>{language === 'bn' ? '১ পাতায় ২টি (পেপার সেভার)' : '2 Cards / A4'}</span>
                  </button>
                </div>
              </div>

              {/* In 2 Cards per Page mode: Mode selector */}
              {admitFormat === 'two_per_page' && (
                <div className="flex items-center space-x-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                  <span className="font-bold text-blue-900 text-[11px]">{language === 'bn' ? '২য় কার্ড:' : '2nd Card:'}</span>
                  <select
                    value={admitTwoPerPageMode}
                    onChange={(e) => setAdmitTwoPerPageMode(e.target.value as any)}
                    className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-semibold text-blue-950"
                  >
                    <option value="duplicate">
                      {language === 'bn' ? 'একই শিক্ষার্থীর ২ কপি (শিক্ষার্থী + অফিস কপি)' : 'Student + Office Copy (Same)'}
                    </option>
                    <option value="two_students">
                      {language === 'bn' ? 'পরপর ২ জন শিক্ষার্থী (৫০% কাগজ সাশ্রয়)' : 'Consecutive Students (Save 50% Paper)'}
                    </option>
                  </select>
                </div>
              )}

              {/* Density and Instructions Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 text-[11px] font-semibold">{language === 'bn' ? 'ঘনত্ব:' : 'Density:'}</span>
                  <select
                    value={admitDensity}
                    onChange={(e) => setAdmitDensity(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="auto">{language === 'bn' ? 'অটো-ফিট (Auto)' : 'Auto-Fit'}</option>
                    <option value="standard">{language === 'bn' ? 'স্বাভাবিক (Standard)' : 'Standard'}</option>
                    <option value="compact">{language === 'bn' ? 'কম্প্যাক্ট (ঘন - ১২ বিষয়)' : 'Compact'}</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-slate-500 text-[11px] font-semibold">{language === 'bn' ? 'নির্দেশনা:' : 'Rules:'}</span>
                  <select
                    value={admitInstructionMode}
                    onChange={(e) => setAdmitInstructionMode(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="auto">{language === 'bn' ? 'স্মার্ট (Smart)' : 'Smart Auto'}</option>
                    <option value="full">{language === 'bn' ? 'পূর্ণাঙ্গ (৪টি নিয়ম)' : 'Full (4 Rules)'}</option>
                    <option value="compact">{language === 'bn' ? '২-কলাম সংক্ষিপ্ত' : 'Compact 2-Col'}</option>
                    <option value="minimal">{language === 'bn' ? '১-লাইন সামারি' : '1-Line Minimal'}</option>
                    <option value="none">{language === 'bn' ? 'বাদ দিন (None)' : 'None'}</option>
                  </select>
                </div>

                {/* Bulk Print Class Toggle */}
                <button
                  type="button"
                  onClick={() => setBulkPrintAll(!bulkPrintAll)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold text-xs transition-colors border ${
                    bulkPrintAll
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
                  }`}
                  title="Print admit cards for all students in the selected class"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {bulkPrintAll
                      ? (language === 'bn' ? `সকল ${filteredStudents.length} জনের মোড চালু` : `Bulk Mode ON (${filteredStudents.length})`)
                      : (language === 'bn' ? `শ্রেণির সবার প্রিন্ট (${filteredStudents.length} জন)` : `Print All (${filteredStudents.length})`)}
                  </span>
                </button>
              </div>
            </div>

            {/* Smart Advisory Banner based on subject count */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border text-xs bg-slate-50">
              <div className="flex items-center space-x-2">
                {classRoutines.length <= 7 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'bn' ? 'কম বিষয়' : 'Few Subjects'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>{language === 'bn' ? `${classRoutines.length}টি বিষয়` : `${classRoutines.length} Subjects`}</span>
                  </span>
                )}
                <span className="text-slate-700 font-medium text-[11px]">
                  {classRoutines.length <= 7 ? (
                    language === 'bn'
                      ? `এই শ্রেণিতে মোট ${classRoutines.length}টি বিষয় রয়েছে। পেপার সাশ্রয় করতে 'হাফ A4' অথবা '১ পাতায় ২টি (পেপার সেভার)' বেছে নিতে পারেন!`
                      : `This class has ${classRoutines.length} subjects. Consider using 'Half A4' or '2 Cards / A4' to save paper!`
                  ) : (
                    language === 'bn'
                      ? `এই শ্রেণিতে মোট ${classRoutines.length}টি বিষয় রয়েছে। এটি কোনো অবস্থাতেই A4 সাইজের বাইরে যাবে না—নিখুঁত ১ পেজে ফিট রাখার জন্য অপ্টিমাইজ করা হয়েছে!`
                      : `This class has ${classRoutines.length} subjects. It is strictly optimized to never exceed 1 single A4 sheet!`
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                A4 Max-Height: 280mm
              </div>
            </div>
          </div>
        )}

        {/* Specialized Toolbar for Institutional Certificates (A4 vs 11x14 Inch & 2 Design Templates) */}
        {['testimonial', 'transfer', 'character', 'bonafide'].includes(docType) && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Paper Size: 14x11 Inch (Default) vs A4 */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'সনদের সাইজ / মাপ:' : 'Certificate Size:'}</span>
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setCertSize('fourteen_by_eleven')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      certSize === 'fourteen_by_eleven'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? '১৪ × ১১ ইঞ্চি (সনদ সাইজ - ডিফল্ট)' : '14 × 11 Inch (Default)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertSize('a4')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      certSize === 'a4'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? 'A4 সাইজ (বোর্ড মান)' : 'A4 Size'}
                  </button>
                </div>
              </div>

              {/* Template Choice: Classic Academic vs Modern Executive */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'bn' ? 'ডিজাইন টেমপ্লেট:' : 'Design Template:'}</span>
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setCertTemplate('classic')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      certTemplate === 'classic'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? 'টেমপ্লেট ১: ক্লাসিক অ্যাকাডেমিক' : 'Template 1: Classic Academic'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertTemplate('modern')}
                    className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                      certTemplate === 'modern'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {language === 'bn' ? 'টেমপ্লেট ২: মডার্ন বোর্ড এক্সিকিউটিভ' : 'Template 2: Modern Executive'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-blue-50/70 p-2 rounded-lg border border-blue-150">
              <span className="flex items-center gap-1.5 font-medium text-blue-900">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {certSize === 'fourteen_by_eleven'
                    ? 'স্কুল ও শিক্ষা প্রতিষ্ঠানের প্রাতিষ্ঠানিক ১৪ × ১১ ইঞ্চি সাইজ সক্রিয়। ফ্রেম বাঁধাই ও প্রাতিষ্ঠানিক সনদ স্ট্যান্ডার্ড।'
                    : 'স্ট্যান্ডার্ড ISO A4 (২১০ × ২৯৭ মিমি) সাইজ সক্রিয়। সরকারি বোর্ড ও অফিসিয়াল নথিপত্রের জন্য অনুমোদিত।'}
                </span>
              </span>
              <span className="font-mono font-bold text-blue-800">
                {certSize === 'fourteen_by_eleven' ? '14" × 11" (355mm × 279mm)' : 'A4 (210mm × 297mm)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <div className="bg-slate-100 p-4 md:p-8 rounded-2xl border border-slate-200 flex justify-center print:bg-white print:p-0 print:border-none">
        {!student ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 w-full max-w-lg shadow-sm">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-base text-slate-800">
              {language === 'bn' ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Available'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {language === 'bn'
                ? 'আইডি কার্ড, প্রবেশপত্র বা সনদ প্রিন্ট করার জন্য প্রথমে শিক্ষার্থী মেনু থেকে নতুন শিক্ষার্থী যুক্ত করুন।'
                : 'Please add students from the Student Management module to preview and generate certificates.'}
            </p>
          </div>
        ) : (
          <>
            {/* 1. STUDENT ID CARD (Front & Back - Smart All-English Design) */}
            {docType === 'id_card' && (
              <div className="flex flex-col sm:flex-row gap-6 print:m-0 print:gap-4 justify-center items-center">
                {/* Front Side: Smart Academic ID */}
                <div className="w-[320px] h-[500px] bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col justify-between text-slate-900 print:shadow-none print:border-2 print:border-black relative">
                  {/* Lanyard Punch Hole Indicator */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-1.5 print:hidden shrink-0" />

                  {/* Smart Dual-Tone Header */}
                  <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-3 text-center relative z-10 shrink-0">
                    <div className="flex items-center justify-center space-x-2.5 mb-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-md">
                        <img
                          src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-left leading-tight">
                        <h3 className="font-black text-xs tracking-wider text-white uppercase leading-tight">
                          {school.nameEn || 'SMART MODEL SCHOOL & COLLEGE'}
                        </h3>
                        <p className="text-[8px] text-blue-200 font-mono mt-0.5">
                          EIIN: {school.eiin} • {school.addressEn || 'Dhaka, Bangladesh'}
                        </p>
                      </div>
                    </div>
                    {/* Golden Hologram-style Badge */}
                    <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-slate-950" />
                      <span>STUDENT IDENTITY CARD</span>
                    </div>
                  </div>

                  {/* Card Body: Photo & Identity Grid */}
                  <div className="p-3.5 flex flex-col items-center text-center flex-1 relative z-10 justify-between">
                    {/* Top RFID Badge & Photo */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-between w-full px-2 mb-1 text-[8px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 font-bold text-blue-600">
                          <Wifi className="w-3 h-3 rotate-90" />
                          <span>SMART CAMPUS ID</span>
                        </span>
                        <span>SESSION: {student.session || school.currentSession || '2026'}</span>
                      </div>

                      <div className="relative">
                        <div className="w-24 h-28 rounded-2xl border-3 border-blue-600 bg-slate-100 flex items-center justify-center font-bold text-2xl text-blue-800 shadow-md overflow-hidden">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.nameEn} className="w-full h-full object-cover" />
                          ) : (
                            student.nameEn.charAt(0)
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-xs" title="Verified Student">
                          ✓
                        </span>
                      </div>

                      <h4 className="font-black text-sm text-slate-950 mt-2 uppercase tracking-wide leading-tight">
                        {student.nameEn}
                      </h4>
                      <div className="mt-1 inline-block px-3 py-0.5 bg-blue-50 text-blue-800 font-mono font-bold text-[11px] rounded-full border border-blue-200">
                        ID: {student.studentId}
                      </div>
                    </div>

                    {/* Academic Information Grid */}
                    <div className="w-full mt-2 pt-2 border-t border-slate-200 text-left space-y-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between items-center py-0.5 px-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 text-[10px] font-semibold">Class:</span>
                          <strong className="text-slate-900 font-bold text-[11px]">{student.className}</strong>
                        </div>
                        <div className="flex justify-between items-center py-0.5 px-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 text-[10px] font-semibold">Roll:</span>
                          <strong className="text-slate-900 font-mono font-bold text-[11px]">{student.roll}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between items-center py-0.5 px-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 text-[10px] font-semibold">Section:</span>
                          <strong className="text-slate-900 font-bold text-[11px]">{student.section || 'A'}</strong>
                        </div>
                        <div className="flex justify-between items-center py-0.5 px-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 text-[10px] font-semibold">Blood:</span>
                          <strong className="text-rose-600 font-bold text-[11px]">{student.bloodGroup || 'B+'}</strong>
                        </div>
                      </div>

                      {/* Class 9 & 10 Group Badge */}
                      {['Class 9', 'Class 10'].includes(student.className) && (
                        <div className="flex justify-between items-center py-0.5 px-2 bg-amber-50 rounded border border-amber-300">
                          <span className="text-amber-950 font-bold text-[10px]">Academic Group:</span>
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded text-[10px] uppercase">
                            {student.group || 'Science'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Front Signatures & Footer */}
                  <div className="px-3.5 pb-2 pt-1.5 border-t border-slate-200 bg-slate-50 text-[9px] relative z-10 shrink-0">
                    <div className="flex items-center justify-between pb-1">
                      <div className="text-center">
                        <div className="font-serif italic text-[10px] text-slate-600 border-b border-slate-300 pb-0.5 w-20">
                          Student Sign
                        </div>
                        <span className="text-[7px] text-slate-400 block uppercase font-bold mt-0.5">
                          Cardholder Signature
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-serif italic font-bold text-[10px] text-blue-900 border-b border-slate-400 pb-0.5 w-24 truncate">
                          {school.principalNameEn || 'Principal'}
                        </div>
                        <span className="text-[7px] text-slate-400 block uppercase font-bold mt-0.5">
                          Principal Signature
                        </span>
                      </div>
                    </div>
                    <div className="text-center text-[7.5px] text-slate-500 font-medium pt-1 border-t border-slate-200">
                      Institutional Property • Helpline: {school.phone}
                    </div>
                  </div>
                </div>

                {/* Back Side: Smart Attendance & Emergency Contact (100% English) */}
                <div className="w-[320px] h-[500px] bg-white text-black rounded-2xl shadow-2xl border-2 border-black p-3.5 flex flex-col justify-between text-xs print:shadow-none print:border-2 print:border-black relative">
                  {/* Lanyard Punch Hole Indicator */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto my-1.5 print:hidden shrink-0" />

                  {/* Top Header */}
                  <div className="border-b-2 border-black pb-1.5 text-center shrink-0">
                    <h4 className="font-black text-xs uppercase tracking-wider text-black">
                      {school.nameEn || 'INSTITUTION IDENTITY'}
                    </h4>
                    <p className="font-bold text-[8.5px] text-black uppercase tracking-widest mt-0.5">
                      STUDENT IDENTITY CARD • BACK SIDE
                    </p>
                  </div>

                  {/* Sharp Black QR Code & Instant Scan Target */}
                  <div className="flex flex-col items-center justify-center my-1 text-center shrink-0">
                    <div className="p-1.5 bg-white rounded-xl border-2 border-black shadow-2xs relative">
                      {/* Corner Target Markers */}
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-black" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-black" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-black" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-black" />
                      {studentQrUrl ? (
                        <img src={studentQrUrl} alt="Student Attendance QR" className="w-24 h-24 object-contain" />
                      ) : (
                        <div className="w-24 h-24 bg-white border border-black flex items-center justify-center text-xs font-mono font-bold text-black">
                          QR CODE
                        </div>
                      )}
                    </div>
                    <span className="mt-1 font-mono font-black text-[11px] text-black tracking-wider">
                      CARD ID: {student.studentId}
                    </span>
                    <span className="text-[7.5px] font-bold text-black uppercase tracking-wide">
                      Scan at Smart Gate Kiosk for Attendance
                    </span>
                  </div>

                  {/* Emergency Guardian Contact & Particulars Box (100% English) */}
                  <div className="bg-white border-2 border-black rounded-xl p-2 text-black space-y-1 shrink-0">
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-black">
                      <span className="font-black flex items-center space-x-1 uppercase tracking-wide text-black">
                        <Phone className="w-3 h-3 text-black" />
                        <span>Emergency Guardian:</span>
                      </span>
                      <span className="font-mono font-black text-xs text-black">{student.guardianPhone}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5 text-[9px] pt-0.5">
                      <div className="flex justify-between">
                        <span className="font-semibold text-black">Father's Name:</span>
                        <span className="font-bold text-black truncate max-w-[170px]">{student.fatherNameEn || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-black">Mother's Name:</span>
                        <span className="font-bold text-black truncate max-w-[170px]">{student.motherNameEn || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-black">Date of Birth:</span>
                        <span className="font-mono font-bold text-black">{student.dob || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-[8px] pt-0.5 border-t border-dashed border-black">
                        <span className="font-semibold text-black">Present Address:</span>
                        <span className="text-black font-semibold truncate max-w-[170px]">{student.presentAddress || 'Dhaka, Bangladesh'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions (100% English) */}
                  <div className="space-y-1 text-[7.5px] text-black leading-tight border-t border-black pt-1.5 shrink-0">
                    <p className="font-black uppercase tracking-wider">Terms & Conditions:</p>
                    <ol className="list-decimal pl-3 space-y-0.5 text-[7px] leading-snug">
                      <li>This card must be carried at all times on school premises.</li>
                      <li>Scan the QR code at the gate kiosk to log daily attendance.</li>
                      <li>This card is non-transferable and remains institutional property.</li>
                    </ol>
                    <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7px] font-bold">
                      <span>If found, please return to: {school.nameEn}</span>
                      <span>Helpline: {school.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* 2. EXAM ADMIT CARD */}
        {docType === 'admit_card' && (
          <div className="w-full">
            {/* Print Stylesheet for strict A4 / Half A4 print geometry */}
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 6mm 6mm 6mm 6mm;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print-page-break {
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .print-page-break:last-child {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
              }
            `}</style>

            {!bulkPrintAll ? (
              /* Single Student Mode */
              student && (
                <AdmitCardTemplate
                  school={school}
                  student={student}
                  exam={exam}
                  routines={classRoutines}
                  issueDate={issueDate}
                  format={admitFormat}
                  instructionMode={admitInstructionMode}
                  density={admitDensity}
                  twoPerPageMode={admitTwoPerPageMode}
                  pairedStudent={pairedStudent}
                  pairedRoutines={pairedRoutines}
                  language={language}
                />
              )
            ) : (
              /* Bulk Print Mode (All Students in Filtered Class) */
              <div className="space-y-6 print:space-y-0">
                {admitFormat === 'two_per_page' ? (
                  /* 2 Cards per Sheet Pairing */
                  Array.from({ length: Math.ceil(filteredStudents.length / (admitTwoPerPageMode === 'two_students' ? 2 : 1)) }).map((_, sheetIdx) => {
                    const firstStd = admitTwoPerPageMode === 'two_students'
                      ? filteredStudents[sheetIdx * 2]
                      : filteredStudents[sheetIdx];
                    const secondStd = admitTwoPerPageMode === 'two_students'
                      ? filteredStudents[sheetIdx * 2 + 1]
                      : firstStd;
                    if (!firstStd) return null;

                    const firstRoutines = getRoutinesForStudent(firstStd);
                    const secondRoutines = secondStd ? getRoutinesForStudent(secondStd) : firstRoutines;

                    return (
                      <div key={sheetIdx} className="print-page-break pb-6 print:pb-0">
                        <AdmitCardTemplate
                          school={school}
                          student={firstStd}
                          exam={exam}
                          routines={firstRoutines}
                          issueDate={issueDate}
                          format="two_per_page"
                          instructionMode={admitInstructionMode}
                          density={admitDensity}
                          twoPerPageMode={admitTwoPerPageMode}
                          pairedStudent={secondStd}
                          pairedRoutines={secondRoutines}
                          language={language}
                        />
                      </div>
                    );
                  })
                ) : (
                  /* Single Card per Sheet (A4 Full or Half A4) */
                  filteredStudents.map((std, idx) => (
                    <div key={std.id || idx} className="print-page-break pb-6 print:pb-0">
                      <AdmitCardTemplate
                        school={school}
                        student={std}
                        exam={exam}
                        routines={getRoutinesForStudent(std)}
                        issueDate={issueDate}
                        format={admitFormat}
                        instructionMode={admitInstructionMode}
                        density={admitDensity}
                        language={language}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Certificate Print Stylesheet (14x11 Inch vs ISO A4) */}
        <style>{`
          @media print {
            @page {
              size: ${certSize === 'fourteen_by_eleven' ? '14in 11in landscape' : 'A4 portrait'};
              margin: ${certSize === 'fourteen_by_eleven' ? '8mm' : '8mm'};
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background: white !important;
            }
            .a4-certificate-sheet {
              width: 100% !important;
              max-width: ${certSize === 'fourteen_by_eleven' ? '355mm' : '210mm'} !important;
              min-height: ${certSize === 'fourteen_by_eleven' ? '270mm' : '275mm'} !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: ${certSize === 'fourteen_by_eleven' ? '12mm 16mm' : '10mm'} !important;
              box-shadow: none !important;
              border-width: 4px !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
          }
        `}</style>

        {/* 3. TESTIMONIAL (14x11 INCH DEFAULT OR A4 WITH 2 TEMPLATES) */}
        {docType === 'testimonial' && (
          <div
            className={`a4-certificate-sheet w-full ${
              certSize === 'fourteen_by_eleven'
                ? 'max-w-[355mm] min-h-[279mm] p-8 sm:p-14'
                : 'max-w-[210mm] min-h-[297mm] p-6 sm:p-12'
            } bg-white rounded-none sm:rounded-2xl shadow-2xl ${
              certTemplate === 'classic'
                ? 'border-[8px] border-double border-slate-900 ring-2 ring-slate-800'
                : 'border-4 border-indigo-950 ring-8 ring-amber-500/25'
            } text-slate-900 print:shadow-none print:border-4 print:border-slate-900 flex flex-col justify-between relative mx-auto my-0`}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img
                src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                alt=""
                className="w-80 h-80 object-contain"
              />
            </div>

            {/* Header */}
            <div>
              <div className="text-center pb-5 border-b-2 border-slate-900 relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{school.nameBn}</h1>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{school.nameEn}</h2>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1">{school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}</p>
                <div className="inline-block mt-3 px-6 py-1.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-xs">
                  TESTIMONIAL CERTIFICATE • প্রশংসাপত্র
                </div>
              </div>

              {/* Serial & Date Bar */}
              <div className="flex justify-between items-center text-xs text-slate-600 py-3 border-b border-dashed border-slate-300 relative z-10 font-mono">
                <span>স্মারক / Sl. No: <strong className="text-slate-900 font-bold">{certificateSerial}</strong></span>
                <span>প্রদানের তারিখ / Date: <strong className="text-slate-900 font-bold">{issueDate}</strong></span>
              </div>

              {/* Certificate Body Paragraphs */}
              <div className="my-8 space-y-5 text-[14px] leading-loose text-slate-800 text-justify relative z-10">
                <p className="indent-10">
                  This is to solemnly certify that <strong className="text-slate-950 font-black text-base underline decoration-slate-400 underline-offset-4">{student.nameEn}</strong>{' '}
                  <span className="font-semibold text-slate-700">({student.nameBn})</span>, son / daughter of{' '}
                  <strong className="text-slate-950 font-bold">{student.fatherNameEn}</strong> and{' '}
                  <strong className="text-slate-950 font-bold">{student.motherNameEn}</strong>, bearing Student ID{' '}
                  <strong className="text-blue-900 font-mono font-black">{student.studentId}</strong> and Class Roll{' '}
                  <strong className="text-slate-950 font-mono font-black">{student.roll}</strong>, was a bonafide student of this institution in{' '}
                  <strong className="text-slate-950 font-bold">{student.className}</strong>
                  {['Class 9', 'Class 10'].includes(student.className) && (
                    <span> (বিভাগ / Group: <strong className="text-amber-900 font-bold">{formatGroupName(student.group || 'Science', language)}</strong>)</span>
                  )}{' '}, Section <strong className="text-slate-950 font-bold">{student.section}</strong> during the academic session{' '}
                  <strong className="text-slate-950 font-bold">{student.session || school.currentSession || '2026'}</strong>.
                </p>

                <p className="indent-10">
                  During his / her period of study in this renowned institution, his / her academic performance was found to be thoroughly satisfactory and conduct was exemplary. To the best of my knowledge and official records, he / she never took part in any activity subversive of the discipline of the institution or of the state.
                </p>

                <p className="indent-10">
                  He / She bears a reputable character and good moral conduct. I sincerely wish him / her a prosperous and illuminating future in all higher academic pursuits.
                </p>
              </div>
            </div>

            {/* Bottom Official Signatures & Seal */}
            <div className="pt-8 border-t-2 border-slate-900 relative z-10">
              <div className="grid grid-cols-3 items-end text-center text-xs">
                {/* Prepared By */}
                <div>
                  <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
                    Prepared By
                  </div>
                  <span className="text-[10px] text-slate-500 block">অফিস সহকারী / প্রণেতা</span>
                </div>

                {/* Institutional Official Seal Stamp */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[8px] text-slate-400 text-center uppercase p-1">
                    <span>SEAL</span>
                    <span className="text-[6.5px]">প্রতিষ্ঠানের সীল</span>
                  </div>
                </div>

                {/* Principal Signature */}
                <div>
                  <div className="font-serif italic font-black text-sm text-blue-950 border-b border-slate-700 pb-0.5 truncate">
                    {school.principalNameEn || 'Principal / Head Teacher'}
                  </div>
                  <div className="pt-1 font-bold text-slate-900">
                    Principal / Headmaster
                  </div>
                  <span className="text-[10px] text-slate-500 block">অধ্যক্ষ / প্রধান শিক্ষক</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                {certSize === 'fourteen_by_eleven' ? '14" × 11" Institutional Certificate Standard' : 'ISO A4 Standard Certificate'} • {school.nameEn} • Verification Helpline: {school.phone}
              </div>
            </div>
          </div>
        )}

        {/* 4. TRANSFER CERTIFICATE (TC - 14x11 INCH DEFAULT OR A4 WITH 2 TEMPLATES) */}
        {docType === 'transfer' && (
          <div
            className={`a4-certificate-sheet w-full ${
              certSize === 'fourteen_by_eleven'
                ? 'max-w-[355mm] min-h-[279mm] p-8 sm:p-14'
                : 'max-w-[210mm] min-h-[297mm] p-6 sm:p-12'
            } bg-white rounded-none sm:rounded-2xl shadow-2xl ${
              certTemplate === 'classic'
                ? 'border-[8px] border-double border-rose-950 ring-2 ring-rose-900'
                : 'border-4 border-rose-950 ring-8 ring-amber-500/25'
            } text-slate-900 print:shadow-none print:border-4 print:border-rose-950 flex flex-col justify-between relative mx-auto my-0`}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img
                src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                alt=""
                className="w-80 h-80 object-contain"
              />
            </div>

            {/* Header */}
            <div>
              <div className="text-center pb-5 border-b-2 border-rose-950 relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{school.nameBn}</h1>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{school.nameEn}</h2>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1">{school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}</p>
                <div className="inline-block mt-3 px-6 py-1.5 bg-rose-900 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-xs">
                  TRANSFER CERTIFICATE (ছাড়পত্র / TC)
                </div>
              </div>

              {/* Serial & Date Bar */}
              <div className="flex justify-between items-center text-xs text-slate-600 py-3 border-b border-dashed border-slate-300 relative z-10 font-mono">
                <span>ছাড়পত্র নং / TC No: <strong className="text-rose-950 font-bold">{certificateSerial.replace(/^AC/, 'TC')}</strong></span>
                <span>প্রদানের তারিখ / Date: <strong className="text-slate-900 font-bold">{issueDate}</strong></span>
              </div>

              {/* Form Particulars Table */}
              <div className="my-6 space-y-2 text-xs leading-relaxed relative z-10">
                <table className="w-full border-collapse border border-slate-300 text-left text-slate-800">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700 w-1/3 border-r border-slate-200">১. শিক্ষার্থীর নাম (Student Name):</td>
                      <td className="p-2.5 font-black text-slate-950 text-sm">{student.nameEn} ({student.nameBn})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">২. স্টুডেন্ট / ভর্তি আইডি (Student ID):</td>
                      <td className="p-2.5 font-mono font-black text-blue-900">{student.studentId}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৩. পিতার নাম (Father's Name):</td>
                      <td className="p-2.5 font-semibold text-slate-900">{student.fatherNameEn} ({student.fatherNameBn || '—'})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৪. মাতার নাম (Mother's Name):</td>
                      <td className="p-2.5 font-semibold text-slate-900">{student.motherNameEn} ({student.motherNameBn || '—'})</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৫. জন্ম তারিখ (Date of Birth):</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{student.dob}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৬. সর্বশেষ অধ্যয়নরত শ্রেণি ও রোল:</td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {student.className} (রোল: {student.roll}, শাখা: {student.section})
                        {['Class 9', 'Class 10'].includes(student.className) && (
                          <span className="text-amber-900 font-bold ml-2">বিভাগ: {formatGroupName(student.group || 'Science', language)}</span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৭. শিক্ষাবর্ষ (Academic Session):</td>
                      <td className="p-2.5 font-bold text-slate-900">{student.session || school.currentSession || '2026'}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৮. বকেয়া বেতন ও ফি পরিশোধের বিবরণ:</td>
                      <td className="p-2.5 font-bold text-emerald-700">সমস্ত প্রাতিষ্ঠানিক ফি ও বকেয়া সম্পূর্ণ পরিশোধিত (Full Dues Cleared)</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">৯. সাধারণ আচরণ ও চরিত্র:</td>
                      <td className="p-2.5 font-bold text-slate-900">সন্তোষজনক ও প্রশংসনীয় (Satisfactory & Exemplary)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">১০. বিদ্যালয় ত্যাগের কারণ:</td>
                      <td className="p-2.5 font-bold text-slate-900">অভিভাবকের স্থানান্তর / ব্যক্তিগত সুবিধা (Guardian Transfer / Relocation)</td>
                    </tr>
                  </tbody>
                </table>

                <p className="pt-3 text-justify text-xs text-slate-700">
                  অভিভাবকের আবেদনের প্রেক্ষিতে এবং বিদ্যালয়ের হিসাব শাখা ও একাডেমিক রেকর্ড যাচাইপূর্বক এই ছাড়পত্র (Transfer Certificate) প্রদান করা হলো। আমরা শিক্ষার্থীর ভবিষ্যৎ শিক্ষা জীবনের সর্বাঙ্গীন সাফল্য কামনা করি।
                </p>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-8 border-t-2 border-rose-950 relative z-10">
              <div className="grid grid-cols-3 items-end text-center text-xs">
                <div>
                  <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
                    Head Clerk / Accountant
                  </div>
                  <span className="text-[10px] text-slate-500 block">প্রধান সহকারী / হিসাবরক্ষক</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[8px] text-slate-400 text-center uppercase p-1">
                    <span>SEAL</span>
                    <span className="text-[6.5px]">অফিসিয়াল সীল</span>
                  </div>
                </div>

                <div>
                  <div className="font-serif italic font-black text-sm text-rose-950 border-b border-slate-700 pb-0.5 truncate">
                    {school.principalNameEn || 'Principal / Head Teacher'}
                  </div>
                  <div className="pt-1 font-bold text-slate-900">
                    Principal / Headmaster
                  </div>
                  <span className="text-[10px] text-slate-500 block">প্রধান শিক্ষক / অধ্যক্ষ</span>
                </div>
              </div>

              <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                {certSize === 'fourteen_by_eleven' ? '14" × 11" Institutional Certificate Standard' : 'ISO A4 Standard Certificate'} • {school.nameEn} • Verification Helpline: {school.phone}
              </div>
            </div>
          </div>
        )}

        {/* 5. CHARACTER CERTIFICATE (14x11 INCH DEFAULT OR A4 WITH 2 TEMPLATES) */}
        {docType === 'character' && (
          <div
            className={`a4-certificate-sheet w-full ${
              certSize === 'fourteen_by_eleven'
                ? 'max-w-[355mm] min-h-[279mm] p-8 sm:p-14'
                : 'max-w-[210mm] min-h-[297mm] p-6 sm:p-12'
            } bg-white rounded-none sm:rounded-2xl shadow-2xl ${
              certTemplate === 'classic'
                ? 'border-[8px] border-double border-indigo-950 ring-2 ring-indigo-900'
                : 'border-4 border-indigo-950 ring-8 ring-amber-500/25'
            } text-slate-900 print:shadow-none print:border-4 print:border-indigo-950 flex flex-col justify-between relative mx-auto my-0`}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img
                src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                alt=""
                className="w-80 h-80 object-contain"
              />
            </div>

            {/* Header */}
            <div>
              <div className="text-center pb-5 border-b-2 border-indigo-950 relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{school.nameBn}</h1>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{school.nameEn}</h2>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1">{school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}</p>
                <div className="inline-block mt-3 px-6 py-1.5 bg-indigo-900 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-xs">
                  CHARACTER CERTIFICATE • চারিত্রিক সনদপত্র
                </div>
              </div>

              {/* Serial & Date Bar */}
              <div className="flex justify-between items-center text-xs text-slate-600 py-3 border-b border-dashed border-slate-300 relative z-10 font-mono">
                <span>সনদ নং / Certificate No: <strong className="text-indigo-950 font-bold">{certificateSerial.replace(/^AC/, 'CC')}</strong></span>
                <span>প্রদানের তারিখ / Date: <strong className="text-slate-900 font-bold">{issueDate}</strong></span>
              </div>

              {/* Certificate Body Paragraphs */}
              <div className="my-8 space-y-5 text-[14px] leading-loose text-slate-800 text-justify relative z-10">
                <p className="indent-10">
                  This is to certify that <strong className="text-slate-950 font-black text-base underline decoration-slate-400 underline-offset-4">{student.nameEn}</strong>{' '}
                  <span className="font-semibold text-slate-700">({student.nameBn})</span>, son / daughter of{' '}
                  <strong className="text-slate-950 font-bold">{student.fatherNameEn}</strong> and{' '}
                  <strong className="text-slate-950 font-bold">{student.motherNameEn}</strong>, is a student of this school in{' '}
                  <strong className="text-slate-950 font-bold">{student.className}</strong>
                  {['Class 9', 'Class 10'].includes(student.className) && (
                    <span> (Group: <strong className="text-indigo-900 font-bold">{formatGroupName(student.group || 'Science', language)}</strong>)</span>
                  )}{' '}, Section <strong className="text-slate-950 font-bold">{student.section}</strong>, Class Roll <strong className="text-slate-950 font-mono font-bold">{student.roll}</strong>, Student ID <strong className="text-indigo-950 font-mono font-bold">{student.studentId}</strong>.
                </p>

                <p className="indent-10">
                  To the best of my knowledge and according to our institutional registers, he / she bears a sublime moral character, exhibits disciplined demeanour, and possesses polite manners. He / She has never been found engaged in any activity detrimental to the discipline of this institution or the laws of the country.
                </p>

                <p className="indent-10">
                  I wish him / her all success in his / her life and higher academic pursuits.
                </p>
              </div>
            </div>

            {/* Bottom Official Signatures & Seal */}
            <div className="pt-8 border-t-2 border-indigo-950 relative z-10">
              <div className="grid grid-cols-3 items-end text-center text-xs">
                <div>
                  <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
                    Prepared By
                  </div>
                  <span className="text-[10px] text-slate-500 block">নথিপত্র নিরীক্ষক</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[8px] text-slate-400 text-center uppercase p-1">
                    <span>SEAL</span>
                    <span className="text-[6.5px]">প্রাতিষ্ঠানিক সীল</span>
                  </div>
                </div>

                <div>
                  <div className="font-serif italic font-black text-sm text-indigo-950 border-b border-slate-700 pb-0.5 truncate">
                    {school.principalNameEn || 'Principal / Head Teacher'}
                  </div>
                  <div className="pt-1 font-bold text-slate-900">
                    Principal / Headmaster
                  </div>
                  <span className="text-[10px] text-slate-500 block">প্রধান শিক্ষক / অধ্যক্ষ</span>
                </div>
              </div>

              <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                {certSize === 'fourteen_by_eleven' ? '14" × 11" Institutional Certificate Standard' : 'ISO A4 Standard Certificate'} • {school.nameEn} • Verification Helpline: {school.phone}
              </div>
            </div>
          </div>
        )}

        {/* 6. BONAFIDE STUDENT CERTIFICATE (14x11 INCH DEFAULT OR A4 WITH 2 TEMPLATES) */}
        {docType === 'bonafide' && (
          <div
            className={`a4-certificate-sheet w-full ${
              certSize === 'fourteen_by_eleven'
                ? 'max-w-[355mm] min-h-[279mm] p-8 sm:p-14'
                : 'max-w-[210mm] min-h-[297mm] p-6 sm:p-12'
            } bg-white rounded-none sm:rounded-2xl shadow-2xl ${
              certTemplate === 'classic'
                ? 'border-[8px] border-double border-emerald-950 ring-2 ring-emerald-900'
                : 'border-4 border-emerald-950 ring-8 ring-amber-500/25'
            } text-slate-900 print:shadow-none print:border-4 print:border-emerald-950 flex flex-col justify-between relative mx-auto my-0`}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img
                src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                alt=""
                className="w-80 h-80 object-contain"
              />
            </div>

            {/* Header */}
            <div>
              <div className="text-center pb-5 border-b-2 border-emerald-950 relative z-10">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">{school.nameBn}</h1>
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{school.nameEn}</h2>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1">{school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}</p>
                <div className="inline-block mt-3 px-6 py-1.5 bg-emerald-900 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-xs">
                  BONAFIDE STUDENT CERTIFICATE • অধ্যয়নরত প্রত্যয়নপত্র
                </div>
              </div>

              {/* Serial & Date Bar */}
              <div className="flex justify-between items-center text-xs text-slate-600 py-3 border-b border-dashed border-slate-300 relative z-10 font-mono">
                <span>স্মারক / Ref No: <strong className="text-emerald-950 font-bold">{certificateSerial.replace(/^AC/, 'BON')}</strong></span>
                <span>প্রদানের তারিখ / Date: <strong className="text-slate-900 font-bold">{issueDate}</strong></span>
              </div>

              {/* Certificate Body Paragraphs */}
              <div className="my-8 space-y-5 text-[14px] leading-loose text-slate-800 text-justify relative z-10">
                <div className="text-center font-bold tracking-wider text-xs text-slate-700 uppercase pb-2">
                  TO WHOM IT MAY CONCERN
                </div>

                <p className="indent-10">
                  This is to certify that <strong className="text-slate-950 font-black text-base underline decoration-slate-400 underline-offset-4">{student.nameEn}</strong>{' '}
                  <span className="font-semibold text-slate-700">({student.nameBn})</span>, son / daughter of{' '}
                  <strong className="text-slate-950 font-bold">{student.fatherNameEn}</strong> and{' '}
                  <strong className="text-slate-950 font-bold">{student.motherNameEn}</strong>, is a regular and bonafide student of this institution.
                </p>

                <p className="indent-10">
                  He / She is presently studying in <strong className="text-slate-950 font-bold">{student.className}</strong>
                  {['Class 9', 'Class 10'].includes(student.className) && (
                    <span> (Group: <strong className="text-emerald-900 font-bold">{formatGroupName(student.group || 'Science', language)}</strong>)</span>
                  )}{' '}, Section <strong className="text-slate-950 font-bold">{student.section}</strong>, Class Roll <strong className="text-slate-950 font-mono font-bold">{student.roll}</strong>, Student ID <strong className="text-emerald-950 font-mono font-bold">{student.studentId}</strong> for the current academic session <strong className="text-slate-950 font-bold">{student.session || school.currentSession || '2026'}</strong>.
                </p>

                <p className="indent-10">
                  As per school admission register, his / her recorded date of birth is <strong className="text-slate-950 font-mono font-bold">{student.dob}</strong>. This certificate is issued upon the specific prayer of his / her legal guardian for official verification, passport, bank account, or scholarship purposes.
                </p>
              </div>
            </div>

            {/* Bottom Official Signatures & Seal */}
            <div className="pt-8 border-t-2 border-emerald-950 relative z-10">
              <div className="grid grid-cols-3 items-end text-center text-xs">
                <div>
                  <div className="border-t border-slate-700 pt-1.5 font-bold text-slate-800">
                    Prepared By
                  </div>
                  <span className="text-[10px] text-slate-500 block">যাচাইকারী কর্মকর্তা</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-[8px] text-slate-400 text-center uppercase p-1">
                    <span>SEAL</span>
                    <span className="text-[6.5px]">বিদ্যালয়ের সীল</span>
                  </div>
                </div>

                <div>
                  <div className="font-serif italic font-black text-sm text-emerald-950 border-b border-slate-700 pb-0.5 truncate">
                    {school.principalNameEn || 'Principal / Head Teacher'}
                  </div>
                  <div className="pt-1 font-bold text-slate-900">
                    Principal / Headmaster
                  </div>
                  <span className="text-[10px] text-slate-500 block">প্রধান শিক্ষক / অধ্যক্ষ</span>
                </div>
              </div>

              <div className="mt-6 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                {certSize === 'fourteen_by_eleven' ? '14" × 11" Institutional Certificate Standard' : 'ISO A4 Standard Certificate'} • {school.nameEn} • Verification Helpline: {school.phone}
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
