import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { AIService } from '../../services/aiService';
import { Student, StudentPerformanceAnalytics, ClassLevel } from '../../types';
import {
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  CalendarCheck2,
  User,
  GraduationCap,
  Search,
  Filter,
  ArrowUpRight,
  Printer,
  FileText,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Target,
  ShieldAlert,
  HelpCircle,
  Clock,
  Check,
} from 'lucide-react';

export const StudentPerformanceAnalyticsView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { language, toBnNumber } = useLanguage();

  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std_1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [liveAIRecommendations, setLiveAIRecommendations] = useState<{
    summary?: string;
    recommendations?: string[];
    growth?: string;
  } | null>(null);

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

  // Identify student if logged in as student or guardian
  const authenticatedStudent: Student | undefined = useMemo(() => {
    if (activeRole === 'student') {
      return (
        students.find((s) => s.id === currentUser.linkedStudentId) ||
        students.find((s) => s.nameEn.toLowerCase() === currentUser.name.toLowerCase()) ||
        students.find((s) => s.id === 'std_1') ||
        students[0]
      );
    }
    if (activeRole === 'guardian') {
      return (
        students.find((s) => s.id === currentUser.linkedStudentId) ||
        students.find((s) => s.guardianName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        students.find((s) => s.id === 'std_1') ||
        students[0]
      );
    }
    return undefined;
  }, [activeRole, currentUser, students]);

  // Set active student ID based on role
  useEffect(() => {
    if (authenticatedStudent) {
      setSelectedStudentId(authenticatedStudent.id);
    }
  }, [authenticatedStudent]);

  // Filter students for Teacher/Admin selector
  const filteredStudents = useMemo(() => {
    if (activeRole === 'student' || activeRole === 'guardian') {
      return authenticatedStudent ? [authenticatedStudent] : [];
    }
    return students.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSection = selectedSection === 'all' || s.section === selectedSection;
      const matchSearch =
        !searchQuery ||
        s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nameBn.includes(searchQuery) ||
        s.roll.includes(searchQuery);
      return matchClass && matchSection && matchSearch;
    });
  }, [students, selectedClass, selectedSection, searchQuery, activeRole, authenticatedStudent]);

  // Calculate current student analytics
  const currentStudentAnalytics = useMemo(() => {
    const targetId = authenticatedStudent ? authenticatedStudent.id : selectedStudentId;
    return StorageService.calculateStudentAnalytics(targetId);
  }, [selectedStudentId, authenticatedStudent]);

  // Class Overview Analytics (for Teachers / Admins)
  const classAnalyticsOverview = useMemo(() => {
    const classList = students.filter(
      (s) => (selectedClass === 'all' || s.className === selectedClass) && s.status === 'active'
    );
    const totalCount = classList.length || 1;

    let totalAttendanceSum = 0;
    let totalExamSum = 0;
    let totalHwSum = 0;
    const weakStudentsList: { student: Student; analytics: StudentPerformanceAnalytics }[] = [];
    const attendanceWarningList: { student: Student; analytics: StudentPerformanceAnalytics }[] = [];
    const missingHomeworkList: { student: Student; count: number }[] = [];

    classList.forEach((st) => {
      const a = StorageService.calculateStudentAnalytics(st.id);
      if (a) {
        totalAttendanceSum += a.attendancePercentage;
        totalExamSum += a.examAverageMarks;
        totalHwSum += a.homeworkSubmissionRate;

        if (a.weakSubjects.length > 0 || a.overallScore < 60) {
          weakStudentsList.push({ student: st, analytics: a });
        }
        if (a.attendanceWarning) {
          attendanceWarningList.push({ student: st, analytics: a });
        }
        if (a.missingHomeworkCount > 0) {
          missingHomeworkList.push({ student: st, count: a.missingHomeworkCount });
        }
      }
    });

    return {
      totalStudents: classList.length,
      avgAttendance: Math.round(totalAttendanceSum / totalCount),
      avgExamScore: Math.round(totalExamSum / totalCount),
      avgHwRate: Math.round(totalHwSum / totalCount),
      weakStudentsList,
      attendanceWarningList,
      missingHomeworkList,
    };
  }, [students, selectedClass]);

  // Trigger Live AI Recommendations from Gemini
  const handleGenerateLiveAI = async () => {
    if (!currentStudentAnalytics) return;
    setIsGeneratingAI(true);
    setLiveAIRecommendations(null);

    const res = await AIService.generateStudentAnalytics({
      studentName: currentStudentAnalytics.studentName,
      className: currentStudentAnalytics.className,
      attendancePercentage: currentStudentAnalytics.attendancePercentage,
      homeworkSubmissionRate: currentStudentAnalytics.homeworkSubmissionRate,
      homeworkAverageMarks: currentStudentAnalytics.homeworkAverageMarks,
      examAverageMarks: currentStudentAnalytics.examAverageMarks,
      subjectPerformance: currentStudentAnalytics.subjectPerformance,
      weakSubjects: currentStudentAnalytics.weakSubjects,
      strongSubjects: currentStudentAnalytics.strongSubjects,
      missingHomeworkCount: currentStudentAnalytics.missingHomeworkCount,
      attendanceWarning: currentStudentAnalytics.attendanceWarning,
    });

    setIsGeneratingAI(false);
    if (res.success && res.analytics) {
      setLiveAIRecommendations({
        summary: res.analytics.aiSummary,
        recommendations: res.analytics.aiRecommendations,
        growth: res.analytics.predictedGrowth,
      });
    }
  };

  const isRestrictedRole = activeRole === 'student' || activeRole === 'guardian';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{language === 'bn' ? 'এআই শিক্ষার্থী পারফরম্যান্স অ্যানালিটিক্স' : 'AI Student Performance Analytics'}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gemini 3.8 Flash Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRestrictedRole
                ? activeRole === 'student'
                  ? 'আপনার উপস্থিতি, হোমওয়ার্ক, পরীক্ষার নম্বর এবং ব্যক্তিগত এআই পড়াশোনার পরামর্শ'
                  : 'আপনার সন্তানের উপস্থিতি, হোমওয়ার্ক অগ্রগতি ও পড়াশোনায় উন্নতির এআই পরামর্শ'
                : 'উপস্থিতি, বাড়ির কাজ এবং পরীক্ষার বাস্তব তথ্যভিত্তিক এআই বিশ্লেষণ ও দুর্বল শিক্ষার্থীদের সহায়তা তালিকা'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TEACHER / ADMIN CLASS-LEVEL OVERVIEW (Hidden for Student/Parent) */}
      {/* ========================================================================= */}
      {!isRestrictedRole && (
        <div className="space-y-4">
          {/* Class Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">শ্রেণি ভিত্তিক বিশ্লেষণ:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="all">সকল শ্রেণি (All Classes)</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <span className="font-bold text-slate-700 ml-2">শাখা:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="all">সকল শাখা (All)</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              মোট শিক্ষার্থী: <b>{toBnNumber(classAnalyticsOverview.totalStudents)}</b> জন
            </div>
          </div>

          {/* Class Metrics 4 Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase">গড় উপস্থিতি</span>
                <span className="text-xl font-black text-slate-900">
                  {toBnNumber(classAnalyticsOverview.avgAttendance)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase">হোমওয়ার্ক জমাদান হার</span>
                <span className="text-xl font-black text-indigo-700">
                  {toBnNumber(classAnalyticsOverview.avgHwRate)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase">পরীক্ষার গড় নম্বর</span>
                <span className="text-xl font-black text-emerald-700">
                  {toBnNumber(classAnalyticsOverview.avgExamScore)}%
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-700 block uppercase">সহায়তা প্রয়োজন</span>
                <span className="text-xl font-black text-amber-800">
                  {toBnNumber(classAnalyticsOverview.weakStudentsList.length)} জন
                </span>
              </div>
            </div>
          </div>

          {/* Weak Students & Action Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weak Students Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-rose-600" />
                  <span>বিশেষ মনোযোগ প্রয়োজন এমন শিক্ষার্থী ({classAnalyticsOverview.weakStudentsList.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400">দুর্বল বিষয় ও পরামর্শ</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
                {classAnalyticsOverview.weakStudentsList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    কোনো শিক্ষার্থীর নম্বর আশঙ্কাজনক নয়।
                  </div>
                ) : (
                  classAnalyticsOverview.weakStudentsList.map(({ student, analytics }) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className="p-2.5 bg-slate-50 hover:bg-rose-50/60 rounded-xl border border-slate-200 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {student.nameBn || student.nameEn} (রোল: {student.roll})
                        </div>
                        <div className="text-[11px] text-rose-700 mt-0.5">
                          দুর্বল বিষয়: <b>{analytics.weakSubjects.join(', ') || 'গণিত / বিজ্ঞান'}</b>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          স্কোর: {analytics.overallScore}%
                        </span>
                        <span className="block text-[10px] text-blue-600 font-semibold mt-1">বিস্তারিত দেখুন →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attendance & Homework Warning List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>উপস্থিতি ও হোমওয়ার্ক সতর্কবার্তা তালিকা</span>
                </h3>
                <span className="text-[10px] text-slate-400">৮০% এর নিচে উপস্থিতি</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
                {classAnalyticsOverview.attendanceWarningList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    সকল শিক্ষার্থীর উপস্থিতি সন্তোষজনক।
                  </div>
                ) : (
                  classAnalyticsOverview.attendanceWarningList.map(({ student, analytics }) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className="p-2.5 bg-slate-50 hover:bg-amber-50/60 rounded-xl border border-slate-200 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {student.nameBn || student.nameEn} (রোল: {student.roll})
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          উপস্থিতি: <b>{analytics.attendancePercentage}%</b> (অনুপস্থিত: {analytics.absentDays} দিন)
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        সতর্কবার্তা
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: INDIVIDUAL STUDENT DEEP AI PERFORMANCE REPORT                  */}
      {/* ========================================================================= */}
      {currentStudentAnalytics && (
        <div className="space-y-5">
          {/* Student Selector Card for Teachers */}
          {!isRestrictedRole && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">নির্দিষ্ট শিক্ষার্থীর রিপোর্ট নির্বাচন:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-indigo-700"
                >
                  {filteredStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameEn} (রোল: {st.roll}, {st.className}-{st.section})
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={isGeneratingAI}
                onClick={handleGenerateLiveAI}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>এআই বিশ্লেষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>লাইভ এআই বিশ্লেষণ রিফ্রেশ</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Student Banner Profile */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-indigo-400 bg-white/10 shadow-md shrink-0">
                  {currentStudentAnalytics.photoUrl ? (
                    <img
                      src={currentStudentAnalytics.photoUrl}
                      alt={currentStudentAnalytics.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-indigo-200 font-bold">
                      Photo
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-black">
                      {currentStudentAnalytics.studentNameBn || currentStudentAnalytics.studentName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      ID: {currentStudentAnalytics.studentId}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    শ্রেণি: <b>{currentStudentAnalytics.className}</b> • শাখা: <b>{currentStudentAnalytics.section}</b> • রোল: <b>{currentStudentAnalytics.roll}</b>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20">
                      সামগ্রিক স্কোর: <b>{currentStudentAnalytics.overallScore}%</b>
                    </span>
                    {currentStudentAnalytics.attendanceWarning && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold">
                        উপস্থিতি সতর্কবার্তা (Attendance Alert)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick AI Trigger button for Student/Parent */}
              {isRestrictedRole && (
                <button
                  disabled={isGeneratingAI}
                  onClick={handleGenerateLiveAI}
                  className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{isGeneratingAI ? 'এআই বিশ্লেষণ হচ্ছে...' : 'নতুন এআই স্টাডি টিপস নিন'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Student 4 Core Metric Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">উপস্থিতির হার</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-blue-700">
                  {toBnNumber(currentStudentAnalytics.attendancePercentage)}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {currentStudentAnalytics.presentDays}/{currentStudentAnalytics.totalSchoolDays} দিন
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${currentStudentAnalytics.attendancePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">হোমওয়ার্ক জমা হার</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-indigo-700">
                  {toBnNumber(currentStudentAnalytics.homeworkSubmissionRate)}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  বকেয়া: {currentStudentAnalytics.missingHomeworkCount}টি
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${currentStudentAnalytics.homeworkSubmissionRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">হোমওয়ার্ক গড় নম্বর</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-700">
                  {toBnNumber(currentStudentAnalytics.homeworkAverageMarks)}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  মূল্যায়িত
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${currentStudentAnalytics.homeworkAverageMarks}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">পরীক্ষার গড় নম্বর</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-purple-700">
                  {toBnNumber(currentStudentAnalytics.examAverageMarks)}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  টার্ম পরীক্ষা
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${currentStudentAnalytics.examAverageMarks}%` }}
                />
              </div>
            </div>
          </div>

          {/* Subject-Wise Performance Progress Bars */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>বিষয়ভিত্তিক ফলাফল ও দক্ষতার অগ্রগতি (Subject-Wise Performance)</span>
              </span>
              <span className="text-xs text-slate-400 font-normal">পূর্ণমান ১০০-এর ভিত্তিতে</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStudentAnalytics.subjectPerformance.map((sub, idx) => (
                <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{sub.subjectName}</span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'strong'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'weak'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {sub.status === 'strong' ? 'সবল' : sub.status === 'weak' ? 'দুর্বল' : 'সন্তোষজনক'}
                      </span>
                      <span className="font-black text-slate-800">{sub.marks} ({sub.grade})</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        sub.percentage >= 75
                          ? 'bg-emerald-500'
                          : sub.percentage < 55
                          ? 'bg-rose-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis & Personalized Recommendations Box */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-white rounded-2xl border-2 border-indigo-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>এআই একাডেমিক বিশ্লেষণ ও সুপারিশ (AI Pedagogical Assessment & Recommendations)</span>
              </h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                {liveAIRecommendations?.growth || '+6% to +9% প্রবৃদ্ধি প্রত্যাশিত'}
              </span>
            </div>

            {/* AI Summary Text */}
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-indigo-100">
              {liveAIRecommendations?.summary || currentStudentAnalytics.aiSummary}
            </p>

            {/* AI Actionable Recommendations Checklist */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                বাস্তবায়নযোগ্য দিকনির্দেশনা (Actionable Recommendations):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {(liveAIRecommendations?.recommendations || currentStudentAnalytics.aiRecommendations).map(
                  (rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start space-x-2.5 shadow-xs"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <span className="text-slate-700 font-medium leading-snug">{rec}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
