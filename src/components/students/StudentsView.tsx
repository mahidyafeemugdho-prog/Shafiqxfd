import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Student, StudentDocument, ClassLevel, ShiftType, GroupType } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import { formatGroupName } from '../../utils/i18n';
import { compressImageToPassportSize } from '../../utils/storageHelper';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  Printer,
  CheckCircle,
  AlertTriangle,
  X,
  Phone,
  User,
  GraduationCap,
  FileSpreadsheet,
  Camera,
  Building,
  Award,
  RefreshCw,
  Calendar,
  KeyRound,
  QrCode,
  Layers,
  Lock,
  FileText,
  FolderOpen,
  ZoomIn,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  FolderArchive,
  CheckCircle2,
  Files,
  Image as ImageIcon,
  Wifi,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import QRCode from 'qrcode';

interface StudentsViewProps {
  onPrintCertificate?: (student: Student, type: 'id_card' | 'admit_card' | 'testimonial' | 'transfer' | 'character' | 'bonafide') => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onPrintCertificate }) => {
  const { activeRole } = useAuth();
  const { t, language, toBnNumber, formatDate } = useLanguage();
  const { schoolProfile: school } = useSchool();
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<'all' | '2026' | '2027' | '2028'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetailTab, setStudentDetailTab] = useState<'info' | 'vault'>('info');
  const [previewDocumentUrl, setPreviewDocumentUrl] = useState<string | null>(null);
  const [previewDocumentTitle, setPreviewDocumentTitle] = useState<string>('');

  // In-app Delete Confirmation Modal State
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState<boolean>(false);
  const [actionToast, setActionToast] = useState<string>('');

  // Keep student list in sync in real-time when another device or tab adds a student
  React.useEffect(() => {
    const handleSync = () => {
      setStudents(StorageService.getStudents());
    };
    window.addEventListener('school_cloud_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('school_cloud_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // ID Card Modal & 3-Template Customization
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [idCardTemplate, setIdCardTemplate] = useState<'classic_academic' | 'executive_royal' | 'modern_emerald'>('classic_academic');
  const [idCardViewMode, setIdCardViewMode] = useState<'both' | 'front' | 'back'>('both');
  const [singleStudentQrUrl, setSingleStudentQrUrl] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Student ID Customizer state
  const [showIdCustomizer, setShowIdCustomizer] = useState<boolean>(false);
  const [customIdPrefix, setCustomIdPrefix] = useState<string>('S-');

  // Dynamic template color styles for Student Front Side (Back side is strictly pure white per user requirements)
  const getStudentCardStyles = (tpl: 'classic_academic' | 'executive_royal' | 'modern_emerald') => {
    if (tpl === 'executive_royal') {
      return {
        cardBorder: 'border-2 border-amber-600 shadow-xl ring-2 ring-amber-200',
        headerBg: 'bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 text-white',
        ribbonBg: 'bg-amber-400 text-slate-950 font-black',
        photoBorder: 'border-2 border-amber-600 shadow-sm',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        accentText: 'text-amber-800',
        nameColor: 'text-amber-950',
        tagBg: 'bg-amber-50 text-amber-900 border-amber-300',
      };
    } else if (tpl === 'modern_emerald') {
      return {
        cardBorder: 'border-2 border-teal-600 shadow-xl ring-2 ring-teal-200',
        headerBg: 'bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-800 text-white',
        ribbonBg: 'bg-teal-300 text-slate-950 font-black',
        photoBorder: 'border-2 border-teal-500 shadow-sm',
        badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
        accentText: 'text-teal-800',
        nameColor: 'text-teal-950',
        tagBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      };
    } else {
      // Classic Academic (Blue / Navy)
      return {
        cardBorder: 'border-2 border-blue-600 shadow-xl ring-2 ring-blue-200',
        headerBg: 'bg-gradient-to-r from-blue-800 via-indigo-800 to-blue-900 text-white',
        ribbonBg: 'bg-amber-400 text-slate-900 font-bold',
        photoBorder: 'border-2 border-blue-600 shadow-sm',
        badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
        accentText: 'text-blue-700',
        nameColor: 'text-slate-900',
        tagBg: 'bg-blue-50 text-blue-900 border-blue-200',
      };
    }
  };

  // Admin Student Password Management
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [targetPasswordStudent, setTargetPasswordStudent] = useState<Student | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState<string>('1234');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string>('');

  const handleOpenIdCardModal = async (s: Student) => {
    setIdCardStudent(s);
    setShowIdCardModal(true);
    try {
      const qrData = StorageService.generateStudentQRData(s);
      // Generate pure black on white high-contrast QR code for instant camera scanning
      const url = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setSingleStudentQrUrl(url);
    } catch (e) {
      console.error('Error generating QR code:', e);
    }
  };

  const handleSaveStudentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPasswordStudent || !newStudentPassword.trim()) return;
    StorageService.updateStudentPassword(targetPasswordStudent.id, newStudentPassword.trim());
    setStudents(StorageService.getStudents());
    setPasswordChangeSuccess(
      language === 'bn'
        ? `শিক্ষার্থী ${targetPasswordStudent.nameBn || targetPasswordStudent.nameEn}-এর পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!`
        : `Student password updated successfully to '${newStudentPassword}'!`
    );
  };

  // Document Vault Modal & Handlers
  const [showDocVaultModal, setShowDocVaultModal] = useState<boolean>(false);
  const [docVaultStudent, setDocVaultStudent] = useState<Student | null>(null);
  const [docVaultNotice, setDocVaultNotice] = useState<string>('');
  const [customDocTitle, setCustomDocTitle] = useState<string>('');

  const handleOpenDocVaultModal = (s: Student) => {
    setDocVaultStudent(s);
    setDocVaultNotice('');
    setShowDocVaultModal(true);
  };

  const handleVaultUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'birthCertificateUrl' | 'fatherNidUrl' | 'motherNidUrl' | 'transferCertificateUrl' | 'other',
    docTitle?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !docVaultStudent) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const updated: Student = { ...docVaultStudent };
      if (field === 'birthCertificateUrl') updated.birthCertificateUrl = base64;
      else if (field === 'fatherNidUrl') updated.fatherNidUrl = base64;
      else if (field === 'motherNidUrl') updated.motherNidUrl = base64;
      else if (field === 'transferCertificateUrl') updated.transferCertificateUrl = base64;
      else if (field === 'other') {
        const newDoc: StudentDocument = {
          id: `doc_${Date.now()}`,
          title: docTitle || customDocTitle || 'নথিপত্র',
          type: 'other',
          category: 'other',
          fileUrl: base64,
          fileName: file.name,
          uploadedAt: new Date().toISOString().split('T')[0],
        };
        updated.documents = [...(updated.documents || []), newDoc];
      }

      StorageService.updateStudent(updated);
      setDocVaultStudent(updated);
      setStudents(StorageService.getStudents());
      setDocVaultNotice('ডকুমেন্ট সফলভাবে আপলোড ও সংরক্ষণ করা হয়েছে!');
      setTimeout(() => setDocVaultNotice(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleVaultDeleteDoc = (field: 'birthCertificateUrl' | 'fatherNidUrl' | 'motherNidUrl' | 'transferCertificateUrl' | string) => {
    if (!docVaultStudent) return;
    const updated: Student = { ...docVaultStudent };
    if (field === 'birthCertificateUrl') updated.birthCertificateUrl = undefined;
    else if (field === 'fatherNidUrl') updated.fatherNidUrl = undefined;
    else if (field === 'motherNidUrl') updated.motherNidUrl = undefined;
    else if (field === 'transferCertificateUrl') updated.transferCertificateUrl = undefined;
    else {
      updated.documents = (updated.documents || []).filter((d) => d.id !== field);
    }
    StorageService.updateStudent(updated);
    setDocVaultStudent(updated);
    setStudents(StorageService.getStudents());
    setDocVaultNotice('ডকুমেন্ট মুছে ফেলা হয়েছে!');
    setTimeout(() => setDocVaultNotice(''), 3000);
  };

  const handlePrintDocument = (title: string, url: string, student: Student) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${student.nameEn} (${student.studentId})</title>
          <style>
            body { font-family: 'Hind Siliguri', Arial, sans-serif; margin: 20px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
            .title { font-size: 18px; font-weight: bold; margin: 5px 0; color: #0f172a; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
            .info-table td { padding: 6px; border: 1px solid #cbd5e1; }
            .doc-container { text-align: center; margin: 20px 0; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; }
            .doc-image { max-width: 100%; max-height: 700px; object-fit: contain; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; font-size: 20px;">${school.nameBn || school.nameEn}</h2>
            <div style="font-size: 12px; color: #64748b;">EIIN: ${school.eiin} • ${school.addressBn || ''}</div>
            <div class="title">${title}</div>
          </div>
          <table class="info-table">
            <tr>
              <td><strong>শিক্ষার্থীর নাম:</strong> ${student.nameBn || student.nameEn} (${student.nameEn})</td>
              <td><strong>Student ID:</strong> ${student.studentId}</td>
            </tr>
            <tr>
              <td><strong>শ্রেণি ও রোল:</strong> ${student.className} (শাখা: ${student.section || 'A'}, রোল: ${student.roll})</td>
              <td><strong>অভিভাবক মোবাইল:</strong> ${student.guardianPhone}</td>
            </tr>
            <tr>
              <td><strong>পিতার নাম:</strong> ${student.fatherNameEn || ''}</td>
              <td><strong>মাতার নাম:</strong> ${student.motherNameEn || ''}</td>
            </tr>
          </table>
          <div class="doc-container">
            <img src="${url}" class="doc-image" alt="${title}" />
          </div>
          <div class="footer">
            <div>যাচাইকৃত ডিজিটাল কপি • মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD')}</div>
            <div style="border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 5px;">অধ্যক্ষের স্বাক্ষর ও সিল</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<Student>>({
    nameEn: '',
    nameBn: '',
    gender: 'Male',
    dob: '2012-05-10',
    bloodGroup: 'B+',
    religion: 'Islam',
    className: 'Class 10',
    section: 'A',
    shift: 'Day',
    group: 'Science',
    roll: '',
    session: '2026',
    fatherNameEn: '',
    fatherNameBn: '',
    fatherPhone: '',
    motherNameEn: '',
    motherNameBn: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',
    presentAddress: '',
    permanentAddress: '',
    photoUrl: '',
    status: 'active',
  });

  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const canEdit = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'receptionist';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 240, 300, 0.75);
      setFormData((prev) => ({ ...prev, photoUrl: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({ ...prev, photoUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdmissionDocUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'birthCertificateUrl' | 'fatherNidUrl' | 'motherNidUrl' | 'transferCertificateUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({ ...prev, [field]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Filters
  const filteredStudents = students.filter((s) => {
    if (selectedSessionFilter !== 'all' && (s.session || '2026') !== selectedSessionFilter) return false;
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (selectedSection !== 'all' && s.section !== selectedSection) return false;
    if (selectedShift !== 'all' && s.shift !== selectedShift) return false;
    if (selectedGroup !== 'all' && s.group !== selectedGroup) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q);
      const matchId = (s.studentId || s.admissionNo || '').toLowerCase().includes(q);
      const matchRoll = s.roll.includes(q);
      const matchPhone = s.guardianPhone.includes(q);
      return matchName || matchId || matchRoll || matchPhone;
    }
    return true;
  });

  const handleUploadHardCopy = (e: React.ChangeEvent<HTMLInputElement>, category: string, defaultTitle?: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const updated: Student = { ...selectedStudent };
      if (category === 'birth_certificate') {
        updated.birthCertificateUrl = base64;
      } else if (category === 'father_nid') {
        updated.fatherNidUrl = base64;
      } else if (category === 'mother_nid') {
        updated.motherNidUrl = base64;
      } else if (category === 'guardian_nid') {
        updated.guardianNidUrl = base64;
      } else if (category === 'transfer_certificate') {
        updated.transferCertificateUrl = base64;
      }

      const newDoc: StudentDocument = {
        id: `doc_${Date.now()}`,
        title: defaultTitle || (category === 'birth_certificate' ? 'জন্ম নিবন্ধন সনদ' : category === 'father_nid' ? 'পিতার জাতীয় পরিচয়পত্র' : category === 'mother_nid' ? 'মাতার জাতীয় পরিচয়পত্র' : category === 'transfer_certificate' ? 'ছাড়পত্র / টিসি' : 'হার্ডকপি নথি'),
        type: category as any,
        category: category as any,
        fileUrl: base64,
        fileName: file.name,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadDate: new Date().toISOString().split('T')[0],
      };
      updated.documents = [...(updated.documents || []), newDoc];
      StorageService.updateStudent(updated);
      setSelectedStudent(updated);
      setStudents(StorageService.getStudents());
      setActionToast('ডকুমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে!');
      setTimeout(() => setActionToast(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    const curSession = school.currentSession || '2026';
    const autoId = StorageService.generateNextStudentId(curSession);
    const nextRoll = String(students.filter((s) => s.className === 'Class 10').length + 1).padStart(2, '0');
    setFormData({
      studentId: autoId,
      admissionNo: autoId,
      photoUrl: '',
      nameEn: '',
      nameBn: '',
      gender: 'Male',
      dob: '2012-05-10',
      bloodGroup: 'B+',
      religion: 'Islam',
      className: 'Class 10',
      section: 'A',
      shift: 'Day',
      group: 'Science',
      roll: nextRoll,
      session: curSession,
      fatherNameEn: '',
      fatherNameBn: '',
      fatherPhone: '',
      motherNameEn: '',
      motherNameBn: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: 'Father',
      presentAddress: 'Mirpur, Dhaka',
      permanentAddress: 'Mirpur, Dhaka',
      status: 'active',
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn || !formData.nameBn || !formData.roll || !formData.guardianPhone) {
      setFormError(language === 'bn' ? 'সকল প্রয়োজনীয় ঘর পূরণ করুন' : 'Please fill all required fields.');
      return;
    }

    // Duplicate check for Roll in same class & section
    const isDuplicate = students.some(
      (s) =>
        s.id !== formData.id &&
        s.className === formData.className &&
        s.section === formData.section &&
        s.roll === formData.roll
    );

    if (isDuplicate) {
      setFormError(
        language === 'bn'
          ? `এই শ্রেণির শাখা ${formData.section}-এ রোল ${formData.roll} ইতোমধ্যে বিদ্যমান!`
          : `Roll No ${formData.roll} already exists in ${formData.className} Section ${formData.section}!`
      );
      return;
    }

    if (formData.id) {
      // Update
      const updated = formData as Student;
      StorageService.updateStudent(updated);
      setStudents(StorageService.getStudents());
      setFormSuccess(language === 'bn' ? 'সফলভাবে হালনাগাদ করা হয়েছে' : 'Student updated successfully.');
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
      }, 1000);
    } else {
      // Create New Admission
      const autoId = formData.studentId || StorageService.generateNextStudentId('2026');
      const newStudent: Student = {
        ...(formData as Student),
        id: `std_${Date.now()}`,
        studentId: autoId,
        admissionNo: autoId,
        admissionDate: new Date().toISOString().split('T')[0],
      };
      StorageService.addStudent(newStudent);
      setStudents(StorageService.getStudents());
      setShowAddModal(false);
      // Immediately open newly admitted student's ID Card with generated QR code
      handleOpenIdCardModal(newStudent);
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);
    try {
      StorageService.deleteStudent(studentToDelete.id);
      const updated = StorageService.getStudents();
      setStudents(updated);
      const name = studentToDelete.nameBn || studentToDelete.nameEn;
      setActionToast(
        language === 'bn'
          ? `শিক্ষার্থী ${name} (${studentToDelete.studentId}) এর তথ্য সফলভাবে মুছে ফেলা হয়েছে!`
          : `Student ${studentToDelete.nameEn} (${studentToDelete.studentId}) deleted successfully!`
      );
      setTimeout(() => setActionToast(''), 4500);
      setStudentToDelete(null);
    } catch (err) {
      console.error('Failed to delete student:', err);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'studentId,nameEn,nameBn,gender,dob,bloodGroup,religion,className,section,shift,group,roll,session,guardianName,guardianPhone,address\n' +
      'S-2026-9001,Arman Hossain,আরমান হোসেন,Male,2011-03-12,A+,Islam,Class 9,A,Day,Science,05,2026,Kabir Hossain,+880 1711-445522,Mirpur Dhaka\n' +
      'S-2026-9002,Farzana Yasmin,ফারজানা ইয়াসমিন,Female,2011-07-22,O+,Islam,Class 9,A,Day,Science,06,2026,Nurul Islam,+880 1819-332211,Mirpur Dhaka';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'student_bulk_import_template_bangladesh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'শিক্ষার্থী তালিকা ও ভর্তি রেজিস্টার' : 'Student Directory & Admissions'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? `মোট ${toBnNumber(students.length)} জন শিক্ষার্থী প্লে থেকে দশম শ্রেণিতে ভর্তি রয়েছে`
              : `Total ${students.length} students enrolled from Nursery to Class 10`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCsvTemplate}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{language === 'bn' ? 'CSV টেমপ্লেট' : 'CSV Template'}</span>
          </button>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন শিক্ষার্থী ভর্তি' : 'New Admission'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'নাম, আইডি, রোল অথবা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by name, ID, roll, guardian phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              aria-label="Filter by class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{language === 'bn' ? 'সকল শ্রেণি (Nursery - 10)' : 'All Classes'}</option>
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
            <select
              aria-label="Filter by section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{language === 'bn' ? 'সকল শাখা (A, B, C)' : 'All Sections'}</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              aria-label="Filter by shift"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{language === 'bn' ? 'সকল শিফট' : 'All Shifts'}</option>
              <option value="Morning">Morning (প্রভাতি)</option>
              <option value="Day">Day (দিবা)</option>
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <select
              aria-label="Filter by group"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">{language === 'bn' ? 'সকল বিভাগ (Group)' : 'All Groups'}</option>
              <option value="Science">Science (বিজ্ঞান)</option>
              <option value="Commerce">Commerce (ব্যবসায়)</option>
              <option value="Arts">Humanities (মানবিক)</option>
              <option value="Vocational">Vocational (ভোকেশনাল)</option>
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <select
              aria-label="Filter by session"
              value={selectedSessionFilter}
              onChange={(e) => setSelectedSessionFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-blue-900"
            >
              <option value="all">{language === 'bn' ? 'সকল শিক্ষাবর্ষ (All Sessions)' : 'All Sessions'}</option>
              <option value="2026">শিক্ষাবর্ষ ২০২৬ (রানিং)</option>
              <option value="2027">শিক্ষাবর্ষ ২০২৭ (অগ্রিম ভর্তি)</option>
              <option value="2028">শিক্ষাবর্ষ ২০২৮</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID & Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Shift & Group</th>
                <th className="py-3 px-4">Guardian Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-slate-500">
                      <GraduationCap className="w-12 h-12 text-blue-200 mb-3" />
                      <p className="font-bold text-slate-700 text-base">
                        {students.length === 0
                          ? (language === 'bn' ? 'বিদ্যালয়ে এখনও কোনো শিক্ষার্থী ভর্তি করা হয়নি' : 'No students enrolled yet')
                          : (language === 'bn' ? 'ফিল্টারে কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found matching filters')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {students.length === 0
                          ? (language === 'bn' ? 'সিস্টেমে নতুন শিক্ষার্থী যুক্ত করতে ওপরের "+ নতুন শিক্ষার্থী যোগ করুন" বাটনে ক্লিক করুন অথবা এক্সেলে বাল্ক ইমপোর্ট করুন।' : 'Click "+ Add New Student" above to enroll your school students or import via CSV/Excel.')
                          : (language === 'bn' ? 'অনুগ্রহ করে শ্রেণি, শাখা বা সার্চ কি-ওয়ার্ড পরিবর্তন করে দেখুন।' : 'Try clearing filters or changing search keywords.')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-700">{s.studentId}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Roll: {language === 'bn' ? toBnNumber(s.roll) : s.roll}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        {s.photoUrl ? (
                          <img
                            src={s.photoUrl}
                            alt={s.nameEn}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {(s.nameEn || s.nameBn || 'S').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{s.nameEn}</div>
                          <div className="text-[11px] text-slate-500">{s.nameBn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{s.className}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded font-bold text-slate-600">
                        Sec {s.section}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">{s.shift} Shift</div>
                      {s.group && (
                        <div
                          className={`text-[10px] font-bold mt-0.5 px-2 py-0.5 inline-block rounded border ${
                            s.group === 'Vocational'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : s.group === 'Science'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : s.group === 'Commerce'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {s.group} Group
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{s.guardianName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.guardianPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* View Profile */}
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowViewModal(true);
                          }}
                          title="View Profile"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* ID Card Print Trigger (Dual Cards: General & Smart QR) */}
                        <button
                          onClick={() => handleOpenIdCardModal(s)}
                          title="আইডি কার্ডসমূহ (১. প্রাতিষ্ঠানিক + ২. স্মার্ট কিউআর)"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Student Documents Vault (Birth Certificate, Father/Mother NID, TC) */}
                        <button
                          onClick={() => handleOpenDocVaultModal(s)}
                          title="শিক্ষার্থীর নথিপত্র ও হার্ডকপি ভল্ট (জন্ম নিবন্ধন, এনআইডি, ছাড়পত্র)"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded relative group transition-colors"
                        >
                          <FolderArchive className="w-4 h-4 text-emerald-600" />
                          {(s.birthCertificateUrl || s.fatherNidUrl || s.motherNidUrl || s.transferCertificateUrl || (s.documents?.length || 0) > 0) && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" title="নথিপত্র সংরক্ষিত রয়েছে" />
                          )}
                        </button>

                        {/* Student Login Password Management */}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setTargetPasswordStudent(s);
                              setNewStudentPassword(s.password || '1234');
                              setPasswordChangeSuccess('');
                              setShowPasswordModal(true);
                            }}
                            title="লগইন আইডি ও পাসওয়ার্ড পরিবর্তন"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          >
                            <KeyRound className="w-4 h-4 text-indigo-600" />
                          </button>
                        )}

                        {/* Edit */}
                        {canEdit && (
                          <button
                            onClick={() => {
                              setFormData(s);
                              setFormError('');
                              setFormSuccess('');
                              setShowAddModal(true);
                            }}
                            title="Edit Record"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(s)}
                            title={language === 'bn' ? 'শিক্ষার্থী মুছে ফেলুন' : 'Delete Student'}
                            aria-label={language === 'bn' ? 'শিক্ষার্থী মুছে ফেলুন' : 'Delete Student'}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 rounded-lg border border-rose-100/70 min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {formData.id
                  ? language === 'bn' ? 'শিক্ষার্থী তথ্য পরিবর্তন' : 'Edit Student Details'
                  : language === 'bn' ? 'নতুন শিক্ষার্থী ভর্তি ফরম' : 'New Student Admission Form'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4 text-xs">
              {/* Section 1: Basic Info */}
              <div className="font-bold text-slate-700 pb-1 border-b border-slate-100">
                {language === 'bn' ? '১. শিক্ষার্থীর মৌলিক তথ্য' : '1. Student Basic Information'}
              </div>

              {/* Photo Upload & Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                {/* Photo Upload */}
                <div className="flex items-center space-x-3">
                  <div className="relative shrink-0">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Student"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-200 text-slate-400 flex flex-col items-center justify-center border border-slate-300">
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[8px] font-semibold">{language === 'bn' ? 'ছবি নেই' : 'No Photo'}</span>
                      </div>
                    )}
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoUrl: '' })}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-[11px] block">
                      {language === 'bn' ? 'শিক্ষার্থীর ছবি আপলোড' : 'Upload Student Photo'}
                    </span>
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center space-x-1 shadow-xs"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{formData.photoUrl ? (language === 'bn' ? 'পরিবর্তন' : 'Change') : (language === 'bn' ? 'বাছাই করুন' : 'Choose')}</span>
                      </button>
                      {!formData.photoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
                            })
                          }
                          className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px]"
                        >
                          {language === 'bn' ? 'ডেমো ছবি' : 'Sample'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto Student ID with Customizer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-[11px]">
                      {language === 'bn' ? 'স্টুডেন্ট / ভর্তি আইডি' : 'Student / Admission ID'}
                    </label>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        অটো
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowIdCustomizer(!showIdCustomizer)}
                        className="text-[9px] text-blue-600 hover:text-blue-800 font-bold underline"
                      >
                        {showIdCustomizer ? 'লুকান' : '⚙️ কাস্টমাইজ'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      required
                      value={formData.studentId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, studentId: val, admissionNo: val });
                      }}
                      placeholder="e.g. S-2026-1001"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-800 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const curSes = formData.session || school.currentSession || '2026';
                        const nextId = StorageService.generateNextStudentId(curSes);
                        setFormData({ ...formData, studentId: nextId, admissionNo: nextId });
                      }}
                      className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 shrink-0 shadow-2xs"
                      title="Generate new ID according to session"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* ID Customizer & Presets Drawer */}
                  {showIdCustomizer && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mt-1.5 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between text-[10px] text-blue-900 font-bold">
                        <span>আইডি ফরম্যাট প্রিসেট নির্বাচন করুন:</span>
                        <span className="text-[9px] font-mono text-slate-500">সেশন: {formData.session || '2026'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const curSes = formData.session || school.currentSession || '2026';
                            const nextId = StorageService.generateNextStudentId(curSes);
                            setFormData({ ...formData, studentId: nextId, admissionNo: nextId });
                          }}
                          className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md font-mono text-[10px] font-bold text-blue-900 truncate"
                          title="S-Session-Number"
                        >
                          S-{formData.session || '2026'}-****
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const curSes = formData.session || school.currentSession || '2026';
                            const baseId = StorageService.generateNextStudentId(curSes);
                            const nextId = baseId.replace(/^S-/, 'STU-');
                            setFormData({ ...formData, studentId: nextId, admissionNo: nextId });
                          }}
                          className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md font-mono text-[10px] font-bold text-blue-900 truncate"
                          title="STU-Session-Number"
                        >
                          STU-{formData.session || '2026'}-****
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const cls = (formData.className || 'C10').replace(/\s+/g, '').toUpperCase();
                            const rollStr = String(formData.roll || '01').padStart(2, '0');
                            const nextId = `${cls}-${rollStr}`;
                            setFormData({ ...formData, studentId: nextId, admissionNo: nextId });
                          }}
                          className="px-2 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-md font-mono text-[10px] font-bold text-blue-900 truncate"
                          title="Class-Roll format"
                        >
                          {(formData.className || 'C10').replace(/\s+/g, '')}-{formData.roll || '01'}
                        </button>
                      </div>

                      {/* Custom Prefix generator */}
                      <div className="flex items-center space-x-1.5 pt-1 border-t border-blue-200/60">
                        <span className="text-[10px] text-slate-600 font-medium shrink-0">কাস্টম প্রিফিক্স:</span>
                        <input
                          type="text"
                          value={customIdPrefix}
                          onChange={(e) => setCustomIdPrefix(e.target.value)}
                          placeholder="e.g. AIS-"
                          className="w-20 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-[10px] bg-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = customIdPrefix.trim() || 'S-';
                            const curSes = formData.session || school.currentSession || '2026';
                            const num = String(students.length + 1001);
                            const nextId = `${prefix}${curSes}-${num}`;
                            setFormData({ ...formData, studentId: nextId, admissionNo: nextId });
                          }}
                          className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shrink-0"
                        >
                          প্রয়োগ করুন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Student Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    শিক্ষার্থীর পূর্ণ নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameBn || ''}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender / লিঙ্গ</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Male">Male / ছাত্র</option>
                    <option value="Female">Female / ছাত্রী</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth / জন্মতারিখ</label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group / রক্তের গ্রুপ</label>
                  <select
                    value={formData.bloodGroup || 'B+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Religion / ধর্ম</label>
                  <select
                    value={formData.religion || 'Islam'}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Islam">Islam / ইসলাম</option>
                    <option value="Hinduism">Hinduism / হিন্দু</option>
                    <option value="Buddhism">Buddhism / বৌদ্ধ</option>
                    <option value="Christianity">Christianity / খ্রিষ্টান</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Academic Placement */}
              <div className="font-bold text-slate-700 pt-3 pb-1 border-b border-slate-100">
                {language === 'bn' ? '২. একাডেমিক শ্রেণি ও বিভাগ' : '2. Academic Placement'}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formData.className || 'Class 10'}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    value={formData.section || 'A'}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift</label>
                  <select
                    value={formData.shift || 'Day'}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Morning">Morning (প্রভাতি)</option>
                    <option value="Day">Day (দিবা)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll No *</label>
                  <input
                    type="text"
                    required
                    value={formData.roll || ''}
                    onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                    placeholder="e.g. 05"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Group if Class 9 or 10 */}
              {(formData.className === 'Class 9' || formData.className === 'Class 10') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Secondary Group (মাধ্যমিক বিভাগ)
                  </label>
                  <select
                    value={formData.group || 'Science'}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as GroupType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Science">Science (বিজ্ঞান)</option>
                    <option value="Commerce">Business Studies / Commerce (ব্যবসায় শিক্ষা)</option>
                    <option value="Arts">Humanities (মানবিক)</option>
                    <option value="Vocational">Vocational (ভোকেশনাল / কারিগরি শাখা)</option>
                  </select>
                </div>
              )}

              {/* Section 3: Parents & Guardian */}
              <div className="font-bold text-slate-700 pt-3 pb-1 border-b border-slate-100">
                {language === 'bn' ? '৩. অভিভাবকের তথ্য ও যোগাযোগ' : '3. Guardian & Contact Information'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father Name (পিতার নাম)</label>
                  <input
                    type="text"
                    value={formData.fatherNameEn || ''}
                    onChange={(e) => setFormData({ ...formData, fatherNameEn: e.target.value })}
                    placeholder="e.g. Md. Anwar Hossain"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother Name (মাতার নাম)</label>
                  <input
                    type="text"
                    value={formData.motherNameEn || ''}
                    onChange={(e) => setFormData({ ...formData, motherNameEn: e.target.value })}
                    placeholder="e.g. Nasrin Sultana"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guardianName || ''}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="Name of Primary Guardian"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Mobile (SMS Alert) *</label>
                  <input
                    type="text"
                    required
                    value={formData.guardianPhone || ''}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="+880 1711-xxxxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Present Address (বর্তমান ঠিকানা)</label>
                  <input
                    type="text"
                    value={formData.presentAddress || ''}
                    onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
                    placeholder="House, Road, Block, Area, City"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 4: প্রয়োজনীয় নথিপত্র ও হার্ডকপি আপলোড (Birth Certificate, Father/Mother NID, TC) */}
              <div className="font-bold text-slate-700 pt-3 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>{language === 'bn' ? '৪. প্রয়োজনীয় নথিপত্র ও হার্ডকপি আপলোড (ঐচ্ছিক)' : '4. Student Documents & NID Upload'}</span>
                <span className="text-[10px] text-slate-400 font-normal">ভর্তির সময় বা পরবর্তীতে আপলোড করা যাবে</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {/* 1. Birth Certificate */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>জন্ম নিবন্ধন সনদপত্র (Birth Certificate)</span>
                    </span>
                    {formData.birthCertificateUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ ফাইল যুক্ত</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)"
                    value={formData.birthCertificateNo || ''}
                    onChange={(e) => setFormData({ ...formData, birthCertificateNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-mono"
                  />
                  <label className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.birthCertificateUrl ? 'সনদের কপি পরিবর্তন' : 'সনদের ছবি / ফাইল আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleAdmissionDocUpload(e, 'birthCertificateUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Father NID */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span>পিতার জাতীয় পরিচয়পত্র (Father NID)</span>
                    </span>
                    {formData.fatherNidUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ ফাইল যুক্ত</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="পিতার NID নম্বর (১০/১৩/১৭ ডিজিট)"
                    value={formData.fatherNid || ''}
                    onChange={(e) => setFormData({ ...formData, fatherNid: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-mono"
                  />
                  <label className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.fatherNidUrl ? 'পিতার NID পরিবর্তন' : 'পিতার NID ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleAdmissionDocUpload(e, 'fatherNidUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 3. Mother NID */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      <span>মাতার জাতীয় পরিচয়পত্র (Mother NID)</span>
                    </span>
                    {formData.motherNidUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ ফাইল যুক্ত</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="মাতার NID নম্বর"
                    value={formData.motherNid || ''}
                    onChange={(e) => setFormData({ ...formData, motherNid: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-mono"
                  />
                  <label className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md border border-purple-200 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.motherNidUrl ? 'মাতার NID পরিবর্তন' : 'মাতার NID ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleAdmissionDocUpload(e, 'motherNidUrl')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 4. Previous School TC */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>পূর্ববর্তী স্কুলের ছাড়পত্র / প্রত্যয়নপত্র (TC)</span>
                    </span>
                    {formData.transferCertificateUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ ফাইল যুক্ত</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="পূর্ববর্তী প্রতিষ্ঠানের নাম"
                    value={formData.previousSchool || ''}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                  />
                  <label className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.transferCertificateUrl ? 'ছাড়পত্র কপি পরিবর্তন' : 'ছাড়পত্র (TC) ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleAdmissionDocUpload(e, 'transferCertificateUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {formData.id ? t('save') : language === 'bn' ? 'ভর্তি সম্পন্ন করুন' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student View Profile Modal with Document Vault */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 my-8 max-h-[92vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudent.nameBn || selectedStudent.nameEn} - {language === 'bn' ? 'শিক্ষার্থী প্রোফাইল ও নথি ভল্ট' : 'Student Profile & Document Vault'}
                </h3>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher inside Modal */}
            <div className="flex items-center space-x-2 mt-4 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStudentDetailTab('info')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  studentDetailTab === 'info'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{language === 'bn' ? '১. ব্যক্তিগত ও শিক্ষা তথ্য' : 'Profile Details'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailTab('vault')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  studentDetailTab === 'vault'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>
                  {language === 'bn' ? '২. ডিজিটাল ডকুমেন্ট ভল্ট ও হার্ডকপি' : 'Document Vault & Hard Copies'}
                  {(selectedStudent.birthCertificateUrl || selectedStudent.fatherNidUrl || selectedStudent.motherNidUrl || (selectedStudent.documents?.length || 0) > 0) && (
                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-400 text-slate-950 font-black">
                      {[
                        selectedStudent.birthCertificateUrl,
                        selectedStudent.fatherNidUrl,
                        selectedStudent.motherNidUrl,
                        selectedStudent.guardianNidUrl,
                        selectedStudent.transferCertificateUrl,
                      ].filter(Boolean).length + (selectedStudent.documents?.length || 0)}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* TAB 1: Profile Information */}
            {studentDetailTab === 'info' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-3.5 p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-xs">
                    {selectedStudent.photoUrl ? (
                      <img src={selectedStudent.photoUrl} alt={selectedStudent.nameEn} className="w-full h-full object-cover" />
                    ) : (
                      selectedStudent.nameEn.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{selectedStudent.nameEn}</h4>
                    <p className="text-slate-600 font-medium">{selectedStudent.nameBn}</p>
                    <p className="text-blue-700 font-bold mt-0.5">
                      ID: {selectedStudent.studentId} • Roll: {selectedStudent.roll} • Session: {selectedStudent.session || '2026'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-100">
                  <div>
                    <span className="text-slate-400">Class & Section:</span>
                    <p className="font-bold text-slate-800">
                      {selectedStudent.className} - {selectedStudent.section} ({selectedStudent.shift} Shift)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Blood Group & Religion:</span>
                    <p className="font-bold text-slate-800">
                      {selectedStudent.bloodGroup} • {selectedStudent.religion}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Birth:</span>
                    <p className="font-semibold text-slate-800">{selectedStudent.dob}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Academic Session:</span>
                    <p className="font-semibold text-blue-900">{selectedStudent.session || '2026'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">জন্ম নিবন্ধন নম্বর (Birth Reg No):</span>
                    <p className="font-mono font-bold text-slate-900">
                      {selectedStudent.birthCertificateNo || 'নম্বর এন্ট্রি করা নেই'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">পিতা/মাতা NID:</span>
                    <p className="font-mono text-slate-700">
                      {selectedStudent.fatherNidUrl ? '✓ পিতার NID সংযুক্ত' : 'NID কপি পাওয়া যায়নি'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Father & Mother:</span>
                  <p className="font-medium text-slate-800">{selectedStudent.fatherNameEn} / {selectedStudent.motherNameEn}</p>
                </div>

                <div>
                  <span className="text-slate-400">Guardian Contact:</span>
                  <p className="font-semibold text-slate-900">{selectedStudent.guardianName} ({selectedStudent.guardianPhone})</p>
                </div>

                <div>
                  <span className="text-slate-400">Address:</span>
                  <p className="text-slate-700">{selectedStudent.presentAddress || 'Mirpur, Dhaka'}</p>
                </div>
              </div>
            )}

            {/* TAB 2: Document Vault & Hard Copies */}
            {studentDetailTab === 'vault' && (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    শিক্ষার্থীর জন্ম নিবন্ধন সনদ, পিতা/মাতার জাতীয় পরিচয়পত্র (NID) এবং ছাড়পত্রসহ সকল হার্ডকপি নিচে ডিজিটাল ভল্টে সংরক্ষিত রয়েছে। ক্লিক করে বড় করে দেখুন বা ডাউনলোড করুন।
                  </span>
                </div>

                {/* Standard Document Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Document 1: Birth Certificate */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>১. জন্ম নিবন্ধন সনদ</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedStudent.birthCertificateUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedStudent.birthCertificateUrl ? '✓ হার্ডকপি সংরক্ষিত' : 'কপি অনুপস্থিত'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-mono">
                      সনদ নং: {selectedStudent.birthCertificateNo || 'নম্বর উল্লেখ নেই'}
                    </div>

                    {selectedStudent.birthCertificateUrl ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => {
                            setPreviewDocumentUrl(selectedStudent.birthCertificateUrl!);
                            setPreviewDocumentTitle(`${selectedStudent.nameEn} - জন্ম নিবন্ধন সনদ`);
                          }}
                          className="h-28 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer relative group flex items-center justify-center"
                        >
                          <img
                            src={selectedStudent.birthCertificateUrl}
                            alt="Birth Certificate"
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                            <ZoomIn className="w-4 h-4" />
                            <span>বড় করে দেখুন</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocumentUrl(selectedStudent.birthCertificateUrl!);
                              setPreviewDocumentTitle(`${selectedStudent.nameEn} - জন্ম নিবন্ধন সনদ`);
                            }}
                            className="flex-1 py-1 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>ভিউ</span>
                          </button>
                          <label className="flex-1 py-1 px-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-center cursor-pointer">
                            <span>পরিবর্তন</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleUploadHardCopy(e, 'birth_certificate', 'জন্ম নিবন্ধন সনদ')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="font-bold text-blue-600 block">জন্ম নিবন্ধন কপি আপলোড করুন</span>
                        <span className="text-[10px] text-slate-400">ক্যামেরা ছবি বা স্ক্যান ফাইল</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleUploadHardCopy(e, 'birth_certificate', 'জন্ম নিবন্ধন সনদ')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Document 2: Father NID */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>২. পিতার জাতীয় পরিচয়পত্র (NID)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedStudent.fatherNidUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {selectedStudent.fatherNidUrl ? '✓ সংরক্ষিত' : 'সংযুক্ত নেই'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      পিতা: {selectedStudent.fatherNameEn || selectedStudent.fatherNameBn}
                    </div>

                    {selectedStudent.fatherNidUrl ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => {
                            setPreviewDocumentUrl(selectedStudent.fatherNidUrl!);
                            setPreviewDocumentTitle(`${selectedStudent.nameEn} - পিতার NID`);
                          }}
                          className="h-28 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer relative group flex items-center justify-center"
                        >
                          <img
                            src={selectedStudent.fatherNidUrl}
                            alt="Father NID"
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                            <ZoomIn className="w-4 h-4" />
                            <span>বড় করে দেখুন</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocumentUrl(selectedStudent.fatherNidUrl!);
                              setPreviewDocumentTitle(`${selectedStudent.nameEn} - পিতার NID`);
                            }}
                            className="flex-1 py-1 px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>ভিউ</span>
                          </button>
                          <label className="flex-1 py-1 px-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-center cursor-pointer">
                            <span>পরিবর্তন</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleUploadHardCopy(e, 'father_nid', 'পিতার জাতীয় পরিচয়পত্র')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl text-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="font-bold text-indigo-600 block">পিতার NID কার্ড আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleUploadHardCopy(e, 'father_nid', 'পিতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Document 3: Mother NID */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <span>৩. মাতার জাতীয় পরিচয়পত্র (NID)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedStudent.motherNidUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {selectedStudent.motherNidUrl ? '✓ সংরক্ষিত' : 'সংযুক্ত নেই'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      মাতা: {selectedStudent.motherNameEn || selectedStudent.motherNameBn}
                    </div>

                    {selectedStudent.motherNidUrl ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => {
                            setPreviewDocumentUrl(selectedStudent.motherNidUrl!);
                            setPreviewDocumentTitle(`${selectedStudent.nameEn} - মাতার NID`);
                          }}
                          className="h-28 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer relative group flex items-center justify-center"
                        >
                          <img
                            src={selectedStudent.motherNidUrl}
                            alt="Mother NID"
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                            <ZoomIn className="w-4 h-4" />
                            <span>বড় করে দেখুন</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocumentUrl(selectedStudent.motherNidUrl!);
                              setPreviewDocumentTitle(`${selectedStudent.nameEn} - মাতার NID`);
                            }}
                            className="flex-1 py-1 px-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>ভিউ</span>
                          </button>
                          <label className="flex-1 py-1 px-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-center cursor-pointer">
                            <span>পরিবর্তন</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleUploadHardCopy(e, 'mother_nid', 'মাতার জাতীয় পরিচয়পত্র')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl text-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="font-bold text-purple-600 block">মাতার NID কার্ড আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleUploadHardCopy(e, 'mother_nid', 'মাতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Document 4: Transfer Certificate / TC */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>৪. প্রশংসাপত্র / ছাড়পত্র (TC)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedStudent.transferCertificateUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {selectedStudent.transferCertificateUrl ? '✓ সংরক্ষিত' : 'প্রয়োজন নেই'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      পূর্ববর্তী স্কুল ছাড়পত্র বা সনদপত্র
                    </div>

                    {selectedStudent.transferCertificateUrl ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => {
                            setPreviewDocumentUrl(selectedStudent.transferCertificateUrl!);
                            setPreviewDocumentTitle(`${selectedStudent.nameEn} - ছাড়পত্র / টিসি`);
                          }}
                          className="h-28 rounded-lg overflow-hidden border border-slate-300 bg-white cursor-pointer relative group flex items-center justify-center"
                        >
                          <img
                            src={selectedStudent.transferCertificateUrl}
                            alt="Transfer Certificate"
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                            <ZoomIn className="w-4 h-4" />
                            <span>বড় করে দেখুন</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocumentUrl(selectedStudent.transferCertificateUrl!);
                              setPreviewDocumentTitle(`${selectedStudent.nameEn} - ছাড়পত্র / টিসি`);
                            }}
                            className="flex-1 py-1 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>ভিউ</span>
                          </button>
                          <label className="flex-1 py-1 px-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-center cursor-pointer">
                            <span>পরিবর্তন</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleUploadHardCopy(e, 'transfer_certificate', 'ছাড়পত্র / টিসি')}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block p-3 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="font-bold text-emerald-600 block">ছাড়পত্র (TC) কপি আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleUploadHardCopy(e, 'transfer_certificate', 'ছাড়পত্র / টিসি')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Additional Attached Documents List */}
                {selectedStudent.documents && selectedStudent.documents.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h5 className="font-bold text-slate-800">অন্যান্য সংরক্ষিত ডকুমেন্টস ({selectedStudent.documents.length}টি):</h5>
                    <div className="space-y-1.5">
                      {selectedStudent.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-2">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-bold text-slate-800">{doc.title}</span>
                              <span className="text-[10px] text-slate-400 block">{doc.uploadedAt || doc.uploadDate}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDocumentUrl(doc.fileUrl);
                              setPreviewDocumentTitle(doc.title);
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold hover:bg-blue-100 flex items-center space-x-1"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>দেখুন</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              {onPrintCertificate && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    onPrintCertificate(selectedStudent, 'id_card');
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'আইডি কার্ড প্রিন্ট' : 'Print ID Card'}</span>
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN ZOOM LIGHTBOX MODAL FOR HARD COPY DOCUMENTS */}
      {previewDocumentUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-4 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {previewDocumentTitle || 'হার্ডকপি প্রিভিউ'}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewDocumentUrl}
                  download="student_document.png"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center space-x-1 hover:bg-blue-100 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center space-x-1 hover:bg-slate-200 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocumentUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/5 rounded-xl my-3 min-h-[350px]">
              <img
                src={previewDocumentUrl}
                alt="Document Preview"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md border border-slate-200 bg-white"
              />
            </div>

            <div className="text-center text-slate-500 text-[11px]">
              বিদ্যালয়ের ডিজিটাল নথিপত্র ভল্ট • উচ্চ রেজুল্যুশন অরিজিনাল কপি
            </div>
          </div>
        </div>
      )}

      {/* Official Student ID Card Modal (3 Templates + Pure White Back with Black QR & Mobile) */}
      {showIdCardModal && idCardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 my-8 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:my-0">
            {/* Header controls (hidden on print) */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {idCardStudent.nameBn || idCardStudent.nameEn} - শিক্ষার্থী ডিজিটাল আইডি কার্ড
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ID: <span className="font-mono font-bold text-blue-700">{idCardStudent.studentId}</span> • শ্রেণি: {idCardStudent.className} (রোল: {idCardStudent.roll})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => setShowIdCardModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Toolbars: Template Switcher & Side Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {/* 3 Template Themes Selector */}
                <div className="flex items-center space-x-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 px-1.5">থিম:</span>
                  <button
                    type="button"
                    onClick={() => setIdCardTemplate('classic_academic')}
                    className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                      idCardTemplate === 'classic_academic'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    ১. ক্লাসিক ব্লু
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardTemplate('executive_royal')}
                    className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                      idCardTemplate === 'executive_royal'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    ২. রয়্যাল মেরুন/গোল্ড
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardTemplate('modern_emerald')}
                    className={`px-2.5 py-1 rounded font-bold text-xs transition-colors ${
                      idCardTemplate === 'modern_emerald'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/70'
                    }`}
                  >
                    ৩. মডার্ন এমারেল্ড
                  </button>
                </div>

                {/* Front / Back / Both Switcher */}
                <div className="flex items-center space-x-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 px-1.5">সাইড:</span>
                  <button
                    type="button"
                    onClick={() => setIdCardViewMode('both')}
                    className={`px-2 py-1 rounded font-bold ${
                      idCardViewMode === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    উভয় পাশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardViewMode('front')}
                    className={`px-2 py-1 rounded font-bold ${
                      idCardViewMode === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সামনের পাশ (Front)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardViewMode('back')}
                    className={`px-2 py-1 rounded font-bold ${
                      idCardViewMode === 'back' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    পেছনের পাশ (White Back)
                  </button>
                </div>
              </div>
            </div>

            {/* Printable ID Cards Layout */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-6 print:m-0 print:gap-4">
              {/* SIDE 1: FRONT SIDE (DYNAMIC TEMPLATE COLORED - SMART 100% ENGLISH) */}
              {(idCardViewMode === 'both' || idCardViewMode === 'front') && (() => {
                const styles = getStudentCardStyles(idCardTemplate);
                return (
                  <div className={`w-[320px] h-[500px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between text-slate-900 print:shadow-none print:border-black shrink-0 relative transition-all ${styles.cardBorder}`}>
                    {/* Top Lanyard Slot Indicator */}
                    <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-1.5 print:hidden shrink-0" />

                    {/* Header banner with School Logo */}
                    <div>
                      <div className={`${styles.headerBg} p-2.5 text-center relative z-10`}>
                        <div className="flex items-center justify-center space-x-2">
                          <img
                            src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                            alt="Logo"
                            className="w-9 h-9 object-contain bg-white rounded-lg p-0.5 shadow-xs shrink-0"
                          />
                          <div className="text-left leading-tight">
                            <h3 className="font-black text-[11px] tracking-wide text-white uppercase leading-tight">
                              {school.nameEn || 'SMART MODEL SCHOOL & COLLEGE'}
                            </h3>
                            <h4 className="text-[9px] font-semibold text-blue-100 opacity-90">{school.nameBn}</h4>
                          </div>
                        </div>
                        <p className="text-[8px] opacity-85 mt-0.5 font-mono text-white/90">
                          EIIN: {school.eiin} • SESSION: {idCardStudent.session || school.currentSession || '2026'}
                        </p>
                      </div>

                      {/* Sub-badge Ribbon */}
                      <div className={`${styles.ribbonBg} py-0.5 text-center text-[9px] font-black uppercase tracking-widest shadow-2xs flex items-center justify-center space-x-1`}>
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>STUDENT IDENTITY CARD</span>
                      </div>

                      {/* RFID Tech Sub-bar */}
                      <div className="px-3 pt-1 flex items-center justify-between text-[8px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 font-bold text-blue-600">
                          <Wifi className="w-2.5 h-2.5 rotate-90" />
                          <span>SMART CAMPUS ID</span>
                        </span>
                        <span>VALID: {school.currentSession || '2026'}</span>
                      </div>

                      {/* Photo & Details */}
                      <div className="px-3 pb-2 pt-1 flex flex-col items-center text-center relative z-10">
                        <div className="relative mb-1">
                          <div className={`w-20 h-24 rounded-2xl p-0.5 bg-white shadow-md overflow-hidden shrink-0 ${styles.photoBorder}`}>
                            {idCardStudent.photoUrl ? (
                              <img
                                src={idCardStudent.photoUrl}
                                alt={idCardStudent.nameEn}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-extrabold flex items-center justify-center text-2xl rounded-xl">
                                {idCardStudent.nameEn.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-black shadow-xs" title="Verified Student">
                            ✓
                          </span>
                        </div>

                        <h4 className={`font-black text-xs uppercase tracking-wide truncate max-w-full leading-tight ${styles.nameColor}`}>
                          {idCardStudent.nameEn}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-500 truncate max-w-full">
                          {idCardStudent.nameBn}
                        </p>
                        <div className={`inline-block mt-1 px-3 py-0.5 font-mono font-black text-[11px] rounded-full border ${styles.badgeBg}`}>
                          ID: {idCardStudent.studentId}
                        </div>

                        {/* Class Info 2-Column Grid */}
                        <div className="w-full mt-2 pt-1.5 border-t border-slate-200 text-left space-y-1 text-[10.5px]">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-500 text-[10px] font-medium">Class:</span>
                              <strong className="text-slate-900 font-bold">{idCardStudent.className}</strong>
                            </div>
                            <div className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-500 text-[10px] font-medium">Roll:</span>
                              <strong className="text-slate-900 font-mono font-bold">{idCardStudent.roll}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-500 text-[10px] font-medium">Section:</span>
                              <strong className="text-slate-900 font-bold">{idCardStudent.section || 'A'}</strong>
                            </div>
                            <div className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                              <span className="text-slate-500 text-[10px] font-medium">Blood:</span>
                              <strong className="text-rose-600 font-black">{idCardStudent.bloodGroup || 'B+'}</strong>
                            </div>
                          </div>

                          {idCardStudent.group && (
                            <div className="flex justify-between items-center px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                              <span className="text-amber-900 font-bold text-[10px]">Academic Group:</span>
                              <span className="px-2 py-0.2 bg-amber-500 text-slate-950 font-black rounded text-[9.5px] uppercase">
                                {idCardStudent.group}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                            <span className="text-slate-500 text-[10px] font-medium">Guardian Phone:</span>
                            <strong className="text-slate-900 font-mono text-[10px] font-bold">{idCardStudent.guardianPhone}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Front Footer with Signatures */}
                    <div>
                      <div className="w-full px-3.5 pb-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] relative z-10 bg-slate-50/50">
                        <div className="text-center">
                          <div className="font-serif italic font-bold text-[9px] text-slate-700 border-b border-slate-300 pb-0.5 w-16">
                            Cardholder
                          </div>
                          <span className="text-slate-500 block uppercase font-medium">Signature</span>
                        </div>
                        <div className="text-center">
                          <div className="font-serif italic font-bold text-[9px] text-blue-900 border-b border-slate-400 pb-0.5 w-20 truncate">
                            {school.principalNameEn || 'Principal'}
                          </div>
                          <span className="text-slate-500 block uppercase font-medium">Principal Sign</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border-t border-slate-200 py-1 text-center text-[7.5px] text-slate-500">
                        Institutional Property • Helpline: {school.phone}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SIDE 2: BACK SIDE (100% ENGLISH, CRISP SOLID BLACK TEXT, HIGH-CONTRAST BLACK QR & EMERGENCY CONTACTS) */}
              {(idCardViewMode === 'both' || idCardViewMode === 'back') && (
                <div className="w-[320px] h-[500px] bg-white text-black rounded-2xl border-2 border-black shadow-xl overflow-hidden flex flex-col justify-between font-sans print:border-2 print:border-black p-3.5 shrink-0 relative">
                  {/* Top Lanyard Slot Indicator */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto my-1 print:hidden shrink-0" />

                  {/* Top Header: Pure Black text on Pure White */}
                  <div className="border-b-2 border-black pb-1.5 text-center shrink-0">
                    <h4 className="font-black text-[11px] uppercase tracking-wider text-black">
                      {school.nameEn || 'INSTITUTION IDENTITY'}
                    </h4>
                    <p className="font-bold text-[8.5px] text-black tracking-widest uppercase mt-0.5">
                      STUDENT IDENTITY CARD • BACK SIDE
                    </p>
                    <p className="font-mono text-[8px] text-black mt-0.5">
                      EIIN: {school.eiin} • SESSION: {idCardStudent.session || school.currentSession || '2026'}
                    </p>
                  </div>

                  {/* Center: Large High-Contrast Pitch Black QR Code & ID */}
                  <div className="flex flex-col items-center justify-center my-1 text-center shrink-0">
                    <div className="p-1.5 bg-white rounded-xl border-2 border-black shadow-2xs relative">
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-black" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-black" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-black" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-black" />
                      {singleStudentQrUrl ? (
                        <img
                          src={singleStudentQrUrl}
                          alt="Student QR Attendance Code"
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-white border border-black flex items-center justify-center text-xs font-mono font-bold text-black">
                          QR CODE
                        </div>
                      )}
                    </div>
                    <span className="mt-1 font-mono font-black text-[11px] text-black tracking-wider">
                      STUDENT ID: {idCardStudent.studentId}
                    </span>
                    <span className="text-[8px] font-bold text-black uppercase tracking-wider">
                      Scan at Smart Gate Kiosk for Attendance
                    </span>
                  </div>

                  {/* PROMINENT EMERGENCY GUARDIAN MOBILE BOX (100% English) */}
                  <div className="bg-white border-2 border-black rounded-xl p-2 text-black space-y-1 shrink-0">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-black" />
                        <span>Emergency Guardian Mobile:</span>
                      </span>
                      <span className="font-mono font-black text-[11px] text-black">{idCardStudent.guardianPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-black">
                      <span className="text-black font-medium">Father's Name:</span>
                      <span className="font-bold text-black truncate max-w-[170px]">{idCardStudent.fatherNameEn || idCardStudent.fatherNameBn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-black font-medium">Mother's Name:</span>
                      <span className="font-bold text-black truncate max-w-[170px]">{idCardStudent.motherNameEn || idCardStudent.motherNameBn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[8.5px]">
                      <span className="text-black font-medium">Present Address:</span>
                      <span className="text-black font-semibold truncate max-w-[170px]">{idCardStudent.presentAddress || 'Dhaka, Bangladesh'}</span>
                    </div>
                  </div>

                  {/* Institutional Rules & Return Instructions (100% English) */}
                  <div className="space-y-1 text-black text-[7.5px] leading-tight border-t border-black pt-1.5 shrink-0">
                    <p className="font-bold uppercase tracking-wider text-[8px]">Terms & Conditions:</p>
                    <ol className="list-decimal pl-3 space-y-0.5 text-[7px] leading-snug">
                      <li>Carrying this identity card is mandatory within the school campus.</li>
                      <li>Scan QR code at the smart gate kiosk for automated daily attendance.</li>
                      <li>Institutional property and non-transferable. Report loss to office immediately.</li>
                    </ol>
                    <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7px] font-semibold">
                      <span>If found, return to: {school.nameEn}</span>
                      <span>Helpline: {school.phone}</span>
                    </div>
                  </div>

                  {/* Dual Signatures */}
                  <div className="pt-1.5 border-t border-black flex items-center justify-between text-black text-[8px] shrink-0">
                    <div className="text-center">
                      <div className="font-serif italic font-bold text-[9px] border-b border-black pb-0.5 w-20">
                        Cardholder
                      </div>
                      <span className="block font-medium text-[7px] uppercase">Signature</span>
                    </div>
                    <div className="text-center">
                      <div className="font-serif italic font-bold text-[9px] border-b border-black pb-0.5 w-20 truncate">
                        {school.principalNameEn || 'Principal'}
                      </div>
                      <span className="block font-medium text-[7px] uppercase">Principal Signature</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>স্মার্ট আইডি কার্ড প্রস্তুত (সামনের পাশ + সাদা ব্যাকগ্রাউন্ডে কালো কিউআর ও মোবাইলযুক্ত ব্যাক পার্ট)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIdCardModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Student Password Management Modal */}
      {showPasswordModal && targetPasswordStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  শিক্ষার্থী লগইন পাসওয়ার্ড ব্যবস্থাপনা
                </h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordChangeSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudentPassword} className="mt-4 space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="font-bold text-blue-950 text-sm">
                  {targetPasswordStudent.nameBn || targetPasswordStudent.nameEn}
                </div>
                <div className="text-slate-600">
                  শ্রেণি: {targetPasswordStudent.className} • শাখা: {targetPasswordStudent.section} • রোল: {targetPasswordStudent.roll}
                </div>
                <div className="text-indigo-800 font-mono font-bold pt-1">
                  স্টুডেন্ট লগইন আইডি (Username): <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">{targetPasswordStudent.studentId}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পাসওয়ার্ড পরিবর্তন করুন (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="ডিফল্ট: 1234"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * শিক্ষার্থী তার নিজের Student ID এবং এই পাসওয়ার্ড ব্যবহার করে সরাসরি নিজের ড্যাশবোর্ডে লগইন করবে।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  পাসওয়ার্ড সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app Student Delete Confirmation Modal (Native confirm bypass for Mobile / Iframe) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-center transform scale-100 transition-all">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              {language === 'bn' ? 'শিক্ষার্থী রেকর্ড মুছে ফেলতে চান?' : 'Delete Student Record?'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {language === 'bn' ? (
                <>
                  আপনি কি নিশ্চিত যে শিক্ষার্থী <strong className="text-slate-900 font-bold">"{studentToDelete.nameBn || studentToDelete.nameEn}"</strong> (আইডি: <span className="font-mono text-blue-700 font-bold">{studentToDelete.studentId}</span>, শ্রেণি: <span className="font-bold text-slate-800">{studentToDelete.className}</span>, রোল: <span className="font-bold text-slate-800">{studentToDelete.roll}</span>)-এর তথ্য মুছে ফেলতে চান?
                </>
              ) : (
                <>
                  Are you sure you want to delete student <strong className="text-slate-900 font-bold">"{studentToDelete.nameEn}"</strong> (ID: <span className="font-mono text-blue-700 font-bold">{studentToDelete.studentId}</span>, Class: <span className="font-bold text-slate-800">{studentToDelete.className}</span>, Roll: <span className="font-bold text-slate-800">{studentToDelete.roll}</span>)?
                </>
              )}
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 mb-5 text-left text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {language === 'bn'
                  ? 'এই শিক্ষার্থীকে মুছে দিলে লোকাল ডাটাবেজ এবং ক্লাউড ফায়ারবেস থেকে তাৎক্ষণিকভাবে সম্পূর্ণ রিমুভ হয়ে যাবে।'
                  : 'Deleting will permanently remove this record from both local browser storage and cloud Firestore.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeletingStudent}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                disabled={isDeletingStudent}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
              >
                {isDeletingStudent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Student Document Vault Modal (Birth Certificate, Father/Mother NID, TC) */}
      {showDocVaultModal && docVaultStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 my-8 max-h-[92vh] overflow-y-auto text-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>{docVaultStudent.nameBn || docVaultStudent.nameEn}</span>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      ID: {docVaultStudent.studentId}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    শ্রেণি: {docVaultStudent.className} (শাখা: {docVaultStudent.section || 'A'}, রোল: {docVaultStudent.roll}) • নথিপত্র ও হার্ডকপি ভল্ট
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {(docVaultStudent.birthCertificateUrl || docVaultStudent.fatherNidUrl || docVaultStudent.motherNidUrl || docVaultStudent.transferCertificateUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (docVaultStudent.birthCertificateUrl) {
                        handlePrintDocument('শিক্ষার্থীর জন্ম নিবন্ধন ও সকল সংরক্ষিত নথিপত্র', docVaultStudent.birthCertificateUrl, docVaultStudent);
                      } else if (docVaultStudent.fatherNidUrl) {
                        handlePrintDocument('পিতার জাতীয় পরিচয়পত্র', docVaultStudent.fatherNidUrl, docVaultStudent);
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>নথি প্রিন্ট করুন</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDocVaultModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {docVaultNotice && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{docVaultNotice}</span>
              </div>
            )}

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* 1. BIRTH CERTIFICATE */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-slate-900 text-sm">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      <span>১. জন্ম নিবন্ধন সনদপত্র (Birth Certificate)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      docVaultStudent.birthCertificateUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {docVaultStudent.birthCertificateUrl ? '✓ সংরক্ষিত' : 'কপি অনুপস্থিত'}
                    </span>
                  </div>

                  {/* Document Number with Save */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="জন্ম নিবন্ধন নম্বর (১৭ ডিজিট)"
                      defaultValue={docVaultStudent.birthCertificateNo || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== docVaultStudent.birthCertificateNo) {
                          const updated = { ...docVaultStudent, birthCertificateNo: val };
                          StorageService.updateStudent(updated);
                          setDocVaultStudent(updated);
                          setStudents(StorageService.getStudents());
                          setDocVaultNotice('জন্ম নিবন্ধন নম্বর সংরক্ষিত হয়েছে!');
                          setTimeout(() => setDocVaultNotice(''), 3000);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  {/* Thumbnail / Upload Area */}
                  {docVaultStudent.birthCertificateUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setPreviewDocumentUrl(docVaultStudent.birthCertificateUrl!);
                          setPreviewDocumentTitle(`${docVaultStudent.nameEn} - জন্ম নিবন্ধন সনদপত্র`);
                        }}
                        className="h-36 rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer relative group flex items-center justify-center p-1"
                      >
                        <img
                          src={docVaultStudent.birthCertificateUrl}
                          alt="Birth Certificate"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>বড় করে প্রিভিউ দেখুন</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocumentUrl(docVaultStudent.birthCertificateUrl!);
                            setPreviewDocumentTitle(`${docVaultStudent.nameEn} - জন্ম নিবন্ধন সনদপত্র`);
                          }}
                          className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>প্রিভিউ</span>
                        </button>
                        <a
                          href={docVaultStudent.birthCertificateUrl}
                          download={`Birth_Cert_${docVaultStudent.studentId}_${docVaultStudent.nameEn.replace(/\s+/g, '_')}.png`}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handlePrintDocument('শিক্ষার্থীর জন্ম নিবন্ধন সনদপত্র', docVaultStudent.birthCertificateUrl!, docVaultStudent)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVaultDeleteDoc('birthCertificateUrl')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                          title="সনদের কপি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="p-3 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-500 mb-1" />
                        <span className="font-bold text-blue-700">ফাইল আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleVaultUpload(e, 'birthCertificateUrl', 'জন্ম নিবন্ধন সনদপত্র')}
                          className="hidden"
                        />
                      </label>
                      <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-bold text-emerald-700">ক্যামেরা দিয়ে ছবি</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleVaultUpload(e, 'birthCertificateUrl', 'জন্ম নিবন্ধন সনদপত্র')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. FATHER NID */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-slate-900 text-sm">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>২. পিতার জাতীয় পরিচয়পত্র (Father NID)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      docVaultStudent.fatherNidUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {docVaultStudent.fatherNidUrl ? '✓ সংরক্ষিত' : 'কপি অনুপস্থিত'}
                    </span>
                  </div>

                  {/* Document Number with Save */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="পিতার NID নম্বর (১০/১৩/১৭ ডিজিট)"
                      defaultValue={docVaultStudent.fatherNid || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== docVaultStudent.fatherNid) {
                          const updated = { ...docVaultStudent, fatherNid: val };
                          StorageService.updateStudent(updated);
                          setDocVaultStudent(updated);
                          setStudents(StorageService.getStudents());
                          setDocVaultNotice('পিতার NID নম্বর সংরক্ষিত হয়েছে!');
                          setTimeout(() => setDocVaultNotice(''), 3000);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  {/* Thumbnail / Upload Area */}
                  {docVaultStudent.fatherNidUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setPreviewDocumentUrl(docVaultStudent.fatherNidUrl!);
                          setPreviewDocumentTitle(`${docVaultStudent.nameEn} - পিতার NID`);
                        }}
                        className="h-36 rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer relative group flex items-center justify-center p-1"
                      >
                        <img
                          src={docVaultStudent.fatherNidUrl}
                          alt="Father NID"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>বড় করে প্রিভিউ দেখুন</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocumentUrl(docVaultStudent.fatherNidUrl!);
                            setPreviewDocumentTitle(`${docVaultStudent.nameEn} - পিতার NID`);
                          }}
                          className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>প্রিভিউ</span>
                        </button>
                        <a
                          href={docVaultStudent.fatherNidUrl}
                          download={`Father_NID_${docVaultStudent.studentId}_${docVaultStudent.nameEn.replace(/\s+/g, '_')}.png`}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handlePrintDocument('পিতার জাতীয় পরিচয়পত্র (NID)', docVaultStudent.fatherNidUrl!, docVaultStudent)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVaultDeleteDoc('fatherNidUrl')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                          title="পিতার NID কপি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="p-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-indigo-500 mb-1" />
                        <span className="font-bold text-indigo-700">ফাইল আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleVaultUpload(e, 'fatherNidUrl', 'পিতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                      <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-bold text-emerald-700">ক্যামেরা দিয়ে ছবি</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleVaultUpload(e, 'fatherNidUrl', 'পিতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. MOTHER NID */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-slate-900 text-sm">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>৩. মাতার / অভিভাবকের পরিচয়পত্র (Mother NID)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      docVaultStudent.motherNidUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {docVaultStudent.motherNidUrl ? '✓ সংরক্ষিত' : 'কপি অনুপস্থিত'}
                    </span>
                  </div>

                  {/* Document Number with Save */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="মাতার NID নম্বর"
                      defaultValue={docVaultStudent.motherNid || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== docVaultStudent.motherNid) {
                          const updated = { ...docVaultStudent, motherNid: val };
                          StorageService.updateStudent(updated);
                          setDocVaultStudent(updated);
                          setStudents(StorageService.getStudents());
                          setDocVaultNotice('মাতার NID নম্বর সংরক্ষিত হয়েছে!');
                          setTimeout(() => setDocVaultNotice(''), 3000);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>

                  {/* Thumbnail / Upload Area */}
                  {docVaultStudent.motherNidUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setPreviewDocumentUrl(docVaultStudent.motherNidUrl!);
                          setPreviewDocumentTitle(`${docVaultStudent.nameEn} - মাতার NID`);
                        }}
                        className="h-36 rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer relative group flex items-center justify-center p-1"
                      >
                        <img
                          src={docVaultStudent.motherNidUrl}
                          alt="Mother NID"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>বড় করে প্রিভিউ দেখুন</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocumentUrl(docVaultStudent.motherNidUrl!);
                            setPreviewDocumentTitle(`${docVaultStudent.nameEn} - মাতার NID`);
                          }}
                          className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>প্রিভিউ</span>
                        </button>
                        <a
                          href={docVaultStudent.motherNidUrl}
                          download={`Mother_NID_${docVaultStudent.studentId}_${docVaultStudent.nameEn.replace(/\s+/g, '_')}.png`}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handlePrintDocument('মাতার জাতীয় পরিচয়পত্র (NID)', docVaultStudent.motherNidUrl!, docVaultStudent)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVaultDeleteDoc('motherNidUrl')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                          title="মাতার NID কপি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="p-3 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-purple-500 mb-1" />
                        <span className="font-bold text-purple-700">ফাইল আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleVaultUpload(e, 'motherNidUrl', 'মাতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                      <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-bold text-emerald-700">ক্যামেরা দিয়ে ছবি</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleVaultUpload(e, 'motherNidUrl', 'মাতার জাতীয় পরিচয়পত্র')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. PREVIOUS SCHOOL TC */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-slate-900 text-sm">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>৪. পূর্ববর্তী স্কুলের ছাড়পত্র (Transfer Certificate / TC)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      docVaultStudent.transferCertificateUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {docVaultStudent.transferCertificateUrl ? '✓ সংরক্ষিত' : 'কপি অনুপস্থিত'}
                    </span>
                  </div>

                  {/* Previous school name input with save */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="পূর্ববর্তী প্রতিষ্ঠানের নাম"
                      defaultValue={docVaultStudent.previousSchool || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== docVaultStudent.previousSchool) {
                          const updated = { ...docVaultStudent, previousSchool: val };
                          StorageService.updateStudent(updated);
                          setDocVaultStudent(updated);
                          setStudents(StorageService.getStudents());
                          setDocVaultNotice('পূর্ববর্তী প্রতিষ্ঠানের তথ্য সংরক্ষিত হয়েছে!');
                          setTimeout(() => setDocVaultNotice(''), 3000);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {/* Thumbnail / Upload Area */}
                  {docVaultStudent.transferCertificateUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() => {
                          setPreviewDocumentUrl(docVaultStudent.transferCertificateUrl!);
                          setPreviewDocumentTitle(`${docVaultStudent.nameEn} - ছাড়পত্র / প্রত্যয়নপত্র (TC)`);
                        }}
                        className="h-36 rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer relative group flex items-center justify-center p-1"
                      >
                        <img
                          src={docVaultStudent.transferCertificateUrl}
                          alt="Transfer Certificate"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold space-x-1 text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>বড় করে প্রিভিউ দেখুন</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocumentUrl(docVaultStudent.transferCertificateUrl!);
                            setPreviewDocumentTitle(`${docVaultStudent.nameEn} - ছাড়পত্র (TC)`);
                          }}
                          className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center justify-center space-x-1"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>প্রিভিউ</span>
                        </button>
                        <a
                          href={docVaultStudent.transferCertificateUrl}
                          download={`TC_${docVaultStudent.studentId}_${docVaultStudent.nameEn.replace(/\s+/g, '_')}.png`}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handlePrintDocument('পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র / প্রত্যয়নপত্র (TC)', docVaultStudent.transferCertificateUrl!, docVaultStudent)}
                          className="py-1.5 px-2.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVaultDeleteDoc('transferCertificateUrl')}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg"
                          title="ছাড়পত্র কপি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-bold text-emerald-700">ফাইল আপলোড</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleVaultUpload(e, 'transferCertificateUrl', 'ছাড়পত্র / টিসি')}
                          className="hidden"
                        />
                      </label>
                      <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-bold text-emerald-700">ক্যামেরা দিয়ে ছবি</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleVaultUpload(e, 'transferCertificateUrl', 'ছাড়পত্র / টিসি')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Custom Documents Section */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Files className="w-4 h-4 text-slate-700" />
                    <span>৫. অন্যান্য সংরক্ষিত নথিপত্র ও সংযুক্তি ({docVaultStudent.documents?.length || 0}টি)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">টিকা কার্ড, মেডিক্যাল সার্টিফিকেট, কোটা সনদপত্র ইত্যাদি</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="নথির শিরোনাম (যেমন: টিকা কার্ড)"
                    value={customDocTitle}
                    onChange={(e) => setCustomDocTitle(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-48"
                  />
                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন ফাইল যুক্ত</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        handleVaultUpload(e, 'other', customDocTitle || 'সংযুক্ত নথিপত্র');
                        setCustomDocTitle('');
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {docVaultStudent.documents && docVaultStudent.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {docVaultStudent.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate" title={doc.title}>{doc.title}</span>
                          <span className="text-[10px] text-slate-400">{doc.uploadedAt || doc.uploadDate || 'সংরক্ষিত'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewDocumentUrl(doc.fileUrl);
                            setPreviewDocumentTitle(doc.title);
                          }}
                          className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold"
                        >
                          ভিউ
                        </button>
                        <a
                          href={doc.fileUrl}
                          download={`${doc.title.replace(/\s+/g, '_')}_${docVaultStudent.studentId}.png`}
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded"
                          title="ডাউনলোড"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handlePrintDocument(doc.title, doc.fileUrl, docVaultStudent)}
                          className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded"
                          title="প্রিন্ট"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVaultDeleteDoc(doc.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  কোনো অতিরিক্ত ফাইল এখনও যুক্ত করা হয়নি।
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                বিদ্যালয়ের সেন্ট্রাল ডিজিটাল ভল্টে প্রতিটি নথি সুরক্ষিতভাবে সংরক্ষিত থাকে।
              </span>
              <button
                type="button"
                onClick={() => setShowDocVaultModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Success Toast */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center space-x-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionToast}</span>
          <button
            type="button"
            onClick={() => setActionToast('')}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
