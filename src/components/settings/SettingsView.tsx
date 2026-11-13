import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { SchoolProfile, SuperAdminCredentials } from '../../types';
import {
  Settings as SettingsIcon,
  Building2,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Server,
  Image as ImageIcon,
  Camera,
  Trash2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  QrCode,
} from 'lucide-react';

import { useSchool } from '../../context/SchoolContext';
import { AIService } from '../../services/aiService';
import { getDomainTenantId, CloudSyncService } from '../../services/cloudSync';
import { safeGetLocalStorage, safeSetLocalStorage, compressImageToPassportSize } from '../../utils/storageHelper';

export const SettingsView: React.FC = () => {
  const { isFirebaseConnected, syncStatus, syncNow } = useAuth();
  const { language } = useLanguage();
  const { schoolProfile, updateSchoolProfile } = useSchool();
  const [profile, setProfile] = useState<SchoolProfile>(schoolProfile);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string>('');

  // Super Admin Credentials state
  const [adminCreds, setAdminCreds] = useState<SuperAdminCredentials>(() =>
    StorageService.getSuperAdminCredentials()
  );
  const [adminUsername, setAdminUsername] = useState<string>(adminCreds.username || 'superadmin');
  const [currentAdminPass, setCurrentAdminPass] = useState<string>('');
  const [newAdminPass, setNewAdminPass] = useState<string>('');
  const [confirmAdminPass, setConfirmAdminPass] = useState<string>('');
  const [showAdminCurrentPass, setShowAdminCurrentPass] = useState<boolean>(false);
  const [showAdminNewPass, setShowAdminNewPass] = useState<boolean>(false);
  const [showStoredPass, setShowStoredPass] = useState<boolean>(false);
  const [adminCredsError, setAdminCredsError] = useState<string>('');
  const [adminCredsSuccess, setAdminCredsSuccess] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<{ status: string; aiEnabled: boolean; model: string; message: string } | null>(null);

  // Keep local form in sync if schoolProfile changes externally
  React.useEffect(() => {
    setProfile(schoolProfile);
    AIService.checkAIStatus().then((s) => setAiStatus(s));
  }, [schoolProfile]);

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredsError('');
    setAdminCredsSuccess('');

    const cleanUsername = adminUsername.trim();
    if (!cleanUsername) {
      setAdminCredsError(language === 'bn' ? 'ইউজারনেম খালি রাখা যাবে না।' : 'Username cannot be empty.');
      return;
    }

    if (newAdminPass || confirmAdminPass) {
      if (currentAdminPass.trim() !== adminCreds.password.trim()) {
        setAdminCredsError(
          language === 'bn'
            ? 'বর্তমান পাসওয়ার্ড সঠিক নয়! অনুগ্রহ করে সঠিক পাসওয়ার্ড প্রদান করুন।'
            : 'Current password does not match.'
        );
        return;
      }
      if (newAdminPass.length < 4) {
        setAdminCredsError(
          language === 'bn'
            ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
            : 'New password must be at least 4 characters.'
        );
        return;
      }
      if (newAdminPass !== confirmAdminPass) {
        setAdminCredsError(
          language === 'bn'
            ? 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।'
            : 'New password and confirm password do not match.'
        );
        return;
      }
    }

    const updated: SuperAdminCredentials = {
      ...adminCreds,
      username: cleanUsername,
      password: newAdminPass ? newAdminPass.trim() : adminCreds.password,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveSuperAdminCredentials(updated);
    setAdminCreds(updated);
    setAdminCredsSuccess(
      language === 'bn'
        ? 'সুপার অ্যাডমিন লগইন ক্রেডেনশিয়াল সফলভাবে সংরক্ষিত হয়েছে!'
        : 'Super Admin credentials saved successfully!'
    );
    setCurrentAdminPass('');
    setNewAdminPass('');
    setConfirmAdminPass('');
    setTimeout(() => setAdminCredsSuccess(''), 4000);
  };

  const [updateStudentsSession, setUpdateStudentsSession] = useState<boolean>(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(profile);
    if (updateStudentsSession && profile.currentSession) {
      StorageService.updateAllStudentsSession(profile.currentSession);
    }
    setSaveSuccess(
      language === 'bn'
        ? `বিদ্যালয়ের তথ্য ও শিক্ষাবর্ষ (${profile.currentSession}) সফলভাবে সংরক্ষিত ও আপডেট হয়েছে`
        : `School settings & academic session (${profile.currentSession}) updated across system.`
    );
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 200, 200, 0.8);
      setProfile((prev) => ({ ...prev, logoUrl: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 800, 450, 0.75);
      setProfile((prev) => ({ ...prev, heroImageUrl: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, heroImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 800, 450, 0.75);
      setProfile((prev) => ({ ...prev, aboutImageUrl: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, aboutImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBackup = () => {
    const dataStr = StorageService.exportBackupData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amarschool_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackupData(content);
      if (success) {
        setImportNotice('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportNotice('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'bn' ? 'বিদ্যালয় সেটিংস ও ক্লাউড ডেটাবেজ' : 'School Settings & Cloud Database'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'bn'
            ? 'প্রতিষ্ঠান পরিচিতি, ইআইআইএন নম্বর, ফায়ারস্টোর ক্লাউড সিঙ্ক এবং ব্যাকআপ ব্যবস্থাপনা'
            : 'Institutional profile, EIIN credentials, Firestore cloud sync, and JSON backup/restore'}
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {importNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Cloud & Backup Management Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>{language === 'bn' ? 'ফায়ারবেস ক্লাউড ডেটাবেজ ও ডোমেন আইসোলেশন' : 'Firebase Cloud Database & Domain Multi-Tenancy'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'প্রতিটি নেটলিফাই ডোমেন সম্পূর্ণ আলাদা ডেটাবেজ পায়। একই ডোমেনের সকল ব্যবহারকারী লাইভ আপডেট দেখতে পান।'
                : 'Each Netlify or custom domain has its own isolated cloud database. All users on the same domain see live updates in real time.'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                await syncNow();
                setSaveSuccess(language === 'bn' ? 'ক্লাউড ডেটাবেজের সাথে সফলভাবে লাইভ সিঙ্ক সম্পন্ন হয়েছে!' : 'Synced successfully with Firestore Cloud Database!');
                setTimeout(() => setSaveSuccess(''), 3000);
              }}
              disabled={syncStatus === 'syncing'}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncStatus === 'syncing' ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (language === 'bn' ? 'এখনই ক্লাউড সিঙ্ক করুন' : 'Sync to Firestore Now')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="text-blue-600 block text-[10px] uppercase font-bold">Active Domain / ডোমেন</span>
            <div className="font-bold text-slate-900 mt-1 truncate" title={typeof window !== 'undefined' ? window.location.hostname : 'localhost'}>
              {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
            </div>
            <p className="text-[10px] text-blue-700 font-mono mt-0.5">Origin-Isolated</p>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] uppercase font-bold">Cloud Document ID</span>
            <div className="font-mono font-bold text-slate-900 mt-1 text-[11px] truncate" title={getDomainTenantId()}>
              {getDomainTenantId()}
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {language === 'bn' ? '✓ স্বাধীন ক্লাউড স্টোর' : '✓ Isolated Cloud Store'}
            </p>
          </div>
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
            <span className="text-purple-700 block text-[10px] uppercase font-bold">Live Real-time Sync</span>
            <div className="flex items-center space-x-1.5 mt-1 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>onSnapshot Active</span>
            </div>
            <p className="text-[10px] text-purple-700 mt-0.5">
              {language === 'bn' ? 'সকল ডিভাইসে সাথে সাথে আপডেট' : 'Instant updates on all devices'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">JSON Data Backup</span>
            <div className="flex items-center space-x-2 mt-1.5">
              <button
                onClick={handleExportBackup}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 shadow-2xs"
              >
                Download
              </button>
              <label className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer shadow-2xs">
                Restore
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Engine & Multimodal Features Setup Card */}
      <div className="p-6 bg-white rounded-2xl border border-indigo-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-indigo-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                {language === 'bn'
                  ? 'এআই ইঞ্জিন ও স্মার্ট ফিচার কনফিগারেশন (AI Engine & Multimodal Setup)'
                  : 'AI Engine & Smart System Configuration'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'হস্তলিখিত হোমওয়ার্ক মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণের জন্য Gemini 3.8 Flash এআই মডেল সংযুক্ত'
                : 'Server-side Gemini 3.8 Flash multimodal evaluation for handwritten homework & student performance analysis'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                aiStatus?.aiEnabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${aiStatus?.aiEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{aiStatus?.aiEnabled ? 'AI Engine Ready' : 'AI Key Setup Guide'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Multimodal AI Model</span>
            <div className="font-black text-indigo-900 text-sm mt-1">gemini-3.8-flash</div>
            <p className="text-[10px] text-slate-500 mt-0.5">হস্তলিখিত খাতা ও গাণিতিক নির্ভুলতা যাচাই</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Smart Gate Attendance</span>
            <div className="font-black text-emerald-900 text-sm mt-1">Live QR Code Scanner</div>
            <p className="text-[10px] text-slate-500 mt-0.5">ডুপ্লিকেট স্ক্যান রোধ ও ফটো ভেরিফিকেশন</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Performance Analytics</span>
            <div className="font-black text-purple-900 text-sm mt-1">Holistic Data Radar</div>
            <p className="text-[10px] text-slate-500 mt-0.5">দুর্বল বিষয় ও ব্যক্তিগত পড়ার গাইড</p>
          </div>
        </div>
      </div>

      {/* Super Admin Security & Credentials Card */}
      <div className="p-6 bg-white rounded-xl border border-purple-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-purple-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>
                {language === 'bn'
                  ? 'সুপার অ্যাডমিন লগইন ক্রেডেনশিয়াল ও সিকিউরিটি'
                  : 'Super Admin Login Credentials & Security'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'bn'
                ? 'সুপার অ্যাডমিনের ইউজারনেম এবং পাসওয়ার্ড পরিবর্তন ও দেখার ব্যবস্থা'
                : 'View or modify your Super Admin username and password'}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            {language === 'bn' ? 'বর্তমান সক্রিয় প্রোফাইল' : 'Active Profile'}
          </span>
        </div>

        {/* Current Active Credentials Summary */}
        <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/80 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-500 block">
                {language === 'bn' ? 'ইউজারনেম (লগইন আইডি)' : 'Super Admin Username'}
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 select-all">
                {adminCreds.username}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-500 block">
                {language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-bold text-sm text-slate-900 select-all">
                  {showStoredPass ? adminCreds.password : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowStoredPass(!showStoredPass)}
                  className="text-purple-600 hover:text-purple-800 p-0.5"
                  title="Toggle show password"
                >
                  {showStoredPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-500 block">
                {language === 'bn' ? 'অফিসিয়াল ইমেইল' : 'Email Address'}
              </span>
              <span className="text-xs font-medium text-slate-800 truncate block">
                {adminCreds.email}
              </span>
            </div>
          </div>
        </div>

        {adminCredsError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{adminCredsError}</span>
          </div>
        )}

        {adminCredsSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminCredsSuccess}</span>
          </div>
        )}

        {/* Change Credentials Form */}
        <form onSubmit={handleSaveAdminCreds} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'নতুন ইউজারনেম *' : 'New Username *'}
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'বর্তমান পাসওয়ার্ড (যাচাই)*' : 'Current Password *'}
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showAdminCurrentPass ? 'text' : 'password'}
                  value={currentAdminPass}
                  onChange={(e) => setCurrentAdminPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminCurrentPass(!showAdminCurrentPass)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showAdminCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showAdminNewPass ? 'text' : 'password'}
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder={language === 'bn' ? 'পরিবর্তন না চাইলে খালি রাখুন' : 'Leave empty to keep current'}
                  className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showAdminNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'কনফার্ম পাসওয়ার্ড' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmAdminPass}
                onChange={(e) => setConfirmAdminPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-lg shadow-xs transition-colors"
            >
              {language === 'bn' ? 'সুপার অ্যাডমিন ক্রেডেনশিয়াল সংরক্ষণ করুন' : 'Save Super Admin Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* School Profile Form */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Institutional Profile & Official Header Details</span>
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Institute Logo Upload Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Institute Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Building2 className="w-7 h-7 mx-auto text-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  {language === 'bn' ? 'বিদ্যালয়ের অফিসিয়াল লোগো (Institute Logo)' : 'Official Institute Logo'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'bn'
                    ? 'হেডার, লগইন স্ক্রিন, মার্কশিট, ফি রসিদ এবং স্টাফ আইডি কার্ডে এই লোগোটি প্রদর্শিত হবে (PNG, JPG, SVG max 2MB)'
                    : 'Displayed across header, hero login, marksheets, receipts, and staff ID cards (PNG, JPG, max 2MB)'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <label className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'লোগো পরিবর্তন করুন' : 'Upload New Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {profile.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="flex items-center space-x-1 px-2.5 py-2 bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                  title="Remove Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                School Name (English) *
              </label>
              <input
                type="text"
                required
                value={profile.nameEn}
                onChange={(e) => setProfile({ ...profile, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                বিদ্যালয়ের নাম (বাংলায়) *
              </label>
              <input
                type="text"
                required
                value={profile.nameBn}
                onChange={(e) => setProfile({ ...profile, nameBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">EIIN Number *</label>
              <input
                type="text"
                required
                value={profile.eiin}
                onChange={(e) => setProfile({ ...profile, eiin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">School Code</label>
              <input
                type="text"
                value={profile.schoolCode}
                onChange={(e) => setProfile({ ...profile, schoolCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Head Teacher / Principal Name</label>
              <input
                type="text"
                value={profile.principalNameEn}
                onChange={(e) => setProfile({ ...profile, principalNameEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">প্রধান শিক্ষকের নাম (বাংলায়)</label>
              <input
                type="text"
                value={profile.principalNameBn}
                onChange={(e) => setProfile({ ...profile, principalNameBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Phone Numbers</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">School Address (English)</label>
              <input
                type="text"
                value={profile.addressEn}
                onChange={(e) => setProfile({ ...profile, addressEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">বিদ্যালয়ের ঠিকানা (বাংলায়)</label>
              <input
                type="text"
                value={profile.addressBn}
                onChange={(e) => setProfile({ ...profile, addressBn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            {/* Dynamic Academic Session Configuration */}
            <div className="sm:col-span-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-bold text-blue-950 text-xs">
                    {language === 'bn' ? 'বর্তমান প্রাতিষ্ঠানিক শিক্ষাবর্ষ (Current Academic Session) *' : 'Current Academic Session *'}
                  </label>
                  <p className="text-[11px] text-blue-800/80">
                    {language === 'bn'
                      ? 'এখানে শিক্ষাবর্ষ পরিবর্তন করলে (যেমন ২০২৬ থেকে ২০২৭ বা ২০২৮) নতুন স্টুডেন্ট আইডি (S-2027-...), আইডি কার্ড, প্রবেশপত্র এবং ফি রসিদে স্বয়ংক্রিয়ভাবে সেই সেশন প্রদর্শিত হবে।'
                      : 'Changing session here dynamically updates Student IDs (e.g. S-2027-...), ID Cards, Admit Cards, and Fee Receipts.'}
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-600">Quick Presets:</span>
                  {['2026', '2027', '2028', '2029', '2030'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setProfile({ ...profile, currentSession: yr })}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        profile.currentSession === yr
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <input
                    type="text"
                    required
                    value={profile.currentSession}
                    onChange={(e) => setProfile({ ...profile, currentSession: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 bg-white rounded-lg font-mono font-black text-sm text-blue-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2026, 2027 or 2028"
                  />
                </div>
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateStudentsSession}
                    onChange={(e) => setUpdateStudentsSession(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>
                    {language === 'bn'
                      ? `বিদ্যমান সকল শিক্ষার্থীর সেশনও "${profile.currentSession}"-এ আপডেট করুন`
                      : `Sync & apply session "${profile.currentSession}" to all active students`}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Established Year (প্রতিষ্ঠিত সাল)</label>
              <input
                type="text"
                value={profile.establishedYear}
                onChange={(e) => setProfile({ ...profile, establishedYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* HERO SECTION & PUBLIC PORTAL BRANDING CARD */}
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-900 text-sm">
                {language === 'bn'
                  ? 'হিরো সেকশন ও ওয়েবসাইট ব্র্যান্ডিং কাস্টমাইজেশন (Hero Section & Appearance)'
                  : 'Hero Section & Website Appearance Customization'}
              </h4>
            </div>
            <p className="text-slate-500 text-[11px]">
              {language === 'bn'
                ? 'পাবলিক ওয়েবসাইট ও হিরো সেকশনের ব্যানার ছবি, স্লোগান, সম্পর্কে তথ্য এবং ৪টি স্ট্যাট কার্ড এখান থেকে পরিবর্তন বা আপলোড করুন।'
                : 'Upload hero picture, customize school campus photo, welcome tagline, subtitle and 4 stat counters.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hero Banner Image */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? 'হিরো সেকশনের ছবি (Hero Image)' : 'Hero Section Picture'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        heroImageUrl: '/assets/aistudio/school_hero.webp',
                      })
                    }
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    {language === 'bn' ? 'ডিফল্ট ছবি ব্যবহার' : 'Reset to Reference Image'}
                  </button>
                </div>
                <div className="h-36 w-full rounded-lg border border-slate-200 bg-white overflow-hidden relative group">
                  <img
                    src={profile.heroImageUrl || '/assets/aistudio/school_hero.webp'}
                    alt="Hero Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Hero Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ডিভাইস থেকে নতুন ছবি দিন' : 'Upload New Hero Picture'}</span>
                    <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Campus / About Us Picture */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'ক্যাম্পাস ছবি ("আমাদের সম্পর্কে")' : 'Campus / About Us Picture'}</span>
                  </label>
                </div>
                <div className="h-36 w-full rounded-lg border border-slate-200 bg-white overflow-hidden relative group">
                  <img
                    src={profile.aboutImageUrl || '/assets/aistudio/school_hero.webp'}
                    alt="About Us Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Campus Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleAboutImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ক্যাম্পাসের ছবি পরিবর্তন' : 'Upload Campus Picture'}</span>
                    <input type="file" accept="image/*" onChange={handleAboutImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Tagline and Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'হিরো স্লোগান ব্যাজ (Tagline Badge)' : 'Hero Tagline Badge'}
                </label>
                <input
                  type="text"
                  value={profile.heroTaglineBn || 'শিক্ষাই আলো, শিক্ষাই শক্তি'}
                  onChange={(e) => setProfile({ ...profile, heroTaglineBn: e.target.value })}
                  placeholder="যেমন: শিক্ষাই আলো, শিক্ষাই শক্তি"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'প্রতিষ্ঠান মূলমন্ত্র (Motto)' : 'Institutional Motto'}
                </label>
                <input
                  type="text"
                  value={profile.mottoBn || 'জ্ঞান • নৈতিকতা • সুন্দর ভবিষ্যৎ'}
                  onChange={(e) => setProfile({ ...profile, mottoBn: e.target.value })}
                  placeholder="যেমন: জ্ঞান • নৈতিকতা • সুন্দর ভবিষ্যৎ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'হিরো বিস্তারিত বিবরণী (Hero Subtitle / Description)' : 'Hero Subtitle Description'}
                </label>
                <textarea
                  rows={2}
                  value={profile.heroSubtitleBn || 'আধুনিক শিক্ষা, নৈতিকতা ও ইসলামিক মূল্যবোধের সমন্বয়ে গড়ে তুলছি আলোকিত প্রজন্ম।'}
                  onChange={(e) => setProfile({ ...profile, heroSubtitleBn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* 4 Stats Editor */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800 text-xs">
                {language === 'bn' ? '৪টি হাইলাইট স্ট্যাট কার্ড সংখ্যা (4 Quick Stat Counters):' : '4 Stat Counters:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">শিক্ষার্থী সংখ্যা (Students)</span>
                  <input
                    type="text"
                    value={profile.statsStudents || '৫০০+'}
                    onChange={(e) => setProfile({ ...profile, statsStudents: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-blue-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">শিক্ষক-শিক্ষিকা (Teachers)</span>
                  <input
                    type="text"
                    value={profile.statsTeachers || '২৫+'}
                    onChange={(e) => setProfile({ ...profile, statsTeachers: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">ক্লাস রুম (Classrooms)</span>
                  <input
                    type="text"
                    value={profile.statsClassrooms || '১০+'}
                    onChange={(e) => setProfile({ ...profile, statsClassrooms: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-purple-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">অভিজ্ঞতা (Experience)</span>
                  <input
                    type="text"
                    value={profile.statsExperience || '১০+ বছর'}
                    onChange={(e) => setProfile({ ...profile, statsExperience: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-rose-800"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs text-xs transition-colors"
            >
              {language === 'bn' ? 'সেটিংস সংরক্ষণ করুন' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
