import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storageHelper';

export const CLOUD_SYNC_COLLECTION = 'school_sync';
export const LAST_SYNC_KEY = 'school_erp_last_cloud_sync_time';

/**
 * Resolves the unique tenant document ID in Firestore based on the active domain or workspace.
 * Automatically harmonizes:
 * - AI Studio preview URLs: ais-dev-XXX and ais-pre-XXX share the exact same tenant
 * - Netlify custom domains and subdomains
 * - Strips www. and deploy-preview prefixes
 */
export function getDomainTenantId(): string {
  if (typeof window === 'undefined') return 'domain_default';

  // 1. Check if user configured a manual custom school workspace ID in Settings
  const customWorkspace = safeGetLocalStorage('school_erp_workspace_id');
  if (customWorkspace && customWorkspace.trim()) {
    return `workspace_${customWorkspace.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
  }

  // 2. Automatically derive from current browser hostname / domain
  const rawHost = window.location.hostname || 'localhost';
  let normalizedHost = rawHost.toLowerCase().trim();
  normalizedHost = normalizedHost.replace(/^www\./, '');
  // Harmonize AI Studio Dev and Preview shared URLs so user and friend share same live store
  normalizedHost = normalizedHost.replace(/^(ais-dev-|ais-pre-)/, 'ais-');
  // Harmonize Netlify branch/preview deploys (e.g. main--school.netlify.app -> school.netlify.app)
  normalizedHost = normalizedHost.replace(/^[a-z0-9_-]+--([a-z0-9-]+\.netlify\.app)$/, '$1');
  // Strip port if running on localhost
  normalizedHost = normalizedHost.split(':')[0];

  const cleanHost = normalizedHost.replace(/[^a-z0-9_-]/g, '_');
  return `domain_${cleanHost}`;
}

/**
 * Returns a unique device identifier for the current browser session.
 * Prevents echo loops where an upload bounces back to the device that just pushed it.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let id = safeGetLocalStorage('school_erp_device_id');
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    safeSetLocalStorage('school_erp_device_id', id);
  }
  return id;
};

// Slices of data stored in Firestore so no single document ever exceeds Firestore's 1MB limit
export const DATA_SLICES = {
  profile: [
    'school_erp_profile',
    'school_erp_access_control',
    'school_erp_super_admin_creds',
    'school_erp_mfs_settings',
    'school_erp_website_messages',
    'school_erp_blog_posts',
    'school_erp_holidays',
  ],
  students: [
    'school_erp_students',
    'school_erp_enquiries',
  ],
  staff: [
    'school_erp_staff',
  ],
  academics: [
    'school_erp_classes',
    'school_erp_subjects',
    'school_erp_routines',
    'school_erp_exams',
    'school_erp_exam_routines',
  ],
  attendance: [
    'school_erp_attendance',
    'school_erp_attendance_rules',
    'school_erp_attendance_audit',
    'school_erp_marks',
  ],
  finance: [
    'school_erp_fee_heads',
    'school_erp_class_fees',
    'school_erp_scheduled_fees',
    'school_erp_student_transports',
    'school_erp_invoices',
    'school_erp_payments',
    'school_erp_expenses',
    'school_erp_online_payment_requests',
    'school_erp_custom_class_fee_columns',
    'school_erp_hidden_class_fee_columns',
    'school_erp_homework',
    'school_erp_homework_submissions',
    'school_erp_books',
    'school_erp_book_issues',
    'school_erp_routes',
    'school_erp_inventory',
    'school_erp_notices',
  ],
};

export type SliceType = keyof typeof DATA_SLICES;
export const SYNCED_STORAGE_KEYS = Object.values(DATA_SLICES).flat();

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  hasCloudData: boolean;
  tenantId: string;
  domain: string;
  error?: string | null;
}

type SyncListener = (status: SyncStatus) => void;
const statusListeners = new Set<SyncListener>();

let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: typeof window !== 'undefined' ? safeGetLocalStorage(LAST_SYNC_KEY) : null,
  hasCloudData: false,
  tenantId: typeof window !== 'undefined' ? getDomainTenantId() : 'domain_default',
  domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  error: null,
};

function notifyStatus(update: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...update };
  statusListeners.forEach((listener) => {
    try {
      listener(currentStatus);
    } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cloud_sync_status_changed', { detail: currentStatus }));
  }
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  statusListeners.add(listener);
  listener(currentStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

// Track if local edit initiated the update to avoid bounce loops
let isApplyingCloudUpdate = false;
let syncTimeout: any = null;

export const CloudSyncService = {
  /**
   * Pack slice data from local storage
   */
  getSlicePayload(keys: string[]): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const key of keys) {
      const raw = safeGetLocalStorage(key);
      if (raw !== null) {
        try {
          payload[key] = JSON.parse(raw);
        } catch {
          payload[key] = raw;
        }
      }
    }
    return payload;
  },

  /**
   * Apply cloud slice data to local storage and notify React UI
   */
  applySnapshotToLocal(data: Record<string, any>, serverTimestamp?: string): boolean {
    isApplyingCloudUpdate = true;
    try {
      let changed = false;
      let profileUpdated = false;

      for (const [key, value] of Object.entries(data)) {
        if (key === 'updatedAt' || key === 'clientTimestamp' || key === 'deviceId' || key === 'tenantId' || key === 'domain' || key === 'slice') continue;
        if (SYNCED_STORAGE_KEYS.includes(key) && value !== undefined) {
          const stringified = typeof value === 'string' ? value : JSON.stringify(value);
          const current = safeGetLocalStorage(key);
          if (current !== stringified) {
            safeSetLocalStorage(key, stringified);
            changed = true;
            if (key === 'school_erp_profile') {
              profileUpdated = true;
            }
          }
        }
      }

      const syncTime = serverTimestamp || new Date().toISOString();
      safeSetLocalStorage(LAST_SYNC_KEY, syncTime);
      notifyStatus({
        isSyncing: false,
        lastSyncedAt: syncTime,
        hasCloudData: true,
        tenantId: getDomainTenantId(),
        domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        error: null,
      });

      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('school_cloud_data_synced', { detail: { syncTime } }));
        if (profileUpdated) {
          const rawProfile = safeGetLocalStorage('school_erp_profile');
          const parsed = rawProfile ? JSON.parse(rawProfile) : null;
          if (parsed && (parsed.nameEn || parsed.nameBn)) {
            window.dispatchEvent(new CustomEvent('school_profile_updated', { detail: parsed }));
          }
        }
      }

      return changed;
    } finally {
      setTimeout(() => {
        isApplyingCloudUpdate = false;
      }, 300);
    }
  },

  /**
   * Push ONLY a specific slice to Firestore (ultra-fast, ~20ms, eliminates 1MB overhead)
   */
  async pushSliceToCloud(sliceName: SliceType): Promise<boolean> {
    if (isApplyingCloudUpdate) return false;
    const tenantId = getDomainTenantId();
    try {
      const timestamp = new Date().toISOString();
      const myDeviceId = getDeviceId();
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const keys = DATA_SLICES[sliceName];
      const sliceData = this.getSlicePayload(keys);
      const docRef = doc(db, CLOUD_SYNC_COLLECTION, `${tenantId}__${sliceName}`);

      await setDoc(
        docRef,
        {
          ...sliceData,
          slice: sliceName,
          tenantId,
          domain,
          deviceId: myDeviceId,
          updatedAt: timestamp,
          clientTimestamp: Date.now(),
        },
        { merge: true }
      );

      safeSetLocalStorage(`school_erp_sync_${sliceName}`, timestamp);
      safeSetLocalStorage(LAST_SYNC_KEY, timestamp);
      notifyStatus({
        isSyncing: false,
        lastSyncedAt: timestamp,
        hasCloudData: true,
        tenantId,
        error: null,
      });
      return true;
    } catch (err: any) {
      console.warn(`[CloudSync] pushSliceToCloud failed for ${sliceName}:`, err);
      return false;
    }
  },

  /**
   * Push all slices to Firestore for THIS domain
   */
  async pushLocalToCloud(force: boolean = false): Promise<boolean> {
    if (isApplyingCloudUpdate && !force) return false;

    const tenantId = getDomainTenantId();
    notifyStatus({ isSyncing: true, error: null, tenantId });
    try {
      const timestamp = new Date().toISOString();
      const myDeviceId = getDeviceId();
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

      const sliceEntries = Object.entries(DATA_SLICES);
      for (const [sliceName, keys] of sliceEntries) {
        const sliceData = this.getSlicePayload(keys);
        const docRef = doc(db, CLOUD_SYNC_COLLECTION, `${tenantId}__${sliceName}`);
        await setDoc(
          docRef,
          {
            ...sliceData,
            slice: sliceName,
            tenantId,
            domain,
            deviceId: myDeviceId,
            updatedAt: timestamp,
            clientTimestamp: Date.now(),
          },
          { merge: true }
        );
        safeSetLocalStorage(`school_erp_sync_${sliceName}`, timestamp);
      }

      // Also update master tenant index document
      const indexDocRef = doc(db, CLOUD_SYNC_COLLECTION, tenantId);
      await setDoc(
        indexDocRef,
        {
          tenantId,
          domain,
          deviceId: myDeviceId,
          updatedAt: timestamp,
          clientTimestamp: Date.now(),
        },
        { merge: true }
      );

      safeSetLocalStorage(LAST_SYNC_KEY, timestamp);
      notifyStatus({
        isSyncing: false,
        lastSyncedAt: timestamp,
        hasCloudData: true,
        tenantId,
        error: null,
      });
      return true;
    } catch (err: any) {
      console.warn(`[CloudSync] Push to Firestore failed for ${tenantId}:`, err);
      notifyStatus({
        isSyncing: false,
        error: err?.message || 'Cloud sync upload failed',
      });
      return false;
    }
  },

  /**
   * Pull all slices from Firestore for THIS domain into local storage
   */
  async pullFromCloud(): Promise<boolean> {
    const tenantId = getDomainTenantId();
    notifyStatus({ isSyncing: true, error: null, tenantId });
    try {
      let hasAnyCloudData = false;
      const sliceEntries = Object.entries(DATA_SLICES);

      for (const [sliceName] of sliceEntries) {
        const docRef = doc(db, CLOUD_SYNC_COLLECTION, `${tenantId}__${sliceName}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          hasAnyCloudData = true;
          const cloudData = snap.data();
          this.applySnapshotToLocal(cloudData, cloudData.updatedAt);
          safeSetLocalStorage(`school_erp_sync_${sliceName}`, cloudData.updatedAt || '');
        }
      }

      // Check legacy single-document format if slices are not yet present
      if (!hasAnyCloudData) {
        const legacyDocRef = doc(db, CLOUD_SYNC_COLLECTION, tenantId);
        const legacySnap = await getDoc(legacyDocRef);
        if (legacySnap.exists()) {
          const cloudData = legacySnap.data();
          this.applySnapshotToLocal(cloudData, cloudData.updatedAt);
          await this.pushLocalToCloud(true);
          return true;
        } else {
          // Brand new domain without Firestore record yet:
          // Upload initial local configuration to Firestore
          await this.pushLocalToCloud(true);
          return true;
        }
      }

      return true;
    } catch (err: any) {
      console.warn(`[CloudSync] Pull from Firestore failed for ${tenantId}:`, err);
      notifyStatus({
        isSyncing: false,
        error: err?.message || 'Could not fetch from cloud database',
      });
      return false;
    }
  },

  /**
   * Debounced sync trigger to upload changes to Firestore
   */
  scheduleCloudSync(delayMs: number = 300): void {
    if (isApplyingCloudUpdate) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      this.pushLocalToCloud();
    }, delayMs);
  },

  /**
   * Initialize real-time synchronization on app load
   */
  initialize(): () => void {
    const tenantId = getDomainTenantId();

    // 1. Initial cloud pull for this domain
    this.pullFromCloud().catch(() => {});

    // 2. Real-time Firestore snapshot listeners for THIS domain's slices
    const unsubscribers: (() => void)[] = [];
    const myDeviceId = getDeviceId();

    const sliceNames = Object.keys(DATA_SLICES) as SliceType[];
    sliceNames.forEach((sliceName) => {
      try {
        const docRef = doc(db, CLOUD_SYNC_COLLECTION, `${tenantId}__${sliceName}`);
        const unsub = onSnapshot(
          docRef,
          (snap: any) => {
            if (snap.exists()) {
              const data = snap.data();
              const cloudTime = data.updatedAt || '';
              const sliceSyncKey = `school_erp_sync_${sliceName}`;
              const lastSliceTime = safeGetLocalStorage(sliceSyncKey) || '';
              const incomingDeviceId = data.deviceId || '';

              // CRITICAL: Compare against THIS slice's last sync time so other slices are NEVER blocked!
              if (incomingDeviceId !== myDeviceId && cloudTime && cloudTime !== lastSliceTime && !isApplyingCloudUpdate) {
                this.applySnapshotToLocal(data, cloudTime);
                safeSetLocalStorage(sliceSyncKey, cloudTime);
              }
            }
          },
          (err: any) => {
            console.warn(`[CloudSync] Real-time listener error for ${tenantId}__${sliceName}:`, err);
          }
        );
        unsubscribers.push(unsub);
      } catch (e) {
        console.warn(`[CloudSync] Could not set up onSnapshot listener for ${sliceName}:`, e);
      }
    });

    // 3. Online/Offline network listeners
    const handleOnline = () => {
      notifyStatus({ isOnline: true });
      this.pullFromCloud().catch(() => {});
    };
    const handleOffline = () => {
      notifyStatus({ isOnline: false });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      unsubscribers.forEach((u) => u());
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  },
};
