import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { AttendanceRuleConfig, ClassAttendanceSchedule } from '../../types';
import {
  Clock,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Save,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Building,
  Layers,
} from 'lucide-react';

export const ClassTimingsTab: React.FC<{ onRulesUpdated?: () => void }> = ({ onRulesUpdated }) => {
  const { language, toBnNumber } = useLanguage();
  const [rules, setRules] = useState<AttendanceRuleConfig>(() => StorageService.getAttendanceRules());
  const [savedNotice, setSavedNotice] = useState<string>('');

  const allClasses = [
    'Play',
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

  // Helper to ensure all classes have a schedule object
  const getSchedule = (className: string): ClassAttendanceSchedule => {
    if (rules.classSchedules && rules.classSchedules[className]) {
      return rules.classSchedules[className];
    }
    // Default fallback
    const isPrimary = ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2'].includes(className);
    return {
      className,
      shift: isPrimary ? 'Morning' : 'Day',
      startTime: isPrimary ? '08:00' : '09:00',
      lateThresholdTime: isPrimary ? '08:15' : '09:15',
      dismissalTime: isPrimary ? '11:30' : '14:00',
      enabled: true,
    };
  };

  const handleUpdateSchedule = (
    className: string,
    field: keyof ClassAttendanceSchedule,
    value: any
  ) => {
    const current = getSchedule(className);
    const updated = {
      ...current,
      [field]: value,
    };

    setRules((prev) => ({
      ...prev,
      classSchedules: {
        ...(prev.classSchedules || {}),
        [className]: updated,
      },
    }));
  };

  const handleApplyPreset = (type: 'kindergarten_early' | 'standard_school' | 'shift_based') => {
    const newSchedules: Record<string, ClassAttendanceSchedule> = { ...(rules.classSchedules || {}) };

    allClasses.forEach((cls) => {
      if (type === 'kindergarten_early') {
        if (['Play', 'Nursery', 'KG'].includes(cls)) {
          newSchedules[cls] = {
            className: cls,
            shift: 'Morning',
            startTime: '08:00',
            lateThresholdTime: '08:15',
            dismissalTime: '11:00',
            enabled: true,
          };
        } else if (['Class 1', 'Class 2', 'Class 3'].includes(cls)) {
          newSchedules[cls] = {
            className: cls,
            shift: 'Morning',
            startTime: '08:30',
            lateThresholdTime: '08:45',
            dismissalTime: '12:30',
            enabled: true,
          };
        } else {
          newSchedules[cls] = {
            className: cls,
            shift: 'Day',
            startTime: '09:00',
            lateThresholdTime: '09:15',
            dismissalTime: '14:30',
            enabled: true,
          };
        }
      } else if (type === 'shift_based') {
        const isMorning = ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(cls);
        newSchedules[cls] = {
          className: cls,
          shift: isMorning ? 'Morning' : 'Day',
          startTime: isMorning ? '07:45' : '11:45',
          lateThresholdTime: isMorning ? '08:00' : '12:00',
          dismissalTime: isMorning ? '11:30' : '16:00',
          enabled: true,
        };
      } else {
        // Standard
        newSchedules[cls] = {
          className: cls,
          shift: 'All',
          startTime: '08:30',
          lateThresholdTime: '08:45',
          dismissalTime: '13:30',
          enabled: true,
        };
      }
    });

    const updatedRules: AttendanceRuleConfig = {
      ...rules,
      classSchedules: newSchedules,
    };
    setRules(updatedRules);
    StorageService.saveAttendanceRules(updatedRules);
    setSavedNotice(
      language === 'bn'
        ? 'প্রিসেট সফলভাবে প্রয়োগ ও সংরক্ষণ করা হয়েছে!'
        : 'Timing preset applied and saved successfully!'
    );
    setTimeout(() => setSavedNotice(''), 3000);
    if (onRulesUpdated) onRulesUpdated();
  };

  const handleSave = () => {
    StorageService.saveAttendanceRules(rules);
    setSavedNotice(
      language === 'bn'
        ? 'সকল শ্রেণির সময় ও লেইট কাটঅফ রুলস সফলভাবে সংরক্ষণ করা হয়েছে!'
        : 'Class timings and late cutoff rules saved successfully!'
    );
    setTimeout(() => setSavedNotice(''), 3000);
    if (onRulesUpdated) onRulesUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold text-blue-100">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>শ্রেণিভিত্তিক উপস্থিতি সময় নিয়ন্ত্রণ ও অটো-লেইট অ্যালগরিদম</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              শ্রেণিভিত্তিক শুরু সময়, লেইট কাটঅফ ও ছুটির শিডিউল
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              যেহেতু নার্সারি, কেজি ও মাধ্যমিক শ্রেণির শুরু ও ছুটির সময় ভিন্ন ভিন্ন হয়, তাই এখানে প্রতিটি শ্রেণির জন্য আলাদাভাবে ক্লাসের সময় ও লেইট কাটঅফ নির্ধারণ করতে পারবেন। কিউআর আইডি কার্ড স্ক্যান করার সময় সিস্টেম স্বয়ংক্রিয়ভাবে উক্ত শিক্ষার্থীর শ্রেণির নির্ধারিত কাটঅফ অনুযায়ী <strong>'উপস্থিত' (Present)</strong> নাকি <strong>'দেরিতে আগমন' (Late)</strong> তা নির্ধারণ করবে।
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সংরক্ষণ করুন (Save Rules)</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Preset Action Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-bold">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>১-ক্লিকে শিফট ও সময় প্রিসেট লোড করুন:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleApplyPreset('kindergarten_early')}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-bold transition-colors flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>কেজি ও প্রাইমারি আলাদা শিফট (Play-KG: 8:00, 1-3: 8:30, 4-10: 9:00)</span>
          </button>
          <button
            onClick={() => handleApplyPreset('shift_based')}
            className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg font-bold transition-colors flex items-center space-x-1"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>মর্নিং ও ডে শিফট (মর্নিং: ৭:৪৫, ডে: ১১:৪৫)</span>
          </button>
          <button
            onClick={() => handleApplyPreset('standard_school')}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition-colors"
          >
            <span>সব শ্রেণি স্ট্যান্ডার্ড (৮:৩০ - ৮:৪৫)</span>
          </button>
        </div>
      </div>

      {/* Class Schedules Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              শ্রেণিভিত্তিক বিস্তারিত সময়সূচি তালিকা
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            মোট {toBnNumber(allClasses.length)}টি শ্রেণি
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">শ্রেণির নাম</th>
                <th className="py-3 px-4">শিফট ধরন</th>
                <th className="py-3 px-4">ক্লাস শুরু সময়</th>
                <th className="py-3 px-4 text-amber-700">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>লেইট কাটঅফ শেষ সময়</span>
                  </div>
                </th>
                <th className="py-3 px-4">ছুটির সময়</th>
                <th className="py-3 px-4 text-center">সক্রিয় স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">উৎস নিয়ম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {allClasses.map((cls) => {
                const sched = getSchedule(cls);
                const isLateHighlight = sched.lateThresholdTime > '09:00';

                return (
                  <tr key={cls} className={`hover:bg-blue-50/40 transition-colors ${!sched.enabled ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                        {cls.charAt(0)}
                      </div>
                      <span className="text-sm">{cls}</span>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={sched.shift || 'Morning'}
                        onChange={(e) => handleUpdateSchedule(cls, 'shift', e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Morning">মর্নিং শিফট (Morning)</option>
                        <option value="Day">ডে শিফট (Day)</option>
                        <option value="All">উভয় / সার্বিক (All)</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={sched.startTime || '08:00'}
                        onChange={(e) => handleUpdateSchedule(cls, 'startTime', e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={sched.lateThresholdTime || '08:15'}
                          onChange={(e) => handleUpdateSchedule(cls, 'lateThresholdTime', e.target.value)}
                          className="px-2.5 py-1 border border-amber-300 rounded-lg bg-amber-50/50 text-xs font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-amber-700 font-semibold hidden md:inline">
                          (এর পর স্ক্যান করলে লেইট)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={sched.dismissalTime || '11:30'}
                        onChange={(e) => handleUpdateSchedule(cls, 'dismissalTime', e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleUpdateSchedule(cls, 'enabled', !sched.enabled)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          sched.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {sched.enabled ? '✓ কার্যকর (Active)' : '✗ নিষ্ক্রিয়'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                        {cls}-এর নির্ধারিত নিয়ম
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & save */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              কোনো শ্রেণির নিয়ম নিষ্ক্রিয় থাকলে ডিফল্ট স্কুল রুলস <strong>(শুরু: {rules.lateThresholdTime || '০৮:৩০'})</strong> প্রযোজ্য হবে।
            </span>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>নিয়মাবলি সংরক্ষণ করুন (Save All Schedules)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
