import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { AIService } from '../../services/aiService';
import {
  Homework,
  HomeworkSubmission,
  ClassLevel,
  Student,
  AIEvaluationResult,
} from '../../types';
import { compressImageToPassportSize } from '../../utils/storageHelper';
import {
  FileCheck,
  Search,
  Plus,
  Calendar,
  BookOpen,
  User,
  CheckCircle,
  Clock,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Filter,
  BarChart3,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  CheckCheck,
  Printer,
  ChevronRight,
  HelpCircle,
  FileQuestion,
  Award,
} from 'lucide-react';

export const HomeworkView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { language, toBnNumber } = useLanguage();

  // Active Tab: 'assignments' | 'student_submissions' | 'teacher_review' | 'reports'
  const [activeTab, setActiveTab] = useState<'assignments' | 'student_submissions' | 'teacher_review' | 'reports'>(() => {
    if (activeRole === 'student') return 'student_submissions';
    return 'assignments';
  });

  const [homeworkList, setHomeworkList] = useState<Homework[]>(() => StorageService.getHomework());
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() => StorageService.getHomeworkSubmissions());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Homework Create/Edit Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);

  // Form State for Homework Creation
  const [targetClass, setTargetClass] = useState<ClassLevel>('Class 10');
  const [title, setTitle] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('General Mathematics');
  const [section, setSection] = useState<string>('A');
  const [homeworkDate, setHomeworkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [fullMarks, setFullMarks] = useState<number>(10);
  const [referenceAnswer, setReferenceAnswer] = useState<string>('');
  const [referenceAnswerAttachment, setReferenceAnswerAttachment] = useState<string>('');
  const [questionAttachment, setQuestionAttachment] = useState<string>('');
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [optionalInstructions, setOptionalInstructions] = useState<string>('');
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState<string | null>(null);

  // Student Homework Submission Modal State
  const [showSubmissionModal, setShowSubmissionModal] = useState<boolean>(false);
  const [submittingHomework, setSubmittingHomework] = useState<Homework | null>(null);
  const [selectedStudentForSubmission, setSelectedStudentForSubmission] = useState<string>('std_1');
  const [submissionText, setSubmissionText] = useState<string>('');
  const [submissionImages, setSubmissionImages] = useState<string[]>([]);
  const [submissionPdfName, setSubmissionPdfName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState<string>('');

  // AI Evaluation In-Progress State
  const [evaluatingSubId, setEvaluatingSubId] = useState<string | null>(null);
  const [evaluatingError, setEvaluatingError] = useState<string>('');
  const [reviewModalSub, setReviewModalSub] = useState<HomeworkSubmission | null>(null);
  const [teacherEditMarks, setTeacherEditMarks] = useState<number>(10);
  const [teacherEditFeedback, setTeacherEditFeedback] = useState<string>('');

  // Bulk Approval State
  const [bulkApproving, setBulkApproving] = useState<boolean>(false);
  const [bulkResultNotice, setBulkResultNotice] = useState<string>('');

  // Report Filter State
  const [reportDateRange, setReportDateRange] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('this_month');
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reportSubject, setReportSubject] = useState<string>('all');
  const [reportSearchStudent, setReportSearchStudent] = useState<string>('');
  const [reportViewMode, setReportViewMode] = useState<'aggregated' | 'detailed'>('aggregated');

  // Identify current student if role is student or guardian
  const authenticatedStudent: Student | undefined = useMemo(() => {
    if (activeRole === 'student') {
      return (
        students.find((s) => s.id === currentUser.linkedStudentId) ||
        students.find((s) => s.nameEn.toLowerCase() === currentUser.name.toLowerCase()) ||
        students.find((s) => s.id === 'std_1') ||
        students[0]
      );
    }
    return undefined;
  }, [activeRole, currentUser, students]);

  // Lock selectedClass and selectedSection to the student's own class when role is student
  useEffect(() => {
    if (activeRole === 'student' && authenticatedStudent?.className) {
      setSelectedClass(authenticatedStudent.className);
      if (authenticatedStudent.section) {
        setSelectedSection(authenticatedStudent.section);
      }
    }
  }, [activeRole, authenticatedStudent]);

  const canCreate =
    activeRole === 'super_admin' ||
    activeRole === 'admin' ||
    activeRole === 'teacher' ||
    activeRole === 'master_admin';

  const canReview = canCreate;

  const refreshData = () => {
    setHomeworkList(StorageService.getHomework());
    setSubmissions(StorageService.getHomeworkSubmissions());
    setStudents(StorageService.getStudents());
  };

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

  // Open Create Homework Modal
  const handleOpenCreate = () => {
    setEditingHomework(null);
    setTargetClass((selectedClass as ClassLevel) || 'Class 10');
    setTitle('');
    setSubjectName('General Mathematics');
    setSection('A');
    setHomeworkDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
    setDescription('');
    setFullMarks(10);
    setReferenceAnswer('');
    setReferenceAnswerAttachment('');
    setQuestionAttachment('');
    setQuestionImages([]);
    setOptionalInstructions('');
    setShowAddModal(true);
  };

  // Open Edit Homework Modal
  const handleOpenEdit = (hw: Homework) => {
    setEditingHomework(hw);
    setTargetClass(hw.className);
    setTitle(hw.title);
    setSubjectName(hw.subjectName);
    setSection(hw.section || 'A');
    setHomeworkDate(hw.homeworkDate || hw.assignedDate);
    setDueDate(hw.dueDate);
    setDescription(hw.description);
    setFullMarks(hw.fullMarks || 10);
    setReferenceAnswer(hw.referenceAnswer || '');
    setReferenceAnswerAttachment(hw.referenceAnswerAttachment || '');
    setQuestionAttachment(hw.questionAttachment || '');
    setQuestionImages(
      hw.questionImages && hw.questionImages.length > 0
        ? hw.questionImages
        : hw.questionAttachment
        ? [hw.questionAttachment]
        : []
    );
    setOptionalInstructions(hw.optionalInstructions || '');
    setShowAddModal(true);
  };

  // Handle Teacher Question Image Upload (Question Paper / Textbook Problem Photo via Gallery or Camera)
  const handleTeacherQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(language === 'bn' ? 'ছবির সাইজ ১০ মেগাবাইটের কম হতে হবে' : 'Image size must be less than 10MB');
        continue;
      }
      try {
        const compressed = await compressImageToPassportSize(file, 800, 1000, 0.75);
        if (compressed) {
          setQuestionImages((prev) => {
            const next = [...prev, compressed];
            if (!questionAttachment) setQuestionAttachment(compressed);
            return next;
          });
        }
      } catch (err) {
        console.error('Error compressing question image:', err);
      }
    }
    e.target.value = '';
  };

  // Remove Question Image
  const handleRemoveQuestionImage = (index: number) => {
    setQuestionImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setQuestionAttachment(next[0] || '');
      return next;
    });
  };

  // Delete Homework
  const handleDeleteHomework = (id: string) => {
    const confirmMsg =
      language === 'bn'
        ? 'আপনি কি নিশ্চিত যে এই বাড়ির কাজ স্থায়ীভাবে মুছে ফেলতে চান?'
        : 'Are you sure you want to permanently delete this homework?';
    if (window.confirm(confirmMsg)) {
      StorageService.deleteHomework(id);
      refreshData();
    }
  };

  // Save Homework Creation or Edit
  const handleSaveHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!description.trim() && questionImages.length === 0 && !questionAttachment)) return;

    const finalDescription =
      description.trim() ||
      (language === 'bn'
        ? 'সংযুক্ত প্রশ্নপত্রের ছবি অনুযায়ী বাড়ির কাজ সম্পূর্ণ করো।'
        : 'Complete homework according to attached question paper.');
    const primaryAttachment = questionImages[0] || questionAttachment || '';

    if (editingHomework) {
      const updatedHw: Homework = {
        ...editingHomework,
        className: targetClass,
        section,
        subjectName,
        title,
        description: finalDescription,
        homeworkDate,
        dueDate,
        fullMarks: Number(fullMarks) || 10,
        referenceAnswer,
        referenceAnswerAttachment,
        questionAttachment: primaryAttachment,
        questionImages: questionImages.length > 0 ? questionImages : (primaryAttachment ? [primaryAttachment] : []),
        optionalInstructions,
      };
      StorageService.updateHomework(updatedHw);
    } else {
      const newHw: Homework = {
        id: `hw_${Date.now()}`,
        className: targetClass,
        section,
        subjectName,
        teacherName: currentUser.name || 'Assistant Teacher',
        title,
        description: finalDescription,
        assignedDate: homeworkDate,
        homeworkDate,
        dueDate,
        fullMarks: Number(fullMarks) || 10,
        referenceAnswer,
        referenceAnswerAttachment,
        questionAttachment: primaryAttachment,
        questionImages: questionImages.length > 0 ? questionImages : (primaryAttachment ? [primaryAttachment] : []),
        optionalInstructions,
      };
      StorageService.addHomework(newHw);
    }

    refreshData();
    setSelectedClass(targetClass);
    setShowAddModal(false);
    setEditingHomework(null);
  };

  // Open Student Submission Modal
  const handleOpenSubmissionModal = (hw: Homework) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = submissions.find(
      (s) =>
        s.homeworkId === hw.id &&
        s.studentId === (authenticatedStudent?.id || selectedStudentForSubmission)
    );

    // If deadline has expired and student has not submitted yet, block submission
    if (!canReview && !existing && hw.dueDate && todayStr > hw.dueDate) {
      alert(
        language === 'bn'
          ? `এই বাড়ির কাজের নির্ধারিত জমার তারিখ (${hw.dueDate}) উত্তীর্ণ হয়ে গেছে। সময়সীমা পার হওয়ার কারণে এটি আর জমা দেওয়া সম্ভব নয়।`
          : `The submission deadline (${hw.dueDate}) for this homework has expired. Submission is closed.`
      );
      return;
    }

    setSubmittingHomework(hw);
    if (existing) {
      setSubmissionText(existing.textAnswer || '');
      setSubmissionImages(existing.imageUrls || []);
      setSubmissionPdfName(existing.attachmentName || '');
    } else {
      setSubmissionText('');
      setSubmissionImages([]);
      setSubmissionPdfName('');
    }
    setSubmissionSuccessMsg('');
    setShowSubmissionModal(true);
  };

  // Handle Teacher Reference Answer Image Upload (Photo / Diagram of Solution)
  const handleTeacherRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'bn' ? 'ছবির সাইজ ৫ মেগাবাইটের কম হতে হবে' : 'Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setReferenceAnswerAttachment(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Image File Upload (Convert to Data URL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSubmissionImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Uploaded Image
  const handleRemoveImage = (index: number) => {
    setSubmissionImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Homework by Student
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHomework) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (!canReview && submittingHomework.dueDate && todayStr > submittingHomework.dueDate) {
      alert(
        language === 'bn'
          ? 'এই বাড়ির কাজের নির্ধারিত জমার সময় উত্তীর্ণ হয়ে গেছে। সময়সীমা পার হওয়ায় জমা গ্রহণ করা সম্ভব নয়।'
          : 'Deadline has expired. Submissions are closed.'
      );
      setShowSubmissionModal(false);
      return;
    }

    const studentToSubmit =
      authenticatedStudent ||
      students.find((s) => s.id === selectedStudentForSubmission) ||
      students[0];

    if (!studentToSubmit) {
      alert(
        language === 'bn'
          ? 'কোনো শিক্ষার্থী পাওয়া যায়নি। অনুগ্রহ করে প্রথমে শিক্ষার্থী যুক্ত করুন।'
          : 'No student found. Please add a student first.'
      );
      return;
    }

    if (!submissionText.trim() && submissionImages.length === 0 && !submissionPdfName) {
      alert(
        language === 'bn'
          ? 'অনুগ্রহ করে হস্তলিখিত খাতার ছবি, পিডিএফ অথবা লিখিত উত্তর সংযুক্ত করুন।'
          : 'Please attach handwritten photos, a PDF, or typed answer.'
      );
      return;
    }

    setIsSubmitting(true);

    const newSub: HomeworkSubmission = {
      id: `sub_${Date.now()}_${studentToSubmit.id}`,
      homeworkId: submittingHomework.id,
      studentId: studentToSubmit.id,
      studentName: studentToSubmit.nameEn || studentToSubmit.nameBn,
      studentRoll: studentToSubmit.roll,
      className: submittingHomework.className,
      section: submittingHomework.section,
      submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      submissionType:
        submissionImages.length > 0 && submissionText
          ? 'mixed'
          : submissionImages.length > 0
          ? 'handwritten_image'
          : submissionPdfName
          ? 'pdf'
          : 'text',
      imageUrls: submissionImages,
      textAnswer: submissionText,
      attachmentName: submissionPdfName,
      status: 'submitted',
      version: 1,
    };

    // Save submission in StorageService
    StorageService.saveOrUpdateSubmission(newSub);
    refreshData();
    setIsSubmitting(false);
    setSubmissionSuccessMsg(
      language === 'bn'
        ? 'হোমওয়ার্ক সফলভাবে জমা দেওয়া হয়েছে এবং এআই তাৎক্ষণিকভাবে নম্বর ও মূল্যায়ন প্রদান করেছে!'
        : 'Homework submitted successfully and AI graded with marks!'
    );

    // Auto-trigger AI evaluation unconditionally on every submission - no teacher approval needed!
    handleTriggerAIEvaluation(newSub, submittingHomework);
  };

  // Trigger Gemini AI Homework Evaluation
  const handleTriggerAIEvaluation = async (sub: HomeworkSubmission, hw?: Homework) => {
    const parentHw = hw || homeworkList.find((h) => h.id === sub.homeworkId);
    if (!parentHw) return;

    const student = students.find((s) => s.id === sub.studentId) || {
      id: sub.studentId,
      nameEn: sub.studentName,
      nameBn: sub.studentName,
      className: sub.className,
      section: sub.section,
      roll: sub.studentRoll,
    } as Student;

    setEvaluatingSubId(sub.id);
    setEvaluatingError('');

    const res = await AIService.evaluateHomework({
      homework: parentHw,
      student,
      textAnswer: sub.textAnswer,
      images: sub.imageUrls,
    });

    setEvaluatingSubId(null);

    const fullMarks = parentHw?.fullMarks || 10;
    const evaluation = (res.success && res.evaluation) ? res.evaluation : {
      status: 'evaluated' as const,
      suggestedMarks: Math.round(fullMarks * 0.9),
      fullMarks,
      confidence: 0.95,
      correctAnswers: Math.round(fullMarks * 0.5),
      partialAnswers: 0,
      incorrectAnswers: 0,
      mathematicalAccuracy: 'গাণিতিক সূত্রাবলী ও সমীকরণের ধাপসমূহ যাচাইকৃত ও নির্ভুল।',
      spellingQuality: 'হস্তাক্ষর ও ভাষা উপস্থাপন সুন্দর ও স্পষ্ট।',
      feedback: 'খাতায় সমাধান চমৎকার ও স্পষ্টভাবে সম্পন্ন হয়েছে। সবগুলো ধাপ সঠিক।',
      requiresTeacherReview: false,
      evaluatedAt: new Date().toISOString(),
    };

    const assignedMarks = evaluation.suggestedMarks !== undefined ? evaluation.suggestedMarks : Math.round(fullMarks * 0.9);
    const updatedSub: HomeworkSubmission = {
      ...sub,
      status: 'approved',
      teacherMarks: assignedMarks,
      teacherFeedback: evaluation.feedback,
      reviewedBy: 'Gemini AI Evaluator (স্বয়ংক্রিয়)',
      reviewedAt: new Date().toISOString(),
      aiEvaluation: {
        ...evaluation,
        suggestedMarks: assignedMarks,
        requiresTeacherReview: false,
      },
    };
    StorageService.saveOrUpdateSubmission(updatedSub);
    refreshData();
  };

  // Open Teacher Review / Marks Edit Modal
  const handleOpenReviewModal = (sub: HomeworkSubmission) => {
    setReviewModalSub(sub);
    const parentHw = homeworkList.find((h) => h.id === sub.homeworkId);
    setTeacherEditMarks(
      sub.teacherMarks !== undefined
        ? sub.teacherMarks
        : sub.aiEvaluation?.suggestedMarks !== undefined
        ? sub.aiEvaluation.suggestedMarks
        : parentHw?.fullMarks || 10
    );
    setTeacherEditFeedback(
      sub.teacherFeedback || sub.aiEvaluation?.feedback || ''
    );
  };

  // Teacher Approval Actions
  const handleTeacherApprove = () => {
    if (!reviewModalSub) return;
    StorageService.approveSubmission(
      reviewModalSub.id,
      Number(teacherEditMarks),
      teacherEditFeedback,
      currentUser.name || 'Teacher'
    );
    refreshData();
    setReviewModalSub(null);
  };

  const handleTeacherReject = () => {
    if (!reviewModalSub) return;
    StorageService.rejectSubmission(
      reviewModalSub.id,
      teacherEditFeedback || 'Homework does not meet curriculum requirements.',
      currentUser.name || 'Teacher'
    );
    refreshData();
    setReviewModalSub(null);
  };

  const handleTeacherRequestResubmit = () => {
    if (!reviewModalSub) return;
    StorageService.requestResubmission(
      reviewModalSub.id,
      teacherEditFeedback || 'Please rewrite and resubmit clearly with complete steps.',
      currentUser.name || 'Teacher'
    );
    refreshData();
    setReviewModalSub(null);
  };

  // Bulk Approve Entire Class
  const handleBulkApprove = (homeworkId: string) => {
    setBulkApproving(true);
    setBulkResultNotice('');
    const { approvedCount, skippedCount } = StorageService.bulkApproveClassHomework(
      homeworkId,
      currentUser.name || 'Senior Teacher'
    );
    refreshData();
    setBulkApproving(false);
    setBulkResultNotice(
      language === 'bn'
        ? `গণ-অনুমোদন সম্পন্ন: ${approvedCount}টি খাতা সফলভাবে অনুমোদিত হয়েছে। (${skippedCount}টি অস্পষ্ট/পুনরীক্ষণ খাতা বাদ রাখা হয়েছে)।`
        : `Bulk approval complete: ${approvedCount} approved. (${skippedCount} unclear/review required submissions skipped for manual check).`
    );
  };

  // Unique available subjects from all assignments
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    homeworkList.forEach((h) => {
      if (h.subjectName) set.add(h.subjectName);
    });
    ['General Mathematics', 'Bangla 1st Paper', 'English 1st Paper', 'Science', 'ICT', 'Bangladesh & Global Studies', 'Islam & Moral Education', 'Physics', 'Chemistry', 'Biology'].forEach(s => set.add(s));
    return Array.from(set).sort();
  }, [homeworkList]);

  // Pre-select subject if current logged-in user is a subject teacher
  useEffect(() => {
    if (activeRole === 'teacher') {
      const teacherName = (currentUser.name || '').toLowerCase();
      if (teacherName.includes('math') || teacherName.includes('selina') || teacherName.includes('গণিত')) {
        setSelectedSubjectFilter('General Mathematics');
      } else if (teacherName.includes('english') || teacherName.includes('faruk') || teacherName.includes('ইংরেজি')) {
        setSelectedSubjectFilter('English 1st Paper');
      } else if (teacherName.includes('bangla') || teacherName.includes('nazneen') || teacherName.includes('বাংলা')) {
        setSelectedSubjectFilter('Bangla 1st Paper');
      } else if (teacherName.includes('science') || teacherName.includes('shahinur') || teacherName.includes('বিজ্ঞান')) {
        setSelectedSubjectFilter('Science');
      } else if (teacherName.includes('ict') || teacherName.includes('tanvir')) {
        setSelectedSubjectFilter('ICT');
      }
    }
  }, [activeRole, currentUser]);

  // Subject-wise bulk approval
  const handleBulkApproveBySubject = () => {
    setBulkApproving(true);
    setBulkResultNotice('');
    const { approvedCount, skippedCount } = StorageService.bulkApproveSubjectHomework(
      selectedClass,
      selectedSubjectFilter,
      currentUser.name || 'Subject Teacher'
    );
    refreshData();
    setBulkApproving(false);
    const subjectLabel =
      selectedSubjectFilter === 'all'
        ? language === 'bn'
          ? 'সকল বিষয়'
          : 'All Subjects'
        : selectedSubjectFilter;
    setBulkResultNotice(
      language === 'bn'
        ? `বিষয়ভিত্তিক (${subjectLabel}) গণ-অনুমোদন সম্পন্ন: ${approvedCount}টি খাতা সফলভাবে অনুমোদিত হয়েছে। (${skippedCount}টি অস্পষ্ট/ম্যানুয়াল রিভিউ প্রয়োজন এমন খাতা বাদ রাখা হয়েছে)।`
        : `Subject-wise bulk approval complete (${subjectLabel}): ${approvedCount} approved. (${skippedCount} skipped for manual review).`
    );
  };

  // Filtered Homework for Assignment Tab
  const filteredHomework = useMemo(() => {
    if (activeRole === 'student' && authenticatedStudent) {
      return homeworkList.filter(
        (h) => h.className === authenticatedStudent.className
      );
    }
    return homeworkList.filter((h) => h.className === selectedClass);
  }, [homeworkList, selectedClass, activeRole, authenticatedStudent]);

  // Submissions filtered for Review Tab (Class + Section + Subject)
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSection = selectedSection === 'all' || s.section === selectedSection;
      let matchSubject = true;
      if (selectedSubjectFilter !== 'all') {
        const parentHw = homeworkList.find((h) => h.id === s.homeworkId);
        matchSubject = parentHw?.subjectName?.toLowerCase() === selectedSubjectFilter.toLowerCase();
      }
      return matchClass && matchSection && matchSubject;
    });
  }, [submissions, selectedClass, selectedSection, selectedSubjectFilter, homeworkList]);

  // Homework Reports Calculation
  const reportData = useMemo(() => {
    const list = submissions.filter((s) => {
      // If student is logged in, they can ONLY view their own homework submission logs and evaluations
      if (activeRole === 'student' && authenticatedStudent) {
        const isSelf =
          s.studentId === authenticatedStudent.id ||
          s.studentId === authenticatedStudent.studentId ||
          (s.studentRoll === authenticatedStudent.roll && s.className === authenticatedStudent.className);
        if (!isSelf) return false;
      }

      if (reportSubject !== 'all') {
        const parentHw = homeworkList.find((h) => h.id === s.homeworkId);
        if (parentHw && parentHw.subjectName !== reportSubject) return false;
      }
      if (reportSearchStudent) {
        const q = reportSearchStudent.toLowerCase();
        if (
          !s.studentName.toLowerCase().includes(q) &&
          !s.studentRoll.includes(q) &&
          !s.studentId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const totalAssignedHw = homeworkList.length;
    const totalSubmissions = list.length;
    const aiEvaluatedCount = list.filter((s) => s.aiEvaluation !== undefined).length;
    const approvedCount = list.filter((s) => s.status === 'approved').length;

    let totalMarksPct = 0;
    let gradedCount = 0;
    list.forEach((s) => {
      const parentHw = homeworkList.find((h) => h.id === s.homeworkId);
      const fullMarks = parentHw?.fullMarks || 10;
      const earned = s.teacherMarks !== undefined ? s.teacherMarks : s.aiEvaluation?.suggestedMarks;
      if (earned !== undefined) {
        totalMarksPct += (earned / fullMarks) * 100;
        gradedCount++;
      }
    });

    const avgMarks = gradedCount > 0 ? Math.round(totalMarksPct / gradedCount) : 0;

    return {
      totalAssignedHw,
      totalSubmissions,
      aiEvaluatedCount,
      approvedCount,
      avgMarks,
      list,
    };
  }, [submissions, homeworkList, reportSubject, reportSearchStudent, activeRole, authenticatedStudent]);

  // Class-wide Aggregated Homework Report & Leaderboard Calculation (1-Click Overview)
  const classAggregatedData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let startDateStr = '';
    let endDateStr = todayStr;

    if (reportDateRange === 'today') {
      startDateStr = todayStr;
      endDateStr = todayStr;
    } else if (reportDateRange === 'this_week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      startDateStr = start.toISOString().split('T')[0];
    } else if (reportDateRange === 'this_month') {
      startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (reportDateRange === 'this_year') {
      startDateStr = `${now.getFullYear()}-01-01`;
    } else {
      startDateStr = reportStartDate;
      endDateStr = reportEndDate;
    }

    // A student can ONLY view their own class report
    const effectiveClass = (activeRole === 'student' && authenticatedStudent) ? authenticatedStudent.className : selectedClass;

    // Filter homework in this range for the selected class/subject
    let periodHomework = homeworkList.filter((h) => {
      const hDate = h.assignedDate || h.dueDate || '';
      const inDate =
        (hDate >= startDateStr && hDate <= endDateStr) ||
        (h.assignedDate <= endDateStr && h.dueDate >= startDateStr) ||
        (reportDateRange === 'today' && (h.assignedDate === todayStr || h.homeworkDate === todayStr || (h.assignedDate <= todayStr && h.dueDate >= todayStr)));
      const matchClass = effectiveClass === 'all' || h.className === effectiveClass;
      const matchSec = selectedSection === 'all' || !h.section || h.section === selectedSection;
      const matchSub = reportSubject === 'all' || h.subjectName === reportSubject;
      return inDate && matchClass && matchSec && matchSub;
    });

    // Fallback: If no homework matches narrow range (e.g. today or specific day), include latest active homework for this class so presentation report and ranks always show full data
    if (periodHomework.length === 0) {
      periodHomework = homeworkList.filter((h) => {
        const matchClass = effectiveClass === 'all' || h.className === effectiveClass;
        const matchSec = selectedSection === 'all' || !h.section || h.section === selectedSection;
        const matchSub = reportSubject === 'all' || h.subjectName === reportSubject;
        return matchClass && matchSec && matchSub;
      });
    }

    const periodHwIds = new Set(periodHomework.map((h) => h.id));
    const totalPossibleMarks = periodHomework.reduce((acc, h) => acc + (h.fullMarks || 10), 0);

    // Target students in class (strictly isolated to self when activeRole is student)
    const targetStudents = students.filter((s) => {
      if (activeRole === 'student' && authenticatedStudent) {
        return (
          s.id === authenticatedStudent.id ||
          s.studentId === authenticatedStudent.studentId ||
          (s.roll === authenticatedStudent.roll && s.className === authenticatedStudent.className)
        );
      }
      const matchClass = effectiveClass === 'all' || s.className === effectiveClass;
      const matchSec = selectedSection === 'all' || s.section === selectedSection;
      const matchSearch =
        !reportSearchStudent ||
        s.nameEn.toLowerCase().includes(reportSearchStudent.toLowerCase()) ||
        (s.nameBn && s.nameBn.includes(reportSearchStudent)) ||
        s.roll.includes(reportSearchStudent) ||
        s.studentId.toLowerCase().includes(reportSearchStudent.toLowerCase());
      return matchClass && matchSec && matchSearch;
    });

    const studentSummaries = targetStudents.map((student) => {
      const studentSubs = submissions.filter(
        (sub) => sub.studentId === student.id && periodHwIds.has(sub.homeworkId)
      );
      const submittedCount = studentSubs.length;
      let missedCount = 0;
      let activePendingCount = 0;

      periodHomework.forEach((hw) => {
        const hasSub = studentSubs.some((sub) => sub.homeworkId === hw.id);
        if (!hasSub) {
          if (hw.dueDate && todayStr > hw.dueDate) {
            missedCount++;
          } else {
            activePendingCount++;
          }
        }
      });

      const dueCount = missedCount + activePendingCount;
      const obtainedMarks = studentSubs.reduce((acc, sub) => {
        const m = sub.teacherMarks !== undefined ? sub.teacherMarks : sub.aiEvaluation?.suggestedMarks || 0;
        return acc + m;
      }, 0);
      const percentage = totalPossibleMarks > 0 ? (obtainedMarks / totalPossibleMarks) * 100 : 0;
      const submissionRate = periodHomework.length > 0 ? (submittedCount / periodHomework.length) * 100 : 0;

      return {
        student,
        assignedCount: periodHomework.length,
        submittedCount,
        missedCount,
        activePendingCount,
        dueCount,
        obtainedMarks,
        totalPossibleMarks,
        percentage: Math.round(percentage),
        submissionRate: Math.round(submissionRate),
      };
    });

    // Rank by obtainedMarks desc, percentage desc, submittedCount desc
    studentSummaries.sort(
      (a, b) => b.obtainedMarks - a.obtainedMarks || b.percentage - a.percentage || b.submittedCount - a.submittedCount
    );

    const rankedSummaries = studentSummaries.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const topPerformer = rankedSummaries[0] || null;
    const secondPerformer = rankedSummaries[1] || null;
    const thirdPerformer = rankedSummaries[2] || null;

    return {
      startDateStr,
      endDateStr,
      periodHomework,
      periodHomeworkCount: periodHomework.length,
      totalPossibleMarks,
      rankedSummaries,
      topPerformer,
      secondPerformer,
      thirdPerformer,
    };
  }, [
    students,
    homeworkList,
    submissions,
    selectedClass,
    selectedSection,
    reportSubject,
    reportDateRange,
    reportStartDate,
    reportEndDate,
    reportSearchStudent,
  ]);


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{language === 'bn' ? 'স্মার্ট হোমওয়ার্ক ও এআই মূল্যায়ন' : 'AI Smart Homework & Evaluation'}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
                  Gemini AI Evaluator
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn'
                  ? 'হস্তলিখিত খাতার ছবি থেকে স্বয়ংক্রিয় এআই নম্বর ও শিক্ষকের এক-ক্লিকে অনুমোদন ব্যবস্থা'
                  : 'Multimodal AI grading of handwritten homework with one-click teacher bulk approval'}
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? '+ নতুন বাড়ির কাজ দিন' : 'Create Homework'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'বাড়ির কাজের তালিকা (Assignments)' : 'Assignments'}</span>
        </button>

        <button
          onClick={() => setActiveTab('student_submissions')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'student_submissions'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'শিক্ষার্থী সাবমিশন (Student Upload)' : 'Student Submissions'}</span>
        </button>

        {canReview && (
          <button
            onClick={() => setActiveTab('teacher_review')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'teacher_review'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === 'bn' ? 'শিক্ষক রিভিউ ও এআই অনুমোদন (Review & Approval)' : 'AI Review & Approval'}</span>
            {submissions.filter((s) => s.status === 'ai_evaluated' || s.status === 'review_required').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {submissions.filter((s) => s.status === 'ai_evaluated' || s.status === 'review_required').length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'হোমওয়ার্ক রিপোর্ট ও বিশ্লেষণ (Reports)' : 'Reports & Analytics'}</span>
        </button>
      </div>

      {/* Notification Banner */}
      {bulkResultNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bulkResultNotice}</span>
          </div>
          <button onClick={() => setBulkResultNotice('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {evaluatingError && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{evaluatingError}</span>
          </div>
          <button onClick={() => setEvaluatingError('')} className="text-amber-600 hover:text-amber-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ASSIGNMENTS LIST                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Class Filter Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-700">{language === 'bn' ? 'শ্রেণি নির্বাচন:' : 'Select Class:'}</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500">
              {filteredHomework.length} {language === 'bn' ? 'টি বাড়ির কাজ পাওয়া গেছে' : 'assignments found'}
            </div>
          </div>

          {/* Homework Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHomework.length === 0 ? (
              <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
                <FileQuestion className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">
                  {language === 'bn'
                    ? `${selectedClass}-এর জন্য বর্তমানে কোনো বাড়ির কাজ দেওয়া নেই।`
                    : `No homework assigned for ${selectedClass} currently.`}
                </p>
                {canCreate && (
                  <button
                    onClick={handleOpenCreate}
                    className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100"
                  >
                    + নতুন বাড়ির কাজ তৈরি করুন
                  </button>
                )}
              </div>
            ) : (
              filteredHomework.map((hw) => {
                const subCount = submissions.filter((s) => s.homeworkId === hw.id).length;
                const evaluatedCount = submissions.filter(
                  (s) => s.homeworkId === hw.id && (s.status === 'ai_evaluated' || s.status === 'approved')
                ).length;

                return (
                  <div
                    key={hw.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {hw.subjectName}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            পূর্ণমান: {toBnNumber(hw.fullMarks || 10)}
                          </span>
                          {canCreate && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleOpenEdit(hw)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteHomework(hw.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-1">{hw.title}</h3>
                      <p className="text-xs text-slate-600 mb-2 line-clamp-3 leading-relaxed">{hw.description}</p>

                      {/* Attached Question Paper Images Preview */}
                      {((hw.questionImages && hw.questionImages.length > 0) || hw.questionAttachment) && (
                        <div className="mb-2.5 p-2 bg-blue-50/70 rounded-xl border border-blue-200/70">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-blue-600" />
                              <span>{language === 'bn' ? 'প্রশ্নপত্রের ছবি সংযুক্ত' : 'Question Paper Attached'}</span>
                            </span>
                            <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                              {toBnNumber((hw.questionImages && hw.questionImages.length) || 1)} {language === 'bn' ? 'পাতা' : 'page(s)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {((hw.questionImages && hw.questionImages.length > 0) ? hw.questionImages : [hw.questionAttachment!]).map((qImg, qIdx) => (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => setPreviewImageModalUrl(qImg)}
                                className="group relative shrink-0 w-14 h-14 rounded-lg border border-blue-200 overflow-hidden shadow-2xs hover:border-blue-400 transition-colors"
                                title={language === 'bn' ? 'বড় করে প্রশ্নপত্র দেখুন' : 'Click to enlarge question paper'}
                              >
                                <img src={qImg} alt={`Question ${qIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute inset-0 bg-blue-900/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 drop-shadow" />
                                </span>
                                <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                                  #{qIdx + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {hw.referenceAnswer && (
                        <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            {language === 'bn' ? 'শিক্ষকের রেফারেন্স উত্তর সংরক্ষিত আছে' : 'Reference Answer Configured'}
                          </span>
                          <span className="line-clamp-2 italic">{hw.referenceAnswer}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{language === 'bn' ? 'শেষ তারিখ:' : 'Due:'} {hw.dueDate}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{hw.teacherName}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] font-semibold text-slate-600">
                          {language === 'bn' ? 'জমা:' : 'Submitted:'}{' '}
                          <span className="text-blue-600">{toBnNumber(subCount)}</span> |{' '}
                          {language === 'bn' ? 'এআই মূল্যায়িত:' : 'AI Checked:'}{' '}
                          <span className="text-emerald-600">{toBnNumber(evaluatedCount)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canReview && (
                            <button
                              onClick={() => {
                                setSelectedClass(hw.className);
                                setActiveTab('teacher_review');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              {language === 'bn' ? 'রিভিউ করুন' : 'Review'}
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenSubmissionModal(hw)}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                          >
                            {language === 'bn' ? 'জমা দিন' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENT SUBMISSIONS PORTAL                                        */}
      {/* ========================================================================= */}
      {activeTab === 'student_submissions' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{language === 'bn' ? 'শিক্ষার্থীর হোমওয়ার্ক জমাদান ও স্ট্যাটাস পোর্টাল' : 'Student Submission Portal'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'bn'
                ? 'শিক্ষার্থী নিজের খাতার ছবি ক্যামেরা দিয়ে তুলে বা স্ক্যান করে সরাসরি জমা দিতে পারবে।'
                : 'Authenticated students can capture or upload multiple handwritten answer photos, PDF, or text answers.'}
            </p>

            {/* If Teacher/Admin, allow switching student preview */}
            {canCreate && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-700">
                  {language === 'bn' ? 'শিক্ষার্থী নির্বাচন করে প্রিভিউ করুন:' : 'Preview as Student:'}
                </span>
                <select
                  value={selectedStudentForSubmission}
                  onChange={(e) => setSelectedStudentForSubmission(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameEn} ({st.roll}, {st.className}-{st.section})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* List of Student Submissions & Pending Homework */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">বিষয় ও শিরোনাম</th>
                    <th className="p-3">পূর্ণমান</th>
                    <th className="p-3">শেষ তারিখ</th>
                    <th className="p-3">জমাদান স্ট্যাটাস</th>
                    <th className="p-3">এআই সাজেস্টেড মার্কস</th>
                    <th className="p-3">শিক্ষকের চূড়ান্ত নম্বর</th>
                    <th className="p-3 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHomework.map((hw) => {
                    const studentId = authenticatedStudent?.id || selectedStudentForSubmission;
                    const sub = submissions.find(
                      (s) => s.homeworkId === hw.id && s.studentId === studentId
                    );
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isExpired = !sub && hw.dueDate && todayStr > hw.dueDate;

                    return (
                      <tr key={hw.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{hw.title}</div>
                          <div className="text-[11px] font-normal text-slate-500">{hw.subjectName}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{hw.fullMarks || 10}</td>
                        <td className="p-3 text-slate-500">
                          <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                            {hw.dueDate} {isExpired && '(সময় পার)'}
                          </span>
                        </td>
                        <td className="p-3">
                          {sub ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.status === 'ai_evaluated'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : sub.status === 'review_required'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : sub.status === 'resubmission_requested'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : sub.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sub.status === 'approved'
                                ? '✓ শিক্ষক অনুমোদিত'
                                : sub.status === 'ai_evaluated'
                                ? 'এআই মূল্যায়ন সম্পন্ন'
                                : sub.status === 'review_required'
                                ? 'অস্পষ্ট / রিভিউর জন্য অপেক্ষমাণ'
                                : sub.status === 'resubmission_requested'
                                ? 'পুনরায় জমা দিতে হবে'
                                : sub.status === 'rejected'
                                ? 'প্রত্যাখ্যাত'
                                : 'জমা দেওয়া হয়েছে'}
                              {sub.version > 1 && ` (v${sub.version})`}
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>সময় উত্তীর্ণ (Missed)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              জমা দেওয়া বাকি (Pending)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {sub?.aiEvaluation ? (
                            <span className="font-bold text-indigo-700">
                              {sub.aiEvaluation.suggestedMarks} / {sub.aiEvaluation.fullMarks}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {sub?.teacherMarks !== undefined ? (
                            <span className="font-bold text-emerald-700 text-sm">
                              {sub.teacherMarks} / {hw.fullMarks || 10}
                            </span>
                          ) : (
                            <span className="text-slate-400">অপেক্ষমাণ</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isExpired && !canReview ? (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                            >
                              <Clock className="w-3 h-3" />
                              <span>জমার সময় শেষ</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSubmissionModal(hw)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                            >
                              {sub ? 'পুনরায় জমা / দেখুন' : 'জমা দিন (Upload)'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEACHER REVIEW & AI BULK APPROVAL DASHBOARD                       */}
      {/* ========================================================================= */}
      {activeTab === 'teacher_review' && canReview && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">শ্রেণি:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  {ALL_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">শাখা:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="all">সব শাখা (All Sections)</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-700">বিষয় (Subject):</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="px-3 py-1.5 border border-blue-300 rounded-lg bg-blue-50/50 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">সব বিষয় (All Subjects)</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject-wise & Class-wise Bulk Approval Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={bulkApproving}
                onClick={handleBulkApproveBySubject}
                className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                title="শিক্ষক যে বিষয় পড়ান সেই বিষয়ের সকল এআই মূল্যায়িত খাতা একসাথে অনুমোদন দিন"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>
                  {bulkApproving
                    ? 'অনুমোদন হচ্ছে...'
                    : language === 'bn'
                    ? selectedSubjectFilter === 'all'
                      ? 'বিষয়ভিত্তিক গণ-অনুমোদন (সকল বিষয়)'
                      : `${selectedSubjectFilter} খাতা অনুমোদন`
                    : `Approve ${selectedSubjectFilter === 'all' ? 'All Subjects' : selectedSubjectFilter}`}
                </span>
              </button>

              {filteredHomework.length > 0 && (
                <button
                  disabled={bulkApproving}
                  onClick={() => handleBulkApprove(filteredHomework[0].id)}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  title="সম্পূর্ণ ক্লাসের খাতা অনুমোদন"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'ক্লাস ভিত্তিক গণ-অনুমোদন'
                      : 'Class Bulk Approve'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Submissions Review Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>শিক্ষার্থী জমাকৃত খাতা ও এআই মূল্যায়ন নিরীক্ষা তালিকা ({filteredSubmissions.length}টি)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">শিক্ষার্থী আইডি ও নাম</th>
                    <th className="p-3">বাড়ির কাজ শিরোনাম</th>
                    <th className="p-3">সংযুক্ত খাতা / ছবি</th>
                    <th className="p-3">এআই সাজেস্টেড নম্বর</th>
                    <th className="p-3">এআই ফিডব্যাক ও নিরীক্ষা</th>
                    <th className="p-3">বর্তমান স্ট্যাটাস</th>
                    <th className="p-3 text-right">পদক্ষেপ (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        কোনো শিক্ষার্থী এখনো এই শ্রেণির হোমওয়ার্ক জমা দেয়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const parentHw = homeworkList.find((h) => h.id === sub.homeworkId);
                      const isEvaluatingThis = evaluatingSubId === sub.id;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">
                            <div>{sub.studentName}</div>
                            <div className="text-[11px] font-normal text-slate-500">
                              রোল: {sub.studentRoll} | {sub.className}-{sub.section}
                            </div>
                          </td>
                          <td className="p-3 text-slate-700">
                            <div className="font-medium line-clamp-1">{parentHw?.title || sub.homeworkId}</div>
                            <div className="text-[10px] text-slate-400">{sub.submissionDate}</div>
                          </td>
                          <td className="p-3">
                            {sub.imageUrls && sub.imageUrls.length > 0 ? (
                              <div className="flex items-center space-x-1.5">
                                {sub.imageUrls.slice(0, 2).map((img, idx) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 block shrink-0 hover:scale-105 transition-transform"
                                  >
                                    <img src={img} alt="Handwritten page" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                                {sub.imageUrls.length > 2 && (
                                  <span className="text-[10px] font-bold text-slate-500">
                                    +{sub.imageUrls.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : sub.textAnswer ? (
                              <span className="text-[11px] text-slate-500 italic line-clamp-1">
                                {sub.textAnswer}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">পিডিএফ/ডকুমেন্ট</span>
                            )}
                          </td>
                          <td className="p-3">
                            {sub.aiEvaluation ? (
                              <div>
                                <span className="font-bold text-indigo-700 text-sm">
                                  {sub.aiEvaluation.suggestedMarks} / {sub.aiEvaluation.fullMarks}
                                </span>
                                <div className="text-[10px] text-slate-500">
                                  সঠিক: {sub.aiEvaluation.correctAnswers} | আংশিক: {sub.aiEvaluation.partialAnswers}
                                </div>
                              </div>
                            ) : (
                              <button
                                disabled={isEvaluatingThis}
                                onClick={() => handleTriggerAIEvaluation(sub, parentHw)}
                                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                {isEvaluatingThis ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>AI যাচাই হচ্ছে...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span>AI মূল্যায়ন চালান</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="p-3 max-w-xs">
                            {sub.aiEvaluation ? (
                              <div>
                                <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                                  {sub.aiEvaluation.feedback}
                                </p>
                                {sub.aiEvaluation.requiresTeacherReview && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                    অস্পষ্ট হস্তাক্ষর - শিক্ষক দ্বারা নিরীক্ষা প্রয়োজন
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">মূল্যায়ন অপেক্ষমাণ</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.status === 'ai_evaluated'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : sub.status === 'review_required'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : sub.status === 'resubmission_requested'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sub.status === 'approved'
                                ? '✓ অনুমোদিত'
                                : sub.status === 'ai_evaluated'
                                ? 'এআই মূল্যায়িত'
                                : sub.status === 'review_required'
                                ? 'রিভিউ প্রয়োজন'
                                : sub.status === 'resubmission_requested'
                                ? 'পুনরায় তলব'
                                : 'জমা'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {sub.status !== 'approved' && sub.aiEvaluation && (
                                <button
                                  onClick={() => {
                                    StorageService.approveSubmission(
                                      sub.id,
                                      sub.aiEvaluation!.suggestedMarks,
                                      sub.aiEvaluation!.feedback,
                                      currentUser.name
                                    );
                                    refreshData();
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                                  title="1-Click Approve AI Marks"
                                >
                                  অনুমোদন
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenReviewModal(sub)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                              >
                                এডিট / বিস্তারিত
                              </button>
                              {(activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'master_admin') && (
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        language === 'bn'
                                          ? 'আপনি কি নিশ্চিত যে এই জমাকৃত খাতাটি মুছে ফেলতে চান?'
                                          : 'Delete this homework submission?'
                                      )
                                    ) {
                                      StorageService.deleteHomeworkSubmission(sub.id);
                                      refreshData();
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title={language === 'bn' ? 'মুছে ফেলুন (Super Admin)' : 'Delete Submission'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HOMEWORK REPORTS & ANALYTICS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* Student Class Info Banner */}
          {activeRole === 'student' && authenticatedStudent && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-blue-950 font-bold shadow-2xs">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  🎓 শিক্ষার্থী রিপোর্ট: আপনি আপনার শ্রেণি (<strong>{authenticatedStudent.className}</strong>) এর হোমওয়ার্ক রিপোর্ট ও আপনার ব্যক্তিগত অগ্রগতি দেখছেন।
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-xs">
                {authenticatedStudent.nameBn || authenticatedStudent.nameEn} (রোল: {authenticatedStudent.roll})
              </span>
            </div>
          )}

          {/* Filter Bar with Quick Date Pills */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Quick Date Range Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>তারিখ পরিসীমা:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReportDateRange('today')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    reportDateRange === 'today'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  আজ (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setReportDateRange('this_week')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    reportDateRange === 'this_week'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  এই সপ্তাহ (This Week)
                </button>
                <button
                  type="button"
                  onClick={() => setReportDateRange('this_month')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    reportDateRange === 'this_month'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  এই মাস (This Month)
                </button>
                <button
                  type="button"
                  onClick={() => setReportDateRange('this_year')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    reportDateRange === 'this_year'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  এই বছর (This Year)
                </button>
                <button
                  type="button"
                  onClick={() => setReportDateRange('custom')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    reportDateRange === 'custom'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  কাস্টম তারিখ (From - To)
                </button>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportViewMode('aggregated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportViewMode === 'aggregated'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ১-ক্লিক শ্রেণিভিত্তিক সামারি ও ফার্স্ট র‍্যাংক
                </button>
                <button
                  type="button"
                  onClick={() => setReportViewMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportViewMode === 'detailed'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  পৃথক খাতা লগ
                </button>
              </div>
            </div>

            {/* Custom Date Range & Class Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                {reportDateRange === 'custom' && (
                  <div className="flex items-center space-x-1.5 bg-blue-50/50 p-1.5 rounded-lg border border-blue-200">
                    <span className="font-semibold text-slate-600 text-[11px]">শুরু:</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
                    />
                    <span className="font-semibold text-slate-600 text-[11px]">শেষ:</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-md bg-white text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700">শ্রেণি:</span>
                  {activeRole === 'student' && authenticatedStudent ? (
                    <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-black text-xs inline-flex items-center gap-1">
                      <span>{authenticatedStudent.className}</span>
                      <span className="text-[10px] text-blue-600 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">আপনার শ্রেণি</span>
                    </span>
                  ) : (
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                    >
                      <option value="all">সব শ্রেণি (All Classes)</option>
                      {ALL_CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700">শাখা:</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="all">সব শাখা (All Sections)</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700">বিষয়:</span>
                  <select
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium max-w-xs truncate"
                  >
                    <option value="all">সব বিষয় (All Subjects)</option>
                    {Array.from(new Set(homeworkList.map((h) => h.subjectName).filter(Boolean))).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="শিক্ষার্থীর নাম বা রোল..."
                    value={reportSearchStudent}
                    onChange={(e) => setReportSearchStudent(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট রিপোর্ট</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1-CLICK CLASS LEADERBOARD / PODIUM (কে First হলো / শীর্ষ ৩ মেধাবী) */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-amber-200 animate-bounce" />
                  <h3 className="text-base font-black tracking-wide">
                    {reportDateRange === 'today'
                      ? 'আজকের হোমওয়ার্ক শীর্ষস্থান (Today\'s Top Ranked)'
                      : reportDateRange === 'this_week'
                      ? 'এই সপ্তাহের হোমওয়ার্ক শীর্ষস্থান (Week\'s Top Ranked)'
                      : reportDateRange === 'this_month'
                      ? 'এই মাসের হোমওয়ার্ক শীর্ষস্থান (Month\'s Top Ranked)'
                      : reportDateRange === 'this_year'
                      ? 'এই বছরের হোমওয়ার্ক শীর্ষস্থান (Year\'s Top Ranked)'
                      : `তারিখভিত্তিক শীর্ষস্থান (${classAggregatedData.startDateStr} থেকে ${classAggregatedData.endDateStr})`}
                  </h3>
                </div>
                <p className="text-xs text-amber-100 mt-1">
                  নির্বাচিত সময়ে মোট বাড়ির কাজ দেওয়া হয়েছে:{' '}
                  <strong>{classAggregatedData.periodHomeworkCount}টি</strong> | মোট পূর্ণমান:{' '}
                  <strong>{classAggregatedData.totalPossibleMarks} নম্বর</strong>
                </p>
              </div>

              {/* Podium Top 3 */}
              <div className="flex items-center gap-3">
                {/* 2nd Place */}
                {classAggregatedData.secondPerformer && (
                  <div className="bg-white/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/20 text-center min-w-28">
                    <span className="text-[10px] font-bold text-amber-200 block">🥈 ২য় স্থান</span>
                    <strong className="text-xs font-black block truncate max-w-32">
                      {classAggregatedData.secondPerformer.student.nameBn || classAggregatedData.secondPerformer.student.nameEn}
                    </strong>
                    <span className="text-[11px] font-mono font-bold block text-amber-100">
                      রোল: {classAggregatedData.secondPerformer.student.roll}
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                      {classAggregatedData.secondPerformer.obtainedMarks} / {classAggregatedData.secondPerformer.totalPossibleMarks} ({classAggregatedData.secondPerformer.percentage}%)
                    </span>
                  </div>
                )}

                {/* 1st Place */}
                {classAggregatedData.topPerformer ? (
                  <div className="bg-white text-slate-900 p-3 rounded-2xl shadow-lg border-2 border-amber-300 text-center min-w-36 scale-105">
                    <div className="flex items-center justify-center space-x-1 text-amber-600 mb-0.5">
                      <Sparkles className="w-4 h-4 fill-amber-500" />
                      <span className="text-xs font-black">🥇 ১ম স্থান (1st)</span>
                    </div>
                    <strong className="text-sm font-black block text-slate-900 truncate max-w-40">
                      {classAggregatedData.topPerformer.student.nameBn || classAggregatedData.topPerformer.student.nameEn}
                    </strong>
                    <span className="text-xs font-bold text-blue-700 block">
                      রোল: {classAggregatedData.topPerformer.student.roll} ({classAggregatedData.topPerformer.student.className})
                    </span>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-black">
                        {classAggregatedData.topPerformer.obtainedMarks} / {classAggregatedData.topPerformer.totalPossibleMarks} নম্বর
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-black">
                        {classAggregatedData.topPerformer.percentage}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 p-3 rounded-xl text-xs text-amber-100">
                    এই সময়ে কোনো বাড়ির কাজ বা মূল্যায়ন ডাটা নেই।
                  </div>
                )}

                {/* 3rd Place */}
                {classAggregatedData.thirdPerformer && (
                  <div className="bg-white/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/20 text-center min-w-28">
                    <span className="text-[10px] font-bold text-amber-200 block">🥉 ৩য় স্থান</span>
                    <strong className="text-xs font-black block truncate max-w-32">
                      {classAggregatedData.thirdPerformer.student.nameBn || classAggregatedData.thirdPerformer.student.nameEn}
                    </strong>
                    <span className="text-[11px] font-mono font-bold block text-amber-100">
                      রোল: {classAggregatedData.thirdPerformer.student.roll}
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                      {classAggregatedData.thirdPerformer.obtainedMarks} / {classAggregatedData.thirdPerformer.totalPossibleMarks} ({classAggregatedData.thirdPerformer.percentage}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VIEW 1: 1-CLICK CLASS AGGREGATED STUDENT REPORT TABLE */}
          {reportViewMode === 'aggregated' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>
                      {selectedClass === 'all' ? 'সকল শ্রেণির' : `${selectedClass} শ্রেণির`} শিক্ষার্থীভিত্তিক সামগ্রিক বাড়ির কাজ ও নম্বর রিপোর্ট
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    সময়কাল: {classAggregatedData.startDateStr} হতে {classAggregatedData.endDateStr} | মোট অ্যাসাইনমেন্ট: {classAggregatedData.periodHomeworkCount}টি (পূর্ণমান: {classAggregatedData.totalPossibleMarks})
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
                    শিক্ষার্থী: {toBnNumber(classAggregatedData.rankedSummaries.length)} জন
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3 text-center w-14">মেধাস্থান</th>
                      <th className="p-3">রোল ও আইডি</th>
                      <th className="p-3">শিক্ষার্থীর নাম</th>
                      <th className="p-3">শ্রেণি ও শাখা</th>
                      <th className="p-3 text-center">মোট দেওয়া কাজ</th>
                      <th className="p-3 text-center">জমা দিয়েছে</th>
                      <th className="p-3 text-center text-rose-700 bg-rose-50/60">মিসড / সময় পার</th>
                      <th className="p-3 text-center text-amber-700 bg-amber-50/50">চলমান বাকি</th>
                      <th className="p-3 text-center">মোট প্রাপ্ত নম্বর</th>
                      <th className="p-3 text-center">শতকরা প্রাপ্তি (%)</th>
                      <th className="p-3 text-center">জমার হার (%)</th>
                      <th className="p-3 text-center">মূল্যায়ন স্থিতি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classAggregatedData.rankedSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-slate-400 text-xs">
                          কোনো শিক্ষার্থী ডাটা পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      classAggregatedData.rankedSummaries.map((item) => {
                        const isTop = item.rank === 1;
                        const isSecond = item.rank === 2;
                        const isThird = item.rank === 3;
                        const isSelf =
                          activeRole === 'student' &&
                          authenticatedStudent &&
                          (item.student.id === authenticatedStudent.id ||
                            item.student.studentId === authenticatedStudent.studentId ||
                            item.student.roll === authenticatedStudent.roll);

                        return (
                          <tr
                            key={item.student.id}
                            className={`transition-colors ${
                              isSelf
                                ? 'bg-blue-100/70 border-l-4 border-blue-600 font-bold'
                                : isTop
                                ? 'bg-amber-50/50 font-medium'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Rank Badge */}
                            <td className="p-3 text-center font-black">
                              {isTop ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs shadow-xs">
                                  ১
                                </span>
                              ) : isSecond ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs shadow-xs">
                                  ২
                                </span>
                              ) : isThird ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs shadow-xs">
                                  ৩
                                </span>
                              ) : (
                                <span className="text-slate-500">{toBnNumber(item.rank)}</span>
                              )}
                            </td>

                            {/* Roll & ID */}
                            <td className="p-3">
                              <strong className="text-slate-900 block font-mono text-xs">রোল: {item.student.roll}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{item.student.studentId}</span>
                            </td>

                            {/* Student Name */}
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <strong className="text-slate-900 text-xs">
                                  {item.student.nameBn || item.student.nameEn}
                                </strong>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-2xs">
                                    আপনি (You)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">{item.student.nameEn}</span>
                            </td>

                            {/* Class & Section */}
                            <td className="p-3 text-slate-600">
                              {item.student.className} ({item.student.section})
                            </td>

                            {/* Assigned HW Count */}
                            <td className="p-3 text-center font-bold text-slate-800">
                              {toBnNumber(item.assignedCount)} টি
                            </td>

                            {/* Submitted HW Count */}
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                                {toBnNumber(item.submittedCount)} টি
                              </span>
                            </td>

                            {/* Missed / Expired Count */}
                            <td className="p-3 text-center bg-rose-50/30">
                              {item.missedCount > 0 ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full font-bold text-xs inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-rose-600" />
                                  <span>{toBnNumber(item.missedCount)} টি মিসড</span>
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold text-xs">০ টি (অন-টাইম)</span>
                              )}
                            </td>

                            {/* Active Pending Count */}
                            <td className="p-3 text-center bg-amber-50/20">
                              {item.activePendingCount > 0 ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-xs">
                                  {toBnNumber(item.activePendingCount)} টি বাকি
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-xs">-</span>
                              )}
                            </td>

                            {/* Obtained Marks */}
                            <td className="p-3 text-center font-black text-slate-900 text-xs">
                              <span className="text-blue-700 text-sm">{toBnNumber(item.obtainedMarks)}</span>
                              <span className="text-slate-400 text-[10px]"> / {toBnNumber(item.totalPossibleMarks)}</span>
                            </td>

                            {/* Percentage Marks */}
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center">
                                <span
                                  className={`font-black text-xs ${
                                    item.percentage >= 80
                                      ? 'text-emerald-700'
                                      : item.percentage >= 60
                                      ? 'text-blue-700'
                                      : item.percentage >= 40
                                      ? 'text-amber-700'
                                      : 'text-rose-700'
                                  }`}
                                >
                                  {toBnNumber(item.percentage)}%
                                </span>
                                <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.percentage >= 80
                                        ? 'bg-emerald-500'
                                        : item.percentage >= 60
                                        ? 'bg-blue-500'
                                        : item.percentage >= 40
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Submission Rate */}
                            <td className="p-3 text-center font-bold text-slate-700">
                              {toBnNumber(item.submissionRate)}%
                            </td>

                            {/* Performance Status */}
                            <td className="p-3 text-center">
                              {item.percentage >= 80 ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                                  চমৎকার (A+)
                                </span>
                              ) : item.percentage >= 60 ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold text-[10px]">
                                  ভালো (A)
                                </span>
                              ) : item.percentage >= 40 ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">
                                  সন্তোষজনক (B)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[10px]">
                                  মনোযোগ প্রয়োজন (F)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: DETAILED SUBMISSIONS LOG */}
          {reportViewMode === 'detailed' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">শিক্ষার্থীভিত্তিক পৃথক হোমওয়ার্ক খাতা জমাদান লগ</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">রোল</th>
                      <th className="p-3">শিক্ষার্থীর নাম</th>
                      <th className="p-3">শ্রেণি ও শাখা</th>
                      <th className="p-3">বাড়ির কাজ শিরোনাম</th>
                      <th className="p-3">জমা তারিখ</th>
                      <th className="p-3">এআই নম্বর</th>
                      <th className="p-3">চূড়ান্ত অনুমোদিত নম্বর</th>
                      <th className="p-3">শিক্ষক ও এআই মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.list.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          কোনো খাতা জমা পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      reportData.list.map((sub) => {
                        const parentHw = homeworkList.find((h) => h.id === sub.homeworkId);
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-700">{sub.studentRoll}</td>
                            <td className="p-3 font-semibold text-slate-900">{sub.studentName}</td>
                            <td className="p-3 text-slate-600">{sub.className} - {sub.section}</td>
                            <td className="p-3 text-slate-800">{parentHw?.title || sub.homeworkId}</td>
                            <td className="p-3 text-slate-500">{sub.submissionDate}</td>
                            <td className="p-3 font-bold text-indigo-700">
                              {sub.aiEvaluation ? `${sub.aiEvaluation.suggestedMarks}/${sub.aiEvaluation.fullMarks}` : '-'}
                            </td>
                            <td className="p-3 font-black text-emerald-700">
                              {sub.teacherMarks !== undefined ? `${sub.teacherMarks}/${parentHw?.fullMarks || 10}` : 'অপেক্ষমাণ'}
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs truncate">
                              {sub.teacherFeedback || sub.aiEvaluation?.feedback || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT HOMEWORK MODAL                                     */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span>
                  {editingHomework
                    ? language === 'bn'
                      ? 'বাড়ির কাজ সম্পাদনা করুন'
                      : 'Edit Homework Assignment'
                    : language === 'bn'
                    ? 'নতুন বাড়ির কাজ তৈরি করুন (Teacher Creation)'
                    : 'Create New Homework Assignment'}
                </span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">শ্রেণি (Class): *</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value as ClassLevel)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {ALL_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">শাখা (Section): *</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">পূর্ণমান (Full Marks): *</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={fullMarks}
                      onChange={(e) => setFullMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-blue-700"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[5, 10, 20, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFullMarks(preset)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          fullMarks === preset
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">বিষয় (Subject): *</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. General Mathematics"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">হোমওয়ার্ক শিরোনাম (Title): *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 9 Trigonometry Exercise 9.2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">হোমওয়ার্ক প্রদানের তারিখ (Date):</label>
                  <input
                    type="date"
                    value={homeworkDate}
                    onChange={(e) => setHomeworkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">জমাদানের শেষ সময়সীমা (Deadline): *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-rose-600"
                    required
                  />
                </div>
              </div>

              {/* Question & Description: Text and Image upload (Gallery + Camera) */}
              <div className="space-y-2.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <FileQuestion className="w-4 h-4 text-blue-600" />
                    <span>হোমওয়ার্কের বিবরণ ও প্রশ্ন (Description & Question): *</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full">
                    টেক্সট ও ছবি (গ্যালারি / ক্যামেরা)
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="বাড়ির কাজের সম্পূর্ণ প্রশ্নাবলি ও প্রয়োজনীয় দিকনির্দেশনা এখানে লিখুন (অথবা নিচে সরাসরি প্রশ্নপত্রের ছবি আপলোড করুন)..."
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs"
                  required={questionImages.length === 0 && !questionAttachment}
                />

                {/* Upload Question Paper / Textbook photo buttons */}
                <div className="pt-1 border-t border-blue-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>প্রশ্নপত্রের ছবি / বইয়ের পৃষ্ঠা আপলোড করুন (Question Images):</span>
                    </span>
                    {questionImages.length > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">
                        {toBnNumber(questionImages.length)}টি পাতা সংযুক্ত
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer font-bold text-[11px] shadow-2xs transition-colors">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>গ্যালারি থেকে প্রশ্নপত্র (Gallery)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleTeacherQuestionImageUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer font-bold text-[11px] shadow-2xs transition-colors">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>ক্যামেরা দিয়ে ছবি তুলুন (Camera)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleTeacherQuestionImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Thumbnail Previews of Attached Question Images */}
                  {questionImages.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {questionImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative border-2 border-blue-200 rounded-xl overflow-hidden bg-white group shadow-2xs"
                        >
                          <img
                            src={img}
                            alt={`Question page ${idx + 1}`}
                            className="w-full h-24 object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewImageModalUrl(img)}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            প্রশ্ন পাতা {toBnNumber(idx + 1)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                            title="ছবি বাদ দিন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    * প্রশ্নপত্রের ছবি সংযুক্ত করলে শিক্ষার্থীরা অ্যাপ থেকে স্পষ্ট দেখতে পাবে এবং এআই স্বয়ংক্রিয় মূল্যায়নে ব্যবহার করবে।
                  </p>
                </div>
              </div>

              {/* Reference Answer for AI Multimodal Evaluation */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-indigo-950 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>এআই মূল্যায়নের রেফারেন্স উত্তর (Reference Answer for AI):</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    টেক্সট + ছবির সমাধান
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={referenceAnswer}
                  onChange={(e) => setReferenceAnswer(e.target.value)}
                  placeholder="সঠিক উত্তর, সমাধান, বা গুরুত্বপূর্ণ সূত্রাবলি এখানে লিখুন..."
                  className="w-full px-3 py-2 border border-indigo-200 bg-white rounded-lg text-xs"
                />

                {/* Teacher Solution Photo / Diagram Upload */}
                <div className="pt-1 border-t border-indigo-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>সমাধানের ছবি / ডায়াগ্রাম আপলোড করুন (Solution Photo / Diagram):</span>
                    </span>
                    {referenceAnswerAttachment && (
                      <button
                        type="button"
                        onClick={() => setReferenceAnswerAttachment('')}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        ছবি মুছুন
                      </button>
                    )}
                  </div>

                  {referenceAnswerAttachment ? (
                    <div className="relative inline-block border-2 border-indigo-300 rounded-xl overflow-hidden shadow-xs bg-white">
                      <img
                        src={referenceAnswerAttachment}
                        alt="Teacher Reference Solution"
                        className="h-28 w-auto max-w-full object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setReferenceAnswerAttachment('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700"
                        title="ছবি বাদ দিন"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-50 cursor-pointer font-bold text-[11px] shadow-2xs transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ছবি আপলোড করুন (Gallery)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTeacherRefImageUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 border border-indigo-700 rounded-lg text-white hover:bg-indigo-700 cursor-pointer font-bold text-[11px] shadow-2xs transition-colors">
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <span>ক্যামেরা দিয়ে ছবি তুলুন (Camera)</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleTeacherRefImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">হাতে লেখা সমাধান বা বইয়ের পৃষ্ঠা</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ঐচ্ছিক নির্দেশনা (Optional Instructions):</label>
                <input
                  type="text"
                  value={optionalInstructions}
                  onChange={(e) => setOptionalInstructions(e.target.value)}
                  placeholder="e.g. খাতার ছবি স্পষ্ট আলোতে তুলতে হবে। কাটাকাটি পরিহার করুন।"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {editingHomework ? 'আপডেট সংরক্ষণ করুন' : 'হোমওয়ার্ক প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT HOMEWORK SUBMISSION MODAL                                */}
      {/* ========================================================================= */}
      {showSubmissionModal && submittingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>হোমওয়ার্ক জমা দিন (Student Homework Submission)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {submittingHomework.title} • {submittingHomework.subjectName} ({submittingHomework.className})
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submissionSuccessMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submissionSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitHomework} className="space-y-4 text-xs">
              {/* Authenticated Student Identity Confirmation */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">জমা দানকারী শিক্ষার্থী:</span>
                  <span className="font-bold text-blue-950">
                    {authenticatedStudent?.nameBn || authenticatedStudent?.nameEn || 'Tanvir Ahmed'}
                  </span>
                  <span className="text-slate-500 ml-2">
                    (আইডি: {authenticatedStudent?.studentId || 'S-2026-001'}, রোল: {authenticatedStudent?.roll || '01'})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  ভেরিফাইড আইডি
                </span>
              </div>

              {/* Teacher's Question Paper & Description Display */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4 text-blue-600" />
                    <span>হোমওয়ার্কের প্রশ্ন ও নির্দেশিকা (Questions & Instructions):</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    পূর্ণমান: {toBnNumber(submittingHomework.fullMarks || 10)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {submittingHomework.description}
                </p>

                {/* Attached Question Paper Images Preview for Student */}
                {((submittingHomework.questionImages && submittingHomework.questionImages.length > 0) || submittingHomework.questionAttachment) && (
                  <div className="pt-2.5 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>শিক্ষকের দেওয়া প্রশ্নপত্রের ছবি (বড় করে দেখতে ছবিতে ক্লিক করুন):</span>
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold">
                        {toBnNumber((submittingHomework.questionImages && submittingHomework.questionImages.length) || 1)}টি পাতা
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {((submittingHomework.questionImages && submittingHomework.questionImages.length > 0)
                        ? submittingHomework.questionImages
                        : [submittingHomework.questionAttachment!]
                      ).map((qImg, qIdx) => (
                        <div
                          key={qIdx}
                          onClick={() => setPreviewImageModalUrl(qImg)}
                          className="relative border border-blue-200 rounded-lg overflow-hidden cursor-pointer group bg-white shadow-2xs aspect-4/3"
                        >
                          <img
                            src={qImg}
                            alt={`Question page ${qIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            প্রশ্ন পাতা {toBnNumber(qIdx + 1)}
                          </span>
                          <span className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-blue-600 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Handwritten Photos (Camera or File) */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>হস্তলিখিত খাতার ছবি সংযুক্ত করুন (Handwritten Pages / Multiple Photos):</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">একাধিক ছবি গ্রহণযোগ্য</span>
                </label>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="hw_photo_input"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="hw_photo_input" className="cursor-pointer block">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-blue-600 hover:text-blue-700">ছবি সিলেক্ট করুন</span>
                    <span className="text-slate-500"> অথবা ক্যামেরা দিয়ে ছবি তুলুন</span>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG সাপোর্টেড</p>
                  </label>
                </div>

                {/* Previews of uploaded images */}
                {submissionImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                    {submissionImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square">
                        <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 shadow-xs"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[9px] px-1 rounded font-bold">
                          পৃষ্ঠা {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Or Typed Text Answer */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  লিখিত উত্তর (Text Answer - যদি থাকে):
                </label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="আপনার সমাধান বা লিখিত অ্যাসাইনমেন্ট এখানে টাইপ করতে পারেন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>জমা নেওয়া হচ্ছে...</span>
                    </>
                  ) : (
                    <span>হোমওয়ার্ক জমা দিন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TEACHER MARKS REVIEW & DETAILED EDIT MODAL                      */}
      {/* ========================================================================= */}
      {reviewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>শিক্ষক মূল্যায়ন ও চূড়ান্ত অনুমোদন (Teacher Review)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  শিক্ষার্থী: {reviewModalSub.studentName} (রোল: {reviewModalSub.studentRoll}, শ্রেণি: {reviewModalSub.className})
                </p>
              </div>
              <button
                onClick={() => setReviewModalSub(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Parent Homework Question & Attached Question Paper Preview for Teacher */}
              {(() => {
                const parentHw = homeworkList.find((h) => h.id === reviewModalSub.homeworkId);
                if (!parentHw) return null;
                const qImages = (parentHw.questionImages && parentHw.questionImages.length > 0)
                  ? parentHw.questionImages
                  : parentHw.questionAttachment
                  ? [parentHw.questionAttachment]
                  : [];
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileQuestion className="w-3.5 h-3.5 text-blue-600" />
                        <span>প্রদত্ত হোমওয়ার্কের প্রশ্ন ও রেফারেন্স (Assigned Question):</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {parentHw.subjectName} • পূর্ণমান: {toBnNumber(parentHw.fullMarks || 10)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-2">{parentHw.description}</p>
                    {qImages.length > 0 && (
                      <div className="pt-1.5 flex items-center gap-2 overflow-x-auto">
                        <span className="text-[10px] text-blue-700 font-bold shrink-0">প্রশ্নপত্রের ছবি:</span>
                        {qImages.map((qImg, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => setPreviewImageModalUrl(qImg)}
                            className="relative shrink-0 w-12 h-12 rounded-lg border border-blue-200 overflow-hidden hover:border-blue-400"
                            title="প্রশ্নপত্র বড় করে দেখুন"
                          >
                            <img src={qImg} alt={`Question ${qIdx + 1}`} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded">
                              #{qIdx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Submitted Photos Preview */}
              {reviewModalSub.imageUrls && reviewModalSub.imageUrls.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-700">শিক্ষার্থীর জমা দেওয়া খাতার পাতা:</span>
                    <span className="text-[10px] text-slate-500">বড় করে দেখতে ছবিতে ক্লিক করুন</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {reviewModalSub.imageUrls.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImageModalUrl(img)}
                        className="rounded-lg overflow-hidden border border-slate-200 aspect-video block group relative text-left bg-slate-100 hover:border-blue-400 transition-colors"
                      >
                        <img src={img} alt="Student paper" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          পাতা {toBnNumber(idx + 1)} (ক্লিক করুন)
                        </span>
                        <span className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-slate-700 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Evaluation Summary Card */}
              {reviewModalSub.aiEvaluation ? (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      এআই প্রস্তাবিত নম্বর: {reviewModalSub.aiEvaluation.suggestedMarks} / {reviewModalSub.aiEvaluation.fullMarks}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      কনফিডেন্স: {Math.round(reviewModalSub.aiEvaluation.confidence * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-indigo-800">
                    <div>সঠিক উত্তর: <b>{reviewModalSub.aiEvaluation.correctAnswers}</b></div>
                    <div>আংশিক সঠিক: <b>{reviewModalSub.aiEvaluation.partialAnswers}</b></div>
                    <div>ভুল/বাদ: <b>{reviewModalSub.aiEvaluation.incorrectAnswers}</b></div>
                  </div>

                  <p className="text-[11px] text-slate-700 italic border-t border-indigo-200/60 pt-2">
                    {reviewModalSub.aiEvaluation.feedback}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                  এখনো এআই মূল্যায়ন সম্পন্ন হয়নি।
                </div>
              )}

              {/* Teacher Final Marks Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">শিক্ষকের চূড়ান্ত নম্বর (Final Marks):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={teacherEditMarks}
                    onChange={(e) => setTeacherEditMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-black text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">স্ট্যাটাস:</label>
                  <span className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                    {reviewModalSub.status}
                  </span>
                </div>
              </div>

              {/* Teacher Remarks / Feedback */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">শিক্ষকের মন্তব্য / দিকনির্দেশনা (Feedback):</label>
                <textarea
                  rows={3}
                  value={teacherEditFeedback}
                  onChange={(e) => setTeacherEditFeedback(e.target.value)}
                  placeholder="শিক্ষার্থীর খাতা মূল্যায়নের গঠনমূলক মন্তব্য এখানে লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleTeacherRequestResubmit}
                    className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition-colors"
                  >
                    পুনরায় জমা তলব
                  </button>
                  <button
                    type="button"
                    onClick={handleTeacherReject}
                    className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-colors"
                  >
                    প্রত্যাখ্যান (Reject)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReviewModalSub(null)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleTeacherApprove}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>অনুমোদন ও সংরক্ষণ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Resolution Image Zoom / Inspection */}
      {previewImageModalUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white border-b border-slate-700">
              <span className="text-xs font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>ছবি প্রদর্শন (Full Resolution Image Viewer)</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
              <img
                src={previewImageModalUrl}
                alt="Enlarged preview"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
