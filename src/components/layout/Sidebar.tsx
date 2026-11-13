import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck2,
  BookOpen,
  CalendarDays,
  Award,
  Wallet,
  FileCheck,
  UserPlus,
  Library,
  Bus,
  Package,
  FileBadge,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  ShieldAlert,
  Globe,
  QrCode,
  X,
} from 'lucide-react';

import { isTabAuthorized } from '../../utils/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  labelKey: any;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { activeRole, currentUser } = useAuth();
  const { t, language } = useLanguage();

  if (activeRole === 'student') {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'master_portal',
      labelKey: 'masterPortal',
      icon: ShieldAlert,
      roles: ['master_admin'],
    },
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'guardian', 'librarian', 'receptionist'],
    },
    {
      id: 'students',
      labelKey: 'students',
      icon: GraduationCap,
      roles: ['super_admin', 'admin', 'teacher', 'receptionist', 'accountant', 'guardian'],
    },
    {
      id: 'staff',
      labelKey: 'teachersAndStaff',
      icon: Users,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'attendance',
      labelKey: 'attendance',
      icon: CalendarCheck2,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    },
    {
      id: 'qr_attendance',
      labelKey: 'qrAttendance',
      icon: QrCode,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian', 'gatekeeper'],
    },
    {
      id: 'academic',
      labelKey: 'academic',
      icon: BookOpen,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'routine',
      labelKey: 'routine',
      icon: CalendarDays,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    },
    {
      id: 'examinations',
      labelKey: 'examinations',
      icon: Award,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    },
    {
      id: 'fees',
      labelKey: 'feesAndAccounts',
      icon: Wallet,
      roles: ['super_admin', 'admin', 'accountant', 'guardian', 'student'],
    },
    {
      id: 'homework',
      labelKey: 'homework',
      icon: FileCheck,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    },
    {
      id: 'admissions',
      labelKey: 'admissions',
      icon: UserPlus,
      roles: ['super_admin', 'admin', 'receptionist'],
    },
    {
      id: 'library',
      labelKey: 'library',
      icon: Library,
      roles: ['super_admin', 'admin', 'librarian', 'teacher', 'student'],
    },
    {
      id: 'transport',
      labelKey: 'transport',
      icon: Bus,
      roles: ['super_admin', 'admin', 'student', 'guardian'],
    },
    {
      id: 'inventory',
      labelKey: 'inventory',
      icon: Package,
      roles: ['super_admin', 'admin', 'librarian'],
    },
    {
      id: 'certificates',
      labelKey: 'certificates',
      icon: FileBadge,
      roles: ['super_admin', 'admin', 'receptionist', 'teacher', 'student'],
    },
    {
      id: 'notices',
      labelKey: 'notices',
      icon: Bell,
      roles: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'guardian', 'librarian', 'receptionist'],
    },
    {
      id: 'blog',
      labelKey: 'schoolBlog',
      icon: BookOpen,
      roles: ['super_admin', 'admin', 'teacher'],
    },
    {
      id: 'reports',
      labelKey: 'reports',
      icon: BarChart3,
      roles: ['super_admin', 'admin', 'accountant'],
    },
    {
      id: 'analytics',
      labelKey: 'analytics',
      icon: Sparkles,
      roles: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    },
    {
      id: 'settings',
      labelKey: 'settings',
      icon: Settings,
      roles: ['super_admin', 'admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => {
    return isTabAuthorized(item.id, activeRole, currentUser);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950/60 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-sm">
            {language === 'bn' ? 'মেনু নেভিগেশন' : 'Navigation Menu'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Info Subheader */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/30">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {language === 'bn' ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}
          </div>
          <div className="text-xs text-blue-400 font-medium mt-0.5 flex items-center justify-between">
            <span>Nursery • Class 10</span>
            <span className="px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[10px]">
              v2.6
            </span>
          </div>
        </div>

        {(activeRole === 'gatekeeper' || currentUser?.permissions?.onlyQrAttendanceKiosk) && (
          <div className="m-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{language === 'bn' ? '🔒 গেট কিওস্ক লকড' : '🔒 Gate Kiosk Locked'}</span>
            </div>
            <p className="text-[10px] text-amber-200/80 mt-1 leading-snug">
              {language === 'bn'
                ? 'স্কুল গেট কিওস্ক মোড সক্রিয়। অন্য সকল সেকশন সুরক্ষিতভাবে বন্ধ রয়েছে।'
                : 'School gate lockdown active. Only QR camera scanner is accessible.'}
            </p>
          </div>
        )}

        {/* Nav Items List */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Role Info */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span>{language === 'bn' ? 'ব্যবহারকারী রোল:' : 'Access Level:'}</span>
            <span className="text-blue-400 font-semibold uppercase text-[10px]">
              {activeRole.replace('_', ' ')}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Asia/Dhaka GMT+6 • {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
};
