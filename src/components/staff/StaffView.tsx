import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Staff } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Printer,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  CreditCard,
  Camera,
  Droplets,
  QrCode,
  Building,
  Download,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import QRCode from 'qrcode';
import { compressImageToPassportSize } from '../../utils/storageHelper';

export const StaffView: React.FC = () => {
  const { activeRole } = useAuth();
  const { t, language, formatTaka, toBnNumber } = useLanguage();
  const { schoolProfile } = useSchool();
  const [staffList, setStaffList] = useState<Staff[]>(() => StorageService.getStaff());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPayslipModal, setShowPayslipModal] = useState<boolean>(false);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedStaffForIdCard, setSelectedStaffForIdCard] = useState<Staff | null>(null);
  const [idCardTemplate, setIdCardTemplate] = useState<'classic_academic' | 'executive_royal' | 'modern_emerald'>('classic_academic');
  const [idCardViewMode, setIdCardViewMode] = useState<'both' | 'front' | 'back'>('both');
  const [staffQrUrl, setStaffQrUrl] = useState<string>('');

  // Dynamic template color styles for Staff Front Side (Back side is strictly pure white per user requirements)
  const getStaffCardStyles = (tpl: 'classic_academic' | 'executive_royal' | 'modern_emerald') => {
    if (tpl === 'executive_royal') {
      return {
        cardBorder: 'border-2 border-amber-600 shadow-xl ring-2 ring-amber-200',
        headerBg: 'bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white',
        ribbonBg: 'bg-amber-400 text-slate-950 font-black',
        photoBorder: 'border-2 border-amber-600 shadow-sm',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        accentText: 'text-amber-800',
        nameColor: 'text-amber-950',
      };
    } else if (tpl === 'modern_emerald') {
      return {
        cardBorder: 'border-2 border-emerald-600 shadow-xl ring-2 ring-emerald-200',
        headerBg: 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white',
        ribbonBg: 'bg-emerald-400 text-slate-950 font-black',
        photoBorder: 'border-2 border-emerald-500 shadow-sm',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        accentText: 'text-emerald-800',
        nameColor: 'text-emerald-950',
      };
    } else {
      // Classic Academic (Blue / Navy)
      return {
        cardBorder: 'border-2 border-blue-600 shadow-xl ring-2 ring-blue-200',
        headerBg: 'bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white',
        ribbonBg: 'bg-indigo-600 text-white font-bold',
        photoBorder: 'border-2 border-indigo-600 shadow-sm',
        badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        accentText: 'text-indigo-700',
        nameColor: 'text-slate-900',
      };
    }
  };

  const [formData, setFormData] = useState<Partial<Staff>>({
    nameEn: '',
    nameBn: '',
    gender: 'Male',
    designation: 'Assistant Teacher',
    department: 'Languages',
    role: 'teacher',
    email: '',
    phone: '',
    qualification: '',
    joiningDate: '2022-01-01',
    basicSalary: 32000,
    houseRentAllowance: 8000,
    medicalAllowance: 2000,
    otherAllowance: 1000,
    providentFundDeduction: 3200,
    status: 'active',
  });

  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const canManage = activeRole === 'super_admin' || activeRole === 'admin';
  const canViewSalary = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'accountant';

  const departments = ['All', 'Administration', 'Mathematics & Science', 'Languages', 'Science', 'Accounts & Finance', 'Library', 'Front Office'];

  const filteredStaff = staffList.filter((st) => {
    if (selectedDept !== 'all' && st.department !== selectedDept) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        st.nameEn.toLowerCase().includes(q) ||
        st.nameBn.includes(q) ||
        st.employeeId.toLowerCase().includes(q) ||
        st.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 240, 300, 0.75);
      setFormData((prev) => ({ ...prev, photoUrl: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    const nextNum = 100 + staffList.length + 1;
    const nextId = `EMP-${nextNum}`;
    setFormData({
      employeeId: nextId,
      nameEn: '',
      nameBn: '',
      gender: 'Male',
      designation: 'Assistant Teacher',
      department: 'Science',
      role: 'teacher',
      email: '',
      phone: '',
      username: `emp${nextNum}`,
      password: 'staff123',
      bloodGroup: 'B+',
      emergencyContact: '',
      qualification: 'B.Sc (Hons), M.Sc',
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: 32000,
      houseRentAllowance: 8000,
      medicalAllowance: 2000,
      otherAllowance: 1000,
      providentFundDeduction: 3200,
      status: 'active',
      photoUrl: '',
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn || !formData.designation || !formData.phone) {
      setFormError('Please fill in required fields.');
      return;
    }

    if (formData.id) {
      StorageService.updateStaff(formData as Staff);
      setStaffList(StorageService.getStaff());
      setFormSuccess('Staff updated successfully.');
    } else {
      const nextNum = 100 + staffList.length + 1;
      const newStaff: Staff = {
        ...(formData as Staff),
        id: `st_${Date.now()}`,
        employeeId: formData.employeeId || `EMP-${nextNum}`,
        username: formData.username || `emp${nextNum}`,
        password: formData.password || 'staff123',
        bloodGroup: formData.bloodGroup || 'B+',
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      };
      StorageService.addStaff(newStaff);
      setStaffList(StorageService.getStaff());
      setFormSuccess('Staff profile created successfully.');
    }
    setTimeout(() => {
      setShowAddModal(false);
      setFormSuccess('');
    }, 1200);
  };

  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState<boolean>(false);

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeletingStaff(true);
    try {
      StorageService.deleteStaff(staffToDelete.id);
      setStaffList(StorageService.getStaff());
      setStaffToDelete(null);
    } catch (e) {
      console.error('Delete staff error:', e);
    } finally {
      setIsDeletingStaff(false);
    }
  };

  const handlePrintPayslip = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowPayslipModal(true);
  };

  const handleViewIdCard = async (staffMember: Staff) => {
    setSelectedStaffForIdCard(staffMember);
    setShowIdCardModal(true);
    try {
      const qrData = StorageService.generateStaffQRData(staffMember);
      const url = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setStaffQrUrl(url);
    } catch (e) {
      console.error('Error generating staff QR code:', e);
    }
  };

  const handleDownloadStaffQR = () => {
    if (!staffQrUrl || !selectedStaffForIdCard) return;
    const a = document.createElement('a');
    a.href = staffQrUrl;
    a.download = `Staff_Attendance_QR_${selectedStaffForIdCard.employeeId}_${selectedStaffForIdCard.nameEn.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'শিক্ষক ও কর্মচারী ডিরেক্টরি' : 'Teachers & Staff Directory'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? `মোট ${toBnNumber(staffList.length)} জন শিক্ষক ও প্রশাসনিক কর্মকর্তা নিয়োজিত`
              : `Total ${staffList.length} faculty and administrative personnel`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন স্টাফ যোগ করুন' : 'Add New Staff'}</span>
          </button>
        )}
      </div>

      {/* Search and Dept Filter */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'নাম, পদবি বা আইডি দিয়ে খুঁজুন...' : 'Search by name, designation, ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All Departments'}</option>
            {departments.slice(1).map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => {
          const gross = member.basicSalary + member.houseRentAllowance + member.medicalAllowance + member.otherAllowance;
          const netSalary = gross - member.providentFundDeduction;

          return (
            <div
              key={member.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden shrink-0 border border-slate-200">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        member.nameEn.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{member.nameEn}</h4>
                      <p className="text-[11px] text-slate-500">{member.nameBn}</p>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono">
                          {member.employeeId}
                        </span>
                        {member.bloodGroup && (
                          <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200">
                            <Droplets className="w-2.5 h-2.5 text-rose-500" />
                            <span>{member.bloodGroup}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Active
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Designation:</span>
                    <span className="font-semibold text-slate-900">{member.designation}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium">{member.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium text-slate-900 font-mono">{member.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Qualification:</span>
                    <span className="font-medium text-slate-600 truncate max-w-[150px]" title={member.qualification}>
                      {member.qualification}
                    </span>
                  </div>

                  {canViewSalary && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {language === 'bn' ? 'মাসিক নিট বেতন:' : 'Net Monthly Salary:'}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatTaka(netSalary)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleViewIdCard(member)}
                    title="Generate Teacher / Staff ID Card"
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'bn' ? 'আইডি কার্ড' : 'ID Card'}</span>
                  </button>

                  <button
                    onClick={() => handleViewIdCard(member)}
                    title="Teacher Attendance QR Pass / শিক্ষক হাজিরা কিউআর"
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'bn' ? 'হাজিরা কিউআর' : 'QR Pass'}</span>
                  </button>

                  {canViewSalary && (
                    <button
                      onClick={() => handlePrintPayslip(member)}
                      title="Generate Monthly Payslip"
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'পে-স্লিপ' : 'Payslip'}</span>
                    </button>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setFormData(member);
                        setFormError('');
                        setFormSuccess('');
                        setShowAddModal(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffToDelete(member)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-100 min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                      title={language === 'bn' ? 'স্টাফ মুছে ফেলুন' : 'Delete Staff'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {formData.id ? 'Edit Staff Profile' : 'Add New Teacher / Staff Member'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="mt-4 space-y-3 text-xs">
              {/* Photo Upload Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Staff Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-center">
                        <Users className="w-6 h-6 mx-auto text-slate-300" />
                        <span className="text-[9px] block">No Photo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      {language === 'bn' ? 'শিক্ষক / স্টাফ ছবি (Staff Image)' : 'Teacher / Staff Photo'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {language === 'bn'
                        ? 'আইডি কার্ড ও প্রোফাইলে প্রদর্শনের জন্য ছবি আপলোড করুন (Max 2MB)'
                        : 'Upload photo for Staff ID Card and institutional directory'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.photoUrl ? (language === 'bn' ? 'পরিবর্তন' : 'Change') : (language === 'bn' ? 'ছবি আপলোড' : 'Upload')}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">System Role</label>
                  <select
                    value={formData.role || 'teacher'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="admin">Head Teacher / Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant</option>
                    <option value="librarian">Librarian</option>
                    <option value="receptionist">Admission Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Login Username (ইউজারনেম) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. rohim"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Login Password (পাসওয়ার্ড) *</label>
                  <input
                    type="text"
                    required
                    value={formData.password || 'staff123'}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">পূর্ণ নাম (বাংলায়)</label>
                  <input
                    type="text"
                    value={formData.nameBn || ''}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Designation (পদবি) *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={formData.department || 'Science'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {departments.slice(1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Blood Group (রক্তের গ্রুপ)</label>
                  <select
                    value={formData.bloodGroup || 'B+'}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Emergency Contact (জরুরি যোগাযোগ নম্বর)</label>
                  <input
                    type="text"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. +880 1711-..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Qualification (শিক্ষাগত যোগ্যতা)</label>
                  <input
                    type="text"
                    value={formData.qualification || ''}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. M.Sc in Mathematics, B.Ed (DU)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                {/* Salary configuration */}
                <div>
                  <label className="block font-semibold mb-1">Basic Salary (মূল বেতন)</label>
                  <input
                    type="number"
                    value={formData.basicSalary || 0}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">House Rent (বাড়ি ভাড়া)</label>
                  <input
                    type="number"
                    value={formData.houseRentAllowance || 0}
                    onChange={(e) => setFormData({ ...formData, houseRentAllowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Medical Allowance (চিকিৎসা)</label>
                  <input
                    type="number"
                    value={formData.medicalAllowance || 0}
                    onChange={(e) => setFormData({ ...formData, medicalAllowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Provident Fund (কর্তন)</label>
                  <input
                    type="number"
                    value={formData.providentFundDeduction || 0}
                    onChange={(e) => setFormData({ ...formData, providentFundDeduction: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {formData.id ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Salary Payslip Modal */}
      {showPayslipModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 print:p-0 print:border-none print:shadow-none">
            {/* Header controls (hidden when printing) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'bn' ? 'বেতন বিবরণী স্লিপ (Payslip)' : 'Official Salary Payslip'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Payslip'}</span>
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-white text-xs text-slate-800">
              {/* School Header */}
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">{schoolProfile.nameBn}</h2>
                <h3 className="text-xs font-semibold text-slate-700">{schoolProfile.nameEn}</h3>
                <p className="text-[11px] text-slate-500">{schoolProfile.addressBn || schoolProfile.addressEn} • EIIN: {schoolProfile.eiin}</p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Salary Slip for October 2026
                </div>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 gap-2 my-3 py-2 border-b border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-500">Employee Name: </span>
                  <strong className="text-slate-900">{selectedStaff.nameEn} ({selectedStaff.nameBn})</strong>
                </div>
                <div>
                  <span className="text-slate-500">Employee ID: </span>
                  <strong className="text-slate-900">{selectedStaff.employeeId}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Designation: </span>
                  <strong className="text-slate-900">{selectedStaff.designation}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Department: </span>
                  <strong className="text-slate-900">{selectedStaff.department}</strong>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 gap-4 my-3">
                {/* Earnings */}
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                    Earnings (প্রাপ্তি)
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span className="font-semibold">{formatTaka(selectedStaff.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent:</span>
                      <span className="font-semibold">{formatTaka(selectedStaff.houseRentAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Allowance:</span>
                      <span className="font-semibold">{formatTaka(selectedStaff.medicalAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Allowance:</span>
                      <span className="font-semibold">{formatTaka(selectedStaff.otherAllowance)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                      <span>Gross Salary:</span>
                      <span>
                        {formatTaka(
                          selectedStaff.basicSalary +
                            selectedStaff.houseRentAllowance +
                            selectedStaff.medicalAllowance +
                            selectedStaff.otherAllowance
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                    Deductions (কর্তন)
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Provident Fund (PF):</span>
                      <span className="font-semibold">{formatTaka(selectedStaff.providentFundDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax / Other:</span>
                      <span className="font-semibold">৳ 0</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-slate-900">
                      <span>Total Deductions:</span>
                      <span className="text-rose-600">
                        {formatTaka(selectedStaff.providentFundDeduction)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs font-bold text-blue-900 my-3">
                <span>Net Salary Payable (মোট প্রদেয় বেতন):</span>
                <span className="text-base text-blue-700">
                  {formatTaka(
                    selectedStaff.basicSalary +
                      selectedStaff.houseRentAllowance +
                      selectedStaff.medicalAllowance +
                      selectedStaff.otherAllowance -
                      selectedStaff.providentFundDeduction
                  )}
                </span>
              </div>

              {/* Signature lines */}
              <div className="pt-8 grid grid-cols-3 text-center text-[10px] text-slate-500">
                <div>
                  <div className="border-t border-slate-300 pt-1">Employee Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-1">Accountant Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-1">Principal / Head Teacher</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Teacher & Staff ID Card Modal (3 Templates + Pure White Back with Black QR & Mobile) */}
      {showIdCardModal && selectedStaffForIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 print:p-0 print:border-none print:shadow-none print:max-w-none my-6 max-h-[95vh] overflow-y-auto">
            {/* Header controls (hidden on print) */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 print:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {selectedStaffForIdCard.nameBn || selectedStaffForIdCard.nameEn} - শিক্ষক ও কর্মকর্তা ডিজিটাল আইডি কার্ড
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      EMP ID: <span className="font-mono font-bold text-blue-700">{selectedStaffForIdCard.employeeId}</span> • {selectedStaffForIdCard.designation} ({selectedStaffForIdCard.department})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownloadStaffQR}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    title="Download Attendance QR"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'কিউআর ডাউনলোড' : 'Download QR'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
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

            {/* Printable ID Card Container */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-6 print:m-0 print:gap-4">
              {/* SIDE 1: FRONT SIDE (DYNAMIC TEMPLATE COLORED - SMART 100% ENGLISH) */}
              {(idCardViewMode === 'both' || idCardViewMode === 'front') && (() => {
                const styles = getStaffCardStyles(idCardTemplate);
                return (
                  <div className={`w-[320px] h-[500px] bg-white rounded-2xl overflow-hidden relative font-sans text-slate-900 flex flex-col justify-between transition-all ${styles.cardBorder} print:shadow-none print:border-2 print:border-black shrink-0 shadow-xl`}>
                    {/* Top Lanyard Slot Indicator */}
                    <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-1.5 print:hidden shrink-0" />

                    {/* Header */}
                    <div>
                      <div className={`${styles.headerBg} p-2.5 text-center relative`}>
                        <div className="flex items-center justify-center space-x-2.5 mb-1">
                          <div className="w-9 h-9 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                            {schoolProfile.logoUrl ? (
                              <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building className="w-5 h-5 text-blue-700" />
                            )}
                          </div>
                          <div className="text-left leading-tight">
                            <h4 className="font-black text-[11px] tracking-wide text-white uppercase leading-tight">
                              {schoolProfile.nameEn || 'SMART MODEL SCHOOL & COLLEGE'}
                            </h4>
                            <h5 className="font-bold text-[9px] text-blue-100 opacity-90">
                              {schoolProfile.nameBn}
                            </h5>
                          </div>
                        </div>
                        <div className="text-[8px] opacity-85 flex items-center justify-center space-x-2 font-mono text-white/90">
                          <span>EIIN: {schoolProfile.eiin}</span>
                          <span>•</span>
                          <span>SESSION: {schoolProfile.currentSession || '2026'}</span>
                        </div>
                      </div>

                      {/* Sub-badge ribbon */}
                      <div className={`${styles.ribbonBg} py-0.5 text-center font-black text-[9px] uppercase tracking-widest shadow-2xs flex items-center justify-center space-x-1`}>
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>FACULTY & STAFF IDENTITY CARD</span>
                      </div>

                      {/* RFID Tech Sub-bar */}
                      <div className="px-3 pt-1 flex items-center justify-between text-[8px] font-mono text-slate-400">
                        <span className="flex items-center gap-1 font-bold text-blue-600">
                          <Wifi className="w-2.5 h-2.5 rotate-90" />
                          <span>SMART CAMPUS ID</span>
                        </span>
                        <span>VALID: {schoolProfile.currentSession || '2026'}</span>
                      </div>

                      {/* Card Body */}
                      <div className="px-3 pb-2 pt-1 flex flex-col items-center">
                        {/* Staff Photo */}
                        <div className="relative mb-1">
                          <div className={`w-20 h-24 rounded-2xl shadow-md overflow-hidden bg-slate-100 flex items-center justify-center ${styles.photoBorder}`}>
                            {selectedStaffForIdCard.photoUrl ? (
                              <img
                                src={selectedStaffForIdCard.photoUrl}
                                alt={selectedStaffForIdCard.nameEn}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center text-2xl font-black rounded-xl">
                                {selectedStaffForIdCard.nameEn.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-black shadow-xs" title="Verified Personnel">
                            ✓
                          </span>
                        </div>

                        {/* Name & Designation */}
                        <div className="text-center w-full pb-1 mb-1 border-b border-slate-200">
                          <h3 className={`font-black text-xs uppercase tracking-tight leading-tight ${styles.nameColor}`}>
                            {selectedStaffForIdCard.nameEn}
                          </h3>
                          <p className={`text-[10px] font-semibold mt-0.5 text-slate-500`}>
                            {selectedStaffForIdCard.nameBn}
                          </p>
                          <div className={`mt-0.5 inline-block px-2.5 py-0.5 rounded-full font-black text-[9px] border ${styles.badgeBg}`}>
                            🎖️ {selectedStaffForIdCard.designation}
                          </div>
                        </div>

                        {/* Personnel Info Table */}
                        <div className="w-full text-[10.5px] space-y-1 px-1">
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Employee ID:</span>
                            <span className="font-bold font-mono text-blue-900 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                              {selectedStaffForIdCard.employeeId}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Department:</span>
                            <span className="font-semibold text-slate-800">{selectedStaffForIdCard.department}</span>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Blood Group:</span>
                            <span className="inline-flex items-center space-x-1 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[10px]">
                              <Droplets className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                              <span>{selectedStaffForIdCard.bloodGroup || 'B+'}</span>
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Official Mobile:</span>
                            <span className="font-bold font-mono text-slate-800 text-[10px]">{selectedStaffForIdCard.phone}</span>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Joining Date:</span>
                            <span className="font-medium font-mono text-slate-700 text-[10px]">{selectedStaffForIdCard.joiningDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Front Footer with Signatures */}
                    <div>
                      <div className="w-full px-3.5 pb-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[8px] bg-slate-50/50">
                        <div className="text-center">
                          <div className="font-serif italic font-bold text-[9px] text-slate-700 border-b border-slate-300 pb-0.5 w-16">
                            Employee
                          </div>
                          <span className="text-slate-500 block uppercase font-medium">Signature</span>
                        </div>
                        <div className="text-center">
                          <div className="font-serif italic font-bold text-[9px] text-blue-900 border-b border-slate-400 pb-0.5 w-20 truncate">
                            {schoolProfile.principalNameEn || 'Principal'}
                          </div>
                          <span className="text-slate-500 block uppercase font-medium">Principal Sign</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border-t border-slate-200 py-1 text-center text-[7.5px] text-slate-500">
                        Institutional Staff ID • Helpline: {schoolProfile.phone}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SIDE 2: BACK SIDE (100% ENGLISH, PURE WHITE BACKGROUND, SOLID BLACK TEXT, HIGH-CONTRAST BLACK QR & EMERGENCY HOTLINES) */}
              {(idCardViewMode === 'both' || idCardViewMode === 'back') && (
                <div className="w-[320px] h-[500px] bg-white text-black rounded-2xl border-2 border-black shadow-xl overflow-hidden flex flex-col justify-between font-sans print:border-2 print:border-black p-3.5 shrink-0 relative">
                  {/* Top Lanyard Slot Indicator */}
                  <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto my-1 print:hidden shrink-0" />

                  {/* Top Header: Pure Black text on Pure White */}
                  <div className="border-b-2 border-black pb-1.5 text-center shrink-0">
                    <h4 className="font-black text-[11px] uppercase tracking-wider text-black">
                      {schoolProfile.nameEn || 'INSTITUTION IDENTITY'}
                    </h4>
                    <p className="font-bold text-[8.5px] text-black tracking-widest uppercase mt-0.5">
                      FACULTY & STAFF IDENTITY CARD • BACK SIDE
                    </p>
                    <p className="font-mono text-[8px] text-black mt-0.5">
                      EIIN: {schoolProfile.eiin} • SESSION: {schoolProfile.currentSession || '2026'}
                    </p>
                  </div>

                  {/* Center: Large High-Contrast Pitch Black QR Code & Employee ID */}
                  <div className="flex flex-col items-center justify-center my-1 text-center shrink-0">
                    <div className="p-1.5 bg-white rounded-xl border-2 border-black shadow-2xs relative">
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-black" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-black" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-black" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-black" />
                      {staffQrUrl ? (
                        <img
                          src={staffQrUrl}
                          alt="Staff Attendance QR"
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-white border border-black flex items-center justify-center text-xs font-mono font-bold text-black">
                          QR CODE
                        </div>
                      )}
                    </div>
                    <span className="mt-1 font-mono font-black text-[11px] text-black tracking-wider">
                      EMP ID: {selectedStaffForIdCard.employeeId}
                    </span>
                    <span className="text-[8px] font-bold text-black uppercase tracking-wider">
                      Digital Gate Kiosk Attendance QR Code
                    </span>
                  </div>

                  {/* PROMINENT OFFICIAL MOBILE & EMERGENCY HOTLINE BOX (100% English) */}
                  <div className="bg-white border-2 border-black rounded-xl p-2 text-black space-y-1 shrink-0">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-black" />
                        <span>Official Mobile:</span>
                      </span>
                      <span className="font-mono font-black text-[11px] text-black">{selectedStaffForIdCard.phone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-black">
                      <span className="font-medium">Emergency Contact:</span>
                      <span className="font-mono font-bold text-black">{selectedStaffForIdCard.emergencyContact || selectedStaffForIdCard.phone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-medium">Blood Group: <strong>{selectedStaffForIdCard.bloodGroup || 'B+'}</strong></span>
                      <span className="font-medium">National ID (NID): <strong>{selectedStaffForIdCard.nid || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] pt-0.5 border-t border-dashed border-black">
                      <span className="font-medium">Official Email:</span>
                      <span className="font-mono text-black">{schoolProfile.email || selectedStaffForIdCard.email}</span>
                    </div>
                  </div>

                  {/* Institutional Rules & Return Instructions (100% English) */}
                  <div className="space-y-1 text-black text-[7.5px] leading-tight border-t border-black pt-1.5 shrink-0">
                    <p className="font-bold uppercase tracking-wider text-[8px]">Rules & Regulations:</p>
                    <ol className="list-decimal pl-3 space-y-0.5 text-[7px] leading-snug">
                      <li>Carrying this identity card is mandatory within the institutional campus.</li>
                      <li>Scan QR code at the gate kiosk for automatic faculty attendance check-in/out.</li>
                      <li>This card is non-transferable and remains institutional property.</li>
                    </ol>
                    <div className="pt-1 border-t border-dotted border-black flex items-center justify-between text-[7px] font-semibold">
                      <span>If found, return to: {schoolProfile.nameEn}</span>
                      <span>Helpline: {schoolProfile.phone}</span>
                    </div>
                  </div>

                  {/* Dual Signatures */}
                  <div className="pt-1.5 border-t border-black flex items-center justify-between text-black text-[8px] shrink-0">
                    <div className="text-center">
                      <div className="font-serif italic font-bold text-[9px] border-b border-black pb-0.5 w-20">
                        Employee
                      </div>
                      <span className="block font-medium text-[7px] uppercase">Signature</span>
                    </div>
                    <div className="text-center">
                      <div className="font-serif italic font-bold text-[9px] border-b border-black pb-0.5 w-20 truncate">
                        {schoolProfile.principalNameEn || 'Principal'}
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
                <span>শিক্ষক/স্টাফ স্মার্ট আইডি কার্ড প্রস্তুত (সামনের পাশ + সাদা ব্যাকগ্রাউন্ডে কালো কিউআর ও মোবাইলযুক্ত ব্যাক পার্ট)</span>
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

      {/* In-app Staff Delete Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-center transform scale-100 transition-all">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              {language === 'bn' ? 'স্টাফ রেকর্ড মুছে ফেলতে চান?' : 'Delete Staff Record?'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {language === 'bn' ? (
                <>
                  আপনি কি নিশ্চিত যে শিক্ষক/কর্মচারী <strong className="text-slate-900 font-bold">"{staffToDelete.nameBn || staffToDelete.nameEn}"</strong> (পদবি: <span className="font-bold text-slate-800">{staffToDelete.designation}</span>, আইডি: <span className="font-mono text-blue-700 font-bold">{staffToDelete.employeeId}</span>)-এর রেকর্ড মুছে ফেলতে চান?
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete staff member <strong className="text-slate-900 font-bold">"{staffToDelete.nameEn}"</strong> ({staffToDelete.designation}, ID: <span className="font-mono text-blue-700 font-bold">{staffToDelete.employeeId}</span>)?
                </>
              )}
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 mb-5 text-left text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {language === 'bn'
                  ? 'এই স্টাফকে মুছে দিলে লোকাল ডাটাবেজ এবং ক্লাউড ডাটাবেজ থেকে তথ্য রিমুভ হয়ে যাবে।'
                  : 'Deleting will remove this record from both local device and cloud Firestore.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                disabled={isDeletingStaff}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                disabled={isDeletingStaff}
                className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
