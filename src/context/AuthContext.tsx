import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, SystemAccessControl } from '../types';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../services/firebase';
import { StorageService } from '../services/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from '../utils/storageHelper';
import { CloudSyncService } from '../services/cloudSync';

export interface LoginResult {
  success: boolean;
  errorType?: 'INVALID_CREDENTIALS' | 'SYSTEM_LOCKED' | 'ROLE_DISABLED' | 'ACCOUNT_DISABLED';
  errorMessage?: string;
  user?: UserProfile;
}

export interface DemoAccount {
  role: UserRole;
  labelEn: string;
  labelBn: string;
  username: string;
  password: string;
  name: string;
  badgeColor: string;
  description: string;
}

export const SYSTEM_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'master_admin',
    labelEn: 'Master Admin',
    labelBn: 'মাস্টার অ্যাডমিন',
    username: 'Shafiq',
    password: '070707',
    name: 'Shafiq (Master Admin)',
    badgeColor: 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold ring-2 ring-red-400',
    description: 'System owner - Can disable/enable all access & publish maintenance notices',
  },
  {
    role: 'super_admin',
    labelEn: 'Super Admin',
    labelBn: 'সুপার অ্যাডমিন',
    username: 'superadmin',
    password: 'admin123',
    name: 'Md. Shafiqul Alam',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Full school administration, settings, ERP management',
  },
  {
    role: 'admin',
    labelEn: 'Head Teacher / Admin',
    labelBn: 'প্রধান শিক্ষক',
    username: 'principal',
    password: 'admin123',
    name: 'Prof. Md. Rafiqul Islam',
    badgeColor: 'bg-blue-700 text-white',
    description: 'Academics, staff management, routines, exam schedules',
  },
  {
    role: 'teacher',
    labelEn: 'Teacher',
    labelBn: 'সহকারী শিক্ষক',
    username: 'teacher',
    password: 'teacher123',
    name: 'Selina Parvin',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Daily attendance, homework assignment, marks entry',
  },
  {
    role: 'accountant',
    labelEn: 'Accountant',
    labelBn: 'হিসাবরক্ষক',
    username: 'accountant',
    password: 'acc123',
    name: 'Kamrul Hasan',
    badgeColor: 'bg-amber-600 text-white',
    description: 'Fee collection, money receipts, expenses, vouchers',
  },
  {
    role: 'student',
    labelEn: 'Student',
    labelBn: 'শিক্ষার্থী',
    username: 'student',
    password: 'student123',
    name: 'Tanvir Ahmed',
    badgeColor: 'bg-cyan-600 text-white',
    description: 'View marksheet, report card, routine, fee receipts',
  },
  {
    role: 'guardian',
    labelEn: 'Parent / Guardian',
    labelBn: 'অভিভাবক',
    username: 'guardian',
    password: 'parent123',
    name: 'Md. Anwar Hossain',
    badgeColor: 'bg-teal-600 text-white',
    description: 'Ward performance, fee dues, attendance tracking',
  },
  {
    role: 'gatekeeper',
    labelEn: 'School Gate / QR Kiosk',
    labelBn: 'স্কুল গেট কিউআর কিওস্ক',
    username: 'gate',
    password: 'gate123',
    name: 'Gate Scanner Device',
    badgeColor: 'bg-slate-900 text-amber-300 ring-2 ring-amber-400 font-bold',
    description: 'School main gate QR camera scanner kiosk - all other sections locked',
  },
  {
    role: 'gatekeeper',
    labelEn: 'Face Attendance Kiosk',
    labelBn: 'এআই ফেস হাজিরা কিওস্ক',
    username: 'face',
    password: 'face123',
    name: 'AI Face Scanner Device',
    badgeColor: 'bg-emerald-950 text-emerald-300 ring-2 ring-emerald-400 font-bold',
    description: 'AI Face Attendance Kiosk - opens face scan camera directly',
  },
];

export const defaultProfiles: Record<UserRole, UserProfile> = {
  master_admin: {
    id: 'usr_master_admin',
    email: 'shafiq.master@intercitymodelschool.edu.bd',
    name: 'Shafiq (Master Admin)',
    nameBn: 'শফিক (মাস্টার অ্যাডমিন)',
    role: 'master_admin',
    phone: '+880 1700-070707',
    username: 'Shafiq',
  },
  super_admin: {
    id: 'usr_super_admin',
    email: 'superadmin@intercitymodelschool.edu.bd',
    name: 'Md. Shafiqul Alam',
    nameBn: 'মোঃ শফিকুল আলম',
    role: 'super_admin',
    phone: '+880 1700-000001',
    username: 'superadmin',
  },
  admin: {
    id: 'usr_admin',
    email: 'principal@intercitymodelschool.edu.bd',
    name: 'Prof. Md. Rafiqul Islam (Head Teacher)',
    nameBn: 'অধ্যাপক মোঃ রফিকুল ইসলাম',
    role: 'admin',
    phone: '+880 1711-234567',
    linkedStaffId: 'st_1',
    username: 'principal',
  },
  teacher: {
    id: 'usr_teacher',
    email: 'selina.math@intercitymodelschool.edu.bd',
    name: 'Selina Parvin (Math Teacher)',
    nameBn: 'সেলিনা পারভীন (গণিত শিক্ষক)',
    role: 'teacher',
    phone: '+880 1722-345678',
    linkedStaffId: 'st_2',
    username: 'teacher',
  },
  accountant: {
    id: 'usr_accountant',
    email: 'accounts@intercitymodelschool.edu.bd',
    name: 'Kamrul Hasan (Accountant)',
    nameBn: 'কামরুল হাসান (হিসাবরক্ষক)',
    role: 'accountant',
    phone: '+880 1733-789012',
    linkedStaffId: 'st_6',
    username: 'accountant',
  },
  student: {
    id: 'usr_student',
    email: 'student@intercitymodelschool.edu.bd',
    name: 'Student Portal',
    nameBn: 'শিক্ষার্থী পোর্টাল',
    role: 'student',
    phone: '+880 1711-112233',
    linkedStudentId: '',
    username: 'student',
  },
  guardian: {
    id: 'usr_guardian',
    email: 'guardian@intercitymodelschool.edu.bd',
    name: 'Guardian Portal',
    nameBn: 'অভিভাবক পোর্টাল',
    role: 'guardian',
    phone: '+880 1711-112233',
    linkedStudentId: '',
    username: 'guardian',
  },
  librarian: {
    id: 'usr_librarian',
    email: 'library@intercitymodelschool.edu.bd',
    name: 'Roksana Begum (Librarian)',
    nameBn: 'রোকসানা বেগম (গ্রন্থাগারিক)',
    role: 'librarian',
    phone: '+880 1844-890123',
    linkedStaffId: 'st_7',
    username: 'librarian',
  },
  receptionist: {
    id: 'usr_receptionist',
    email: 'admission@intercitymodelschool.edu.bd',
    name: 'Tariqul Islam (Admission Officer)',
    nameBn: 'তরিকুল ইসলাম (ভর্তি কর্মকর্তা)',
    role: 'receptionist',
    phone: '+880 1555-901234',
    linkedStaffId: 'st_8',
    username: 'receptionist',
  },
  gatekeeper: {
    id: 'usr_gatekeeper',
    email: 'gate@intercitymodelschool.edu.bd',
    name: 'Gate QR Scanner Kiosk',
    nameBn: 'স্কুল গেট কিউআর কিওস্ক',
    role: 'gatekeeper',
    phone: '+880 1700-000000',
    username: 'gate',
    permissions: {
      manageStudents: false,
      manageAttendance: true,
      manageExams: false,
      manageFees: false,
      manageRoutine: false,
      manageHomework: false,
      manageLibrary: false,
      onlyQrAttendanceKiosk: true,
    },
  },
};

interface AuthContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  loginWithCredentials: (usernameOrEmail: string, password: string) => LoginResult;
  logout: () => void;
  systemAccessControl: SystemAccessControl;
  updateSystemAccessControl: (control: Partial<SystemAccessControl>) => void;
  firebaseUser: User | null;
  isFirebaseConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncNow: () => Promise<void>;
  loginWithGooglePopup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // User request: Always show Hero Section first on reload / new session so users log in before working
    return false;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const isAuth = safeGetLocalStorage('school_erp_authenticated');
    const authState = isAuth === null ? true : isAuth === 'true';
    if (!authState) return 'super_admin';
    const saved = safeGetLocalStorage('school_erp_role') as UserRole;
    return saved || 'super_admin';
  });

  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(() => {
    try {
      const saved = safeGetLocalStorage('school_erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [systemAccessControl, setSystemAccessControl] = useState<SystemAccessControl>(() => {
    return StorageService.getSystemAccessControl();
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [superAdminCreds, setSuperAdminCreds] = useState(() => StorageService.getSuperAdminCredentials());

  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setFirebaseUser(user);
    });

    const handleCredsUpdate = (e: any) => {
      if (e?.detail) {
        setSuperAdminCreds(e.detail);
      } else {
        setSuperAdminCreds(StorageService.getSuperAdminCredentials());
      }
    };
    window.addEventListener('super_admin_creds_updated', handleCredsUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('super_admin_creds_updated', handleCredsUpdate);
    };
  }, []);

  const updateSystemAccessControl = (partial: Partial<SystemAccessControl>) => {
    const updated: SystemAccessControl = {
      ...systemAccessControl,
      ...partial,
      updatedAt: new Date().toISOString(),
      updatedBy: activeRole === 'master_admin' ? 'Shafiq (Master Admin)' : 'Admin',
    };
    StorageService.saveSystemAccessControl(updated);
    setSystemAccessControl(updated);
  };

  const switchRole = (role: UserRole) => {
    // STRICT RBAC: Once logged in, regular staff and users CANNOT switch roles!
    // Only Master Admin Shafiq has authorization to simulate other roles.
    if (activeRole !== 'master_admin') {
      console.warn('Role switching blocked for non-master admin accounts');
      return;
    }
    if (systemAccessControl.isSystemLocked || systemAccessControl.disabledRoles.includes(role)) {
      return;
    }
    setActiveRole(role);
    safeSetLocalStorage('school_erp_role', role);
  };

  const loginWithCredentials = (usernameOrEmail: string, pass: string): LoginResult => {
    const trimmedUser = usernameOrEmail.trim();
    const trimmedPass = pass.trim();

    // 1. Check Master Admin: Shafiq / 070707
    if (
      (trimmedUser.toLowerCase() === 'shafiq' ||
        trimmedUser.toLowerCase() === 'shafiq.master@intercitymodelschool.edu.bd' ||
        trimmedUser.toLowerCase() === 'shafiq.master@pattashischool.edu.bd' ||
        trimmedUser.toLowerCase() === 'shafiq.master@dhakamodel.edu.bd') &&
      trimmedPass === '070707'
    ) {
      const user = defaultProfiles.master_admin;
      setActiveRole('master_admin');
      setIsAuthenticated(true);
      safeSetLocalStorage('school_erp_role', 'master_admin');
      safeSetLocalStorage('school_erp_authenticated', 'true');
      safeSetLocalStorage('school_erp_user', JSON.stringify(user));
      return { success: true, user };
    }

    const cleanUser = trimmedUser.toLowerCase();

    // 1.5. Direct Gatekeeper Kiosks: 'gate' / 'gate123' (QR) & 'face' / 'face123' (Face)
    if (cleanUser === 'gate' && trimmedPass === 'gate123') {
      const user = defaultProfiles.gatekeeper;
      safeSetLocalStorage('kiosk_login_mode', 'qr');
      safeSetLocalStorage('smart_attendance_scanner_type', 'qr');
      setActiveRole('gatekeeper');
      setIsAuthenticated(true);
      safeSetLocalStorage('school_erp_role', 'gatekeeper');
      safeSetLocalStorage('school_erp_authenticated', 'true');
      safeSetLocalStorage('school_erp_user', JSON.stringify(user));
      return { success: true, user };
    }

    if (cleanUser === 'face' && trimmedPass === 'face123') {
      const user = {
        ...defaultProfiles.gatekeeper,
        name: 'AI Face Attendance Kiosk',
        nameBn: 'এআই ফেস হাজিরা কিওস্ক',
        username: 'face',
      };
      safeSetLocalStorage('kiosk_login_mode', 'face');
      safeSetLocalStorage('smart_attendance_scanner_type', 'face');
      setActiveRole('gatekeeper');
      setIsAuthenticated(true);
      safeSetLocalStorage('school_erp_role', 'gatekeeper');
      safeSetLocalStorage('school_erp_authenticated', 'true');
      safeSetLocalStorage('school_erp_user', JSON.stringify(user));
      return { success: true, user };
    }

    let targetRole: UserRole | null = null;
    let expectedPass = '';
    const cleanUserDigits = trimmedUser.replace(/\D/g, '');
    let customStaffProfile: UserProfile | null = null;

    // 2. Check Super Admin credentials (supports custom username/password changed by Super Admin)
    const superAdminCreds = StorageService.getSuperAdminCredentials();
    const isSuperAdminMatch =
      cleanUser === superAdminCreds.username.trim().toLowerCase() ||
      cleanUser === superAdminCreds.email.trim().toLowerCase() ||
      cleanUser === 'superadmin';

    if (isSuperAdminMatch) {
      targetRole = 'super_admin';
      expectedPass = (superAdminCreds.password || 'admin123').trim();
      customStaffProfile = {
        id: 'super_admin_user',
        email: superAdminCreds.email,
        name: superAdminCreds.name,
        nameBn: superAdminCreds.nameBn || superAdminCreds.name,
        role: 'super_admin',
        phone: superAdminCreds.phone,
        username: superAdminCreds.username,
      };
    } else {
      // 3. Check if user is a staff member configured by Super Admin
      const allStaff = StorageService.getStaff();
      const matchedStaff = allStaff.find((s) => {
        const uMatch = s.username && s.username.trim().toLowerCase() === cleanUser;
        const eMatch = s.email && s.email.trim().toLowerCase() === cleanUser;
        const idMatch = s.employeeId && s.employeeId.trim().toLowerCase() === cleanUser;
        const phoneDigits = s.phone ? s.phone.replace(/\D/g, '') : '';
        const phoneMatch = cleanUserDigits.length >= 8 && phoneDigits.endsWith(cleanUserDigits);
        return uMatch || eMatch || idMatch || phoneMatch;
      });

      if (matchedStaff) {
        if (matchedStaff.status === 'resigned') {
          return {
            success: false,
            errorType: 'ACCOUNT_DISABLED',
            errorMessage: 'This staff account has been deactivated by Super Admin.',
          };
        }
        targetRole = matchedStaff.role || 'teacher';
        expectedPass = (matchedStaff.password || 'staff123').trim();
        customStaffProfile = {
          id: matchedStaff.id,
          email: matchedStaff.email,
          name: matchedStaff.nameEn,
          nameBn: matchedStaff.nameBn || matchedStaff.nameEn,
          role: targetRole,
          phone: matchedStaff.phone,
          avatar: matchedStaff.photoUrl,
          linkedStaffId: matchedStaff.id,
          username: matchedStaff.username || matchedStaff.employeeId,
          permissions: matchedStaff.permissions,
        };
      }
    }

    // 3.5. Check if user is an authenticated Student by Student ID (e.g. S-2026-1004, S-2026-0002, std_1)
    if (!targetRole) {
      const allStudents = StorageService.getStudents();
      const userAlphaNum = cleanUser.replace(/[^a-z0-9]/g, '');

      const matchedStudent = allStudents.find((st) => {
        if (!st) return false;
        const sId = (st.studentId || '').trim().toLowerCase();
        const sIdAlphaNum = sId.replace(/[^a-z0-9]/g, '');
        const sIdDigits = sId.replace(/\D/g, '');

        // 1. Direct studentId match (e.g. "s-2026-1004" === "s-2026-1004")
        const sIdMatch = sId && sId === cleanUser;
        // 2. Alphanumeric match (e.g. "s20261004" === "s20261004")
        const alphaMatch = userAlphaNum.length >= 4 && sIdAlphaNum === userAlphaNum;
        // 3. Digits suffix match (e.g. "1004" or "20261004")
        const digitsMatch = cleanUserDigits.length >= 4 && (sIdDigits === cleanUserDigits || sIdDigits.endsWith(cleanUserDigits));
        // 4. Internal system id match (e.g. "std_1")
        const sysIdMatch = st.id && st.id.trim().toLowerCase() === cleanUser;
        // 5. Roll match
        const rollStr = String(st.roll || '').trim();
        const rollMatch = rollStr && (`roll_${rollStr}`.toLowerCase() === cleanUser || rollStr === cleanUser);
        // 6. Name match
        const nameEnMatch = st.nameEn && st.nameEn.trim().toLowerCase() === cleanUser;
        const nameBnMatch = st.nameBn && st.nameBn.trim().toLowerCase() === cleanUser;

        return sIdMatch || alphaMatch || digitsMatch || sysIdMatch || rollMatch || nameEnMatch || nameBnMatch;
      });

      if (matchedStudent) {
        if (matchedStudent.status === 'inactive' || matchedStudent.status === 'transferred') {
          return {
            success: false,
            errorType: 'ACCOUNT_DISABLED',
            errorMessage: 'This student profile is inactive or transferred.',
          };
        }
        targetRole = 'student';
        expectedPass = (matchedStudent.password && matchedStudent.password.trim()) ? matchedStudent.password.trim() : '1234';
        const effectiveId = matchedStudent.studentId || matchedStudent.id || 'student';
        customStaffProfile = {
          id: matchedStudent.id,
          email: `${effectiveId.toLowerCase()}@school.edu.bd`,
          name: matchedStudent.nameEn || matchedStudent.nameBn || 'Student',
          nameBn: matchedStudent.nameBn || matchedStudent.nameEn || 'শিক্ষার্থী',
          role: 'student',
          phone: matchedStudent.guardianPhone || matchedStudent.fatherPhone || '',
          avatar: matchedStudent.photoUrl || '',
          linkedStudentId: matchedStudent.id,
          username: effectiveId,
        };
      }
    }

    if (!targetRole) {
      const matchedDemo = SYSTEM_DEMO_ACCOUNTS.find(
        (acc) =>
          acc.username.toLowerCase() === trimmedUser.toLowerCase() ||
          defaultProfiles[acc.role].email.toLowerCase() === trimmedUser.toLowerCase()
      );

      if (matchedDemo) {
        targetRole = matchedDemo.role;
        expectedPass = matchedDemo.password;
      } else {
        // Check other roles by email or username
        Object.entries(defaultProfiles).forEach(([r, profile]) => {
          if (
            profile.email.toLowerCase() === trimmedUser.toLowerCase() ||
            profile.username?.toLowerCase() === trimmedUser.toLowerCase()
          ) {
            targetRole = r as UserRole;
            expectedPass = 'admin123';
          }
        });
      }
    }

    if (!targetRole) {
      return {
        success: false,
        errorType: 'INVALID_CREDENTIALS',
        errorMessage: 'Invalid username or password. Please verify your credentials or select a demo role.',
      };
    }

    // STRICT PASSWORD CHECK: No cross-role or unauthorized bypass passwords!
    // Each account must provide their assigned password.
    const isPassValid = trimmedPass === expectedPass;

    if (!isPassValid) {
      return {
        success: false,
        errorType: 'INVALID_CREDENTIALS',
        errorMessage: 'Incorrect password for this user account. Please check your credentials.',
      };
    }

    // 3. MASTER ACCESS CONTROL ENFORCEMENT
    // Check if entire system is locked by Master Admin Shafiq
    if (systemAccessControl.isSystemLocked) {
      return {
        success: false,
        errorType: 'SYSTEM_LOCKED',
        errorMessage: systemAccessControl.disabledMessage || 'Access disabled by Master Admin.',
      };
    }

    // Check if this specific role is disabled by Master Admin Shafiq
    if (systemAccessControl.disabledRoles.includes(targetRole)) {
      return {
        success: false,
        errorType: 'ROLE_DISABLED',
        errorMessage: systemAccessControl.disabledMessage || 'Access for your role has been disabled by Master Admin.',
      };
    }

    // Login successful
    const user = customStaffProfile || defaultProfiles[targetRole];
    setLoggedInUser(user);

    // CRITICAL: Strip huge base64 image data URLs (> 500 chars) from persisted session to avoid QuotaExceededError
    const userToPersist: UserProfile = {
      ...user,
      avatar: (user.avatar && user.avatar.length > 500) ? '' : user.avatar,
    };

    safeSetLocalStorage('school_erp_user', JSON.stringify(userToPersist));
    setActiveRole(targetRole);
    setIsAuthenticated(true);
    safeSetLocalStorage('school_erp_role', targetRole);
    safeSetLocalStorage('school_erp_authenticated', 'true');

    return { success: true, user };
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveRole('super_admin');
    setLoggedInUser(null);
    safeSetLocalStorage('school_erp_authenticated', 'false');
    safeRemoveLocalStorage('school_erp_role');
    safeRemoveLocalStorage('school_erp_user');
    logoutUser().catch(console.error);
  };

  const syncNow = async () => {
    setSyncStatus('syncing');
    try {
      const ok = await CloudSyncService.pushLocalToCloud(true);
      await CloudSyncService.pullFromCloud();
      if (ok) {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 4000);
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const resolvedSuperAdminProfile: Partial<UserProfile> = activeRole === 'super_admin' ? {
    name: superAdminCreds.name || 'Md. Shafiqul Alam',
    nameBn: superAdminCreds.nameBn || 'মোঃ শফিকুল আলম',
    email: superAdminCreds.email || 'superadmin@school.edu.bd',
    username: superAdminCreds.username || 'superadmin',
  } : {};

  const currentUser: UserProfile = loggedInUser && loggedInUser.role === activeRole
    ? {
        ...defaultProfiles[activeRole],
        ...resolvedSuperAdminProfile,
        ...loggedInUser,
        ...(activeRole === 'super_admin' ? resolvedSuperAdminProfile : {}),
        ...(firebaseUser?.email ? { email: firebaseUser.email, name: firebaseUser.displayName || loggedInUser.name } : {}),
      }
    : {
        ...defaultProfiles[activeRole],
        ...resolvedSuperAdminProfile,
        ...(firebaseUser?.email ? { email: firebaseUser.email, name: firebaseUser.displayName || defaultProfiles[activeRole].name } : {}),
      };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
        switchRole,
        loginWithCredentials,
        logout: handleLogout,
        systemAccessControl,
        updateSystemAccessControl,
        firebaseUser,
        isFirebaseConnected,
        syncStatus,
        syncNow,
        loginWithGooglePopup: handleGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
