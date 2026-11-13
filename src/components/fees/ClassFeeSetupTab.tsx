import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { CloudSyncService } from '../../services/cloudSync';
import { ClassFeeConfig, ClassLevel } from '../../types';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Award,
  Wallet,
  Plus,
  Trash2,
  X,
  UserPlus,
} from 'lucide-react';

interface ClassFeeSetupTabProps {
  onConfigsUpdated?: (configs: ClassFeeConfig[]) => void;
}

export interface CustomFeeColumn {
  id: string;
  nameEn: string;
  nameBn: string;
  defaultAmount: number;
  category?: 'activity' | 'exam' | 'session' | 'monthly' | 'one_time';
  dueDate?: string; // Last date of fee submission (জমার শেষ তারিখ)
  lateFee?: number; // Late fine amount after due date passes (বিলম্ব ফি)
}

export const ClassFeeSetupTab: React.FC<ClassFeeSetupTabProps> = ({ onConfigsUpdated }) => {
  const { language, formatTaka, toBnNumber } = useLanguage();
  const [configs, setConfigs] = useState<ClassFeeConfig[]>(() => {
    const list = StorageService.getClassFeeConfigs();
    return list.map((c) => ({
      ...c,
      admissionFee: c.admissionFee ?? (c.className === 'Nursery' ? 1000 : c.className === 'KG' ? 1200 : c.className === 'Class 9' || c.className === 'Class 10' ? 2500 : 1500),
      customFees: c.customFees ?? { computer_fee: 300 },
    }));
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('custom');

  // Custom Fee Items / Dynamic Columns State
  const [customColumns, setCustomColumns] = useState<CustomFeeColumn[]>(() => {
    try {
      const saved = localStorage.getItem('school_erp_custom_class_fee_columns');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'computer_fee', nameEn: 'Computer Lab Fee', nameBn: 'কম্পিউটার ল্যাব ফি', defaultAmount: 300 },
    ];
  });

  // Hidden/Removed Standard Columns State (Allow deleting exam fee or other fee items)
  const [hiddenStandardColumns, setHiddenStandardColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('school_erp_hidden_class_fee_columns');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showManageColumnsModal, setShowManageColumnsModal] = useState<boolean>(false);

  // Modal to Add Custom Fee Item
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);
  const [newFeeNameEn, setNewFeeNameEn] = useState<string>('');
  const [newFeeNameBn, setNewFeeNameBn] = useState<string>('');
  const [newFeeDefaultAmount, setNewFeeDefaultAmount] = useState<number>(500);
  const [newFeeCategory, setNewFeeCategory] = useState<'activity' | 'exam' | 'session' | 'monthly' | 'one_time'>('activity');
  const [newFeeDueDate, setNewFeeDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newFeeLateFee, setNewFeeLateFee] = useState<number>(0);

  const [columnToDelete, setColumnToDelete] = useState<{
    type: 'standard' | 'custom';
    id: string;
    name: string;
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');

  const standardFeeColumnDefs = [
    { id: 'admissionFee', nameEn: 'Admission Fee', nameBn: 'ভর্তি ফি', color: 'teal' },
    { id: 'tuitionFee', nameEn: 'Monthly Tuition', nameBn: 'মাসিক বেতন', color: 'blue' },
    { id: 'examFee1stModelTest', nameEn: '1st Model Test', nameBn: '১ম মডেল টেস্ট', color: 'amber' },
    { id: 'examFee1stSemester', nameEn: '1st Semester', nameBn: '১ম সেমিস্টার', color: 'purple' },
    { id: 'examFee2ndModelTest', nameEn: '2nd Model Test', nameBn: '২য় মডেল টেস্ট', color: 'amber' },
    { id: 'examFee2ndSemester', nameEn: '2nd Semester', nameBn: '২য় সেমিস্টার', color: 'indigo' },
    { id: 'examFee3rdModelTest', nameEn: '3rd Model Test', nameBn: '৩য় মডেল টেস্ট', color: 'amber' },
    { id: 'examFee3rdSemester', nameEn: '3rd Semester', nameBn: '৩য় সেমিস্টার', color: 'emerald' },
    { id: 'sessionFee', nameEn: 'Session Charge', nameBn: 'সেশন চার্জ', color: 'slate' },
  ];

  const requestDeleteStandardColumn = (colId: string, colName: string) => {
    setColumnToDelete({
      type: 'standard',
      id: colId,
      name: colName,
    });
  };

  const requestDeleteCustomColumn = (colId: string, colName: string) => {
    setColumnToDelete({
      type: 'custom',
      id: colId,
      name: colName,
    });
  };

  const confirmDeleteColumn = () => {
    if (!columnToDelete) return;
    const { type, id, name } = columnToDelete;

    if (type === 'standard') {
      const updatedHidden = [...hiddenStandardColumns, id];
      setHiddenStandardColumns(updatedHidden);
      try {
        localStorage.setItem('school_erp_hidden_class_fee_columns', JSON.stringify(updatedHidden));
      } catch {}

      // Also set the value to 0 across classes so it won't charge in future calculations
      const updatedConfigs = configs.map((c) => ({
        ...c,
        [id]: 0,
      }));
      setConfigs(updatedConfigs);
      StorageService.saveClassFeeConfigs(updatedConfigs);
      if (onConfigsUpdated) onConfigsUpdated(updatedConfigs);
      CloudSyncService.pushLocalToCloud(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_profile_updated'));
      }

      setActionNotice(language === 'bn' ? `"${name}" কলামটি শ্রেণি কাঠামো থেকে মুছে ফেলা হয়েছে!` : `Column "${name}" removed successfully!`);
    } else {
      // Custom dynamic column deletion
      const updatedCols = customColumns.filter((c) => c.id !== id);
      setCustomColumns(updatedCols);
      try {
        localStorage.setItem('school_erp_custom_class_fee_columns', JSON.stringify(updatedCols));
      } catch {}

      const updatedConfigs = configs.map((c) => {
        const current = { ...(c.customFees || {}) };
        delete current[id];
        return { ...c, customFees: current };
      });
      setConfigs(updatedConfigs);
      StorageService.saveClassFeeConfigs(updatedConfigs);
      if (onConfigsUpdated) onConfigsUpdated(updatedConfigs);
      CloudSyncService.pushLocalToCloud(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_profile_updated'));
      }

      setActionNotice(language === 'bn' ? `"${name}" ফি আইটেমটি সফলভাবে মুছে ফেলা হয়েছে!` : `Fee item "${name}" deleted successfully!`);
    }

    setColumnToDelete(null);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleRestoreStandardColumn = (colId: string) => {
    const updated = hiddenStandardColumns.filter((id) => id !== colId);
    setHiddenStandardColumns(updated);
    try {
      localStorage.setItem('school_erp_hidden_class_fee_columns', JSON.stringify(updated));
    } catch {}
    setActionNotice(language === 'bn' ? 'কলাম সফলভাবে পুনরুদ্ধার করা হয়েছে!' : 'Column restored successfully!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleFieldChange = (
    className: ClassLevel,
    field: keyof Omit<ClassFeeConfig, 'className' | 'classNameBn' | 'customFees'>,
    value: number
  ) => {
    const val = Math.max(0, value);
    const updated = configs.map((c) => {
      if (c.className !== className) return c;
      const copy: any = { ...c, [field]: val };
      // Keep legacy fields in sync
      if (field === 'examFee1stModelTest') {
        copy.examFee1stTest = val;
        copy.examFeeModelTest = val;
      } else if (field === 'examFee1stSemester') {
        copy.examFeeHalfYearly = val;
      } else if (field === 'examFee3rdSemester') {
        copy.examFeeAnnual = val;
      }
      return copy;
    });
    setConfigs(updated);
  };

  const handleCustomFieldChange = (className: ClassLevel, feeKey: string, value: number) => {
    const val = Math.max(0, value);
    const updated = configs.map((c) => {
      if (c.className !== className) return c;
      const currentCustom = { ...(c.customFees || {}) };
      currentCustom[feeKey] = val;
      return { ...c, customFees: currentCustom };
    });
    setConfigs(updated);
  };

  const handleAddCustomFeeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeNameEn.trim() && !newFeeNameBn.trim()) return;

    const key = `fee_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newCol: CustomFeeColumn = {
      id: key,
      nameEn: newFeeNameEn.trim() || newFeeNameBn.trim(),
      nameBn: newFeeNameBn.trim() || newFeeNameEn.trim(),
      defaultAmount: Math.max(0, newFeeDefaultAmount),
      category: newFeeCategory,
      dueDate: newFeeDueDate,
      lateFee: Math.max(0, newFeeLateFee),
    };

    const updatedCols = [...customColumns, newCol];
    setCustomColumns(updatedCols);
    try {
      localStorage.setItem('school_erp_custom_class_fee_columns', JSON.stringify(updatedCols));
    } catch {}

    // Populate into each class's customFees
    const updatedConfigs = configs.map((c) => ({
      ...c,
      customFees: {
        ...(c.customFees || {}),
        [key]: newCol.defaultAmount,
      },
    }));
    setConfigs(updatedConfigs);
    StorageService.saveClassFeeConfigs(updatedConfigs);
    if (onConfigsUpdated) onConfigsUpdated(updatedConfigs);

    setNewFeeNameEn('');
    setNewFeeNameBn('');
    setNewFeeDefaultAmount(500);
    setNewFeeLateFee(0);
    setShowAddColumnModal(false);
    setActionNotice(language === 'bn' ? `"${newCol.nameBn}" ফি আইটেম (জমার শেষ তারিখ: ${newCol.dueDate}) সফলভাবে যোগ করা হয়েছে!` : `Fee item "${newCol.nameEn}" (Due Date: ${newCol.dueDate}) added successfully!`);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveClassFeeConfigs(configs);
    try {
      localStorage.setItem('school_erp_custom_class_fee_columns', JSON.stringify(customColumns));
    } catch {}
    if (onConfigsUpdated) onConfigsUpdated(configs);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleApplyQuickScale = (baseNursery: number, incrementPerClass: number) => {
    const updated = configs.map((c, idx) => {
      const tuition = baseNursery + idx * incrementPerClass;
      return {
        ...c,
        tuitionFee: tuition,
      };
    });
    setConfigs(updated);
    setActivePreset(`${baseNursery}_${incrementPerClass}`);
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-teal-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'bn'
                ? 'শ্রেণিভিত্তিক ফি কাঠামো ও অটো-রেট নির্ধারণ (ভর্তি ফি, সেমিস্টার ও মডেল টেস্ট)'
                : 'Class-Wise Fee Rate Architecture (Admission, Semesters & Model Tests)'}
            </h3>
            <p className="text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'প্রতিটি শ্রেণির জন্য আলাদা আলাদা নতুন ভর্তি ফি, মাসিক বেতন, মডেল টেস্ট ও সেমিস্টার পরীক্ষার ফি এবং বাৎসরিক সেশন ফি নির্ধারণ করুন। আপনি চাইলে যেকোনো নতুন কাস্টম ফি আইটেমও যুক্ত করতে পারবেন।'
                : 'Configure individual admission fee, monthly tuition, model tests, semester exams, and session charges. You can also dynamically add custom fee items.'}
            </p>
          </div>
        </div>
        {saveSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'সফলভাবে সংরক্ষিত!' : 'Fee Rates Saved!'}</span>
          </div>
        )}
        {actionNotice && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* Quick Pre-fill / Scale Tool & Add Custom Fee Item Button */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-800">
            {language === 'bn' ? 'দ্রুত বেতন স্কেল প্রিসেট:' : 'Quick Tuition Fee Scale Presets:'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const specific = configs.map((c) => {
                if (c.className === 'Nursery') return { ...c, tuitionFee: 400, admissionFee: 1000, examFee1stModelTest: 200, examFee1stSemester: 250, examFee2ndModelTest: 200, examFee2ndSemester: 250, examFee3rdModelTest: 200, examFee3rdSemester: 300, sessionFee: 1500 };
                if (c.className === 'KG') return { ...c, tuitionFee: 450, admissionFee: 1200, examFee1stModelTest: 200, examFee1stSemester: 250, examFee2ndModelTest: 200, examFee2ndSemester: 250, examFee3rdModelTest: 200, examFee3rdSemester: 300, sessionFee: 1800 };
                if (c.className === 'Class 1') return { ...c, tuitionFee: 500, admissionFee: 1500, examFee1stModelTest: 250, examFee1stSemester: 300, examFee2ndModelTest: 250, examFee2ndSemester: 300, examFee3rdModelTest: 250, examFee3rdSemester: 350, sessionFee: 2000 };
                if (c.className === 'Class 2') return { ...c, tuitionFee: 550, admissionFee: 1500, examFee1stModelTest: 250, examFee1stSemester: 300, examFee2ndModelTest: 250, examFee2ndSemester: 300, examFee3rdModelTest: 250, examFee3rdSemester: 350, sessionFee: 2200 };
                if (c.className === 'Class 3') return { ...c, tuitionFee: 600, admissionFee: 1500, examFee1stModelTest: 250, examFee1stSemester: 350, examFee2ndModelTest: 250, examFee2ndSemester: 350, examFee3rdModelTest: 250, examFee3rdSemester: 400, sessionFee: 2500 };
                if (c.className === 'Class 4') return { ...c, tuitionFee: 650, admissionFee: 1800, examFee1stModelTest: 300, examFee1stSemester: 400, examFee2ndModelTest: 300, examFee2ndSemester: 400, examFee3rdModelTest: 300, examFee3rdSemester: 450, sessionFee: 2800 };
                if (c.className === 'Class 5') return { ...c, tuitionFee: 700, admissionFee: 2000, examFee1stModelTest: 350, examFee1stSemester: 450, examFee2ndModelTest: 350, examFee2ndSemester: 450, examFee3rdModelTest: 350, examFee3rdSemester: 500, sessionFee: 3000 };
                if (c.className === 'Class 6') return { ...c, tuitionFee: 800, admissionFee: 2200, examFee1stModelTest: 400, examFee1stSemester: 500, examFee2ndModelTest: 400, examFee2ndSemester: 500, examFee3rdModelTest: 400, examFee3rdSemester: 600, sessionFee: 3500 };
                if (c.className === 'Class 7') return { ...c, tuitionFee: 900, admissionFee: 2200, examFee1stModelTest: 450, examFee1stSemester: 550, examFee2ndModelTest: 450, examFee2ndSemester: 550, examFee3rdModelTest: 450, examFee3rdSemester: 650, sessionFee: 3500 };
                if (c.className === 'Class 8') return { ...c, tuitionFee: 1000, admissionFee: 2500, examFee1stModelTest: 500, examFee1stSemester: 600, examFee2ndModelTest: 500, examFee2ndSemester: 600, examFee3rdModelTest: 500, examFee3rdSemester: 700, sessionFee: 4000 };
                if (c.className === 'Class 9') return { ...c, tuitionFee: 1100, admissionFee: 2800, examFee1stModelTest: 600, examFee1stSemester: 700, examFee2ndModelTest: 600, examFee2ndSemester: 700, examFee3rdModelTest: 600, examFee3rdSemester: 800, sessionFee: 4500 };
                if (c.className === 'Class 10') return { ...c, tuitionFee: 1200, admissionFee: 3000, examFee1stModelTest: 700, examFee1stSemester: 800, examFee2ndModelTest: 700, examFee2ndSemester: 800, examFee3rdModelTest: 700, examFee3rdSemester: 900, sessionFee: 5000 };
                return c;
              });
              setConfigs(specific);
            }}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 rounded-xl font-bold transition-colors"
          >
            {language === 'bn' ? '★ স্ট্যান্ডার্ড স্কেল (Nursery ৪০০৳ - Class 10 ১২০০৳)' : '★ Standard Scale (Nursery 400৳ - Class 10 1200৳)'}
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickScale(500, 100)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
          >
            {language === 'bn' ? '৫০০৳ থেকে ১০০৳ ধাপে' : '500৳ Base (+100৳ step)'}
          </button>
          <button
            type="button"
            onClick={() => handleApplyQuickScale(600, 150)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
          >
            {language === 'bn' ? '৬০০৳ থেকে ১৫০৳ ধাপে' : '600৳ Base (+150৳ step)'}
          </button>
        </div>
      </div>

      {/* Main Class-wise Rates Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {language === 'bn' ? 'শ্রেণিভিত্তিক রেট তালিকা (Nursery - Class 10)' : 'Class Fee Matrix (Nursery to Class 10)'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {language === 'bn'
                ? 'নতুন ভর্তি ফি, মাসিক বেতন, পরীক্ষা ফি, সেশন চার্জ এবং কাস্টম ফি নির্ধারণ করে সংরক্ষণ করুন।'
                : 'Configure admission, tuition, exams, session charges, and custom fees per class level.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManageColumnsModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              title="কলাম মুছুন বা পুনরুদ্ধার করুন"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>{language === 'bn' ? 'কলাম পরিচালনা ও পুনরুদ্ধার' : 'Manage / Restore Columns'}</span>
              {hiddenStandardColumns.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                  {hiddenStandardColumns.length} মুছে ফেলা
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAddColumnModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'bn' ? '+ নতুন ফি আইটেম যুক্ত করুন' : '+ Add Custom Fee Item'}</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'bn' ? 'ফি রেট সংরক্ষণ করুন' : 'Save Fee Rates'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-3 w-36">Class Level (শ্রেণি)</th>
                
                {/* 1. Admission Fee */}
                {!hiddenStandardColumns.includes('admissionFee') && (
                  <th className="py-3 px-2 text-center text-teal-900 bg-teal-50/70 border-x border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <UserPlus className="w-3.5 h-3.5 text-teal-700" />
                      <span>Admission Fee (ভর্তি ফি)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('admissionFee', 'ভর্তি ফি (Admission Fee)');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete Admission Fee column"
                        aria-label="Delete Admission Fee column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 2. Monthly Tuition */}
                {!hiddenStandardColumns.includes('tuitionFee') && (
                  <th className="py-3 px-2 text-center text-blue-900 bg-blue-50/70 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Monthly Tuition (মাসিক বেতন)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('tuitionFee', 'মাসিক বেতন (Monthly Tuition)');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete Monthly Tuition column"
                        aria-label="Delete Monthly Tuition column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 3. 1st Model Test */}
                {!hiddenStandardColumns.includes('examFee1stModelTest') && (
                  <th className="py-3 px-2 text-center text-amber-900 bg-amber-50/70 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>1st Model Test (১ম মডেল টেস্ট)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee1stModelTest', '১ম মডেল টেস্ট পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 1st Model Test Exam Fee"
                        aria-label="Delete 1st Model Test Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 4. 1st Semester Exam */}
                {!hiddenStandardColumns.includes('examFee1stSemester') && (
                  <th className="py-3 px-2 text-center text-purple-900 bg-purple-50/70 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>1st Semester (১ম সেমিস্টার)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee1stSemester', '১ম সেমিস্টার পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 1st Semester Exam Fee"
                        aria-label="Delete 1st Semester Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 5. 2nd Model Test */}
                {!hiddenStandardColumns.includes('examFee2ndModelTest') && (
                  <th className="py-3 px-2 text-center text-amber-900 bg-amber-50/50 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>2nd Model Test (২য় মডেল টেস্ট)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee2ndModelTest', '২য় মডেল টেস্ট পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 2nd Model Test Exam Fee"
                        aria-label="Delete 2nd Model Test Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 6. 2nd Semester Exam */}
                {!hiddenStandardColumns.includes('examFee2ndSemester') && (
                  <th className="py-3 px-2 text-center text-indigo-900 bg-indigo-50/60 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>2nd Semester (২য় সেমিস্টার)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee2ndSemester', '২য় সেমিস্টার পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 2nd Semester Exam Fee"
                        aria-label="Delete 2nd Semester Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 7. 3rd Model Test */}
                {!hiddenStandardColumns.includes('examFee3rdModelTest') && (
                  <th className="py-3 px-2 text-center text-amber-900 bg-amber-50/40 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>3rd Model Test (৩য় মডেল টেস্ট)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee3rdModelTest', '৩য় মডেল টেস্ট পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 3rd Model Test Exam Fee"
                        aria-label="Delete 3rd Model Test Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 8. 3rd Semester Exam */}
                {!hiddenStandardColumns.includes('examFee3rdSemester') && (
                  <th className="py-3 px-2 text-center text-emerald-900 bg-emerald-50/60 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>3rd Semester (৩য় সেমিস্টার)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('examFee3rdSemester', '৩য় সেমিস্টার / বার্ষিক পরীক্ষা ফি');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete 3rd Semester Exam Fee"
                        aria-label="Delete 3rd Semester Exam Fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 9. Session Charge */}
                {!hiddenStandardColumns.includes('sessionFee') && (
                  <th className="py-3 px-2 text-center text-slate-800 bg-slate-100 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Session Charge (সেশন চার্জ)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteStandardColumn('sessionFee', 'সেশন চার্জ (Session Charge)');
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete Session Charge column"
                        aria-label="Delete Session Charge column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                )}

                {/* 10. Dynamic Custom Fee Columns */}
                {customColumns.map((col) => (
                  <th key={col.id} className="py-2.5 px-2 text-center text-violet-900 bg-violet-50/70 border-r border-slate-200">
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="font-bold">{col.nameBn || col.nameEn}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteCustomColumn(col.id, col.nameBn || col.nameEn);
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md ml-1 inline-flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-2xs"
                        title="Delete this custom fee item"
                        aria-label="Delete this custom fee item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {col.dueDate && (
                      <div className="text-[9px] font-bold text-violet-800 bg-violet-100/90 border border-violet-200 px-1.5 py-0.5 rounded mt-0.5 inline-flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5 text-violet-600" />
                        <span>শেষ তারিখ: {col.dueDate}</span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configs.map((config) => (
                <tr key={config.className} className="hover:bg-slate-50/70 transition-colors">
                  {/* Class Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-extrabold text-slate-900 text-xs">{config.className}</div>
                    <div className="text-[10px] text-blue-700 font-semibold">{config.classNameBn}</div>
                  </td>

                  {/* Admission Fee */}
                  {!hiddenStandardColumns.includes('admissionFee') && (
                    <td className="py-2 px-2 text-center bg-teal-50/20 border-x border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          required
                          value={config.admissionFee ?? 1500}
                          onChange={(e) => handleFieldChange(config.className, 'admissionFee', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-teal-300 rounded-lg text-xs font-black text-teal-900 bg-white text-right focus:ring-2 focus:ring-teal-500 shadow-2xs"
                        />
                      </div>
                    </td>
                  )}

                  {/* Monthly Tuition Fee */}
                  {!hiddenStandardColumns.includes('tuitionFee') && (
                    <td className="py-2 px-2 text-center bg-blue-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          required
                          value={config.tuitionFee}
                          onChange={(e) => handleFieldChange(config.className, 'tuitionFee', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-blue-300 rounded-lg text-xs font-black text-blue-900 bg-white text-right focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        />
                      </div>
                    </td>
                  )}

                  {/* 1st Model Test Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee1stModelTest') && (
                    <td className="py-2 px-2 text-center bg-amber-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee1stModelTest ?? config.examFee1stTest ?? 250}
                          onChange={(e) => handleFieldChange(config.className, 'examFee1stModelTest', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-amber-300 rounded-lg text-xs font-black text-amber-900 bg-white text-right focus:ring-2 focus:ring-amber-500 shadow-2xs"
                        />
                      </div>
                    </td>
                  )}

                  {/* 1st Semester Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee1stSemester') && (
                    <td className="py-2 px-2 text-center bg-purple-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee1stSemester ?? config.examFeeHalfYearly ?? 350}
                          onChange={(e) => handleFieldChange(config.className, 'examFee1stSemester', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-purple-300 rounded-lg text-xs font-black text-purple-900 bg-white text-right focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* 2nd Model Test Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee2ndModelTest') && (
                    <td className="py-2 px-2 text-center bg-amber-50/10 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee2ndModelTest ?? config.examFeeModelTest ?? 250}
                          onChange={(e) => handleFieldChange(config.className, 'examFee2ndModelTest', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white text-right focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* 2nd Semester Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee2ndSemester') && (
                    <td className="py-2 px-2 text-center bg-indigo-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee2ndSemester ?? config.examFeeHalfYearly ?? 350}
                          onChange={(e) => handleFieldChange(config.className, 'examFee2ndSemester', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 bg-white text-right focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* 3rd Model Test Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee3rdModelTest') && (
                    <td className="py-2 px-2 text-center bg-amber-50/10 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee3rdModelTest ?? config.examFeeModelTest ?? 250}
                          onChange={(e) => handleFieldChange(config.className, 'examFee3rdModelTest', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white text-right focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* 3rd Semester Exam Fee */}
                  {!hiddenStandardColumns.includes('examFee3rdSemester') && (
                    <td className="py-2 px-2 text-center bg-emerald-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.examFee3rdSemester ?? config.examFeeAnnual ?? 400}
                          onChange={(e) => handleFieldChange(config.className, 'examFee3rdSemester', Number(e.target.value))}
                          className="w-18 px-1.5 py-1 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 bg-white text-right focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* Session Fee */}
                  {!hiddenStandardColumns.includes('sessionFee') && (
                    <td className="py-2 px-2 text-center bg-slate-50 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.sessionFee}
                          onChange={(e) => handleFieldChange(config.className, 'sessionFee', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white text-right focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                  )}

                  {/* Custom Fee Columns for this Class */}
                  {customColumns.map((col) => (
                    <td key={col.id} className="py-2 px-2 text-center bg-violet-50/20 border-r border-slate-100">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-slate-400 text-[11px]">৳</span>
                        <input
                          type="number"
                          min={0}
                          value={config.customFees?.[col.id] ?? col.defaultAmount}
                          onChange={(e) => handleCustomFieldChange(config.className, col.id, Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-violet-200 rounded-lg text-xs font-bold text-violet-900 bg-white text-right focus:ring-2 focus:ring-violet-500 shadow-2xs"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with save button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {language === 'bn'
                ? 'ফি কাউন্টারে যেকোনো শ্রেণির শিক্ষার্থী পছন্দ করার সাথে সাথেই ভর্তি ফি, মাসিক বেতন ও কাস্টম রেটগুলো স্বয়ংক্রিয়ভাবে ইনভয়েসে যুক্ত হবে।'
                : 'Rates auto-bind dynamically whenever any student is selected in the fee collection desk.'}
            </span>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{language === 'bn' ? 'ফি রেট আপডেট সংরক্ষণ করুন' : 'Save & Persist All Rates'}</span>
          </button>
        </div>
      </form>

      {/* Modal: Add Custom Fee Item / Column */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <h3 className="font-bold text-sm">
                  {language === 'bn' ? 'নতুন ফি আইটেম / কলাম যোগ করুন' : 'Add New Fee Item Column'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="p-1 text-indigo-100 hover:text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomFeeItem} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ফি আইটেমের নাম (বাংলায়) *' : 'Fee Item Name (Bangla) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: কম্পিউটার ল্যাব ফি / স্কাউট ফি / লাইব্রেরি ফি"
                  value={newFeeNameBn}
                  onChange={(e) => setNewFeeNameBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ফি আইটেমের নাম (ইংরেজিতে) *' : 'Fee Item Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Lab Fee / Scout Fee / Library Fee"
                  value={newFeeNameEn}
                  onChange={(e) => setNewFeeNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ডিফল্ট ফি এর পরিমাণ (৳) *' : 'Default Amount (৳) *'}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newFeeDefaultAmount}
                  onChange={(e) => setNewFeeDefaultAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'bn'
                    ? 'এটি যোগ করার পর টেবিল থেকে প্রতিটি শ্রেণির জন্য আলাদাভাবে পরিমাণ পরিবর্তন করতে পারবেন।'
                    : 'After adding, you can fine-tune the amount for each class in the table.'}
                </p>
              </div>

              {/* Fee Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'ফি এর ধরন / ক্যাটাগরি *' : 'Fee Category *'}
                </label>
                <select
                  value={newFeeCategory}
                  onChange={(e) => setNewFeeCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                >
                  <option value="activity">বাৎসরিক / এককালীন / কার্যক্রম ফি (Activity / Lab / Sports Fee)</option>
                  <option value="exam">পরীক্ষার ফি (Exam Fee)</option>
                  <option value="session">সেশন ও ভর্তি ফি (Session / Admission Fee)</option>
                  <option value="monthly">মাসিক ফি (Monthly Fee)</option>
                  <option value="one_time">এককালীন বিবিধ ফি (One-time Fee)</option>
                </select>
              </div>

              {/* Fee Due Date / Last Date of Payment (User explicit requirement) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <label className="block font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'bn' ? 'ফি জমার শেষ তারিখ (Last Date of Payment) *' : 'Fee Due Date / Last Date *'}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">বাধ্যতামূলক</span>
                </label>
                <input
                  type="date"
                  required
                  value={newFeeDueDate}
                  onChange={(e) => setNewFeeDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono font-bold text-slate-800"
                />
                <p className="text-[10px] text-amber-800 leading-tight">
                  {language === 'bn'
                    ? '💡 এই শেষ তারিখ অতিক্রান্ত হলে শিক্ষার্থীদের পোর্টালে ফিটি স্বয়ংক্রিয়ভাবে বকেয়া (Overdue) হিসেবে লাল সতর্কবার্তাসহ প্রদর্শিত হবে।'
                    : '💡 After this due date passes, the fee will automatically be flagged as Overdue in student portals.'}
                </p>
              </div>

              {/* Optional Late Fine */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{language === 'bn' ? 'বিলম্ব ফি / জরিমানা (৳ - ঐচ্ছিক)' : 'Late Fee / Fine (৳ - Optional)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">শেষ তারিখ পার হলে কার্যকর</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={newFeeLateFee || ''}
                  onChange={(e) => setNewFeeLateFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কলাম যুক্ত করুন' : 'Add Column'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage & Restore Fee Columns */}
      {showManageColumnsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {language === 'bn' ? 'ফি কলাম পরিচালনা ও মুছে ফেলা আইটেম পুনরুদ্ধার' : 'Manage & Restore Fee Columns'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageColumnsModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">
                  {language === 'bn' ? 'স্ট্যান্ডার্ড ফি ও পরীক্ষা কলামসমূহ:' : 'Standard Fee & Exam Columns:'}
                </h4>
                <div className="space-y-2">
                  {standardFeeColumnDefs.map((col) => {
                    const isHidden = hiddenStandardColumns.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isHidden
                            ? 'bg-rose-50/50 border-rose-200 text-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isHidden ? 'bg-rose-400' : 'bg-emerald-500'
                            }`}
                          />
                          <div>
                            <span className="font-bold block text-xs">
                              {col.nameBn} ({col.nameEn})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isHidden
                                ? language === 'bn'
                                  ? 'মুছে ফেলা হয়েছে (লুকানো)'
                                  : 'Removed from table'
                                : language === 'bn'
                                ? 'সক্রিয় ও প্রদর্শিত'
                                : 'Active & displayed'}
                            </span>
                          </div>
                        </div>

                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreStandardColumn(col.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{language === 'bn' ? 'পুনরুদ্ধার করুন' : 'Restore'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestDeleteStandardColumn(col.id, col.nameBn)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {customColumns.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs mb-2">
                    {language === 'bn' ? 'কাস্টম তৈরি করা ফি আইটেমসমূহ:' : 'Custom Fee Items:'}
                  </h4>
                  <div className="space-y-2">
                    {customColumns.map((col) => (
                      <div
                        key={col.id}
                        className="p-2.5 rounded-xl border border-violet-200 bg-violet-50/40 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-violet-950 block text-xs">
                            {col.nameBn} ({col.nameEn})
                          </span>
                          <span className="text-[10px] text-violet-700">ডিফল্ট: ৳ {col.defaultAmount}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => requestDeleteCustomColumn(col.id, col.nameBn || col.nameEn)}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setHiddenStandardColumns([]);
                    try {
                      localStorage.removeItem('school_erp_hidden_class_fee_columns');
                    } catch {}
                    setActionNotice(language === 'bn' ? 'সব স্ট্যান্ডার্ড কলাম পুনরায় দৃশ্যমান করা হয়েছে!' : 'All standard columns restored!');
                    setTimeout(() => setActionNotice(''), 3000);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {language === 'bn' ? 'সব স্ট্যান্ডার্ড কলাম রিসেট করুন' : 'Reset all standard columns'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageColumnsModal(false)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                >
                  {language === 'bn' ? 'সম্পন্ন' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive Delete Column Confirmation (Works seamlessly inside sandboxed iframes) */}
      {columnToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-200" />
                <h3 className="font-bold text-sm">
                  {language === 'bn' ? 'ফি কলাম মুছে ফেলতে চান?' : 'Delete Fee Column?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setColumnToDelete(null)}
                className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                <p className="font-bold text-xs mb-1">
                  {language === 'bn' ? 'আইটেম:' : 'Item:'} {columnToDelete.name}
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {columnToDelete.type === 'standard'
                    ? language === 'bn'
                      ? `আপনি কি নিশ্চিত যে "${columnToDelete.name}" কলামটি টেবিল ও ফি কাঠামো থেকে মুছে ফেলতে চান? টেবিলে এটি প্রদর্শিত হবে না এবং ফিতে যোগ হবে না। পরবর্তীতে 'কলাম পরিচালনা ও পুনরুদ্ধার' বোতাম থেকে যেকোনো সময় ফিরিয়ে আনতে পারবেন।`
                      : `Are you sure you want to remove "${columnToDelete.name}" from the class fee structure? You can restore it later from Manage Columns.`
                    : language === 'bn'
                    ? `আপনি কি নিশ্চিত যে "${columnToDelete.name}" কাস্টম ফি আইটেমটি স্থায়ীভাবে শ্রেণি কাঠামো থেকে মুছে ফেলতে চান? এটি প্রতিটি শ্রেণি থেকে অপসারিত হবে।`
                    : `Are you sure you want to permanently delete custom fee item "${columnToDelete.name}" from all classes?`}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setColumnToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteColumn}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

