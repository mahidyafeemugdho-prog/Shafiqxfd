import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { ClassInfo, Subject, ClassLevel, SchoolHoliday, ShiftType } from '../../types';
import {
  BookOpen,
  Layers,
  Plus,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Trash2,
  X,
  Calendar,
  Sun,
  Palmtree,
  Clock,
  Check,
  AlertCircle,
  CalendarDays,
  Sparkles,
  Info,
} from 'lucide-react';
import { SaturdayOffToggle } from '../common/SaturdayOffToggle';

export const AcademicView: React.FC = () => {
  const { activeRole } = useAuth();
  const { language, toBnNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'holidays'>('classes');

  const [classes, setClasses] = useState<ClassInfo[]>(() => StorageService.getClasses());
  const [subjects, setSubjects] = useState<Subject[]>(() => StorageService.getSubjects());
  const [holidays, setHolidays] = useState<SchoolHoliday[]>(() => StorageService.getHolidays());
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    const list = StorageService.getClasses();
    return list.length > 0 ? list[0].name : 'Class 10';
  });

  // Add / Edit Class Modal States
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [classNameEn, setClassNameEn] = useState<string>('');
  const [classNameBn, setClassNameBn] = useState<string>('');
  const [classSections, setClassSections] = useState<string>('A, B');
  const [classShifts, setClassShifts] = useState<ShiftType[]>(['Morning', 'Day']);
  const [classHasGroups, setClassHasGroups] = useState<boolean>(false);
  const [classOrder, setClassOrder] = useState<number>(1);
  const [classFormError, setClassFormError] = useState<string>('');

  // Add / Edit Subject Modal States
  const [showAddSubModal, setShowAddSubModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subClassName, setSubClassName] = useState<ClassLevel>('Class 10');
  const [subGroup, setSubGroup] = useState<string>('General');
  const [subjectGroupFilter, setSubjectGroupFilter] = useState<string>('all');
  const [subCode, setSubCode] = useState<string>('120');
  const [subNameEn, setSubNameEn] = useState<string>('');
  const [subNameBn, setSubNameBn] = useState<string>('');
  const [subFullMarks, setSubFullMarks] = useState<number>(100);
  const [subPassMarks, setSubPassMarks] = useState<number>(33);
  const [subWritten, setSubWritten] = useState<number>(70);
  const [subMcq, setSubMcq] = useState<number>(30);
  const [subPractical, setSubPractical] = useState<number>(0);

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubClassName(selectedClass as ClassLevel);
    setSubGroup('General');
    setSubCode(String(Math.floor(100 + Math.random() * 900)));
    setSubNameEn('');
    setSubNameBn('');
    setSubFullMarks(100);
    setSubPassMarks(33);
    setSubWritten(70);
    setSubMcq(30);
    setSubPractical(0);
    setShowAddSubModal(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubClassName(sub.className);
    setSubGroup(sub.group || 'General');
    setSubCode(sub.code);
    setSubNameEn(sub.nameEn);
    setSubNameBn(sub.nameBn || '');
    setSubFullMarks(sub.fullMarks);
    setSubPassMarks(sub.passMarks);
    setSubWritten(sub.writtenMarks);
    setSubMcq(sub.mcqMarks ?? 0);
    setSubPractical(sub.practicalMarks ?? 0);
    setShowAddSubModal(true);
  };

  const handleDeleteSubject = (subId: string, name: string) => {
    if (!canEdit) return;
    const confirmMsg = language === 'bn'
      ? `আপনি কি নিশ্চিতভাবে "${name}" বিষয়টি মুছে ফেলতে চান?`
      : `Are you sure you want to delete subject "${name}"?`;
    if (confirm(confirmMsg)) {
      const updated = subjects.filter((s) => s.id !== subId);
      StorageService.saveSubjects(updated);
      setSubjects(updated);
    }
  };

  // School Holiday Modal States (Single-day & Multi-day: 2, 3, 15, 20 days off)
  const [showHolidayModal, setShowHolidayModal] = useState<boolean>(false);
  const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);
  const [holidayTitleEn, setHolidayTitleEn] = useState<string>('');
  const [holidayTitleBn, setHolidayTitleBn] = useState<string>('');
  const [holidayStartDate, setHolidayStartDate] = useState<string>('2026-10-20');
  const [holidayEndDate, setHolidayEndDate] = useState<string>('2026-10-25');
  const [holidayCategory, setHolidayCategory] = useState<'national' | 'religious' | 'vacation' | 'emergency' | 'local'>('vacation');
  const [holidayDescription, setHolidayDescription] = useState<string>('');
  const [holidayFormError, setHolidayFormError] = useState<string>('');

  const canEdit = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'master_admin';

  // Toggle Class Active
  const handleToggleClassActive = (classId: string) => {
    if (!canEdit) return;
    const updated = classes.map((c) => (c.id === classId ? { ...c, isActive: !c.isActive } : c));
    StorageService.saveClasses(updated);
    setClasses(updated);
  };

  // Open Add Class Modal
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameEn('');
    setClassNameBn('');
    setClassSections('A, B');
    setClassShifts(['Morning', 'Day']);
    setClassHasGroups(false);
    setClassOrder(classes.length + 1);
    setClassFormError('');
    setShowClassModal(true);
  };

  // Open Edit Class Modal
  const handleOpenEditClass = (cls: ClassInfo) => {
    setEditingClass(cls);
    setClassNameEn(cls.name);
    setClassNameBn(cls.nameBn || '');
    setClassSections(cls.sections.join(', '));
    setClassShifts(cls.shifts || ['Morning', 'Day']);
    setClassHasGroups(Boolean(cls.hasGroups));
    setClassOrder(cls.order || 1);
    setClassFormError('');
    setShowClassModal(true);
  };

  // Save Class (Add or Edit)
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameEn.trim()) {
      setClassFormError('Please enter class name in English.');
      return;
    }

    const sectionsArray = classSections
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    const safeSections = sectionsArray.length > 0 ? sectionsArray : ['A'];

    if (editingClass) {
      // Update existing class
      const oldName = editingClass.name;
      const updatedClasses = classes.map((c) =>
        c.id === editingClass.id
          ? {
              ...c,
              name: classNameEn.trim(),
              nameBn: classNameBn.trim() || classNameEn.trim(),
              sections: safeSections,
              shifts: classShifts,
              hasGroups: classHasGroups,
              order: classOrder,
            }
          : c
      );
      StorageService.saveClasses(updatedClasses);
      setClasses(updatedClasses);

      // If class was renamed, also update subjects referencing oldName
      if (oldName !== classNameEn.trim()) {
        const updatedSubs = subjects.map((sub) =>
          sub.className === oldName ? { ...sub, className: classNameEn.trim() as ClassLevel } : sub
        );
        StorageService.saveSubjects(updatedSubs);
        setSubjects(updatedSubs);
        if (selectedClass === oldName) {
          setSelectedClass(classNameEn.trim());
        }
      }
    } else {
      // Create new class
      const newClass: ClassInfo = {
        id: `c_${Date.now()}`,
        name: classNameEn.trim(),
        nameBn: classNameBn.trim() || classNameEn.trim(),
        order: classOrder,
        sections: safeSections,
        shifts: classShifts,
        hasGroups: classHasGroups,
        isActive: true,
      };
      const updated = [...classes, newClass].sort((a, b) => a.order - b.order);
      StorageService.saveClasses(updated);
      setClasses(updated);
    }

    setShowClassModal(false);
  };

  // Delete Class
  const handleDeleteClass = (classId: string, classNameToDelete: string) => {
    if (!canEdit) return;
    if (confirm(language === 'bn' ? `আপনি কি নিশ্চিতভাবে "${classNameToDelete}" শ্রেণিটি মুছে ফেলতে চান?` : `Are you sure you want to delete class "${classNameToDelete}"?`)) {
      const updated = classes.filter((c) => c.id !== classId);
      StorageService.saveClasses(updated);
      setClasses(updated);
      if (selectedClass === classNameToDelete && updated.length > 0) {
        setSelectedClass(updated[0].name);
      }
    }
  };

  // Calculate days difference
  const computeHolidayDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  // Quick Action: Declare Tomorrow as Holiday (1-click)
  const handleDeclareTomorrowHoliday = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setEditingHoliday(null);
    setHolidayTitleEn('Special School Off');
    setHolidayTitleBn('আগামীকাল বিশেষ স্কুল ছুটি');
    setHolidayStartDate(tomorrowStr);
    setHolidayEndDate(tomorrowStr);
    setHolidayCategory('emergency');
    setHolidayDescription('School officially closed tomorrow by institutional management.');
    setHolidayFormError('');
    setShowHolidayModal(true);
  };

  // Open Multi-day Holiday modal (e.g. 2, 3, 15, 20 days off)
  const handleOpenAddHoliday = () => {
    const today = new Date().toISOString().split('T')[0];
    const next15Days = new Date();
    next15Days.setDate(next15Days.getDate() + 14);
    const endStr = next15Days.toISOString().split('T')[0];

    setEditingHoliday(null);
    setHolidayTitleEn('');
    setHolidayTitleBn('');
    setHolidayStartDate(today);
    setHolidayEndDate(endStr);
    setHolidayCategory('vacation');
    setHolidayDescription('');
    setHolidayFormError('');
    setShowHolidayModal(true);
  };

  const handleOpenEditHoliday = (hol: SchoolHoliday) => {
    setEditingHoliday(hol);
    setHolidayTitleEn(hol.titleEn);
    setHolidayTitleBn(hol.titleBn);
    setHolidayStartDate(hol.startDate);
    setHolidayEndDate(hol.endDate);
    setHolidayCategory(hol.category);
    setHolidayDescription(hol.description || '');
    setHolidayFormError('');
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayTitleEn.trim() && !holidayTitleBn.trim()) {
      setHolidayFormError('Please enter holiday title.');
      return;
    }
    if (holidayStartDate > holidayEndDate) {
      setHolidayFormError('Start date cannot be after end date.');
      return;
    }

    const totalDays = computeHolidayDays(holidayStartDate, holidayEndDate);

    const titleEn = holidayTitleEn.trim() || holidayTitleBn.trim();
    const titleBn = holidayTitleBn.trim() || holidayTitleEn.trim();

    if (editingHoliday) {
      const updated: SchoolHoliday = {
        ...editingHoliday,
        titleEn,
        titleBn,
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        totalDays,
        category: holidayCategory,
        description: holidayDescription.trim(),
      };
      StorageService.updateHoliday(updated);
      setHolidays(StorageService.getHolidays());
    } else {
      const newHol: SchoolHoliday = {
        id: `hol_${Date.now()}`,
        titleEn,
        titleBn,
        startDate: holidayStartDate,
        endDate: holidayEndDate,
        totalDays,
        category: holidayCategory,
        description: holidayDescription.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      StorageService.addHoliday(newHol);
      setHolidays(StorageService.getHolidays());
    }

    setShowHolidayModal(false);
  };

  const handleDeleteHoliday = (id: string, title: string) => {
    if (!canEdit) return;
    if (confirm(language === 'bn' ? `আপনি কি "${title}" ছুটি তালিকা থেকে মুছে ফেলতে চান?` : `Remove "${title}" from holiday calendar?`)) {
      StorageService.deleteHoliday(id);
      setHolidays(StorageService.getHolidays());
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subNameEn || !subCode) return;

    const assignedGroup = subGroup === 'General' ? undefined : (subGroup as any);

    if (editingSubject) {
      const updated = subjects.map((s) =>
        s.id === editingSubject.id
          ? {
              ...s,
              code: subCode,
              nameEn: subNameEn,
              nameBn: subNameBn || subNameEn,
              className: subClassName,
              group: assignedGroup,
              fullMarks: subFullMarks,
              passMarks: subPassMarks,
              writtenMarks: subWritten,
              mcqMarks: subMcq > 0 ? subMcq : undefined,
              practicalMarks: subPractical > 0 ? subPractical : undefined,
            }
          : s
      );
      StorageService.saveSubjects(updated);
      setSubjects(updated);
      setSelectedClass(subClassName);
      setShowAddSubModal(false);
      setEditingSubject(null);
    } else {
      const newSub: Subject = {
        id: `sub_${Date.now()}`,
        code: subCode,
        nameEn: subNameEn,
        nameBn: subNameBn || subNameEn,
        className: subClassName,
        group: assignedGroup,
        fullMarks: subFullMarks,
        passMarks: subPassMarks,
        writtenMarks: subWritten,
        mcqMarks: subMcq > 0 ? subMcq : undefined,
        practicalMarks: subPractical > 0 ? subPractical : undefined,
      };
      const updated = [...subjects, newSub];
      StorageService.saveSubjects(updated);
      setSubjects(updated);
      setSelectedClass(subClassName);
      setShowAddSubModal(false);
      setSubNameEn('');
      setSubNameBn('');
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (s.className !== selectedClass) return false;
    if (subjectGroupFilter === 'all') return true;
    if (subjectGroupFilter === 'Compulsory') {
      return !s.group || s.group === 'General';
    }
    return s.group === subjectGroupFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'একাডেমিক কাঠামো ও শিক্ষাপঞ্জি' : 'Academic Structure & Curriculum'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'প্লে / নার্সারি থেকে যেকোনো শ্রেণি সম্পাদনা, বিষয়সূচি ও ২-২০ দিনের দীর্ঘ ছুটি ব্যবস্থাপনা'
              : 'Edit class names (Play, Nurani, Class 1-10), manage subjects & multi-day holiday vacations'}
          </p>
        </div>

        {/* Tab switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 bg-slate-100 rounded-xl flex space-x-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'classes' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শ্রেণি ও শাখা' : 'Classes & Sections'}</span>
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'subjects' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'বিষয় তালিকা' : 'Subject Catalog'}</span>
            </button>
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'holidays' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'bn' ? 'ছুটি ও অবকাশ' : 'School Holidays'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                {holidays.length}
              </span>
            </button>
          </div>

          {canEdit && activeTab === 'classes' && (
            <button
              onClick={handleOpenAddClass}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন শ্রেণি যোগ' : 'Add Class'}</span>
            </button>
          )}

          {canEdit && activeTab === 'subjects' && (
            <button
              onClick={handleOpenAddSubject}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'বিষয় যোগ করুন' : 'Add Subject'}</span>
            </button>
          )}

          {canEdit && activeTab === 'holidays' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeclareTomorrowHoliday}
                className="flex items-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                title="1-click: Set tomorrow as official school off"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'আগামীকাল ছুটি ঘোষণা' : 'Tomorrow Off'}</span>
              </button>
              <button
                onClick={handleOpenAddHoliday}
                className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bn' ? 'দীর্ঘ ছুটি ঘোষণা (২-২০ দিন)' : 'Declare Vacation'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: Classes & Sections */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {language === 'bn'
                  ? 'আপনি যেকোনো শ্রেণির নাম পরিবর্তন করতে পারেন (যেমন Nursery কে Play, Nurany বা ইচ্ছামতো নাম দিন) অথবা "নতুন শ্রেণি যোগ" বাটনে ক্লিক করে নতুন শ্রেণি তৈরি করুন।'
                  : 'You can edit and rename any class level (e.g. Play, Nurany, Kindergarten, Class 1-10) or click "Add Class" to introduce custom class levels.'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4 w-14 text-center">Order</th>
                    <th className="py-3 px-4">Class Level (শ্রেণির নাম)</th>
                    <th className="py-3 px-4">Sections (শাখা)</th>
                    <th className="py-3 px-4">Shifts (শিফট)</th>
                    <th className="py-3 px-4">Secondary Groups (বিভাগ)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classes.map((cls, idx) => (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400 text-center font-mono">{cls.order || idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                        <div className="text-[11px] text-blue-700 font-medium">{cls.nameBn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {cls.sections.map((sec) => (
                            <span key={sec} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded font-semibold text-[10px]">
                              {sec}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {cls.shifts.map((sh) => (
                            <span key={sh} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                              {sh}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {cls.hasGroups ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Science, Commerce, Humanities & Vocational
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">General (No Groups)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cls.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cls.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canEdit && (
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEditClass(cls)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center space-x-1 transition-colors"
                              title="Edit Class Name, Sections & Shifts"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>
                            <button
                              onClick={() => handleToggleClassActive(cls.id)}
                              className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                            >
                              {cls.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Subjects Catalog */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Filter by Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-blue-900"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.nameBn ? `(${c.nameBn})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Group / বিভাগ:</span>
              <select
                value={subjectGroupFilter}
                onChange={(e) => setSubjectGroupFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
              >
                <option value="all">{language === 'bn' ? 'সকল বিভাগ (All Groups)' : 'All Groups'}</option>
                <option value="Compulsory">{language === 'bn' ? 'সবার জন্য বাধ্যতামূলক' : 'Compulsory'}</option>
                <option value="Science">{language === 'bn' ? 'বিজ্ঞান (Science)' : 'Science'}</option>
                <option value="Commerce">{language === 'bn' ? 'ব্যবসায় শিক্ষা (Commerce)' : 'Commerce'}</option>
                <option value="Humanities">{language === 'bn' ? 'মানবিক (Humanities)' : 'Humanities'}</option>
                <option value="Vocational">{language === 'bn' ? 'কারিগরি (Vocational)' : 'Vocational'}</option>
              </select>
            </div>

            <span className="text-slate-400">({filteredSubjects.length} subjects configured)</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <th className="py-3 px-4">Subject Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Group / বিভাগ</th>
                    <th className="py-3 px-4 text-center">Full Marks</th>
                    <th className="py-3 px-4 text-center">Pass Marks</th>
                    <th className="py-3 px-4">Breakdown (CQ / MCQ / Prac)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No subjects configured for this class/group yet. Click "Add Subject" to assign one.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{sub.code}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sub.nameEn}</div>
                          <div className="text-[11px] text-slate-500">{sub.nameBn}</div>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const g = sub.group;
                            if (!g || g === 'General') {
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  সবার জন্য (Compulsory)
                                </span>
                              );
                            }
                            if (g === 'Science') {
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                  বিজ্ঞান (Science)
                                </span>
                              );
                            }
                            if (g === 'Commerce') {
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ব্যবসায় শিক্ষা (Commerce)
                                </span>
                              );
                            }
                            if (g === 'Humanities' || g === 'Arts') {
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  মানবিক (Humanities)
                                </span>
                              );
                            }
                            if (g === 'Vocational') {
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  কারিগরি (Vocational)
                                </span>
                              );
                            }
                            return (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {g}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{sub.fullMarks}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">{sub.passMarks}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">CQ: {sub.writtenMarks}</span>
                            {sub.mcqMarks !== undefined && (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">MCQ: {sub.mcqMarks}</span>
                            )}
                            {sub.practicalMarks !== undefined && (
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Prac: {sub.practicalMarks}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canEdit && (
                            <div className="inline-flex items-center space-x-1">
                              <button
                                onClick={() => handleOpenEditSubject(sub)}
                                className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center space-x-1 transition-colors"
                                title={language === 'bn' ? 'বিষয় সম্পাদনা করুন' : 'Edit Subject'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(sub.id, sub.nameEn || sub.nameBn)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={language === 'bn' ? 'বিষয় মুছুন' : 'Delete Subject'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: School Holidays & Vacations (Multi-day: 2, 3, 15, 20 days off) */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          {/* Quick Info & Action Header */}
          <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Palmtree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-amber-950">
                  {language === 'bn' ? 'স্কুল ছুটি ও দীর্ঘ অবকাশ ব্যবস্থাপনা (School Holidays & Recess)' : 'School Holidays & Vacation Recess'}
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  {language === 'bn'
                    ? 'আগামীকালের ছুটি অথবা একসাথে ২, ৩, ১৫, ২০ দিনের ছুটি (যেমন: ঈদুল ফিতর, গ্রীষ্মকালীন ছুটি) ঘোষণা করুন। ছুটির দিনে হাজিরায় অটোমেটিক "স্কুল ছুটি" দেখানো হবে।'
                    : 'Declare single day (tomorrow) or multi-day holidays (e.g. 2, 3, 15, 20 days vacation). Attendance will automatically reflect school closed on holiday dates.'}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleDeclareTomorrowHoliday}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'আগামীকাল ছুটি ঘোষণা' : 'Declare Tomorrow Off'}</span>
                </button>
                <button
                  onClick={handleOpenAddHoliday}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'নতুন ছুটি / অবকাশ যোগ' : 'Add Holiday / Vacation'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 1-Click Saturday Weekend / Open Day Settings Card */}
          <div className="p-4.5 bg-white rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {language === 'bn' ? 'সাপ্তাহিক শনিবার ছুটি / খোলা নির্ধারণ (Saturday Weekend Status)' : 'Saturday Weekend / Working Day Setting'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                    {language === 'bn' ? '১-ক্লিক পরিবর্তন' : '1-Click Toggle'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  {language === 'bn'
                    ? 'সাধারণ স্কুলের জন্য শনিবার সাপ্তাহিক ছুটি (School Weekend OFF)। তবে মাদ্রাসায় শনিবার ছুটি থাকে না বা নিয়মিত ক্লাস হয় — তাই মাদ্রাসার জন্য ১-ক্লিকে শনিবার খোলা রাখা যাবে। পরিবর্তনের সাথে সাথে ক্লাস রুটিন ও দৈনিক হাজিরার ক্যালকুলেশন আপডেট হবে।'
                    : 'General schools have Saturday off, while Madrashas keep Saturday open. Click below to toggle Saturday open/off instantly across Routine and Attendance.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-start md:justify-end">
              <SaturdayOffToggle compact={false} />
            </div>
          </div>

          {/* Holiday Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => {
              const categoryBadge =
                h.category === 'religious'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : h.category === 'national'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : h.category === 'emergency'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200';

              return (
                <div
                  key={h.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${categoryBadge}`}>
                        {h.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs font-mono">
                        {h.totalDays} {language === 'bn' ? 'দিনের ছুটি' : h.totalDays === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm mt-3 leading-snug">
                      {h.titleBn}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{h.titleEn}</p>

                    <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 font-mono">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 font-sans">Start Date:</span>
                        <span className="font-bold">{h.startDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-400 font-sans">End Date:</span>
                        <span className="font-bold">{h.endDate}</span>
                      </div>
                    </div>

                    {h.description && (
                      <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleOpenEditHoliday(h)}
                        className="flex items-center space-x-1 text-slate-600 hover:text-amber-700 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(h.id, h.titleBn || h.titleEn)}
                        className="flex items-center space-x-1 text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal (Play, Nurani, Class 1-10, custom names) */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>
                  {editingClass
                    ? (language === 'bn' ? 'শ্রেণির নাম ও শাখা সম্পাদনা' : 'Edit Class & Sections')
                    : (language === 'bn' ? 'নতুন শ্রেণি তৈরি করুন' : 'Add New Class Level')}
                </span>
              </h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {classFormError && (
              <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {classFormError}
              </div>
            )}

            <form onSubmit={handleSaveClass} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Class Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={classNameEn}
                  onChange={(e) => setClassNameEn(e.target.value)}
                  placeholder="e.g. Play, Nurany, Class 1, Class 2..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  যেমন: Play, Nurany, KG, Class 1, Class 2 বা যেকোনো পছন্দের নাম
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  শ্রেণির নাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={classNameBn}
                  onChange={(e) => setClassNameBn(e.target.value)}
                  placeholder="যেমন: প্লে, নূরানী, ১ম শ্রেণি..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Sections (শাখাসমূহ - কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  value={classSections}
                  onChange={(e) => setClassSections(e.target.value)}
                  placeholder="e.g. A, B, C or Padma, Meghna"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">
                    Display Order (ক্রম)
                  </label>
                  <input
                    type="number"
                    value={classOrder}
                    onChange={(e) => setClassOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">
                    Secondary Groups?
                  </label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="hasGroups"
                      checked={classHasGroups}
                      onChange={(e) => setClassHasGroups(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="hasGroups" className="text-slate-700 font-medium">
                      Science / Commerce / Arts / Vocational (বিজ্ঞান, ব্যবসায়, মানবিক ও ভোকেশনাল)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Declare School Holiday & Vacation Modal (Multi-day: 1, 2, 3, 15, 20 days off) */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Palmtree className="w-5 h-5 text-amber-600" />
                <span>
                  {editingHoliday
                    ? (language === 'bn' ? 'ছুটি বিবরণী সম্পাদনা' : 'Edit School Holiday')
                    : (language === 'bn' ? 'স্কুল ছুটি বা দীর্ঘ অবকাশ ঘোষণা' : 'Declare School Holiday / Vacation')}
                </span>
              </h3>
              <button onClick={() => setShowHolidayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {holidayFormError && (
              <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {holidayFormError}
              </div>
            )}

            <form onSubmit={handleSaveHoliday} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 text-slate-800">
                    ছুটির নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    required
                    value={holidayTitleBn}
                    onChange={(e) => setHolidayTitleBn(e.target.value)}
                    placeholder="যেমন: পবিত্র ঈদুল ফিতর / গ্রীষ্মকালীন ছুটি / ঘূর্ণিঝড় সতর্কতা"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 text-slate-800">
                    Holiday Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={holidayTitleEn}
                    onChange={(e) => setHolidayTitleEn(e.target.value)}
                    placeholder="e.g. Eid-ul-Fitr Vacation, Summer Holidays, Election Off"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Date Range Selection (Multi-day vacation) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <span>ছুটির সময়সীমা (Date Range)</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white font-mono shadow-2xs">
                    মোট: {computeHolidayDays(holidayStartDate, holidayEndDate)} দিনের টানা ছুটি
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">শুরুর তারিখ (Start Date) *</label>
                    <input
                      type="date"
                      required
                      value={holidayStartDate}
                      onChange={(e) => setHolidayStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">শেষ তারিখ (End Date) *</label>
                    <input
                      type="date"
                      required
                      value={holidayEndDate}
                      onChange={(e) => setHolidayEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-amber-800 font-bold mr-1">দ্রুত সময়সীমা:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      t.setDate(t.getDate() + 1);
                      const s = t.toISOString().split('T')[0];
                      setHolidayStartDate(s);
                      setHolidayEndDate(s);
                    }}
                    className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    আগামীকাল (১ দিন)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = new Date().toISOString().split('T')[0];
                      const e = new Date();
                      e.setDate(e.getDate() + 2);
                      setHolidayStartDate(s);
                      setHolidayEndDate(e.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    ৩ দিন ছুটি
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = new Date().toISOString().split('T')[0];
                      const e = new Date();
                      e.setDate(e.getDate() + 14);
                      setHolidayStartDate(s);
                      setHolidayEndDate(e.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    ১৫ দিন ছুটি (ঈদ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = new Date().toISOString().split('T')[0];
                      const e = new Date();
                      e.setDate(e.getDate() + 19);
                      setHolidayStartDate(s);
                      setHolidayEndDate(e.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    ২০ দিন ছুটি (গ্রীষ্মকাল)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">ছুটির ধরন (Category)</label>
                <select
                  value={holidayCategory}
                  onChange={(e) => setHolidayCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="vacation">দীর্ঘ অবকাশ (Summer / Winter Vacation)</option>
                  <option value="religious">ধর্মীয় ছুটি (Eid / Puja / Shab-e-Barat)</option>
                  <option value="national">জাতীয় দিবস (Victory / Independence / Language)</option>
                  <option value="emergency">জরুরি ছুটি / আবহাওয়া / প্রাকৃতিক দুর্যোগ</option>
                  <option value="local">স্থানীয় / প্রাতিষ্ঠানিক সাধারণ ছুটি</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  বিবরণ বা নোটিশ (Notice / Reason)
                </label>
                <textarea
                  rows={2}
                  value={holidayDescription}
                  onChange={(e) => setHolidayDescription(e.target.value)}
                  placeholder="যেমন: সরকারের ঘোষিত সাধারণ ছুটি ও বিদ্যালয় পরিচালনা পরিষদের সিদ্ধান্ত মোতাবেক বন্ধ থাকবে।"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingHoliday ? 'Save Changes' : 'Declare Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject
                  ? (language === 'bn' ? 'বিষয় সম্পাদনা করুন (Edit Subject)' : 'Edit Subject')
                  : (language === 'bn' ? 'নতুন বিষয় যুক্ত করুন (Add New Subject)' : 'Add New Subject')}
              </h3>
              <button onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Class</label>
                  <select
                    value={subClassName}
                    onChange={(e) => setSubClassName(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-blue-900"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Subject Name (English) *</label>
                <input
                  type="text"
                  required
                  value={subNameEn}
                  onChange={(e) => setSubNameEn(e.target.value)}
                  placeholder="e.g. Higher Mathematics"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">বিষয়ের নাম (বাংলায়)</label>
                <input
                  type="text"
                  value={subNameBn}
                  onChange={(e) => setSubNameBn(e.target.value)}
                  placeholder="যেমন: উচ্চতর গণিত"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* Group / Stream Selector (Crucial for Class 9-10 & Secondary streams) */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <label className="block font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{language === 'bn' ? 'বিভাগ / গ্রুপ (Stream / Group) *' : 'Department / Group *'}</span>
                  {['Class 9', 'Class 10'].includes(subClassName) && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      {language === 'bn' ? '৯ম-১০ম শ্রেণির বিভাগ' : 'Secondary Stream'}
                    </span>
                  )}
                </label>
                <select
                  value={subGroup}
                  onChange={(e) => setSubGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="General">
                    {language === 'bn'
                      ? 'সবার জন্য বাধ্যতামূলক (Compulsory / All Streams)'
                      : 'Compulsory (For All Students)'}
                  </option>
                  <option value="Science">
                    {language === 'bn' ? 'বিজ্ঞান বিভাগ (Science)' : 'Science'}
                  </option>
                  <option value="Commerce">
                    {language === 'bn'
                      ? 'ব্যবসায় শিক্ষা (Business Studies / Commerce)'
                      : 'Business Studies / Commerce'}
                  </option>
                  <option value="Humanities">
                    {language === 'bn' ? 'মানবিক বিভাগ (Humanities / Arts)' : 'Humanities / Arts'}
                  </option>
                  <option value="Vocational">
                    {language === 'bn' ? 'কারিগরি শাখা (Vocational)' : 'Vocational'}
                  </option>
                </select>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {language === 'bn'
                    ? '💡 বিভাগ নির্বাচন করলে এই বিষয়টি অ্যাডমিট কার্ড, নম্বর এন্ট্রি ও মার্কশিটে স্বয়ংক্রিয়ভাবে সেই গ্রুপের শিক্ষার্থীর সাথে যুক্ত হবে।'
                    : 'Selecting a group automatically links this subject to matching students on Admit Cards, Marks Entry & Transcripts.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Full Marks</label>
                  <input
                    type="number"
                    value={subFullMarks}
                    onChange={(e) => setSubFullMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={subPassMarks}
                    onChange={(e) => setSubPassMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Written (CQ)</label>
                  <input
                    type="number"
                    value={subWritten}
                    onChange={(e) => setSubWritten(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">MCQ</label>
                  <input
                    type="number"
                    value={subMcq}
                    onChange={(e) => setSubMcq(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Practical</label>
                  <input
                    type="number"
                    value={subPractical}
                    onChange={(e) => setSubPractical(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingSubject
                    ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Update Subject')
                    : (language === 'bn' ? 'বিষয় যুক্ত করুন' : 'Save Subject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
