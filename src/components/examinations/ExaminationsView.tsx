import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { StorageService } from '../../services/storage';
import { calculateSubjectGrade, calculateTotalGPA } from '../../utils/grading';
import { Exam, MarksEntry, Student, Subject, ExamScheduleItem, ClassLevel } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import { formatGroupName } from '../../utils/i18n';
import {
  Award,
  Search,
  Plus,
  Printer,
  CheckCircle,
  FileText,
  TrendingUp,
  Table,
  Eye,
  Sliders,
  Check,
  X,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Sparkles,
  Building,
  Trash2,
  Edit2,
  AlertCircle,
  FileCheck,
  Trophy,
  Medal,
  CheckCircle2,
  Scissors,
  Layers,
  Users,
  HelpCircle,
  Save,
  Lock,
  Unlock,
  User,
  Zap,
  CheckSquare,
  Grid,
  List,
} from 'lucide-react';
import {
  AdmitCardTemplate,
  AdmitCardFormat,
  InstructionMode,
  TableDensity,
} from '../certificates/AdmitCardTemplate';

// Helper to get subjects specifically matching a student's class and secondary stream (group)
export const getSubjectsForStudent = (student: Student, allClassSubjects: Subject[]): Subject[] => {
  if (!student) return allClassSubjects;
  const isNineOrTen = ['Class 9', 'Class 10'].includes(student.className);
  if (!isNineOrTen) {
    return allClassSubjects;
  }
  const sGroup = (student.group || 'Science').toLowerCase();
  return allClassSubjects.filter((sub) => {
    if (!sub.group || sub.group === 'General') return true;
    const subGroup = sub.group.toLowerCase();
    if (sGroup.includes('science') && subGroup.includes('science')) return true;
    if ((sGroup.includes('commerce') || sGroup.includes('business')) && (subGroup.includes('commerce') || subGroup.includes('business'))) return true;
    if ((sGroup.includes('humanities') || sGroup.includes('arts')) && (subGroup.includes('humanities') || subGroup.includes('arts'))) return true;
    if (sGroup.includes('vocational') && subGroup.includes('vocational')) return true;
    return subGroup === sGroup;
  });
};

export const ExaminationsView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { t, language, toBnNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<'exams' | 'exam_routine' | 'admit_cards' | 'marks_entry' | 'report_cards' | 'tabulation' | 'merit_list'>('exam_routine');

  const [exams, setExams] = useState<Exam[]>(() => StorageService.getExams());
  const [selectedExamId, setSelectedExamId] = useState<string>(() => exams[0]?.id || 'ex_1');
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub_10_ban');

  // Merit List Filters & Modal
  const [meritSection, setMeritSection] = useState<string>('all');
  const [meritShift, setMeritShift] = useState<string>('all');
  const [meritGroup, setMeritGroup] = useState<string>('all');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  const students = StorageService.getStudents();
  const subjects = StorageService.getSubjects();
  const [allMarks, setAllMarks] = useState<MarksEntry[]>(() => StorageService.getMarks());
  const [examRoutines, setExamRoutines] = useState<ExamScheduleItem[]>(() => StorageService.getExamRoutines());

  // Routine Modal state
  const [showRoutineModal, setShowRoutineModal] = useState<boolean>(false);
  const [editingRoutineItem, setEditingRoutineItem] = useState<ExamScheduleItem | null>(null);
  const [routineSubjectId, setRoutineSubjectId] = useState<string>('');
  const [routineDate, setRoutineDate] = useState<string>('2026-06-15');
  const [routineDay, setRoutineDay] = useState<string>('Monday');
  const [routineStartTime, setRoutineStartTime] = useState<string>('10:00 AM');
  const [routineEndTime, setRoutineEndTime] = useState<string>('01:00 PM');
  const [routineRoom, setRoutineRoom] = useState<string>('Room 201');

  // Smart Auto Exam Routine Generator State
  const [showAutoRoutineModal, setShowAutoRoutineModal] = useState<boolean>(false);
  const [autoRoutineExamId, setAutoRoutineExamId] = useState<string>('');
  const [autoRoutineTargetClass, setAutoRoutineTargetClass] = useState<ClassLevel | 'all'>('Class 9');
  const [autoRoutineStartDate, setAutoRoutineStartDate] = useState<string>('2026-03-05');
  const [autoRoutineEndDate, setAutoRoutineEndDate] = useState<string>('2026-03-20');
  const [autoRoutineStartTime, setAutoRoutineStartTime] = useState<string>('10:00 AM');
  const [autoRoutineEndTime, setAutoRoutineEndTime] = useState<string>('01:00 PM');
  const [autoRoutineRoom, setAutoRoutineRoom] = useState<string>('মূল কেন্দ্র / Room 201');
  const [autoRoutineSkipFridays, setAutoRoutineSkipFridays] = useState<boolean>(true);
  const [autoRoutineSkipSaturdays, setAutoRoutineSkipSaturdays] = useState<boolean>(() => StorageService.isSaturdayOff());
  const [autoRoutineSkipHolidays, setAutoRoutineSkipHolidays] = useState<boolean>(true);
  const [autoRoutineParallelGroup, setAutoRoutineParallelGroup] = useState<boolean>(true);
  const [autoRoutineHasGaps, setAutoRoutineHasGaps] = useState<boolean>(false);
  const [routineViewMode, setRoutineViewMode] = useState<'date_grouped' | 'table_list'>('date_grouped');
  const [showRoutinePrintModal, setShowRoutinePrintModal] = useState<boolean>(false);

  // Admit Card selection state
  const [selectedAdmitCardStudentId, setSelectedAdmitCardStudentId] = useState<string>('');
  const [showPrintAllAdmitCards, setShowPrintAllAdmitCards] = useState<boolean>(false);
  const [admitFormat, setAdmitFormat] = useState<AdmitCardFormat>('a4_full');
  const [admitTwoPerPageMode, setAdmitTwoPerPageMode] = useState<'duplicate' | 'two_students'>('duplicate');
  const [admitDensity, setAdmitDensity] = useState<TableDensity>('auto');
  const [admitInstructionMode, setAdmitInstructionMode] = useState<InstructionMode>('auto' as any);

  // Marksheet Modal State
  const [showTranscriptModal, setShowTranscriptModal] = useState<boolean>(false);
  const [transcriptStudent, setTranscriptStudent] = useState<Student | null>(null);

  // Exam Modal (Add / Edit)
  const [showAddExamModal, setShowAddExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [newExamNameEn, setNewExamNameEn] = useState<string>('');
  const [newExamNameBn, setNewExamNameBn] = useState<string>('');
  const [newExamTerm, setNewExamTerm] = useState<any>('half_yearly');
  const [newExamStart, setNewExamStart] = useState<string>('2026-06-15');
  const [newExamEnd, setNewExamEnd] = useState<string>('2026-06-30');

  // Explicit Mark Entry Save & Edit Mode State
  const [isEditingMarks, setIsEditingMarks] = useState<boolean>(true);
  const [marksSaveStatus, setMarksSaveStatus] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const canManage = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'teacher';
  const { schoolProfile } = useSchool();
  const school = schoolProfile;

  const handleSaveMarksExplicit = () => {
    if (!currentSubject) return;
    const currentSubjectEntries = allMarks.filter(
      (m) => m.examId === selectedExamId && m.subjectId === currentSubject.id
    );
    if (currentSubjectEntries.length > 0) {
      StorageService.saveMarksBatch(currentSubjectEntries);
    }
    const now = new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastSavedTime(now);
    setMarksSaveStatus('saved');
    setTimeout(() => {
      setMarksSaveStatus(null);
    }, 4000);
  };

  // Handle open add exam
  const handleOpenAddExam = () => {
    setEditingExam(null);
    setNewExamNameEn('');
    setNewExamNameBn('');
    setNewExamTerm('half_yearly');
    setNewExamStart('2026-06-15');
    setNewExamEnd('2026-06-30');
    setShowAddExamModal(true);
  };

  // Handle open edit exam
  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setNewExamNameEn(exam.nameEn);
    setNewExamNameBn(exam.nameBn);
    setNewExamTerm(exam.term);
    setNewExamStart(exam.startDate);
    setNewExamEnd(exam.endDate);
    setShowAddExamModal(true);
  };

  // Handle delete exam
  const handleDeleteExam = (exam: Exam) => {
    if (!canManage) return;
    const confirmMsg = language === 'bn'
      ? `আপনি কি নিশ্চিত যে "${exam.nameBn || exam.nameEn}" পরীক্ষাটি মুছে ফেলতে চান? এর সাথে যুক্ত সকল পরীক্ষার রুটিনও মুছে যাবে।`
      : `Are you sure you want to delete "${exam.nameEn}"? All scheduled routines for this exam will also be deleted.`;
    
    if (window.confirm(confirmMsg)) {
      StorageService.deleteExam(exam.id);
      const remaining = StorageService.getExams();
      setExams(remaining);
      setExamRoutines(StorageService.getExamRoutines());
      if (selectedExamId === exam.id) {
        if (remaining.length > 0) {
          setSelectedExamId(remaining[0].id);
        }
      }
    }
  };

  // Apply quick exam preset in modal
  const handleApplyExamPreset = (nameEn: string, nameBn: string, term: any, start: string, end: string) => {
    setNewExamNameEn(nameEn);
    setNewExamNameBn(nameBn);
    setNewExamTerm(term);
    setNewExamStart(start);
    setNewExamEnd(end);
  };

  // Current selected exam
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Identify student if student role is active
  const authenticatedStudent: Student | undefined = React.useMemo(() => {
    if (activeRole === 'student') {
      return (
        students.find((s) => s.id === currentUser?.linkedStudentId) ||
        students.find((s) => s.nameEn.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
        students.find((s) => s.id === 'std_1') ||
        students[0]
      );
    }
    return undefined;
  }, [activeRole, currentUser, students]);

  React.useEffect(() => {
    if (activeRole === 'student') {
      if (authenticatedStudent) {
        setSelectedClass(authenticatedStudent.className);
        setSelectedAdmitCardStudentId(authenticatedStudent.id);
      }
      if (activeTab === 'tabulation' || activeTab === 'merit_list' || activeTab === 'marks_entry') {
        setActiveTab('report_cards');
      }
    }
  }, [activeRole, authenticatedStudent, activeTab]);

  // Students for selected class (or for student role, restricted to self)
  const classStudents = React.useMemo(() => {
    if (activeRole === 'student' && authenticatedStudent) {
      return [authenticatedStudent];
    }
    return students.filter((s) => s.className === selectedClass && s.status === 'active');
  }, [students, selectedClass, activeRole, authenticatedStudent]);

  // Subjects for selected class
  const classSubjects = subjects.filter((s) => s.className === selectedClass);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || classSubjects[0];

  // Handle Mark Entry Change
  const handleMarkChange = (studentId: string, field: 'written' | 'mcq' | 'practical', value: number) => {
    if (!canManage || !currentSubject) return;

    const existingIndex = allMarks.findIndex(
      (m) => m.examId === selectedExamId && m.studentId === studentId && m.subjectId === currentSubject.id
    );

    let entry: MarksEntry;
    if (existingIndex >= 0) {
      entry = { ...allMarks[existingIndex], [field]: value };
    } else {
      entry = {
        id: `m_${Date.now()}_${studentId}`,
        examId: selectedExamId,
        studentId,
        subjectId: currentSubject.id,
        subjectName: currentSubject.nameEn,
        written: 0,
        mcq: 0,
        practical: 0,
        total: 0,
        grade: 'F',
        gpa: 0,
        [field]: value,
      };
    }

    const total = entry.written + entry.mcq + entry.practical;
    const gradeInfo = calculateSubjectGrade(total, currentSubject.fullMarks);
    entry.total = total;
    entry.grade = gradeInfo.grade;
    entry.gpa = gradeInfo.gpa;

    StorageService.saveMarksBatch([entry]);
    setAllMarks(StorageService.getMarks());
  };

  const getStudentMarkForSubject = (studentId: string, subjectId: string): MarksEntry | undefined => {
    return allMarks.find(
      (m) => m.examId === selectedExamId && m.studentId === studentId && m.subjectId === subjectId
    );
  };

  // Toggle publish status
  const handleTogglePublish = (exam: Exam) => {
    if (!canManage) return;
    const updated = { ...exam, isPublished: !exam.isPublished };
    StorageService.saveExam(updated);
    setExams(StorageService.getExams());
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamNameEn) return;

    if (editingExam) {
      const updatedExam: Exam = {
        ...editingExam,
        nameEn: newExamNameEn,
        nameBn: newExamNameBn || newExamNameEn,
        term: newExamTerm,
        startDate: newExamStart,
        endDate: newExamEnd,
      };
      StorageService.saveExam(updatedExam);
      setExams(StorageService.getExams());
      setShowAddExamModal(false);
      setEditingExam(null);
    } else {
      const exam: Exam = {
        id: `ex_${Date.now()}`,
        nameEn: newExamNameEn,
        nameBn: newExamNameBn || newExamNameEn,
        term: newExamTerm,
        session: '2026',
        startDate: newExamStart,
        endDate: newExamEnd,
        isPublished: false,
        applicableClasses: ['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
      };
      StorageService.saveExam(exam);
      setExams(StorageService.getExams());
      setShowAddExamModal(false);
      setSelectedExamId(exam.id);
    }
  };

  // Current class routines
  const currentClassRoutines = StorageService.getRoutinesForClassAndExam(
    selectedExamId,
    selectedClass as ClassLevel
  );

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysOfWeekBn: Record<string, string> = {
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
    Friday: 'শুক্রবার',
    Saturday: 'শনিবার',
  };

  const handleOpenAddRoutine = () => {
    setEditingRoutineItem(null);
    const firstSub = classSubjects[0];
    setRoutineSubjectId(firstSub?.id || '');
    setRoutineDate(currentExam?.startDate || '2026-06-15');
    const d = new Date(currentExam?.startDate || '2026-06-15');
    setRoutineDay(daysOfWeek[d.getDay()] || 'Monday');
    setRoutineStartTime('10:00 AM');
    setRoutineEndTime(selectedClass === 'Nursery' || selectedClass === 'KG' ? '11:30 AM' : '01:00 PM');
    setRoutineRoom(selectedClass === 'Nursery' ? 'Nursery Hall' : selectedClass === 'KG' ? 'KG Hall' : 'Room 201');
    setShowRoutineModal(true);
  };

  const handleOpenEditRoutine = (item: ExamScheduleItem) => {
    setEditingRoutineItem(item);
    const sub = subjects.find((s) => s.className === item.className && (s.code === item.subjectCode || s.nameEn === item.subjectNameEn));
    setRoutineSubjectId(sub?.id || '');
    setRoutineDate(item.examDate);
    setRoutineDay(item.dayOfWeek || 'Monday');
    setRoutineStartTime(item.startTime);
    setRoutineEndTime(item.endTime);
    setRoutineRoom(item.roomNo || 'Room 201');
    setShowRoutineModal(true);
  };

  const handleSaveRoutineItem = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === routineSubjectId) || classSubjects[0];
    if (!sub) return;

    if (editingRoutineItem) {
      const updated: ExamScheduleItem = {
        ...editingRoutineItem,
        subjectCode: sub.code,
        subjectNameEn: sub.nameEn,
        subjectNameBn: sub.nameBn,
        examDate: routineDate,
        dayOfWeek: routineDay,
        startTime: routineStartTime,
        endTime: routineEndTime,
        roomNo: routineRoom,
      };
      StorageService.updateExamRoutineItem(updated);
    } else {
      const newItem: ExamScheduleItem = {
        id: `er_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        examId: selectedExamId,
        className: selectedClass as ClassLevel,
        subjectCode: sub.code,
        subjectNameEn: sub.nameEn,
        subjectNameBn: sub.nameBn,
        examDate: routineDate,
        dayOfWeek: routineDay,
        startTime: routineStartTime,
        endTime: routineEndTime,
        roomNo: routineRoom,
      };
      StorageService.addExamRoutineItem(newItem);
    }
    setExamRoutines(StorageService.getExamRoutines());
    setShowRoutineModal(false);
  };

  const handleDeleteRoutineItem = (id: string) => {
    if (confirm(language === 'bn' ? 'আপনি কি রুটিন থেকে এই বিষয়টি মুছে ফেলতে চান?' : 'Are you sure you want to delete this routine entry?')) {
      StorageService.deleteExamRoutineItem(id);
      setExamRoutines(StorageService.getExamRoutines());
    }
  };

  const handleOpenAutoRoutineModal = () => {
    setAutoRoutineExamId(selectedExamId);
    setAutoRoutineTargetClass(selectedClass as ClassLevel);
    if (currentExam) {
      setAutoRoutineStartDate(currentExam.startDate || '2026-03-05');
      setAutoRoutineEndDate(currentExam.endDate || '2026-03-20');
    }
    setShowAutoRoutineModal(true);
  };

  const handleApply1stModelTestPreset = () => {
    const modelExam = exams.find(
      (e) =>
        e.id === 'exam_1st_model_test_2026' ||
        e.nameEn.toLowerCase().includes('model test') ||
        e.nameBn.includes('মডেল টেস্ট')
    );
    if (modelExam) {
      setSelectedExamId(modelExam.id);
      setAutoRoutineExamId(modelExam.id);
    }
    setAutoRoutineStartDate('2026-03-05');
    setAutoRoutineEndDate('2026-03-20');
    setAutoRoutineStartTime('10:00 AM');
    setAutoRoutineEndTime('01:00 PM');
    setAutoRoutineSkipFridays(true);
    setAutoRoutineSkipSaturdays(true);
    setAutoRoutineSkipHolidays(true);
    setAutoRoutineParallelGroup(true);
    setAutoRoutineHasGaps(false);
    setAutoRoutineTargetClass(selectedClass as ClassLevel);
    setShowAutoRoutineModal(true);
  };

  const handleAutoGenerateRoutine = () => {
    handleOpenAutoRoutineModal();
  };

  const handleExecuteSmartRoutine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetExamId = autoRoutineExamId || selectedExamId;
    StorageService.generateSmartExamRoutine({
      examId: targetExamId,
      className: autoRoutineTargetClass,
      startDate: autoRoutineStartDate,
      endDate: autoRoutineEndDate,
      startTime: autoRoutineStartTime,
      endTime: autoRoutineEndTime,
      roomNo: autoRoutineRoom,
      skipFridays: autoRoutineSkipFridays,
      skipSaturdays: autoRoutineSkipSaturdays,
      skipHolidays: autoRoutineSkipHolidays,
      parallelGroupSubjects: autoRoutineParallelGroup,
      hasGapDays: autoRoutineHasGaps,
      overwriteExisting: true,
    });
    setExamRoutines(StorageService.getExamRoutines());
    setShowAutoRoutineModal(false);
  };

  // Live preview working dates for modal
  const previewWorkingDates = React.useMemo(() => {
    return StorageService.getWorkingDatesForRange(
      autoRoutineStartDate,
      autoRoutineEndDate,
      autoRoutineSkipFridays,
      autoRoutineSkipSaturdays,
      autoRoutineSkipHolidays
    );
  }, [autoRoutineStartDate, autoRoutineEndDate, autoRoutineSkipFridays, autoRoutineSkipSaturdays, autoRoutineSkipHolidays]);

  // Live preview slots for modal
  const previewSlots = React.useMemo(() => {
    const targetCls = autoRoutineTargetClass === 'all' ? selectedClass : autoRoutineTargetClass;
    const clsSubjects = subjects.filter((s) => s.className === targetCls);
    if (clsSubjects.length === 0) return [];

    const isSecondaryGroupClass = ['Class 9', 'Class 10'].includes(targetCls);
    const slots: { slotNumber: number; title: string; subjects: Subject[]; isParallel: boolean }[] = [];

    if (isSecondaryGroupClass && autoRoutineParallelGroup) {
      const compulsory = clsSubjects.filter((s) => !s.group || s.group.toLowerCase() === 'all');
      compulsory.forEach((sub) => {
        slots.push({
          slotNumber: slots.length + 1,
          title: `${sub.nameBn || sub.nameEn} (আবশ্যিক)`,
          subjects: [sub],
          isParallel: false,
        });
      });

      const scienceSubs = clsSubjects.filter((s) => s.group?.toLowerCase().includes('science'));
      const commerceSubs = clsSubjects.filter(
        (s) => s.group?.toLowerCase().includes('commerce') || s.group?.toLowerCase().includes('business')
      );
      const humanitiesSubs = clsSubjects.filter(
        (s) => s.group?.toLowerCase().includes('humanities') || s.group?.toLowerCase().includes('arts')
      );
      const vocationalSubs = clsSubjects.filter((s) => s.group?.toLowerCase().includes('vocational'));

      const maxGroupLen = Math.max(
        scienceSubs.length,
        commerceSubs.length,
        humanitiesSubs.length,
        vocationalSubs.length
      );

      for (let i = 0; i < maxGroupLen; i++) {
        const pSubs: Subject[] = [];
        if (scienceSubs[i]) pSubs.push(scienceSubs[i]);
        if (commerceSubs[i]) pSubs.push(commerceSubs[i]);
        if (humanitiesSubs[i]) pSubs.push(humanitiesSubs[i]);
        if (vocationalSubs[i]) pSubs.push(vocationalSubs[i]);

        if (pSubs.length > 0) {
          slots.push({
            slotNumber: slots.length + 1,
            title: `বিভাগীয় বিষয়সমূহ (${i + 1}) - একই তারিখে ৪ গ্রুপ`,
            subjects: pSubs,
            isParallel: true,
          });
        }
      }
    } else {
      clsSubjects.forEach((sub, idx) => {
        slots.push({
          slotNumber: idx + 1,
          title: sub.nameBn || sub.nameEn,
          subjects: [sub],
          isParallel: false,
        });
      });
    }

    return slots;
  }, [autoRoutineTargetClass, selectedClass, autoRoutineParallelGroup, subjects]);

  const handleOpenTranscript = (student: Student) => {
    setTranscriptStudent(student);
    setShowTranscriptModal(true);
  };

  const [routineGroupFilter, setRoutineGroupFilter] = useState<string>('all');

  const admitCardStudent = classStudents.find((s) => s.id === selectedAdmitCardStudentId) || classStudents[0];

  // Group-filtered routines for Routine Tab display
  const displayClassRoutines = currentClassRoutines.filter((item) => {
    if (!['Class 9', 'Class 10'].includes(selectedClass)) return true;
    if (routineGroupFilter === 'all') return true;
    if (routineGroupFilter === 'compulsory') return !item.group || item.group.toLowerCase() === 'all';
    return (
      !item.group ||
      item.group.toLowerCase() === 'all' ||
      item.group.toLowerCase().includes(routineGroupFilter.toLowerCase())
    );
  });

  // Group routines by date for modern parallel view
  const groupedRoutinesByDate = React.useMemo(() => {
    const map = new Map<string, ExamScheduleItem[]>();
    displayClassRoutines.forEach((r) => {
      if (!map.has(r.examDate)) {
        map.set(r.examDate, []);
      }
      map.get(r.examDate)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [displayClassRoutines]);

  // Routine filtered strictly for the specific student's group on Admit Card
  const admitCardRoutines = currentClassRoutines.filter((item) => {
    if (!admitCardStudent) return true;
    if (!['Class 9', 'Class 10'].includes(admitCardStudent.className)) return true;
    const sGroup = (admitCardStudent.group || 'Science').toLowerCase();
    // Compulsory subjects with no group or 'all' apply to all students
    if (!item.group || item.group.toLowerCase() === 'all') return true;
    const iGroup = item.group.toLowerCase();
    if (sGroup.includes('science') && iGroup.includes('science')) return true;
    if ((sGroup.includes('commerce') || sGroup.includes('business')) && (iGroup.includes('commerce') || iGroup.includes('business'))) return true;
    if ((sGroup.includes('humanities') || sGroup.includes('arts')) && (iGroup.includes('humanities') || iGroup.includes('arts'))) return true;
    if (sGroup.includes('vocational') && iGroup.includes('vocational')) return true;
    return iGroup === sGroup;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'পরীক্ষা ও ফলাফল ব্যবস্থাপনা' : 'Examinations & Result Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'এনসিটিবি গ্রেডিং স্কেল (GPA 5.00), নম্বর এন্ট্রি, ট্রান্সক্রিপ্ট ও ট্যাবুলেশন শিট'
              : 'NCTB grading scale (GPA 5.00), marks entry, transcripts & master tabulation sheet'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtabs */}
          <div className="p-1 bg-slate-100 rounded-lg flex flex-wrap gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('exam_routine')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'exam_routine' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পরীক্ষার রুটিন' : 'Exam Routine'}</span>
            </button>
            <button
              onClick={() => setActiveTab('admit_cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'admit_cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রবেশপত্র (Admit Cards)' : 'Admit Cards'}</span>
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'exams' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'পরীক্ষার তালিকা' : 'Exams'}
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('marks_entry')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'marks_entry' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'নম্বর এন্ট্রি' : 'Marks Entry'}
              </button>
            )}
            <button
              onClick={() => setActiveTab('report_cards')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'report_cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'মার্কশিট' : 'Report Cards'}
            </button>
            {activeRole !== 'student' && (
              <button
                onClick={() => setActiveTab('tabulation')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'tabulation' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'ট্যাবুলেশন শিট' : 'Tabulation'}
              </button>
            )}
            {activeRole !== 'student' && (
              <button
                onClick={() => setActiveTab('merit_list')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'merit_list'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:text-amber-800 hover:bg-amber-50 font-semibold'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'bn' ? 'মেধা তালিকা' : 'Merit List'}</span>
              </button>
            )}
          </div>

          {canManage && activeTab === 'exams' && (
            <button
              onClick={handleOpenAddExam}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন পরীক্ষা তৈরি' : '+ New Exam'}</span>
            </button>
          )}

          {canManage && activeTab === 'exam_routine' && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleAutoGenerateRoutine}
                className="flex items-center space-x-1 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                title="Auto generate routine with 2 days gap skipping Fridays"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'bn' ? 'অটো জেনারেট' : 'Auto Generate'}</span>
              </button>
              <button
                onClick={handleOpenAddRoutine}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bn' ? '+ বিষয় যোগ' : '+ Add Subject'}</span>
              </button>
              <button
                onClick={() => setShowRoutinePrintModal(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>{language === 'bn' ? 'রুটিন প্রিন্ট' : 'Print Routine'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selector Bar for Exam, Class, and Subject */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Exam Selector */}
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600" />
            <label className="font-semibold text-slate-700">Exam:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {language === 'bn' ? ex.nameBn : ex.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector - ALL 12 CLASSES */}
          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const sub = subjects.find((s) => s.className === e.target.value);
                if (sub) setSelectedSubjectId(sub.id);
                const std = students.find((s) => s.className === e.target.value && s.status === 'active');
                if (std) setSelectedAdmitCardStudentId(std.id);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-blue-800"
            >
              {['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Subject Selector (if in marks entry mode) */}
          {activeTab === 'marks_entry' && (
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <label className="font-semibold text-slate-700">Subject:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {classSubjects.map((sub) => {
                  let groupLabel = '';
                  if (sub.group === 'Science') groupLabel = ' [বিজ্ঞান / Science]';
                  else if (sub.group === 'Commerce') groupLabel = ' [ব্যবসায় শিক্ষা / Commerce]';
                  else if (sub.group === 'Humanities' || sub.group === 'Arts') groupLabel = ' [মানবিক / Humanities]';
                  else if (sub.group === 'Vocational') groupLabel = ' [কারিগরি / Vocational]';
                  else if (['Class 9', 'Class 10'].includes(selectedClass)) groupLabel = ' [বাধ্যতামূলক / Compulsory]';

                  return (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {language === 'bn' ? (sub.nameBn || sub.nameEn) : sub.nameEn}{groupLabel} (Full: {sub.fullMarks})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Publication status */}
        <div className="flex items-center space-x-2 text-xs">
          {currentExam?.isPublished ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ফলাফল প্রকাশিত' : 'Result Published'}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
              {language === 'bn' ? 'খসড়া / অপ্রকাশিত' : 'Draft / Unpublished'}
            </span>
          )}
          {canManage && (
            <button
              onClick={() => currentExam && handleTogglePublish(currentExam)}
              className="px-3 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-slate-700"
            >
              {currentExam?.isPublished ? 'Unpublish' : 'Publish Result'}
            </button>
          )}
        </div>
      </div>

      {/* TAB: EXAM ROUTINE */}
      {activeTab === 'exam_routine' && (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-700/80 text-blue-100 text-[10px] font-extrabold uppercase tracking-wider">
                  {currentExam?.term || 'Official Exam'}
                </span>
                <span className="text-blue-300 text-xs font-semibold">
                  Session {currentExam?.session || '2026'}
                </span>
              </div>
              <h3 className="text-lg font-black mt-1">
                {currentExam?.nameEn} • {selectedClass} Exam Routine
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                {currentExam?.nameBn} • {selectedClass}-এর অফিসিয়াল পরীক্ষা রুটিন
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleApply1stModelTestPreset}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all scale-100 hover:scale-[1.02]"
                title="১ম মডেল টেস্ট পরীক্ষা (০৫/০৩/২০২৬ - ২০/০৩/২০২৬) স্বয়ংক্রিয় রুটিন প্রিসেট"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                <span>{language === 'bn' ? '১ম মডেল টেস্ট (০৫-২০ মার্চ)' : '1st Model Test (05-20 Mar)'}</span>
              </button>
              <button
                onClick={() => setActiveTab('admit_cards')}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span>{language === 'bn' ? 'প্রবেশপত্র' : 'Admit Cards'}</span>
              </button>
              {canManage && (
                <>
                  <button
                    onClick={handleOpenAutoRoutineModal}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white border border-blue-500/80 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'bn' ? 'স্মার্ট অটো জেনারেটর' : 'Smart Auto Generator'}</span>
                  </button>
                  <button
                    onClick={handleOpenAddRoutine}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'bn' ? '+ বিষয় যোগ' : '+ Add Subject'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bangladesh Curriculum Info Banner for Class 9 and 10 */}
          {['Class 9', 'Class 10'].includes(selectedClass) && (
            <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs print:hidden shadow-xs">
              <div className="flex items-start space-x-2.5">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h5 className="font-bold text-blue-950">
                    {language === 'bn'
                      ? 'মাধ্যমিক কারিকুলাম সমন্বিত সমান্তরাল রুটিন (SSC Curriculum Parallel Slotting)'
                      : 'SSC Board Curriculum Parallel Exam Scheduling'}
                  </h5>
                  <p className="text-slate-600 mt-0.5">
                    {language === 'bn'
                      ? 'বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক ও ভোকেশনাল বিভাগের শিক্ষার্থীদের বিভাগীয় পরীক্ষা একই দিনে একই সময়ে অনুষ্ঠিত হয়। প্রবেশপত্রে প্রত্যেক শিক্ষার্থী শুধুমাত্র তার স্ব-স্ব বিভাগের বিষয় দেখতে পাবে।'
                      : 'Science, Commerce, Humanities, and Vocational departmental exams are held on the same date at the same time. Each student only takes their respective group exam.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                <span className="text-[11px] font-bold text-slate-500">ভিউ মোড:</span>
                <div className="inline-flex rounded-xl p-0.5 bg-white border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRoutineViewMode('date_grouped')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      routineViewMode === 'date_grouped'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'তারিখভিত্তিক গ্রুপ' : 'Grouped'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoutineViewMode('table_list')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      routineViewMode === 'table_list'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সাধারণ তালিকা' : 'Table List'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="hidden print:block text-center p-4 border-b-2 border-slate-900">
              <img
                src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                alt="School Logo"
                className="w-14 h-14 object-contain mx-auto mb-2"
              />
              <h1 className="text-xl font-black">{school.nameBn}</h1>
              <h2 className="text-sm font-bold text-slate-700">{school.nameEn}</h2>
              <p className="text-xs text-slate-600">{school.addressBn} • EIIN: {school.eiin}</p>
              <div className="mt-2 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                EXAMINATION ROUTINE • {currentExam?.nameEn} ({selectedClass}{routineGroupFilter !== 'all' ? ` - ${routineGroupFilter}` : ''})
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900">
                    {selectedClass} Routine Schedule ({displayClassRoutines.length} Subject Entries)
                  </h4>
                </div>
                {['Class 9', 'Class 10'].includes(selectedClass) && (
                  <div className="flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300">
                    <span className="font-bold text-amber-950 text-[11px]">বিভাগ / Group:</span>
                    <select
                      value={routineGroupFilter}
                      onChange={(e) => setRoutineGroupFilter(e.target.value)}
                      className="px-2 py-0.5 border border-amber-300 rounded text-xs bg-white font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="all">সকল বিষয় (All Groups)</option>
                      <option value="compulsory">আবশ্যিক বিষয় (Compulsory)</option>
                      <option value="Science">বিজ্ঞান (Science)</option>
                      <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                      <option value="Humanities">মানবিক (Humanities)</option>
                      <option value="Vocational">ভোকেশনাল (Vocational)</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3 text-slate-500 font-medium">
                <span>
                  {language === 'bn'
                    ? 'প্রবেশপত্রে শিক্ষার্থীদের সংশ্লিষ্ট বিভাগের রুটিন স্বয়ংক্রিয়ভাবে দৃশ্যমান হবে।'
                    : 'Admit cards reflect these subject dates automatically.'}
                </span>
                <button
                  onClick={() => setShowRoutinePrintModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center space-x-1 shadow-xs active:scale-95 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রিন্ট রুটিন' : 'Print Routine'}</span>
                </button>
              </div>
            </div>

            {/* DATE GROUPED PARALLEL VIEW MODE */}
            {routineViewMode === 'date_grouped' && displayClassRoutines.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {groupedRoutinesByDate.map(([dateStr, items]) => {
                  const dayName = items[0]?.dayOfWeek || 'Sunday';
                  const hasParallel = items.length > 1;

                  return (
                    <div key={dateStr} className={`p-4 transition-colors ${hasParallel ? 'bg-amber-50/20' : 'bg-white'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 bg-blue-900 text-white rounded-lg font-bold font-mono text-xs shadow-xs">
                            {dateStr}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {dayName} {daysOfWeekBn[dayName] ? `(${daysOfWeekBn[dayName]})` : ''}
                          </span>
                          {hasParallel ? (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-black uppercase flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>একই তারিখে সমান্তরাল {items.length}টি বিভাগীয় পরীক্ষা</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                              {items[0]?.group ? items[0]?.group : 'সাধারণ / আবশ্যিক'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <strong className="text-slate-800">{items[0]?.startTime} - {items[0]?.endTime}</strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5 text-emerald-600" />
                            <strong className="text-slate-800">{items[0]?.roomNo || 'Main Hall'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Parallel Cards Grid for multiple subjects on this date */}
                      <div className={`grid gap-3 ${hasParallel ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                        {items.map((item) => {
                          const groupLower = (item.group || '').toLowerCase();
                          let borderClass = 'border-slate-200 bg-slate-50/50';
                          let badgeBg = 'bg-slate-100 text-slate-800 border-slate-300';

                          if (groupLower.includes('science')) {
                            borderClass = 'border-blue-300 bg-blue-50/40 hover:bg-blue-50/70';
                            badgeBg = 'bg-blue-600 text-white border-blue-700';
                          } else if (groupLower.includes('commerce') || groupLower.includes('business')) {
                            borderClass = 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70';
                            badgeBg = 'bg-emerald-600 text-white border-emerald-700';
                          } else if (groupLower.includes('humanities') || groupLower.includes('arts')) {
                            borderClass = 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70';
                            badgeBg = 'bg-amber-600 text-white border-amber-700';
                          } else if (groupLower.includes('vocational')) {
                            borderClass = 'border-purple-300 bg-purple-50/40 hover:bg-purple-50/70';
                            badgeBg = 'bg-purple-600 text-white border-purple-700';
                          }

                          return (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-xl border ${borderClass} shadow-xs flex flex-col justify-between transition-all`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900 shadow-2xs">
                                    কোড: {item.subjectCode}
                                  </span>
                                  {Boolean(item.group) ? (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badgeBg}`}>
                                      {item.group === 'Commerce' ? 'বাণিজ্য' : item.group === 'Science' ? 'বিজ্ঞান' : item.group === 'Humanities' ? 'মানবিক' : item.group === 'Vocational' ? 'ভোকেশনাল' : item.group}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                      আবশ্যিক
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-sm leading-snug">
                                  {item.subjectNameBn || item.subjectNameEn}
                                </h5>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {item.subjectNameEn}
                                </p>
                              </div>

                              {canManage && (
                                <div className="flex items-center justify-end space-x-1.5 mt-3 pt-2 border-t border-slate-200/60 print:hidden">
                                  <button
                                    onClick={() => handleOpenEditRoutine(item)}
                                    className="p-1 hover:bg-white text-slate-500 rounded-md hover:text-blue-600 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRoutineItem(item.id)}
                                    className="p-1 hover:bg-white text-slate-400 rounded-md hover:text-rose-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* CLASSIC TABLE LIST VIEW MODE (or fallback for empty list) */}
            <div className={`overflow-x-auto ${routineViewMode === 'date_grouped' && displayClassRoutines.length > 0 ? 'hidden print:block' : ''}`}>
              <table className="w-full text-left border-collapse text-xs print:border print:border-slate-800">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] print:bg-slate-100">
                    <th className="py-3 px-4 w-12 text-center print:border print:border-slate-800">Sl</th>
                    <th className="py-3 px-4 w-24 text-center print:border print:border-slate-800">Code</th>
                    <th className="py-3 px-4 print:border print:border-slate-800">Subject Name (বিষয়)</th>
                    <th className="py-3 px-4 w-44 text-center print:border print:border-slate-800">Exam Date & Day (তারিখ ও বার)</th>
                    <th className="py-3 px-4 w-40 text-center print:border print:border-slate-800">Time (সময়)</th>
                    <th className="py-3 px-4 w-32 text-center print:border print:border-slate-800">Exam Hall (কক্ষ)</th>
                    {canManage && <th className="py-3 px-4 w-28 text-right print:hidden">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-800">
                  {displayClassRoutines.length > 0 ? (
                    displayClassRoutines.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400 print:border print:border-slate-800 print:text-black">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 text-center print:border print:border-slate-800">
                          <span className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs print:border-none print:bg-transparent print:text-black">
                            {item.subjectCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 print:border print:border-slate-800">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{item.subjectNameEn}</span>
                            {Boolean(item.group) && (item.group as string) !== 'all' && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                                item.group === 'Science'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : item.group === 'Commerce'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : item.group === 'Humanities'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-purple-100 text-purple-900 border-purple-300'
                              } print:border-slate-600 print:bg-transparent`}>
                                {item.group}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.subjectNameBn}</div>
                        </td>
                        <td className="py-3 px-4 text-center print:border print:border-slate-800">
                          <strong className="text-slate-900 block font-semibold">{item.examDate}</strong>
                          <span className="text-[11px] text-blue-700 font-medium print:text-slate-700">
                            {item.dayOfWeek} {item.dayOfWeek && daysOfWeekBn[item.dayOfWeek] ? `(${daysOfWeekBn[item.dayOfWeek]})` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700 print:border print:border-slate-800">
                          <div className="inline-flex items-center space-x-1 text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400 print:hidden" />
                            <span>{item.startTime} - {item.endTime}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700 print:border print:border-slate-800">
                          {item.roomNo || 'Main Hall'}
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-right print:hidden">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditRoutine(item)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoutineItem(item.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="py-12 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <h4 className="font-bold text-slate-800 text-sm">
                            {language === 'bn' ? 'কোনো রুটিন পাওয়া যায়নি' : 'No Routine Found for ' + selectedClass}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {language === 'bn'
                              ? '"১ম মডেল টেস্ট" অথবা "স্মার্ট অটো জেনারেটর" বাটনে চাপ দিয়ে ০৫/০৩/২৬ থেকে ২০/০৩/২৬ তারিখের রুটিন তৈরি করুন।'
                              : 'Click "1st Model Test" or "Smart Auto Generator" to populate the exam routine.'}
                          </p>
                          {canManage && (
                            <div className="flex items-center justify-center gap-2 pt-2">
                              <button
                                onClick={handleApply1stModelTestPreset}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-xs"
                              >
                                <Zap className="w-4 h-4 text-slate-950 fill-current" />
                                <span>{language === 'bn' ? '১ম মডেল টেস্ট রুটিন প্রস্তুত' : 'Setup 1st Model Test'}</span>
                              </button>
                              <button
                                onClick={handleOpenAutoRoutineModal}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>{language === 'bn' ? 'কাস্টম অটো জেনারেটর' : 'Custom Generator'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="hidden print:flex justify-between items-end p-6 pt-16 text-xs border-t border-slate-800 mt-6">
              <div className="text-center w-40">
                <div className="border-t border-slate-800 pt-1 font-bold">Class Teacher</div>
              </div>
              <div className="text-center w-48">
                <div className="border-t border-slate-800 pt-1 font-bold">Principal / Head Teacher</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADMIT CARDS */}
      {activeTab === 'admit_cards' && (
        <div className="space-y-4">
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

          {/* Control Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5 print:hidden text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <label className="font-bold text-slate-800">Select Student in {selectedClass}:</label>
                  <select
                    value={admitCardStudent?.id || ''}
                    onChange={(e) => setSelectedAdmitCardStudentId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500"
                    disabled={showPrintAllAdmitCards}
                  >
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        Roll {s.roll} • {s.nameEn} ({s.studentId})
                      </option>
                    ))}
                    {classStudents.length === 0 && (
                      <option value="">No students in {selectedClass}</option>
                    )}
                  </select>
                </div>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">
                  Total in Class: <strong>{classStudents.length}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPrintAllAdmitCards(!showPrintAllAdmitCards)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                    showPrintAllAdmitCards
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {showPrintAllAdmitCards
                      ? (language === 'bn' ? `সকল ${classStudents.length} জনের মোড চালু` : `Bulk ON (${classStudents.length})`)
                      : (language === 'bn' ? `শ্রেণির সবার প্রিন্ট (${classStudents.length} জন)` : `Print All (${classStudents.length})`)}
                  </span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? 'প্রবেশপত্র প্রিন্ট' : 'Print Admit Card'}</span>
                </button>
              </div>
            </div>

            {/* Layout, Half-A4, Density & Instructions Toolbar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Page Format Selector */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'সাইজ / লেআউট:' : 'Layout Size:'}</span>
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
                    {language === 'bn' ? 'A4 পূর্ণ পাতা (Single)' : 'A4 Full Page'}
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

              {/* 2nd Card Option in 2 per page mode */}
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

              {/* Density & Instruction Selectors */}
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
              </div>
            </div>

            {/* Smart Advisory Banner */}
            <div className="p-2.5 rounded-xl border text-xs bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {admitCardRoutines.length <= 7 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'bn' ? 'কম বিষয়' : 'Few Subjects'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>{language === 'bn' ? `${admitCardRoutines.length}টি বিষয়` : `${admitCardRoutines.length} Subjects`}</span>
                  </span>
                )}
                <span className="text-slate-700 font-medium text-[11px]">
                  {admitCardRoutines.length <= 7 ? (
                    language === 'bn'
                      ? `এই শ্রেণিতে মোট ${admitCardRoutines.length}টি বিষয় রয়েছে। পেপার সাশ্রয় করতে 'হাফ A4' অথবা '১ পাতায় ২টি (পেপার সেভার)' বেছে নিতে পারেন!`
                      : `This class has ${admitCardRoutines.length} subjects. Consider using 'Half A4' or '2 Cards / A4' to save paper!`
                  ) : (
                    language === 'bn'
                      ? `এই শ্রেণিতে মোট ${admitCardRoutines.length}টি বিষয় রয়েছে। এটি কোনো অবস্থাতেই A4 সাইজের বাইরে যাবে না—নিখুঁত ১ পেজে ফিট রাখার জন্য অপ্টিমাইজ করা হয়েছে!`
                      : `This class has ${admitCardRoutines.length} subjects. It is strictly optimized to never exceed 1 single A4 sheet!`
                  )}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                A4 Max: 280mm
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex justify-center bg-slate-100 p-4 md:p-8 rounded-2xl border border-slate-200 print:bg-white print:p-0 print:border-none">
            {admitCardStudent ? (
              <div className="w-full">
                {!showPrintAllAdmitCards ? (
                  /* Single Card Mode */
                  <AdmitCardTemplate
                    school={school}
                    student={admitCardStudent}
                    exam={currentExam}
                    routines={admitCardRoutines}
                    format={admitFormat}
                    instructionMode={admitInstructionMode}
                    density={admitDensity}
                    twoPerPageMode={admitTwoPerPageMode}
                    pairedStudent={classStudents.find((s) => s.id !== admitCardStudent.id) || admitCardStudent}
                    pairedRoutines={currentClassRoutines}
                    language={language}
                  />
                ) : (
                  /* Bulk Print Mode for Selected Class */
                  <div className="space-y-6 print:space-y-0">
                    {admitFormat === 'two_per_page' ? (
                      Array.from({ length: Math.ceil(classStudents.length / (admitTwoPerPageMode === 'two_students' ? 2 : 1)) }).map((_, sheetIdx) => {
                        const firstStd = admitTwoPerPageMode === 'two_students'
                          ? classStudents[sheetIdx * 2]
                          : classStudents[sheetIdx];
                        const secondStd = admitTwoPerPageMode === 'two_students'
                          ? classStudents[sheetIdx * 2 + 1]
                          : firstStd;
                        if (!firstStd) return null;

                        const firstRoutines = currentClassRoutines.filter((item) => {
                          if (!['Class 9', 'Class 10'].includes(firstStd.className)) return true;
                          const sGroup = (firstStd.group || 'Science').toLowerCase();
                          if (!item.group || item.group.toLowerCase() === 'all') return true;
                          return item.group.toLowerCase().includes(sGroup);
                        });

                        const secondRoutines = secondStd ? currentClassRoutines.filter((item) => {
                          if (!['Class 9', 'Class 10'].includes(secondStd.className)) return true;
                          const sGroup = (secondStd.group || 'Science').toLowerCase();
                          if (!item.group || item.group.toLowerCase() === 'all') return true;
                          return item.group.toLowerCase().includes(sGroup);
                        }) : firstRoutines;

                        return (
                          <div key={sheetIdx} className="print-page-break pb-6 print:pb-0">
                            <AdmitCardTemplate
                              school={school}
                              student={firstStd}
                              exam={currentExam}
                              routines={firstRoutines}
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
                      classStudents.map((std, idx) => {
                        const stdRoutines = currentClassRoutines.filter((item) => {
                          if (!['Class 9', 'Class 10'].includes(std.className)) return true;
                          const sGroup = (std.group || 'Science').toLowerCase();
                          if (!item.group || item.group.toLowerCase() === 'all') return true;
                          return item.group.toLowerCase().includes(sGroup);
                        });

                        return (
                          <div key={std.id || idx} className="print-page-break pb-6 print:pb-0">
                            <AdmitCardTemplate
                              school={school}
                              student={std}
                              exam={currentExam}
                              routines={stdRoutines}
                              format={admitFormat}
                              instructionMode={admitInstructionMode}
                              density={admitDensity}
                              language={language}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">
                No active students enrolled in {selectedClass}. Please choose another class or admit students first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Exams Overview */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                      Session {exam.session}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(exam)}
                      className="cursor-pointer"
                      title={language === 'bn' ? 'স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন' : 'Click to toggle status'}
                    >
                      {exam.isPublished ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-100">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100">
                          Draft
                        </span>
                      )}
                    </button>
                  </div>
                  {canManage && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExam(exam)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={language === 'bn' ? 'পরীক্ষা সম্পাদনা করুন' : 'Edit Exam'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={language === 'bn' ? 'পরীক্ষা মুছে ফেলুন' : 'Delete Exam'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  {language === 'bn' ? exam.nameBn : exam.nameEn}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Schedule: {exam.startDate} to {exam.endDate}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {exam.applicableClasses.map((cls) => (
                    <span key={cls} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    setActiveTab('marks_entry');
                  }}
                  className="font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>{language === 'bn' ? 'নম্বর এন্ট্রি' : 'Enter Marks'}</span>
                  <span>&rarr;</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    setActiveTab('tabulation');
                  }}
                  className="font-semibold text-slate-600 hover:text-slate-900"
                >
                  {language === 'bn' ? 'ট্যাবুলেশন শিট' : 'View Tabulation Sheet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Subject Marks Entry */}
      {activeTab === 'marks_entry' && currentSubject && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          {/* Top Control Bar with Save & Edit Buttons */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  {currentSubject.code} - {language === 'bn' ? currentSubject.nameBn : currentSubject.nameEn}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[11px]">
                  {language === 'bn' ? `${selectedClass}` : `${selectedClass}`}
                </span>
                <span className="ml-1 text-slate-500 font-medium">
                  (Full: {currentSubject.fullMarks} | Pass: {currentSubject.passMarks})
                </span>
              </div>
              <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                Theory CQ: {currentSubject.writtenMarks} | MCQ: {currentSubject.mcqMarks || 0} | Practical: {currentSubject.practicalMarks || 0}
              </div>
            </div>

            {/* Save & Edit Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {marksSaveStatus === 'saved' && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'bn'
                      ? `নম্বর সফলভাবে সংরক্ষিত হয়েছে! (${lastSavedTime})`
                      : `Marks Saved Successfully! (${lastSavedTime})`}
                  </span>
                </div>
              )}

              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingMarks((prev) => !prev)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      isEditingMarks
                        ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={isEditingMarks ? 'Lock entries from accidental edit' : 'Enable editing marks'}
                  >
                    {isEditingMarks ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === 'bn' ? 'সম্পাদনা চালু (Edit Mode)' : 'Editing Enabled'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>{language === 'bn' ? 'লক করা (Locked)' : 'Locked'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveMarksExplicit}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all"
                    title="Explicitly save and persist all marks"
                  >
                    <Save className="w-4 h-4" />
                    <span>{language === 'bn' ? 'নম্বর সংরক্ষণ করুন (Save Marks)' : 'Save Marks'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {(() => {
            const isNineOrTen = ['Class 9', 'Class 10'].includes(selectedClass);
            const subjectGroup = currentSubject?.group;
            const isSpecificGroup = Boolean(isNineOrTen && subjectGroup && subjectGroup !== 'General');

            const marksStudents = classStudents.filter((std) => {
              if (!isSpecificGroup) return true;
              const sGroup = (std.group || '').toLowerCase();
              const subG = (subjectGroup || '').toLowerCase();
              if (subG === 'science' && sGroup.includes('science')) return true;
              if ((subG === 'commerce' || subG === 'business') && (sGroup.includes('commerce') || sGroup.includes('business'))) return true;
              if ((subG === 'humanities' || subG === 'arts') && (sGroup.includes('humanities') || sGroup.includes('arts'))) return true;
              if (subG === 'vocational' && sGroup.includes('vocational')) return true;
              return !std.group; // unassigned
            });

            return (
              <>
                {isSpecificGroup && (
                  <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-950">
                    <span className="font-semibold flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>
                        {language === 'bn'
                          ? `এই বিষয়টি "${subjectGroup}" বিভাগের অন্তর্ভুক্ত। নিচে শুধুমাত্র এই বিভাগের শিক্ষার্থীদের তালিকা প্রদর্শিত হচ্ছে (${marksStudents.length} জন শিক্ষার্থী)।`
                          : `This subject belongs to the "${subjectGroup}" stream. Showing matching students (${marksStudents.length} students).`}
                      </span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 text-[11px] border border-sky-300">
                      {subjectGroup} Stream Only
                    </span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white border-b border-slate-200 text-slate-600 font-semibold uppercase">
                        <th className="py-3 px-4 w-16">Roll</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4 w-28">Written (CQ)</th>
                        <th className="py-3 px-4 w-28">MCQ</th>
                        <th className="py-3 px-4 w-28">Practical</th>
                        <th className="py-3 px-4 w-24">Total</th>
                        <th className="py-3 px-4 w-20">Grade</th>
                        <th className="py-3 px-4 w-20">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {marksStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            {language === 'bn'
                              ? `এই বিভাগে (${subjectGroup || 'General'}) কোনো শিক্ষার্থী পাওয়া যায়নি।`
                              : `No students enrolled in this group (${subjectGroup || 'General'}).`}
                          </td>
                        </tr>
                      ) : (
                        marksStudents.map((std) => {
                          const m = getStudentMarkForSubject(std.id, currentSubject.id) || {
                            written: 0,
                            mcq: 0,
                            practical: 0,
                            total: 0,
                            grade: 'F',
                            gpa: 0,
                          };
                          return (
                            <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-700">
                                {language === 'bn' ? toBnNumber(std.roll) : std.roll}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{std.nameEn}</div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                                  <span>{std.studentId}</span>
                                  {isNineOrTen && (
                                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[10px]">
                                      {std.group || 'Science'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  disabled={!canManage || !isEditingMarks}
                                  min={0}
                                  max={currentSubject.writtenMarks}
                                  value={m.written}
                                  onChange={(e) => handleMarkChange(std.id, 'written', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  disabled={!canManage || !isEditingMarks || !currentSubject.mcqMarks}
                                  min={0}
                                  max={currentSubject.mcqMarks || 0}
                                  value={m.mcq}
                                  onChange={(e) => handleMarkChange(std.id, 'mcq', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  disabled={!canManage || !isEditingMarks || !currentSubject.practicalMarks}
                                  min={0}
                                  max={currentSubject.practicalMarks || 0}
                                  value={m.practical}
                                  onChange={(e) => handleMarkChange(std.id, 'practical', Number(e.target.value))}
                                  className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                                {m.total}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                                    m.grade === 'A+'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : m.grade === 'A' || m.grade === 'A-'
                                      ? 'bg-blue-100 text-blue-800'
                                      : m.grade === 'F'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {m.grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800">
                                {m.gpa.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}

          {/* Bottom Summary & Save Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-medium">
              <span>
                {language === 'bn'
                  ? `মোট শিক্ষার্থী: ${toBnNumber(classStudents.length)} জন | বিষয়: ${currentSubject.nameBn || currentSubject.nameEn}`
                  : `Total Students: ${classStudents.length} | Subject: ${currentSubject.nameEn}`}
              </span>
            </div>
            {canManage && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMarks(true)}
                  className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'সম্পাদনা করুন (Edit)' : 'Edit'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveMarksExplicit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নম্বর সংরক্ষণ করুন (Save Marks)' : 'Save Marks'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Report Cards Directory */}
      {activeTab === 'report_cards' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              {language === 'bn' ? `${selectedClass} - নম্বরপত্র সংগ্রহ` : `${selectedClass} - Student Marksheet Generator`}
            </span>
            <span className="text-slate-500">
              NCTB Grading Scale Applied
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {classStudents.map((std) => {
              const relevantSubs = getSubjectsForStudent(std, classSubjects);
              const studentSubjectMarks = relevantSubs.map((sub) => getStudentMarkForSubject(std.id, sub.id));
              const validMarks = studentSubjectMarks.filter(Boolean) as MarksEntry[];
              const hasFail = validMarks.some((m) => m.grade === 'F');
              const gpas = validMarks.map((m) => m.gpa);
              const gpaResult = calculateTotalGPA(gpas, hasFail);

              return (
                <div key={std.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      {std.roll}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{std.nameEn} ({std.nameBn})</h4>
                      <p className="text-[11px] text-slate-500">
                        ID: {std.studentId} • Section {std.section} • {std.shift} Shift
                        {['Class 9', 'Class 10'].includes(std.className) && (
                          <span className="font-bold text-blue-700 ml-1.5">
                            • {std.group || 'Science'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        GPA: <span className="text-blue-700">{gpaResult.totalGPA.toFixed(2)}</span>
                      </div>
                      <div className={`text-[10px] font-bold ${gpaResult.overallGrade === 'A+' ? 'text-emerald-600' : gpaResult.overallGrade === 'F' ? 'text-rose-600' : 'text-blue-600'}`}>
                        Grade: {gpaResult.overallGrade} ({gpaResult.status})
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenTranscript(std)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'মার্কশিট দেখুন' : 'View Marksheet'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Master Tabulation Sheet */}
      {activeTab === 'tabulation' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">
                {language === 'bn' ? `মাস্টার ট্যাবুলেশন শিট: ${selectedClass}` : `Master Tabulation Sheet: ${selectedClass}`}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentExam?.nameEn} • Session 2026
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('print')}</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  {classSubjects.map((sub) => (
                    <th key={sub.id} className="py-2.5 px-2 text-center border-l border-slate-200">
                      <div>{sub.nameEn.split(' ')[0]}</div>
                      <div className="text-[9px] text-slate-400">({sub.fullMarks})</div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center border-l border-slate-200">Total Marks</th>
                  <th className="py-2.5 px-3 text-center">GPA</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((std) => {
                  let totalObtained = 0;
                  const gpas: number[] = [];
                  let hasFail = false;
                  const isNineOrTen = ['Class 9', 'Class 10'].includes(std.className);
                  const sGroup = (std.group || 'Science').toLowerCase();

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{std.roll}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        <div>{std.nameEn}</div>
                        {isNineOrTen && (
                          <div className="text-[10px] text-blue-700 font-semibold">{std.group || 'Science'}</div>
                        )}
                      </td>
                      {classSubjects.map((sub) => {
                        let isStudentSubject = true;
                        if (isNineOrTen && sub.group && sub.group !== 'General') {
                          const subGroup = sub.group.toLowerCase();
                          isStudentSubject = subGroup.includes(sGroup) || sGroup.includes(subGroup);
                        }

                        const m = isStudentSubject ? getStudentMarkForSubject(std.id, sub.id) : undefined;
                        if (isStudentSubject && m) {
                          totalObtained += m.total;
                          gpas.push(m.gpa);
                          if (m.grade === 'F') hasFail = true;
                        }

                        return (
                          <td key={sub.id} className="py-2.5 px-2 text-center border-l border-slate-100">
                            {!isStudentSubject ? (
                              <span className="text-slate-300 text-[10px] italic">N/A</span>
                            ) : m ? (
                              <div>
                                <span className="font-semibold text-slate-800">{m.total}</span>
                                <span className="text-[9px] text-slate-500 block">({m.grade})</span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      {(() => {
                        const res = calculateTotalGPA(gpas, hasFail);
                        return (
                          <>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900 border-l border-slate-200">
                              {totalObtained}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                              {res.totalGPA.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  res.overallGrade === 'A+'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : res.overallGrade === 'F'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {res.overallGrade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold">
                              <span className={res.status === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}>
                                {res.status}
                              </span>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Official Student Merit List (মেধা তালিকা ও র‍্যাংকিং) */}
      {activeTab === 'merit_list' && (() => {
        // Filter eligible students based on class, section, shift, and group
        const meritEligibleStudents = students.filter((s) => {
          if (s.className !== selectedClass) return false;
          if (s.status !== 'active') return false;
          if (meritSection !== 'all' && s.section !== meritSection) return false;
          if (meritShift !== 'all' && s.shift !== meritShift) return false;
          if (meritGroup !== 'all' && s.group !== meritGroup) return false;
          return true;
        });

        // Calculate marks, total obtained, GPA, and pass/fail for each student
        const meritCalculated = meritEligibleStudents.map((std) => {
          let totalObtained = 0;
          let fullMarks = 0;
          const gpas: number[] = [];
          let hasFail = false;
          let failedCount = 0;
          let subjectsWithMarksCount = 0;

          const relevantSubs = getSubjectsForStudent(std, classSubjects);
          relevantSubs.forEach((sub) => {
            fullMarks += sub.fullMarks;
            const m = getStudentMarkForSubject(std.id, sub.id);
            if (m) {
              subjectsWithMarksCount++;
              totalObtained += m.total;
              gpas.push(m.gpa);
              if (m.grade === 'F') {
                hasFail = true;
                failedCount++;
              }
            }
          });

          const res = calculateTotalGPA(gpas, hasFail);
          const percentage = fullMarks > 0 ? Math.round((totalObtained / fullMarks) * 100) : 0;

          return {
            student: std,
            totalObtained,
            fullMarks,
            percentage,
            gpa: res.totalGPA,
            overallGrade: res.overallGrade,
            hasFail,
            failedCount,
            subjectsWithMarksCount,
          };
        });

        // 1. Passing students sorted by GPA desc, then Total Marks desc, then Roll asc
        const passedStudents = meritCalculated
          .filter((m) => !m.hasFail && m.subjectsWithMarksCount > 0)
          .sort((a, b) => {
            if (b.gpa !== a.gpa) return b.gpa - a.gpa;
            if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
            return Number(a.student.roll) - Number(b.student.roll);
          });

        // 2. Failed / Incomplete students
        const failedStudents = meritCalculated
          .filter((m) => m.hasFail || m.subjectsWithMarksCount === 0)
          .sort((a, b) => {
            if (a.failedCount !== b.failedCount) return a.failedCount - b.failedCount;
            return b.totalObtained - a.totalObtained;
          });

        const top1 = passedStudents[0];
        const top2 = passedStudents[1];
        const top3 = passedStudents[2];

        return (
          <div className="space-y-6">
            {/* Merit List Header and Filter Bar */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                      <span>{language === 'bn' ? `অফিসিয়াল মেধা তালিকা (Merit List): ${selectedClass}` : `Official Student Merit List: ${selectedClass}`}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        NCTB GPA 5.00
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentExam?.nameEn || 'Term Examination'} • {language === 'bn' ? 'মোট পরীক্ষার্থী' : 'Total Students'}: {meritEligibleStudents.length} {language === 'bn' ? 'জন' : ''} • {language === 'bn' ? 'উত্তীর্ণ' : 'Passed'}: {passedStudents.length} {language === 'bn' ? 'জন' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowFormulaModal(true)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'bn' ? 'গণনা পদ্ধতি জানুন' : 'Ranking Formula'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মেধা তালিকা প্রিন্ট করুন' : 'Print Official Merit List'}</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {/* Exam Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'bn' ? 'পরীক্ষা নির্বাচন' : 'Select Examination'}
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {language === 'bn' ? ex.nameBn : ex.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'bn' ? 'শ্রেণি নির্বাচন' : 'Select Class'}
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    {[
                      'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
                      'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
                    ].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Section Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'bn' ? 'শাখা' : 'Section'}
                  </label>
                  <select
                    value={meritSection}
                    onChange={(e) => setMeritSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="all">{language === 'bn' ? 'সকল শাখা (A, B, C)' : 'All Sections'}</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                {/* Shift Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'bn' ? 'শিফট' : 'Shift'}
                  </label>
                  <select
                    value={meritShift}
                    onChange={(e) => setMeritShift(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="all">{language === 'bn' ? 'সকল শিফট' : 'All Shifts'}</option>
                    <option value="Morning">Morning (প্রভাতি)</option>
                    <option value="Day">Day (দিবা)</option>
                  </select>
                </div>

                {/* Group Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {language === 'bn' ? 'বিভাগ (Group)' : 'Secondary Group'}
                  </label>
                  <select
                    value={meritGroup}
                    onChange={(e) => setMeritGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All Groups'}</option>
                    <option value="Science">Science (বিজ্ঞান)</option>
                    <option value="Commerce">Commerce (ব্যবসায়)</option>
                    <option value="Arts">Humanities (মানবিক)</option>
                    <option value="Vocational">Vocational (ভোকেশনাল)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TOP 3 PODIUM CARDS */}
            {passedStudents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1st Place (Gold) */}
                {top1 && (
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-slate-900 shadow-md border-2 border-yellow-300">
                    <div className="absolute top-2 right-2 p-2 bg-white/30 backdrop-blur-xs rounded-full">
                      <Trophy className="w-6 h-6 text-yellow-950" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-950 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider mb-3">
                      🥇 {language === 'bn' ? '১ম স্থান (Champion)' : '1st Place Champion'}
                    </div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full border-2 border-yellow-900 bg-white flex items-center justify-center font-bold text-yellow-900 text-base shadow-xs overflow-hidden">
                        {top1.student.photoUrl ? (
                          <img src={top1.student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          top1.student.nameEn.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-yellow-950 leading-tight">
                          {language === 'bn' ? top1.student.nameBn || top1.student.nameEn : top1.student.nameEn}
                        </h4>
                        <p className="text-xs text-yellow-900 font-medium">
                          Roll: {top1.student.roll} • Sec {top1.student.section} • {top1.student.className}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-yellow-950/10 rounded-xl text-center text-xs font-bold text-yellow-950">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-yellow-900">GPA</div>
                        <div className="text-sm font-black">{top1.gpa.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-yellow-900">Marks</div>
                        <div className="text-sm font-black">{top1.totalObtained}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-yellow-900">Grade</div>
                        <div className="text-sm font-black">{top1.overallGrade}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2nd Place (Silver) */}
                {top2 && (
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 text-slate-800 shadow-xs border border-slate-300">
                    <div className="absolute top-2 right-2 p-2 bg-slate-400/20 rounded-full">
                      <Medal className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-100 font-extrabold text-[11px] uppercase tracking-wider mb-3">
                      🥈 {language === 'bn' ? '২য় স্থান (Runner-Up)' : '2nd Place Runner-Up'}
                    </div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full border-2 border-slate-400 bg-white flex items-center justify-center font-bold text-slate-700 text-base shadow-xs overflow-hidden">
                        {top2.student.photoUrl ? (
                          <img src={top2.student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          top2.student.nameEn.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900 leading-tight">
                          {language === 'bn' ? top2.student.nameBn || top2.student.nameEn : top2.student.nameEn}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Roll: {top2.student.roll} • Sec {top2.student.section} • {top2.student.className}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-400/15 rounded-xl text-center text-xs font-bold text-slate-800">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-600">GPA</div>
                        <div className="text-sm font-black">{top2.gpa.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-600">Marks</div>
                        <div className="text-sm font-black">{top2.totalObtained}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-600">Grade</div>
                        <div className="text-sm font-black">{top2.overallGrade}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {top3 && (
                  <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 text-white shadow-xs border border-amber-600">
                    <div className="absolute top-2 right-2 p-2 bg-white/20 rounded-full">
                      <Medal className="w-6 h-6 text-amber-200" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-amber-100 font-extrabold text-[11px] uppercase tracking-wider mb-3">
                      🥉 {language === 'bn' ? '৩য় স্থান (3rd Place)' : '3rd Place'}
                    </div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-300 bg-white flex items-center justify-center font-bold text-amber-800 text-base shadow-xs overflow-hidden">
                        {top3.student.photoUrl ? (
                          <img src={top3.student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          top3.student.nameEn.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white leading-tight">
                          {language === 'bn' ? top3.student.nameBn || top3.student.nameEn : top3.student.nameEn}
                        </h4>
                        <p className="text-xs text-amber-100 font-medium">
                          Roll: {top3.student.roll} • Sec {top3.student.section} • {top3.student.className}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/20 rounded-xl text-center text-xs font-bold text-white">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-amber-200">GPA</div>
                        <div className="text-sm font-black">{top3.gpa.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-amber-200">Marks</div>
                        <div className="text-sm font-black">{top3.totalObtained}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-amber-200">Grade</div>
                        <div className="text-sm font-black">{top3.overallGrade}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FULL MERIT LIST TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  {language === 'bn'
                    ? `মেধা অনুযায়ী ক্রমানুসারী তালিকা (মোট উত্তীর্ণ: ${passedStudents.length} জন)`
                    : `Complete Merit Ranked Order (Total Passed: ${passedStudents.length})`}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Sorted by: Highest GPA &rarr; Highest Total Marks &rarr; Roll
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 text-center">মেধা স্থান (Rank)</th>
                      <th className="py-3 px-4">Roll & ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Section & Shift</th>
                      <th className="py-3 px-4">Group (বিভাগ)</th>
                      <th className="py-3 px-3 text-center">Marks</th>
                      <th className="py-3 px-3 text-center">%</th>
                      <th className="py-3 px-3 text-center">GPA</th>
                      <th className="py-3 px-3 text-center">Grade</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-400">
                          {language === 'bn'
                            ? 'এই শ্রেণি ও ফিল্টারের জন্য কোনো উত্তীর্ণ শিক্ষার্থীর ফলাফল পাওয়া যায়নি। অনুগ্রহ করে নম্বর এন্ট্রি সম্পন্ন করুন।'
                            : 'No passed students found for current filter. Please ensure marks entry has been entered.'}
                        </td>
                      </tr>
                    ) : (
                      passedStudents.map((item, idx) => {
                        const rank = idx + 1;
                        return (
                          <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Merit Rank Badge */}
                            <td className="py-3 px-4 text-center">
                              {rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-black text-xs shadow-xs">
                                  1st
                                </span>
                              ) : rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 border border-slate-300 text-slate-800 font-black text-xs shadow-xs">
                                  2nd
                                </span>
                              ) : rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 border border-amber-700 text-amber-900 font-black text-xs shadow-xs">
                                  3rd
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                                  {language === 'bn' ? `${toBnNumber(rank)}ম` : `${rank}th`}
                                </span>
                              )}
                            </td>

                            {/* Roll & Student ID */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">
                                Roll: {language === 'bn' ? toBnNumber(item.student.roll) : item.student.roll}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {item.student.studentId}
                              </div>
                            </td>

                            {/* Student Name */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">
                                {language === 'bn' ? item.student.nameBn || item.student.nameEn : item.student.nameEn}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {item.student.nameEn}
                              </div>
                            </td>

                            {/* Section & Shift */}
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-700">Sec {item.student.section}</span>
                              <span className="text-[10px] text-slate-500 block">{item.student.shift} Shift</span>
                            </td>

                            {/* Group */}
                            <td className="py-3 px-4">
                              {item.student.group ? (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                    item.student.group === 'Vocational'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : item.student.group === 'Science'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : item.student.group === 'Commerce'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {item.student.group}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">General</span>
                              )}
                            </td>

                            {/* Obtained Marks */}
                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                              {item.totalObtained}
                              <span className="text-[10px] text-slate-400 block font-normal">/{item.fullMarks}</span>
                            </td>

                            {/* Percentage */}
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {item.percentage}%
                            </td>

                            {/* GPA */}
                            <td className="py-3 px-3 text-center">
                              <span className="font-black text-blue-700 text-xs">
                                {item.gpa.toFixed(2)}
                              </span>
                            </td>

                            {/* Overall Grade */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-black text-xs ${
                                  item.overallGrade === 'A+'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.overallGrade === 'A'
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.overallGrade === 'A-'
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.overallGrade}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Passed</span>
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setTranscriptStudent(item.student);
                                  setShowTranscriptModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] transition-colors"
                              >
                                {language === 'bn' ? 'মার্কশিট' : 'Transcript'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UNRANKED / FAILED STUDENTS SECTION */}
            {failedStudents.length > 0 && (
              <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-rose-950 text-xs">
                      {language === 'bn'
                        ? `অনুত্তীর্ণ শিক্ষার্থী তালিকা (Unranked / Needs Improvement) - মোট: ${failedStudents.length} জন`
                        : `Unranked / Supplementary List (Total: ${failedStudents.length})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-700">
                    {language === 'bn'
                      ? 'NCTB নিয়ম অনুযায়ী কোনো বিষয়ে F গ্রেড পেলে মেধা তালিকায় স্থান পাবে না'
                      : 'Students with F grade in any subject are placed in supplementary list'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                        <th className="py-2.5 px-4">Roll</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4">Section & Shift</th>
                        <th className="py-2.5 px-4 text-center">Failed Subjects</th>
                        <th className="py-2.5 px-4 text-center">Marks</th>
                        <th className="py-2.5 px-4 text-center">GPA</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {failedStudents.map((item) => (
                        <tr key={item.student.id} className="hover:bg-rose-50/40">
                          <td className="py-2.5 px-4 font-bold text-slate-800">Roll: {item.student.roll}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{item.student.nameEn}</td>
                          <td className="py-2.5 px-4 text-slate-600">Sec {item.student.section} • {item.student.shift}</td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                            {item.failedCount > 0 ? `${item.failedCount} Subject(s)` : 'Incomplete Marks'}
                          </td>
                          <td className="py-2.5 px-4 text-center font-semibold text-slate-700">{item.totalObtained}</td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-600">0.00 (F)</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              FAILED
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setTranscriptStudent(item.student);
                                setShowTranscriptModal(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px]"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FORMULA & RANKING EXPLANATION MODAL */}
            {showFormulaModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-xs text-slate-800 shadow-2xl border border-slate-200 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        {language === 'bn' ? 'মেধা তালিকা নির্ধারণের নিয়ম ও সূত্র' : 'Merit List Calculation Rules (NCTB Standard)'}
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowFormulaModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3.5 leading-relaxed text-slate-700">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 font-medium">
                      বাংলাদেশ শিক্ষা বোর্ড ও NCTB কারিকুলাম নীতিমালা অনুযায়ী স্বয়ংক্রিয়ভাবে মেধা তালিকা তৈরি করা হয়:
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ১
                        </span>
                        <div>
                          <strong className="text-slate-900">জিপিএ (GPA 5.00 স্কেল):</strong>
                          <p className="text-[11px] text-slate-600">
                            যেসব শিক্ষার্থী সকল বিষয়ে পাস করেছে, তাদের প্রাপ্ত মোট জিপিএ (যেমন GPA 5.00, 4.50...) অগ্রাধিকারের ভিত্তিতে মেধা ক্রম নির্ধারণ করে।
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ২
                        </span>
                        <div>
                          <strong className="text-slate-900">টাই-ব্রেকার (মোট প্রাপ্ত নম্বর):</strong>
                          <p className="text-[11px] text-slate-600">
                            একাধিক শিক্ষার্থীর জিপিএ সমান হলে তাদের সকল বিষয়ের মোট প্রাপ্ত নম্বর (Total Marks) অনুযায়ী যার নম্বর বেশি সে মেধা তালিকায় এগিয়ে থাকবে।
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ৩
                        </span>
                        <div>
                          <strong className="text-slate-900">ক্লাস রোল অগ্রাধিকার:</strong>
                          <p className="text-[11px] text-slate-600">
                            জিপিএ এবং মোট নম্বর উভয়ই সমান হলে শিক্ষার্থীর ক্লাস রোল অনুযায়ী ক্রম নির্ধারণ করা হয়।
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ৪
                        </span>
                        <div>
                          <strong className="text-rose-900">ফেইল (F গ্রেড) নিয়ম:</strong>
                          <p className="text-[11px] text-slate-600">
                            যেকোনো একটি বিষয়েও অনুত্তীর্ণ (F) শিক্ষার্থীকে মেধা তালিকায় অন্তর্ভুক্ত না করে পৃথক অনুত্তীর্ণ / সাপ্লিমেন্টারি তালিকায় রাখা হয়।
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setShowFormulaModal(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                    >
                      {language === 'bn' ? 'বুঝতে পেরেছি' : 'Got it'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Official Academic Transcript / Marksheet Modal */}
      {showTranscriptModal && transcriptStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-4 md:p-5 my-4 max-h-[96vh] overflow-y-auto print:p-0 print:m-0 print:border-none print:shadow-none print:max-h-none print:w-full">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 print:hidden">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-xs">
                  {language === 'bn' ? 'অফিসিয়াল মার্কশিট ও গ্রেড ট্রান্সক্রিপ্ট' : 'Official Academic Transcript'}
                </h3>
                {transcriptStudent.group && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold">
                    গ্রুপ: {transcriptStudent.group}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                </button>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Marksheet Document (NCTB Bangladesh Standard Format) */}
            <div className="p-4 md:p-5 border-2 border-slate-800 rounded-xl bg-white text-[11px] text-slate-900 font-sans print:border-2 print:p-3">
              {/* Institutional Header */}
              <div className="text-center pb-2.5 border-b-2 border-slate-800">
                <div className="flex items-center justify-center space-x-3 mb-1">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="School Logo"
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <div className="text-left">
                    <h1 className="text-lg font-black text-slate-900 tracking-wide leading-tight">
                      {school.nameBn}
                    </h1>
                    <h2 className="text-xs font-bold text-slate-700 tracking-wider">
                      {school.nameEn.toUpperCase()}
                    </h2>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600">
                  {school.addressBn} • EIIN: {school.eiin} • স্থাপিত: {school.establishedYear}
                </p>
                <div className="inline-block mt-1.5 px-3 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest">
                  ACADEMIC TRANSCRIPT • {currentExam?.nameEn || 'Term Examination'} 2026
                </div>
              </div>

              {/* Student Bio & Photo & Grading Key Grid */}
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3 my-2.5 py-1.5 border-b border-slate-300">
                {/* Official Student Passport Photo */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-24 sm:w-22 sm:h-26 bg-slate-100 border-2 border-slate-400 rounded-md overflow-hidden shadow-xs flex flex-col items-center justify-center relative bg-white">
                    {transcriptStudent.photoUrl ? (
                      <img
                        src={transcriptStudent.photoUrl}
                        alt={transcriptStudent.nameEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-1 text-center">
                        <User className="w-8 h-8 text-slate-400 mb-0.5" />
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tighter">PHOTO</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 font-bold mt-0.5 tracking-tight">শিক্ষার্থীর ছবি</span>
                </div>

                {/* Student Bio Details */}
                <div className="flex-1 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[11px] leading-tight">
                  <div>
                    <span className="text-slate-500">শিক্ষার্থীর নাম: </span>
                    <strong className="text-slate-900">{transcriptStudent.nameBn || transcriptStudent.nameEn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Student Name: </span>
                    <strong className="text-slate-900">{transcriptStudent.nameEn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">আইডি (ID): </span>
                    <strong className="text-blue-700 font-mono font-bold">{transcriptStudent.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">রোল নং (Roll): </span>
                    <strong className="text-slate-900">{transcriptStudent.roll}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">শ্রেণি ও শাখা: </span>
                    <strong>{transcriptStudent.className} ({transcriptStudent.section})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">বিভাগ/গ্রুপ: </span>
                    <strong className={transcriptStudent.group ? 'text-indigo-800 font-bold' : 'text-slate-600'}>
                      {transcriptStudent.group || 'সাধারণ (General)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">পিতা: </span>
                    <span>{transcriptStudent.fatherNameBn || transcriptStudent.fatherNameEn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">মাতা: </span>
                    <span>{transcriptStudent.motherNameBn || transcriptStudent.motherNameEn || '—'}</span>
                  </div>
                </div>

                {/* Compact NCTB Grade Reference */}
                <div className="w-full sm:w-44 shrink-0 border border-slate-300 rounded p-1 text-[9px] bg-slate-50 flex flex-col justify-between">
                  <div className="font-bold text-center border-b border-slate-200 pb-0.5 text-slate-800">
                    NCTB গ্রেডিং স্কেল
                  </div>
                  <div className="grid grid-cols-2 gap-x-1 text-center py-0.5 leading-tight">
                    <div>80-100% : <strong>A+ (5.0)</strong></div>
                    <div>50-59% : <strong>B (3.0)</strong></div>
                    <div>70-79% : <strong>A (4.0)</strong></div>
                    <div>40-49% : <strong>C (2.0)</strong></div>
                    <div>60-69% : <strong>A- (3.5)</strong></div>
                    <div>33-39% : <strong>D (1.0)</strong></div>
                    <div className="col-span-2 text-rose-700 font-bold">00-32% : F (0.0) ফেল</div>
                  </div>
                </div>
              </div>

              {/* Subject Marks Breakdown Table (Filtered strictly by Student's Academic Group) */}
              {(() => {
                const studentSubjects = getSubjectsForStudent(transcriptStudent, classSubjects);

                let grandTotal = 0;
                let totalFullMarks = 0;
                const gpas: number[] = [];
                let hasFail = false;

                const rows = studentSubjects.map((sub) => {
                  const m = getStudentMarkForSubject(transcriptStudent.id, sub.id) || {
                    written: 0,
                    mcq: 0,
                    practical: 0,
                    total: 0,
                    grade: 'F',
                    gpa: 0,
                  };
                  grandTotal += m.total;
                  totalFullMarks += sub.fullMarks;
                  gpas.push(m.gpa);
                  if (m.grade === 'F') hasFail = true;

                  return (
                    <tr key={sub.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                      <td className="py-1 px-2 border-r border-slate-300 font-medium">
                        <span className="font-mono text-slate-500 mr-1">{sub.code}</span>
                        {sub.nameBn || sub.nameEn}
                        {sub.group && (
                          <span className="ml-1.5 px-1 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px]">
                            {sub.group}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center text-slate-700">{sub.fullMarks}</td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center">{m.written}</td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center">{m.mcq + m.practical}</td>
                      <td className="py-1 px-1.5 border-r border-slate-300 text-center font-bold text-slate-900">{m.total}</td>
                      <td
                        className={`py-1 px-1.5 border-r border-slate-300 text-center font-black ${
                          m.grade === 'F' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {m.grade}
                      </td>
                      <td className={`py-1 px-1.5 text-center font-bold ${m.grade === 'F' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {m.gpa.toFixed(2)}
                      </td>
                    </tr>
                  );
                });

                const totalResult = calculateTotalGPA(gpas, hasFail);
                const percentage = totalFullMarks > 0 ? ((grandTotal / totalFullMarks) * 100).toFixed(1) : '0';
                const isPassed = !hasFail && totalResult.status === 'PASSED' && totalResult.overallGrade !== 'F';

                return (
                  <>
                    <div className="my-2 overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800 text-[10px] uppercase">
                            <th className="py-1 px-2 border-r border-slate-400">বিষয় (Subject)</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 text-center w-14">পূর্ণমান</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 text-center w-14">সৃজনশীল</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 text-center w-14">নৈর্ব্যক্তিক/ব্যা</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 text-center w-16">মোট প্রাপ্ত</th>
                            <th className="py-1 px-1.5 border-r border-slate-400 text-center w-14">লেটার গ্রেড</th>
                            <th className="py-1 px-1.5 text-center w-14">গ্রেড পয়েন্ট</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {rows}
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-[11px]">
                            <td colSpan={4} className="py-1.5 px-2 border-r border-slate-400 text-right">
                              সর্বমোট নম্বর ({totalFullMarks}) ও সার্বিক ফলাফল:
                            </td>
                            <td className="py-1.5 px-1.5 border-r border-slate-400 text-center text-xs font-black text-slate-900">
                              {grandTotal} <span className="text-[9px] text-slate-500 block">({percentage}%)</span>
                            </td>
                            <td
                              className={`py-1.5 px-1.5 border-r border-slate-400 text-center text-xs font-black ${
                                isPassed ? 'text-blue-700' : 'text-rose-600'
                              }`}
                            >
                              {totalResult.overallGrade}
                            </td>
                            <td
                              className={`py-1.5 px-1.5 text-center text-xs font-black ${
                                isPassed ? 'text-blue-700' : 'text-rose-600'
                              }`}
                            >
                              {totalResult.totalGPA.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Overall Summary Bar */}
                    <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-300 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-600">ফলাফল মূল্যায়ন: </span>
                        {isPassed ? (
                          <strong className="text-emerald-700 font-bold">উত্তীর্ণ (PASSED)</strong>
                        ) : (
                          <strong className="text-rose-600 font-bold">অনুত্তীর্ণ (FAILED)</strong>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-600">উপস্থিতি: </span>
                        <strong>{(transcriptStudent as any).attendanceSummary?.percentage || '94'}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-600">আচরণ ও শৃঙ্খলা: </span>
                        {isPassed ? (
                          <strong className="text-blue-700">চমৎকার (Excellent)</strong>
                        ) : (
                          <strong className="text-rose-600">মনোযোগ ও পুনঃপরীক্ষা প্রয়োজন</strong>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Remarks and Signatures */}
              <div className="mt-6 pt-5 border-t border-slate-300 grid grid-cols-3 text-center text-[10px] text-slate-700">
                <div>
                  <div className="border-t border-slate-500 pt-1 font-semibold mx-4">
                    শ্রেণি শিক্ষকের স্বাক্ষর
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-500 pt-1 font-semibold mx-4">
                    পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-500 pt-1 font-bold text-slate-900 mx-4">
                    প্রধান শিক্ষকের স্বাক্ষর ও সিল
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingExam
                  ? (language === 'bn' ? 'পরীক্ষা সম্পাদনা করুন' : 'Edit Examination')
                  : (language === 'bn' ? 'নতুন পরীক্ষা তৈরি করুন' : 'Create New Examination')}
              </h3>
              <button
                onClick={() => {
                  setShowAddExamModal(false);
                  setEditingExam(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets for Exam Types */}
            {!editingExam && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-900 block mb-1.5 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'bn' ? 'প্রচলিত পরীক্ষার প্রিসেট (ক্লিক করে অটো-পূরণ করুন):' : 'Standard Exam Presets (1-Click Auto-Fill):'}</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('1st Model Test Examination 2026', '১ম মডেল টেস্ট পরীক্ষা ২০২৬', 'model_test', '2026-03-20', '2026-03-31')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    1. 1st Model Test (১ম মডেল টেস্ট)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('1st Semester Examination 2026', '১ম সেমিস্টার পরীক্ষা ২০২৬', 'half_yearly', '2026-06-15', '2026-06-30')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    2. 1st Semester Exam (১ম সেমিস্টার)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('2nd Model Test Examination 2026', '২য় মডেল টেস্ট পরীক্ষা ২০২৬', 'model_test', '2026-08-10', '2026-08-20')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    3. 2nd Model Test (২য় মডেল টেস্ট)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('2nd Semester Examination 2026', '২য় সেমিস্টার পরীক্ষা ২০২৬', 'half_yearly', '2026-09-15', '2026-09-30')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    4. 2nd Semester Exam (২য় সেমিস্টার)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('3rd Model Test Examination 2026', '৩য় মডেল টেস্ট পরীক্ষা ২০২৬', 'model_test', '2026-10-25', '2026-11-05')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    5. 3rd Model Test (৩য় মডেল টেস্ট)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExamPreset('3rd Semester Examination 2026', '৩য় সেমিস্টার পরীক্ষা ২০২৬', 'annual', '2026-11-20', '2026-12-10')}
                    className="p-1.5 bg-white hover:bg-blue-100/70 border border-blue-200 rounded text-left font-medium text-slate-800 transition-colors"
                  >
                    6. 3rd Semester Exam (৩য় সেমিস্টার)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Exam Name (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Model Test Examination 2026"
                  value={newExamNameEn}
                  onChange={(e) => setNewExamNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">পরীক্ষার নাম (বাংলায়)</label>
                <input
                  type="text"
                  placeholder="যেমন: ১ম মডেল টেস্ট পরীক্ষা ২০২৬"
                  value={newExamNameBn}
                  onChange={(e) => setNewExamNameBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Exam Term / Type</label>
                <select
                  value={newExamTerm}
                  onChange={(e) => setNewExamTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="model_test">Model Test / Pre-Test (মডেল টেস্ট)</option>
                  <option value="half_yearly">Semester / Mid-Term (সেমিস্টার পরীক্ষা)</option>
                  <option value="annual">Final / Annual (চূড়ান্ত / বার্ষিক)</option>
                  <option value="1st_term">Class Test / 1st Term (ক্লাস টেস্ট)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newExamStart}
                    onChange={(e) => setNewExamStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={newExamEnd}
                    onChange={(e) => setNewExamEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExamModal(false);
                    setEditingExam(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingExam
                    ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')
                    : (language === 'bn' ? 'পরীক্ষা তৈরি করুন' : 'Create Exam')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT EXAM ROUTINE ITEM MODAL */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingRoutineItem
                    ? (language === 'bn' ? 'পরীক্ষার সময়সূচি সম্পাদনা' : 'Edit Exam Routine Subject')
                    : (language === 'bn' ? `${selectedClass}-এর পরীক্ষার সময়সূচি যোগ` : `Add Subject Schedule for ${selectedClass}`)}
                </h3>
              </div>
              <button
                onClick={() => setShowRoutineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutineItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'বিষয় নির্বাচন করুন *' : 'Select Subject *'}
                </label>
                <select
                  required
                  value={routineSubjectId}
                  onChange={(e) => setRoutineSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-blue-900"
                >
                  {classSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} • {sub.nameEn} ({sub.nameBn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'পরীক্ষার তারিখ *' : 'Exam Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={routineDate}
                    onChange={(e) => {
                      setRoutineDate(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        setRoutineDay(daysOfWeek[d.getDay()] || 'Monday');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'বার (Day of Week)' : 'Day of Week'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${routineDay} ${daysOfWeekBn[routineDay] ? `(${daysOfWeekBn[routineDay]})` : ''}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'শুরুর সময় *' : 'Start Time *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={routineStartTime}
                    onChange={(e) => setRoutineStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'শেষের সময় *' : 'End Time *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01:00 PM"
                    value={routineEndTime}
                    onChange={(e) => setRoutineEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'পরীক্ষা কক্ষ / হল নং' : 'Exam Room / Hall No'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 201 / Main Hall"
                  value={routineRoom}
                  onChange={(e) => setRoutineRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRoutineModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingRoutineItem
                    ? (language === 'bn' ? 'হালনাগাদ করুন' : 'Update Subject')
                    : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Subject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMART AUTO EXAM ROUTINE GENERATOR MODAL */}
      {showAutoRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 text-xs max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>{language === 'bn' ? 'স্বয়ংক্রিয় পরীক্ষার রুটিন জেনারেটর' : 'Smart Auto Exam Routine Generator'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                      Bangladesh Curriculum
                    </span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {language === 'bn'
                      ? 'ছুটির দিন বাদ দিয়ে এবং বিজ্ঞান, বাণিজ্য, মানবিক ও ভোকেশনাল ৪টি গ্রুপ বিষয় একই তারিখে প্যারালাল স্লট করে দ্রুত রুটিন তৈরি করুন।'
                      : 'Auto-generate schedule excluding off-days & aligning 4 group electives on identical dates.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoRoutineModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Box */}
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-600 fill-current shrink-0" />
                <div>
                  <strong className="text-slate-900 text-xs font-black">
                    {language === 'bn' ? '১ম মডেল টেস্ট পরীক্ষা প্রিসেট:' : '1st Model Test Preset:'}
                  </strong>
                  <span className="text-slate-600 text-[11px] ml-1">
                    ০৫/০৩/২০২৬ থেকে ২০/০৩/২০২৬ (শুক্রবার, শনিবার ও সরকারি ছুটি বাদ)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApply1stModelTestPreset}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                {language === 'bn' ? 'এই প্রিসেট লোড করুন' : 'Load Preset'}
              </button>
            </div>

            <form onSubmit={handleExecuteSmartRoutine} className="mt-4 space-y-4">
              {/* Exam & Class Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {language === 'bn' ? 'টার্গেট পরীক্ষা *' : 'Target Exam *'}
                  </label>
                  <select
                    value={autoRoutineExamId || selectedExamId}
                    onChange={(e) => setAutoRoutineExamId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.nameBn || ex.nameEn} ({ex.session})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {language === 'bn' ? 'কোন শ্রেণির জন্য রুটিন? *' : 'Target Class *'}
                  </label>
                  <select
                    value={autoRoutineTargetClass}
                    onChange={(e) => setAutoRoutineTargetClass(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-blue-900"
                  >
                    <option value="Class 9">Class 9 (৯ম শ্রেণি - ৪ গ্রুপ সমন্বিত)</option>
                    <option value="Class 10">Class 10 (১০ম শ্রেণি - ৪ গ্রুপ সমন্বিত)</option>
                    <option value="Class 8">Class 8 (৮ম শ্রেণি)</option>
                    <option value="Class 7">Class 7 (৭ম শ্রেণি)</option>
                    <option value="Class 6">Class 6 (৬ষ্ঠ শ্রেণি)</option>
                    <option value="Class 5">Class 5 (৫ম শ্রেণি)</option>
                    <option value="Class 4">Class 4 (৪র্থ শ্রেণি)</option>
                    <option value="Class 3">Class 3 (৩য় শ্রেণি)</option>
                    <option value="Class 2">Class 2 (২য় শ্রেণি)</option>
                    <option value="Class 1">Class 1 (১ম শ্রেণি)</option>
                    <option value="KG">KG (কেজি)</option>
                    <option value="Nursery">Nursery (নার্সারি)</option>
                    <option value="all">সকল শ্রেণি (Play থেকে Class 10 - All Classes)</option>
                  </select>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? 'পরীক্ষার সময়সীমা (Date Range)' : 'Exam Date Range'}</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-full font-bold text-[11px]">
                    কার্যকরী কার্যদিবস: {previewWorkingDates.length} দিন
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                      {language === 'bn' ? 'শুরুর তারিখ (Start Date) *' : 'Start Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={autoRoutineStartDate}
                      onChange={(e) => setAutoRoutineStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-[11px]">
                      {language === 'bn' ? 'শেষের তারিখ (End Date) *' : 'End Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={autoRoutineEndDate}
                      onChange={(e) => setAutoRoutineEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Exam Timing & Hall */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {language === 'bn' ? 'শুরুর সময় (Start Time) *' : 'Start Time *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={autoRoutineStartTime}
                    onChange={(e) => setAutoRoutineStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {language === 'bn' ? 'শেষের সময় (End Time) *' : 'End Time *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01:00 PM"
                    value={autoRoutineEndTime}
                    onChange={(e) => setAutoRoutineEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">
                    {language === 'bn' ? 'পরীক্ষা কক্ষ / হল (Hall/Room)' : 'Hall / Room'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exam Hall / Room 201"
                    value={autoRoutineRoom}
                    onChange={(e) => setAutoRoutineRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Smart Skip & Group Parallel Rules */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <h5 className="font-extrabold text-slate-900 text-xs">
                  {language === 'bn' ? 'ছুটির দিন ও অটোমেটিক স্লটিং নিয়মাবলী:' : 'Off-Day & Smart Slotting Rules:'}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={autoRoutineSkipFridays}
                      onChange={(e) => setAutoRoutineSkipFridays(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">
                      {language === 'bn' ? 'শুক্রবার সাপ্তাহিক ছুটি বাদ দিন' : 'Skip Fridays (Weekly Weekend)'}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={autoRoutineSkipSaturdays}
                      onChange={(e) => setAutoRoutineSkipSaturdays(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">
                      {language === 'bn' ? 'শনিবার ছুটি বাদ দিন (স্কুল নিয়ম)' : 'Skip Saturdays (School Weekend)'}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={autoRoutineSkipHolidays}
                      onChange={(e) => setAutoRoutineSkipHolidays(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">
                      {language === 'bn' ? 'সরকারি ও প্রাতিষ্ঠানিক ছুটি বাদ দিন' : 'Skip Official School Holidays'}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-200 hover:border-blue-300">
                    <input
                      type="checkbox"
                      checked={autoRoutineHasGaps}
                      onChange={(e) => setAutoRoutineHasGaps(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-slate-800">
                      {language === 'bn' ? 'সম্ভব হলে ১ দিন প্রস্তুতি ছুটি (Gap)' : '1-Day Study Gap (If time permits)'}
                    </span>
                  </label>
                </div>

                {/* Highlighted Rule: 4 Group subjects on identical dates */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRoutineParallelGroup}
                      onChange={(e) => setAutoRoutineParallelGroup(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <div>
                      <strong className="text-blue-950 text-xs block">
                        {language === 'bn'
                          ? 'বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক ও ভোকেশনাল বিষয় একই তারিখে সমান্তরাল স্লট করুন (সুপারিশকৃত)'
                          : 'Schedule Science, Commerce, Humanities & Vocational Electives on the Same Date (Recommended)'}
                      </strong>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {language === 'bn'
                          ? 'মাধ্যমিকের ৪টি বিভাগের শিক্ষার্থীরা একই সময়ে তাদের নিজস্ব বিভাগীয় বিষয়ে পরীক্ষা দিবে (যেমন: বিজ্ঞান পদার্থবিজ্ঞান, বাণিজ্য হিসাববিজ্ঞান, মানবিক ইতিহাস, ভোকেশনাল ট্রেড ১ একই দিনে)। ফলে পরীক্ষা মাত্র ৯টি কার্যদিবসে ২০/০৩/২০২৬-এর মধ্যে শেষ হবে।'
                          : 'All 4 streams take their respective departmental exam on the same day in parallel, ensuring the exam completes comfortably before March 20.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Preview Timeline */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      {language === 'bn' ? 'রুটিন সময়সূচি লাইভ প্রিভিউ (Generated Preview)' : 'Generated Schedule Preview'}
                    </h5>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="font-bold text-slate-600">
                      মোট স্লট: <strong className="text-blue-700">{previewSlots.length}টি</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-emerald-700">
                      {previewWorkingDates.length >= previewSlots.length
                        ? '✓ সময়সীমা নিখুঁতভাবে সমন্বিত'
                        : '⚠️ কিছু পরীক্ষা অতিরিক্ত দিনে গড়াতে পারে'}
                    </span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {previewSlots.map((slot, sIdx) => {
                    const assignedDate = previewWorkingDates[sIdx] || {
                      dateStr: 'তারিখ হিসাব হচ্ছে...',
                      dayName: '—',
                    };

                    return (
                      <div key={sIdx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-50 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-900 font-black flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <div>
                            <strong className="text-slate-900 block font-bold">
                              {slot.title}
                            </strong>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {slot.subjects.map((sub) => (
                                <span
                                  key={sub.id}
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    sub.group === 'Science'
                                      ? 'bg-blue-100 text-blue-900'
                                      : sub.group === 'Commerce'
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : sub.group === 'Humanities'
                                      ? 'bg-amber-100 text-amber-900'
                                      : sub.group === 'Vocational'
                                      ? 'bg-purple-100 text-purple-900'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {sub.group ? `${sub.group}: ` : ''}{sub.nameBn || sub.nameEn} ({sub.code})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-900 block">
                            {assignedDate.dateStr}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold">
                            {assignedDate.dayName} {daysOfWeekBn[assignedDate.dayName] ? `(${daysOfWeekBn[assignedDate.dayName]})` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAutoRoutineModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-black shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {language === 'bn' ? 'রুটিন তৈরি ও সংরক্ষণ করুন' : 'Generate & Save Routine'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Exam Routine Print Preview Modal */}
      {showRoutinePrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full p-4 sm:p-6 text-xs max-h-[96vh] overflow-y-auto flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 print:hidden shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {language === 'bn' ? 'পরীক্ষা রুটিন অফিসিয়াল প্রিন্ট প্রিভিউ' : 'Official Exam Timetable Print Preview'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {currentExam?.nameBn || currentExam?.nameEn} • {selectedClass} • সেশন ২০২৬
                  </p>
                </div>
              </div>

              {/* Group Filter inside Modal & Print Buttons */}
              <div className="flex items-center space-x-2">
                {['Class 9', 'Class 10'].includes(selectedClass) && (
                  <select
                    value={routineGroupFilter}
                    onChange={(e) => setRoutineGroupFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">সকল বিভাগ (All Groups)</option>
                    <option value="Science">বিজ্ঞান (Science)</option>
                    <option value="Commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                    <option value="Humanities">মানবিক (Humanities)</option>
                    <option value="Vocational">ভোকেশনাল (Vocational)</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? '🖨️ রুটিন প্রিন্ট করুন (A4)' : 'Print Routine (A4)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRoutinePrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Exam Routine Sheet */}
            <div className="printable-exam-sheet bg-white p-6 sm:p-8 border-2 border-slate-900 rounded-xl my-4 text-slate-900">
              {/* Institutional Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="Logo"
                    className="w-14 h-14 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {school.nameBn || school.nameEn}
                    </h1>
                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                      {school.nameEn}
                    </h2>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  {school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}
                </p>
                <div className="inline-block mt-2.5 px-5 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md">
                  {currentExam?.nameBn || currentExam?.nameEn} - ২০২৬ • অফিসিয়াল পরীক্ষা সময়সূচি
                </div>
              </div>

              {/* Meta Info Bar */}
              <div className="flex flex-wrap items-center justify-between py-2 px-3 bg-slate-100 border-b border-slate-300 text-xs font-bold my-3">
                <span>শ্রেণি: <strong className="text-blue-900">{selectedClass}</strong></span>
                {['Class 9', 'Class 10'].includes(selectedClass) && (
                  <span>বিভাগ: <strong className="text-blue-900">{routineGroupFilter === 'all' ? 'সকল বিভাগ (সম্মিলিত)' : routineGroupFilter}</strong></span>
                )}
                <span>সেশন: <strong>২০২৬ (Session 2026)</strong></span>
                <span>মোট বিষয়: <strong>{displayClassRoutines.length} টি</strong></span>
              </div>

              {/* Subject Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-200 border-b-2 border-slate-900 text-slate-900 font-black text-center">
                      <th className="py-2.5 px-3 border border-slate-900 w-12">ক্র.নং</th>
                      <th className="py-2.5 px-3 border border-slate-900 w-20">কোড</th>
                      <th className="py-2.5 px-3 border border-slate-900 text-left">বিষয়ের নাম (Subject)</th>
                      <th className="py-2.5 px-3 border border-slate-900 w-44">তারিখ ও বার (Exam Date & Day)</th>
                      <th className="py-2.5 px-3 border border-slate-900 w-36">সময় (Time)</th>
                      <th className="py-2.5 px-3 border border-slate-900 w-28">কক্ষ (Hall)</th>
                      <th className="py-2.5 px-3 border border-slate-900 w-28">গ্রুপ / শাখা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayClassRoutines.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-bold border border-slate-900">
                          এই শ্রেণির জন্য কোনো পরীক্ষার রুটিন নির্ধারিত নেই।
                        </td>
                      </tr>
                    ) : (
                      displayClassRoutines.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-slate-900 text-center hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-bold border border-slate-900">{idx + 1}</td>
                          <td className="py-2.5 px-2 font-mono font-bold border border-slate-900 text-blue-900">{item.subjectCode}</td>
                          <td className="py-2.5 px-3 font-bold text-left border border-slate-900 text-slate-900">
                            {item.subjectNameBn || item.subjectNameEn}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-900 font-mono font-bold text-slate-900">
                            {item.examDate}
                            <span className="block text-[10px] font-sans font-medium text-blue-700">
                              {item.dayOfWeek ? (daysOfWeekBn[item.dayOfWeek as keyof typeof daysOfWeekBn] || item.dayOfWeek) : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-mono font-bold border border-slate-900 text-slate-800">
                            {item.startTime} - {item.endTime}
                          </td>
                          <td className="py-2.5 px-2 border border-slate-900 font-semibold text-slate-700">
                            {item.roomNo || 'মূল কেন্দ্র'}
                          </td>
                          <td className="py-2.5 px-2 border border-slate-900 font-bold text-slate-700 text-[10px]">
                            {item.group ? item.group : 'আবশ্যিক'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions Box */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">পরীক্ষার্থীদের জন্য বিশেষ নির্দেশনাবলী:</span>
                <p>১. পরীক্ষা আরম্ভের অন্তত ৩০ (ত্রিশ) মিনিট পূর্বে পরীক্ষার্থীদের পরীক্ষা কক্ষে আসন গ্রহণ করতে হবে।</p>
                <p>২. প্রবেশপত্র (Admit Card) ব্যতীত কোনো অবস্থাতেই পরীক্ষা কেন্দ্রে প্রবেশ করতে দেওয়া হবে না।</p>
                <p>৩. পরীক্ষা কেন্দ্রে কোনো প্রকার মোবাইল ফোন, স্মার্টওয়াচ বা অনুমোদিত নয় এমন ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।</p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 mt-6 text-xs text-slate-800">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 w-44 font-bold">
                    শ্রেণি শিক্ষকের স্বাক্ষর
                  </div>
                  <span className="text-[10px] text-slate-500">Class Teacher</span>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 w-44 font-bold">
                    পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর
                  </div>
                  <span className="text-[10px] text-slate-500">Controller of Examinations</span>
                </div>
                <div className="text-center">
                  <div className="font-serif italic font-black text-sm text-slate-900 mb-0.5">
                    {school.principalNameEn || school.principalNameBn || 'Principal'}
                  </div>
                  <div className="border-t-2 border-slate-800 pt-1 w-48 font-bold">
                    অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর ও সিল
                  </div>
                  <span className="text-[10px] text-slate-500">Principal Signature & Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
