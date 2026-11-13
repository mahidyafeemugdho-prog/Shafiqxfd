import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import {
  GraduationCap,
  Globe,
  UserCheck,
  Cloud,
  CloudCheck,
  RefreshCw,
  Bell,
  Menu,
  ChevronDown,
  ShieldAlert,
  LogOut,
  Building2,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import { SuperAdminCredentialsModal } from '../auth/SuperAdminCredentialsModal';
import { WebsiteMessagesModal } from '../auth/WebsiteMessagesModal';
import { StorageService } from '../../services/storage';
import { SaturdayOffToggle } from '../common/SaturdayOffToggle';
import { CloudSyncService, subscribeToSyncStatus, SyncStatus } from '../../services/cloudSync';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTab, onNavigate }) => {
  const { currentUser, activeRole, switchRole, isFirebaseConnected, syncStatus, syncNow, logout } = useAuth();
  const { language, toggleLanguage, t, toBnNumber } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNoticeMenu, setShowNoticeMenu] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [syncInfo, setSyncInfo] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncedAt: null,
    hasCloudData: true,
    tenantId: 'domain_default',
    domain: 'localhost',
    error: null,
  });

  React.useEffect(() => {
    return subscribeToSyncStatus((st) => setSyncInfo(st));
  }, []);

  const allRoles: { role: UserRole; labelEn: string; labelBn: string; badgeColor: string }[] = [
    { role: 'super_admin', labelEn: 'Super Admin', labelBn: 'সুপার অ্যাডমিন', badgeColor: 'bg-purple-600 text-white' },
    { role: 'admin', labelEn: 'Head Teacher / Admin', labelBn: 'প্রধান শিক্ষক', badgeColor: 'bg-blue-700 text-white' },
    { role: 'teacher', labelEn: 'Teacher', labelBn: 'সহকারী শিক্ষক', badgeColor: 'bg-emerald-600 text-white' },
    { role: 'accountant', labelEn: 'Accountant', labelBn: 'হিসাবরক্ষক', badgeColor: 'bg-amber-600 text-white' },
    { role: 'student', labelEn: 'Student', labelBn: 'শিক্ষার্থী', badgeColor: 'bg-cyan-600 text-white' },
    { role: 'guardian', labelEn: 'Parent / Guardian', labelBn: 'অভিভাবক', badgeColor: 'bg-teal-600 text-white' },
    { role: 'librarian', labelEn: 'Librarian', labelBn: 'গ্রন্থাগারিক', badgeColor: 'bg-indigo-600 text-white' },
    { role: 'receptionist', labelEn: 'Admission Officer', labelBn: 'ভর্তি কর্মকর্তা', badgeColor: 'bg-rose-600 text-white' },
    { role: 'gatekeeper', labelEn: 'Gate QR Kiosk', labelBn: 'স্কুল গেট কিওস্ক', badgeColor: 'bg-slate-900 text-amber-300 ring-2 ring-amber-400 font-bold' },
  ];

  const currentRoleObj =
    activeRole === 'master_admin'
      ? {
          role: 'master_admin' as UserRole,
          labelEn: 'Master Admin (Shafiq)',
          labelBn: 'মাস্টার অ্যাডমিন (শফিক)',
          badgeColor: 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold',
        }
      : allRoles.find((r) => r.role === activeRole) || allRoles[0];

  const switchableRoles = allRoles;

  const { schoolProfile } = useSchool();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-xs select-none">
      {/* Left: Mobile Toggle & School Branding */}
      <div className="flex items-center space-x-3">
        {activeRole !== 'student' && activeRole !== 'gatekeeper' && !currentUser?.permissions?.onlyQrAttendanceKiosk && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden shrink-0">
            {schoolProfile.logoUrl ? (
              <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-700 text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                {language === 'bn' ? schoolProfile.nameBn : schoolProfile.nameEn}
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                EIIN: {schoolProfile.eiin}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              {language === 'bn'
                ? `শিক্ষাবর্ষ: ${schoolProfile.currentSession}`
                : `Session: ${schoolProfile.currentSession}`}
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* If Gatekeeper, only show live status and logout */}
        {activeRole === 'gatekeeper' || currentUser?.permissions?.onlyQrAttendanceKiosk ? (
          <>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>লাইভ গেট কিওস্ক সক্রিয়</span>
            </div>

            <button
              onClick={logout}
              title="Sign out of ERP / লগআউট করুন"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </>
        ) : (
          <>
            {/* Real-time Cloud Sync Status & Manual Push/Pull Button */}
            <button
              onClick={async () => {
                await CloudSyncService.pushLocalToCloud(true);
                await CloudSyncService.pullFromCloud();
              }}
              disabled={syncInfo.isSyncing}
              title={
                syncInfo.isSyncing
                  ? (language === 'bn' ? 'ক্লাউড ডেটাবেজের সাথে সিঙ্ক হচ্ছে...' : 'Syncing to cloud...')
                  : `${language === 'bn' ? 'ক্লাউড ডেটাবেজ সক্রিয় (Live)' : 'Cloud Database Live'} • ${syncInfo.tenantId || ''} • ${
                      syncInfo.lastSyncedAt
                        ? new Date(syncInfo.lastSyncedAt).toLocaleTimeString()
                        : (language === 'bn' ? 'এইমাত্র' : 'Just now')
                    }`
              }
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                syncInfo.isSyncing
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : syncInfo.error
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  syncInfo.isSyncing ? 'animate-spin text-amber-600' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {syncInfo.isSyncing ? 'সিঙ্ক হচ্ছে...' : 'ক্লাউড সিঙ্ক'}
              </span>
            </button>

            {/* Bilingual Language Switcher */}
            <button
              onClick={toggleLanguage}
              title="Toggle Language / ভাষা পরিবর্তন"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Authenticated Role Badge (Role switching strictly disabled - users only see their authorized dashboard) */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold select-none shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className={`px-2 py-0.5 text-xs font-bold rounded-md ${currentRoleObj.badgeColor}`}>
                {language === 'bn' ? currentRoleObj.labelBn : currentRoleObj.labelEn}
              </div>
            </div>

            {/* Super Admin / Master Admin Website Messages Inbox Button */}
            {(activeRole === 'super_admin' || activeRole === 'master_admin') && (() => {
              const unreadCount = StorageService.getWebsiteMessages().filter((m) => !m.isRead).length;
              return (
                <button
                  onClick={() => setShowMessagesModal(true)}
                  title={language === 'bn' ? 'ওয়েবসাইট থেকে আসা বার্তা ও অনুসন্ধান দেখুন' : 'View inquiries sent from website'}
                  className="relative flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden md:inline">{language === 'bn' ? 'বার্তা ইনবক্স' : 'Web Inbox'}</span>
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-rose-600 text-white rounded-full animate-pulse shadow-xs">
                      {language === 'bn' ? toBnNumber(unreadCount) : unreadCount}
                    </span>
                  )}
                </button>
              );
            })()}

            {/* Super Admin Quick Password Link */}
            {activeRole === 'super_admin' && (
              <button
                onClick={() => setShowCredsModal(true)}
                title={language === 'bn' ? 'সুপার অ্যাডমিন ইউজারনেম ও পাসওয়ার্ড দেখুন বা পরিবর্তন করুন' : 'View or Change Super Admin Credentials'}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                <span>{language === 'bn' ? 'ইউজার/পাসওয়ার্ড' : 'Credentials'}</span>
              </button>
            )}

            {/* Current User Pill */}
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-blue-700">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left text-xs leading-none">
                <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign out of ERP / লগআউট করুন"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </>
        )}
      </div>

      {/* Super Admin Credentials Modal */}
      <SuperAdminCredentialsModal
        isOpen={showCredsModal}
        onClose={() => setShowCredsModal(false)}
      />

      {/* Super Admin Website Messages Modal */}
      <WebsiteMessagesModal
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
      />
    </header>
  );
};
