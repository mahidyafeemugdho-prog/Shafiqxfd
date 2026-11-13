import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { HeroLoginView } from './components/auth/HeroLoginView';

// Modules & Views
import { MasterAdminPortal } from './components/master/MasterAdminPortal';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentDedicatedDashboard } from './components/dashboard/StudentDedicatedDashboard';
import { StudentsView } from './components/students/StudentsView';
import { StaffView } from './components/staff/StaffView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { SmartQRScannerTab } from './components/attendance/SmartQRScannerTab';
import { AcademicView } from './components/academic/AcademicView';
import { RoutineView } from './components/routine/RoutineView';
import { ExaminationsView } from './components/examinations/ExaminationsView';
import { FeesView } from './components/fees/FeesView';
import { HomeworkView } from './components/homework/HomeworkView';
import { AdmissionsView } from './components/admissions/AdmissionsView';
import { LibraryView } from './components/library/LibraryView';
import { TransportView } from './components/transport/TransportView';
import { InventoryView } from './components/inventory/InventoryView';
import { CertificatesView } from './components/certificates/CertificatesView';
import { NoticesView } from './components/notices/NoticesView';
import { BlogManagementView } from './components/blog/BlogManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { StudentPerformanceAnalyticsView } from './components/analytics/StudentPerformanceAnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import {
  LogOut,
  QrCode,
  LayoutDashboard,
  GraduationCap,
  CalendarCheck2,
  CalendarDays,
  Menu,
} from 'lucide-react';

function AppContent() {
  const { isAuthenticated, activeRole, currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (activeRole === 'master_admin') return 'master_portal';
    if (activeRole === 'gatekeeper') return 'qr_attendance';
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync initial tab when role changes
  useEffect(() => {
    if (activeRole === 'master_admin') {
      setActiveTab('master_portal');
    } else if (activeRole === 'gatekeeper' || currentUser?.permissions?.onlyQrAttendanceKiosk) {
      setActiveTab('qr_attendance');
    } else if (activeTab === 'master_portal') {
      setActiveTab('dashboard');
    }
  }, [activeRole, currentUser, activeTab]);

  // Close sidebar on tab change on mobile
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // If not logged in, show Hero Section / Login View
  if (!isAuthenticated) {
    return <HeroLoginView />;
  }

  // Dedicated Gatekeeper Kiosk mode: clean camera scanner view with zero peripheral noise
  if (activeRole === 'gatekeeper' || currentUser?.role === 'gatekeeper' || !!currentUser?.permissions?.onlyQrAttendanceKiosk) {
    const isFaceKiosk = currentUser?.username === 'face' || localStorage.getItem('kiosk_login_mode') === 'face';
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
        <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${isFaceKiosk ? 'bg-emerald-400/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'}`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide">
                {isFaceKiosk ? 'AI Face Attendance Kiosk' : 'Smart Gate Attendance Kiosk'}
              </span>
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                {isFaceKiosk ? 'Face Scan Mode' : 'Live Scanner'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট (Logout)</span>
          </button>
        </header>

        <main className="flex-1 p-2 sm:p-4 overflow-y-auto">
          <SmartQRScannerTab onAttendanceUpdated={() => {}} isGatekeeper={true} />
        </main>
      </div>
    );
  }

  // Dedicated Student Portal
  if (activeRole === 'student') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <StudentDedicatedDashboard onNavigateTab={handleNavigate} />
        </main>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'master_portal':
        return <MasterAdminPortal />;
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} />;
      case 'students':
        return <StudentsView onPrintCertificate={() => handleNavigate('certificates')} />;
      case 'staff':
        return <StaffView />;
      case 'attendance':
        return <AttendanceView />;
      case 'qr_attendance':
        return <SmartQRScannerTab onAttendanceUpdated={() => {}} isGatekeeper={false} />;
      case 'academic':
        return <AcademicView />;
      case 'routine':
        return <RoutineView />;
      case 'examinations':
        return <ExaminationsView />;
      case 'fees':
        return <FeesView />;
      case 'homework':
        return <HomeworkView />;
      case 'admissions':
        return <AdmissionsView />;
      case 'library':
        return <LibraryView />;
      case 'transport':
        return <TransportView />;
      case 'inventory':
        return <InventoryView />;
      case 'certificates':
        return <CertificatesView />;
      case 'notices':
        return <NoticesView />;
      case 'blog':
        return <BlogManagementView />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <StudentPerformanceAnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          activeTab={activeTab}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Native App-Style Mobile Bottom Navigation Bar */}
      {!currentUser?.permissions?.onlyQrAttendanceKiosk && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around pb-safe select-none">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'dashboard'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">ড্যাশবোর্ড</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('students')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'students'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">শিক্ষার্থী</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('attendance')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'attendance' || activeTab === 'qr_attendance'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">হাজিরা</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate('routine')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              activeTab === 'routine'
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">রুটিন</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 ${
              !['dashboard', 'students', 'attendance', 'routine'].includes(activeTab)
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">সকল মেনু</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SchoolProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SchoolProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
