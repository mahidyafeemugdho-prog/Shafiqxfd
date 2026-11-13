import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { ScheduledFee, ClassLevel } from '../../types';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Award,
  Bus,
  Sparkles,
  Tag,
  Building,
  HelpCircle,
  Check,
} from 'lucide-react';

export const ScheduledFeesTab: React.FC = () => {
  const { language, formatTaka, toBnNumber, formatDate } = useLanguage();
  const [scheduledFees, setScheduledFees] = useState<ScheduledFee[]>(() =>
    StorageService.getScheduledFees()
  );
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<ScheduledFee | null>(null);

  // Form states
  const [titleEn, setTitleEn] = useState<string>('');
  const [titleBn, setTitleBn] = useState<string>('');
  const [category, setCategory] = useState<ScheduledFee['category']>('Exam Fee');
  const [amount, setAmount] = useState<number>(500);
  const [dueDate, setDueDate] = useState<string>('2026-03-25');
  const [session, setSession] = useState<string>('2026');
  const [month, setMonth] = useState<string>('March 2026');
  const [description, setDescription] = useState<string>('');
  const [isCompulsory, setIsCompulsory] = useState<boolean>(true);
  const [applicableClassesMode, setApplicableClassesMode] = useState<'all' | 'custom'>('all');
  const [selectedClasses, setSelectedClasses] = useState<ClassLevel[]>([
    'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  ]);

  const todayStr = '2026-10-20';

  const ALL_CLASSES: ClassLevel[] = [
    'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  ];

  const handleOpenAdd = () => {
    setEditingFee(null);
    setTitleEn('');
    setTitleBn('');
    setCategory('Exam Fee');
    setAmount(500);
    setDueDate('2026-03-25');
    setSession('2026');
    setMonth('March 2026');
    setDescription('');
    setIsCompulsory(true);
    setApplicableClassesMode('all');
    setSelectedClasses(ALL_CLASSES);
    setShowAddModal(true);
  };

  const handleOpenEdit = (fee: ScheduledFee) => {
    setEditingFee(fee);
    setTitleEn(fee.titleEn);
    setTitleBn(fee.titleBn);
    setCategory(fee.category);
    setAmount(fee.amount);
    setDueDate(fee.dueDate);
    setSession(fee.session);
    setMonth(fee.month || '');
    setDescription(fee.description || '');
    setIsCompulsory(fee.isCompulsory);
    if (fee.applicableClasses === 'all') {
      setApplicableClassesMode('all');
      setSelectedClasses(ALL_CLASSES);
    } else {
      setApplicableClassesMode('custom');
      setSelectedClasses(fee.applicableClasses);
    }
    setShowAddModal(true);
  };

  const handleToggleClass = (cls: ClassLevel) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() && !titleBn.trim()) return;

    const newFee: ScheduledFee = {
      id: editingFee ? editingFee.id : `sch_${Date.now()}`,
      titleEn: titleEn.trim() || titleBn.trim(),
      titleBn: titleBn.trim() || titleEn.trim(),
      category,
      amount,
      applicableClasses: applicableClassesMode === 'all' ? 'all' : selectedClasses,
      dueDate,
      session,
      month: month.trim() || undefined,
      description: description.trim(),
      isCompulsory,
      status: 'active',
    };

    if (editingFee) {
      StorageService.updateScheduledFee(newFee);
    } else {
      StorageService.addScheduledFee(newFee);
    }

    setScheduledFees(StorageService.getScheduledFees());
    setShowAddModal(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(language === 'bn' ? `"${title}" ফি শিডিউল ডিলিট করতে চান?` : `Delete scheduled fee "${title}"?`)) {
      StorageService.deleteScheduledFee(id);
      setScheduledFees(StorageService.getScheduledFees());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'bn'
                ? 'ফি শিডিউল ও জমার শেষ তারিখ (Due Dates & Auto Dues)'
                : 'Fee Schedules & Payment Deadlines (Last Date Tracking)'}
            </h3>
            <p className="text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'মডেল টেস্ট পরীক্ষা ফি, শিক্ষা সফর ফি, সেশন চার্জ, বাৎসরিক খেলাধুলা বা যেকোনো ফি জমার শেষ তারিখসহ নির্ধারণ করুন। জমার শেষ তারিখ পার হয়ে গেলে অথবা সংশ্লিষ্ট শিক্ষার্থী ফি জমা দিতে আসলে তার নামের পাশে এই বকেয়াগুলো স্বয়ংক্রিয়ভাবে দেখাবে।'
                : 'Define payment deadlines for Model Tests, Study Tours, Session Fees, Sports Fees, etc. Once the last date arrives, unpaid students automatically show these dues in the collection counter.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ নতুন ফি শিডিউল' : '+ New Scheduled Fee'}</span>
        </button>
      </div>

      {/* Grid of Scheduled Fees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduledFees.map((fee) => {
          const isOverdue = todayStr > fee.dueDate;
          return (
            <div
              key={fee.id}
              className={`p-5 bg-white rounded-2xl border transition-all flex flex-col justify-between ${
                isOverdue ? 'border-rose-300 shadow-xs' : 'border-slate-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {fee.category}
                  </span>
                  {isOverdue ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{language === 'bn' ? 'মেয়াদ শেষ (বকেয়া)' : 'Overdue'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {language === 'bn' ? 'চলতি' : 'Active'}
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-base mt-2.5 leading-snug">
                  {fee.titleBn}
                </h4>
                <p className="text-xs text-slate-500 font-medium">{fee.titleEn}</p>

                <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">
                      {language === 'bn' ? 'ফি পরিমাণ:' : 'Amount:'}
                    </span>
                    <strong className="text-base font-extrabold text-blue-900">
                      {formatTaka(fee.amount)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">
                      {language === 'bn' ? 'জমার শেষ তারিখ:' : 'Last Date:'}
                    </span>
                    <strong className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatDate(fee.dueDate)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">
                      {language === 'bn' ? 'প্রযোজ্য শ্রেণি:' : 'Classes:'}
                    </span>
                    <span className="font-bold text-slate-700">
                      {fee.applicableClasses === 'all'
                        ? (language === 'bn' ? 'সকল শ্রেণি (Nursery-10)' : 'All Classes')
                        : `${fee.applicableClasses.length} Classes`}
                    </span>
                  </div>
                </div>

                {fee.description && (
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                    {fee.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenEdit(fee)}
                  className="flex items-center space-x-1 text-slate-600 hover:text-blue-700 font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => handleDelete(fee.id, fee.titleBn || fee.titleEn)}
                  className="flex items-center space-x-1 text-rose-500 hover:text-rose-700 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  {editingFee
                    ? (language === 'bn' ? 'ফি শিডিউল এডিট করুন' : 'Edit Fee Schedule')
                    : (language === 'bn' ? 'নতুন ফি শিডিউল নির্ধারণ' : 'Define New Fee Schedule')}
                </span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'ফি এর নাম (বাংলা) *' : 'Fee Title (Bengali) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ১ম মডেল টেস্ট পরীক্ষার ফি, শিক্ষা সফর ফি..."
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'ফি এর নাম (English) *' : 'Fee Title (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Model Test Exam Fee, Annual Study Tour..."
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'ফি ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="Exam Fee">Exam Fee (পরীক্ষা ফি)</option>
                    <option value="Session Fee">Session Fee (সেশন চার্জ)</option>
                    <option value="Study Tour">Study Tour (শিক্ষা সফর ফি)</option>
                    <option value="Sports Fee">Sports & Cultural (ক্রীড়া ফি)</option>
                    <option value="Transport Fee">Transport Fee (পরিবহন)</option>
                    <option value="Other">Other Custom Fee (অন্যান্য)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    {language === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Fee Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-blue-900 text-sm"
                  />
                </div>
              </div>

              {/* Due Date (Last Date) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs">
                    {language === 'bn' ? 'জমার শেষ তারিখ (Last Date) *' : 'Payment Deadline (Last Date) *'}
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold">
                    {todayStr > dueDate ? 'মেয়াদোত্তীর্ণ বকেয়া হবে' : 'স্বাভাবিক সময়'}
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-amber-800/80">
                  {language === 'bn'
                    ? 'এই তারিখের পরে কোনো শিক্ষার্থী ফি পরিশোধ না করলে কাউন্টারে তার বকেয়া তালিকায় এটি লাল রঙে চিহ্নিত হবে।'
                    : 'If unpaid past this date, the fee is flagged as overdue under the student’s profile.'}
                </p>
              </div>

              {/* Applicable Classes */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'প্রযোজ্য শ্রেণি' : 'Applicable Classes'}
                </label>
                <div className="flex items-center space-x-3 mb-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="appClassMode"
                      checked={applicableClassesMode === 'all'}
                      onChange={() => setApplicableClassesMode('all')}
                    />
                    <span>{language === 'bn' ? 'সকল শ্রেণি (Nursery - 10)' : 'All Classes'}</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="appClassMode"
                      checked={applicableClassesMode === 'custom'}
                      onChange={() => setApplicableClassesMode('custom')}
                    />
                    <span>{language === 'bn' ? 'নির্দিষ্ট শ্রেণি নির্বাচন' : 'Custom Select'}</span>
                  </label>
                </div>

                {applicableClassesMode === 'custom' && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                    {ALL_CLASSES.map((cls) => {
                      const isSel = selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => handleToggleClass(cls)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            isSel
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSel && <Check className="w-3 h-3 inline mr-1" />}
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'বিবরণ / নোটিস' : 'Description / Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ফি সংক্রান্ত প্রয়োজনীয় নির্দেশাবলী..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingFee ? 'Save Changes' : 'Create Fee Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
