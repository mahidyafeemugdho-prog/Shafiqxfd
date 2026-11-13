import { UserRole, UserProfile } from '../types';

/**
 * Validates whether a user with given role and custom permissions
 * is authorized to access a specific module / view tab.
 */
export const isTabAuthorized = (tab: string, role: UserRole, user: UserProfile | null): boolean => {
  // 1. Master Admin has absolute global access
  if (role === 'master_admin') {
    return true;
  }

  // 2. Master Portal is STRICTLY reserved for Master Admin
  if (tab === 'master_portal') {
    return false;
  }

  // 3. Super Admin has access to all operational modules
  if (role === 'super_admin') {
    return true;
  }

  // 3.5. School Gate / QR Kiosk Lockdown Mode: STRICTLY ONLY qr_attendance is allowed
  const perms = user?.permissions;
  if (role === 'gatekeeper' || perms?.onlyQrAttendanceKiosk) {
    return tab === 'qr_attendance';
  }

  // 4. Non-super-admins can NEVER access system Settings or RBAC Staff management
  if (tab === 'settings') {
    return false;
  }
  if (tab === 'staff') {
    // Only Head Teacher / Admin can access staff directory if specifically needed, never teachers/accountants
    return role === 'admin';
  }

  // 5. If user is a staff member with granular permissions configured by Super Admin
  if (perms) {
    if (tab === 'students' || tab === 'admissions' || tab === 'certificates') {
      return perms.manageStudents !== false;
    }
    if (tab === 'attendance' || tab === 'qr_attendance') {
      return perms.manageAttendance !== false;
    }
    if (tab === 'examinations') {
      return perms.manageExams !== false;
    }
    if (tab === 'fees') {
      return perms.manageFees === true || role === 'accountant';
    }
    if (tab === 'routine' || tab === 'academic') {
      return perms.manageRoutine !== false;
    }
    if (tab === 'homework') {
      return perms.manageHomework !== false;
    }
    if (tab === 'library' || tab === 'inventory' || tab === 'transport') {
      return perms.manageLibrary === true || role === 'librarian';
    }
    if (tab === 'reports') {
      return perms.manageFees === true || role === 'accountant';
    }
  }

  // 6. Base default role-to-tab access mapping
  const baseAllowedRoles: Record<string, UserRole[]> = {
    dashboard: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'guardian', 'librarian', 'receptionist'],
    students: ['super_admin', 'admin', 'teacher', 'receptionist', 'accountant', 'guardian'],
    attendance: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    qr_attendance: ['super_admin', 'admin', 'teacher', 'student', 'guardian', 'gatekeeper'],
    routine: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    examinations: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    fees: ['super_admin', 'admin', 'accountant', 'guardian', 'student'],
    homework: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    admissions: ['super_admin', 'admin', 'receptionist'],
    library: ['super_admin', 'admin', 'librarian', 'teacher', 'student'],
    transport: ['super_admin', 'admin', 'student', 'guardian'],
    inventory: ['super_admin', 'admin', 'librarian'],
    certificates: ['super_admin', 'admin', 'receptionist', 'teacher', 'student'],
    notices: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'guardian', 'librarian', 'receptionist'],
    blog: ['super_admin', 'admin', 'teacher'],
    reports: ['super_admin', 'admin', 'accountant'],
    academic: ['super_admin', 'admin'],
    analytics: ['super_admin', 'admin', 'teacher', 'student', 'guardian'],
    website_preview: ['super_admin', 'admin', 'teacher', 'accountant', 'student', 'guardian', 'librarian', 'receptionist'],
  };

  const allowed = baseAllowedRoles[tab];
  return allowed ? allowed.includes(role) : false;
};
