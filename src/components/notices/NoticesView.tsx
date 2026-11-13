import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Notice } from '../../types';
import {
  Bell,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  Tag,
  Printer,
  X,
  Share2,
  Edit2,
  Trash2,
} from 'lucide-react';

export const NoticesView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { language } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>(() => StorageService.getNotices());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<any>('General');
  const [targetAudience, setTargetAudience] = useState<any>('All');
  const [isImportant, setIsImportant] = useState<boolean>(false);

  const canPost =
    activeRole === 'super_admin' ||
    activeRole === 'admin' ||
    activeRole === 'teacher' ||
    activeRole === 'master_admin';

  const handleOpenAdd = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setTargetAudience('All');
    setIsImportant(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setCategory(notice.category);
    setTargetAudience(notice.targetAudience);
    setIsImportant(!!notice.isImportant);
    setShowAddModal(true);
  };

  const handleDeleteNotice = (id: string) => {
    const confirmMsg =
      language === 'bn'
        ? 'আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this notice?';
    if (window.confirm(confirmMsg)) {
      StorageService.deleteNotice(id);
      setNotices(StorageService.getNotices());
    }
  };

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    if (editingNotice) {
      const updated: Notice = {
        ...editingNotice,
        title,
        content,
        category,
        targetAudience,
        isImportant,
      };
      StorageService.updateNotice(updated);
    } else {
      const newNotice: Notice = {
        id: `not_${Date.now()}`,
        title,
        content,
        date: new Date().toISOString().split('T')[0],
        category,
        targetAudience,
        author: currentUser.name,
        isImportant,
      };
      StorageService.addNotice(newNotice);
    }

    setNotices(StorageService.getNotices());
    setShowAddModal(false);
    setEditingNotice(null);
    setTitle('');
    setContent('');
  };

  const filteredNotices = notices.filter((n) => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'বিদ্যালয়ের নোটিশ বোর্ড' : 'School Notice Board & Bulletins'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'প্রাতিষ্ঠানিক ঘোষণা, ছুটির নোটিশ, পরীক্ষার সময়সূচি ও জরুরি বার্তা'
              : 'Institutional notices, academic schedules, exam dates, and official decrees'}
          </p>
        </div>
        {canPost && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন নোটিশ জারি করুন' : 'Publish Notice'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notices by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="sm:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="all">All Categories</option>
            <option value="General">General (সাধারণ)</option>
            <option value="Academic">Academic (একাডেমিক)</option>
            <option value="Exam">Exam Schedule (পরীক্ষা)</option>
            <option value="Holiday">Holiday (ছুটি)</option>
            <option value="Emergency">Emergency (জরুরি)</option>
          </select>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className={`p-5 bg-white rounded-xl border transition-all ${
              notice.isImportant ? 'border-amber-300 bg-amber-50/20 shadow-xs' : 'border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    notice.category === 'Exam'
                      ? 'bg-rose-100 text-rose-800'
                      : notice.category === 'Holiday'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {notice.category}
                </span>
                {notice.isImportant && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Urgent / Important</span>
                  </span>
                )}
                <span className="text-[11px] text-slate-500">
                  Target: <strong className="text-slate-700">{notice.targetAudience}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{notice.date}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mt-3">{notice.title}</h3>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-100">
              {notice.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Published by: <strong className="text-slate-800">{notice.author}</strong></span>
              <div className="flex items-center space-x-2">
                {canPost && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(notice)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={language === 'bn' ? 'নোটিশ এডিট করুন' : 'Edit Notice'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {(activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'master_admin') && (
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={language === 'bn' ? 'নোটিশ মুছে ফেলুন' : 'Delete Notice'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedNotice(notice);
                    window.print();
                  }}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Notice</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingNotice
                  ? language === 'bn'
                    ? 'নোটিশ সংশোধন (Edit Notice)'
                    : 'Edit Notice'
                  : language === 'bn'
                  ? 'নতুন নোটিশ জারি করুন (Post Notice)'
                  : 'Post New Notice'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handlePostNotice} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule of Annual Sports Day 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam Schedule</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="All">All School (সবার জন্য)</option>
                    <option value="Teachers">Teachers & Staff Only</option>
                    <option value="Guardians">Guardians & Parents</option>
                    <option value="Class">Class Specific</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Notice Content / Body *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write notice details in Bengali or English..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg leading-relaxed"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="urgentNotice"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="urgentNotice" className="font-semibold text-slate-700">
                  Mark as Urgent / Important Banner
                </label>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {editingNotice
                    ? language === 'bn'
                      ? 'পরিবর্তন সংরক্ষণ করুন'
                      : 'Save Changes'
                    : language === 'bn'
                    ? 'নোটিশ জারি করুন'
                    : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
