import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { SuperAdminCredentials } from '../../types';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

interface SuperAdminCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminCredentialsModal: React.FC<SuperAdminCredentialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const [creds, setCreds] = useState<SuperAdminCredentials>(() =>
    StorageService.getSuperAdminCredentials()
  );

  const [name, setName] = useState<string>(creds.name || 'Md. Shafiqul Alam');
  const [nameBn, setNameBn] = useState<string>(creds.nameBn || 'মোঃ শফিকুল আলম');
  const [email, setEmail] = useState<string>(creds.email || 'superadmin@dhakamodel.edu.bd');
  const [phone, setPhone] = useState<string>(creds.phone || '+880 1711-223344');
  const [username, setUsername] = useState<string>(creds.username || 'superadmin');
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showStoredPassword, setShowStoredPassword] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg(language === 'bn' ? 'ইউজারনেম খালি রাখা যাবে না।' : 'Username cannot be empty.');
      return;
    }

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg(language === 'bn' ? 'সুপার অ্যাডমিনের নাম খালি রাখা যাবে না।' : 'Name cannot be empty.');
      return;
    }

    // If changing password, verify current password
    if (newPassword || confirmPassword) {
      if (currentPasswordInput.trim() !== creds.password.trim()) {
        setErrorMsg(
          language === 'bn'
            ? 'বর্তমান পাসওয়ার্ড সঠিক নয়! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
            : 'Current password does not match.'
        );
        return;
      }
      if (newPassword.length < 4) {
        setErrorMsg(
          language === 'bn'
            ? 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
            : 'New password must be at least 4 characters.'
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg(
          language === 'bn'
            ? 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।'
            : 'New password and confirm password do not match.'
        );
        return;
      }
    }

    const updatedCreds: SuperAdminCredentials = {
      ...creds,
      username: cleanUsername,
      name: cleanName,
      nameBn: nameBn.trim() || cleanName,
      email: email.trim() || creds.email,
      phone: phone.trim() || creds.phone,
      password: newPassword ? newPassword.trim() : creds.password,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveSuperAdminCredentials(updatedCreds);
    setCreds(updatedCreds);
    setSuccessMsg(
      language === 'bn'
        ? 'সুপার অ্যাডমিনের নাম ও লগইন ক্রেডেনশিয়াল সফলভাবে সংরক্ষিত হয়েছে!'
        : 'Super Admin name and credentials updated successfully!'
    );
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-xs text-slate-800 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'bn'
                  ? 'সুপার অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড'
                  : 'Super Admin Credentials & Password'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'bn'
                  ? 'সুপার অ্যাডমিনের নিজস্ব লগইন তথ্য দেখুন বা পরিবর্তন করুন'
                  : 'View and update your Super Admin authentication credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Credentials Quick Overview Card */}
        <div className="mt-4 p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-950">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[11px] text-purple-900 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>{language === 'bn' ? 'বর্তমান সক্রিয় ক্রেডেনশিয়াল' : 'Current Active Credentials'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
              Super Admin
            </span>
          </div>

          {/* Active Name & Credentials Card */}
          <div className="bg-white p-3 rounded-lg border border-purple-100 mb-3">
            <span className="text-[10px] text-slate-500 block">
              {language === 'bn' ? 'সুপার অ্যাডমিনের নাম ও পদবি' : 'Super Admin Name & Designation'}
            </span>
            <span className="font-bold text-sm text-purple-950 block">
              {creds.name || 'Md. Shafiqul Alam'}
            </span>
            <span className="text-[11px] text-purple-700 font-medium">
              {creds.nameBn || 'মোঃ শফিকুল আলম'} • {creds.email}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-500 block">
                {language === 'bn' ? 'ইউজারনেম' : 'Username'}
              </span>
              <span className="font-mono font-bold text-xs text-slate-900 select-all">
                {creds.username}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-purple-100">
              <span className="text-[10px] text-slate-500 block">
                {language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono font-bold text-xs text-slate-900 select-all">
                  {showStoredPassword ? creds.password : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowStoredPassword(!showStoredPassword)}
                  className="text-purple-600 hover:text-purple-800 p-0.5"
                  title="Toggle show password"
                >
                  {showStoredPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-purple-800/80 mt-2">
            {language === 'bn'
              ? 'লগইন করার সময় এই ইউজারনেম এবং পাসওয়ার্ড দিয়ে সরাসরি সুপার অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে পারবেন।'
              : 'Use this username and password to log in directly as Super Admin.'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Change Credentials Form */}
        <form onSubmit={handleUpdate} className="mt-4 space-y-3.5">
          <div className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{language === 'bn' ? 'সুপার অ্যাডমিনের নাম ও লগইন তথ্য পরিবর্তন' : 'Update Super Admin Name & Login Details'}</span>
          </div>

          {/* Name (English & Bangla) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'সুপার অ্যাডমিনের নাম (English) *' : 'Super Admin Name (English) *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Shafiqul Alam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'বাংলায় নাম' : 'Bangla Name'}
              </label>
              <input
                type="text"
                placeholder="যেমন: মোঃ শফিকুল আলম"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'bn' ? 'সুপার অ্যাডমিন ইউজারনেম (Login Username) *' : 'Super Admin Username *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Current Password (Required to authorize change) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {language === 'bn' ? 'বর্তমান পাসওয়ার্ড (যাচাইয়ের জন্য) *' : 'Current Password (to verify) *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার বর্তমান পাসওয়ার্ডটি লিখুন' : 'Enter current password'}
                className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* New Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {language === 'bn' ? 'ক্রেডেনশিয়াল সংরক্ষণ করুন' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
