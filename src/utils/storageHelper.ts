/**
 * Quota-safe storage manager and client-side image compression
 * Prevents QuotaExceededError in localStorage (5MB browser limit).
 */

export function cleanupOversizedLocalStorage(): void {
  try {
    // 1. Check and compress students with giant camera base64 photos
    const rawStudents = localStorage.getItem('school_erp_students');
    if (rawStudents && rawStudents.length > 300000) {
      try {
        const students = JSON.parse(rawStudents);
        if (Array.isArray(students)) {
          let modified = false;
          const cleaned = students.map((s: any) => {
            if (s && s.photoUrl && typeof s.photoUrl === 'string' && s.photoUrl.startsWith('data:') && s.photoUrl.length > 40000) {
              modified = true;
              // Remove oversized base64 to free up megabytes of browser storage quota
              return { ...s, photoUrl: '' };
            }
            return s;
          });
          if (modified) {
            localStorage.setItem('school_erp_students', JSON.stringify(cleaned));
          }
        }
      } catch {}
    }

    // 2. Check enquiries with oversized photos
    const rawEnq = localStorage.getItem('school_erp_enquiries');
    if (rawEnq && rawEnq.length > 250000) {
      try {
        const enqs = JSON.parse(rawEnq);
        if (Array.isArray(enqs)) {
          let mod = false;
          const cleaned = enqs.map((e: any) => {
            if (e && e.photoUrl && typeof e.photoUrl === 'string' && e.photoUrl.startsWith('data:') && e.photoUrl.length > 40000) {
              mod = true;
              return { ...e, photoUrl: '' };
            }
            return e;
          });
          if (mod) {
            localStorage.setItem('school_erp_enquiries', JSON.stringify(cleaned));
          }
        }
      } catch {}
    }

    // 3. Trim homework submissions with giant images
    const rawSubs = localStorage.getItem('school_erp_homework_submissions');
    if (rawSubs && rawSubs.length > 400000) {
      try {
        const subs = JSON.parse(rawSubs);
        if (Array.isArray(subs)) {
          const cleaned = subs.map((sub: any) => {
            if (Array.isArray(sub.imageUrls)) {
              return {
                ...sub,
                imageUrls: sub.imageUrls.filter((img: string) => typeof img === 'string' && img.length < 50000),
              };
            }
            return sub;
          });
          localStorage.setItem('school_erp_homework_submissions', JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 4. Trim audit logs to last 20
    const rawAudit = localStorage.getItem('school_erp_attendance_audit');
    if (rawAudit && rawAudit.length > 150000) {
      try {
        const logs = JSON.parse(rawAudit);
        if (Array.isArray(logs) && logs.length > 20) {
          localStorage.setItem('school_erp_attendance_audit', JSON.stringify(logs.slice(0, 20)));
        }
      } catch {}
    }

    // 5. Trim old messages
    const rawMsgs = localStorage.getItem('school_erp_website_messages');
    if (rawMsgs && rawMsgs.length > 150000) {
      try {
        const msgs = JSON.parse(rawMsgs);
        if (Array.isArray(msgs) && msgs.length > 20) {
          localStorage.setItem('school_erp_website_messages', JSON.stringify(msgs.slice(0, 20)));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('cleanupOversizedLocalStorage warning:', err);
  }
}

export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`localStorage.setItem failed for key "${key}", running quota cleanup:`, e);
    try {
      cleanupOversizedLocalStorage();
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`localStorage quota still exceeded for "${key}", storing in sessionStorage:`, e2);
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch {}
      return false;
    }
  }
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
    return sessionStorage.getItem(key);
  } catch {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export function safeRemoveLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

/**
 * Compresses an image file or data URL to passport size (< 40KB)
 */
export async function compressImageToPassportSize(
  imageSource: string | File,
  maxWidth = 240,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => {
        resolve(typeof imageSource === 'string' ? imageSource : '');
      };

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imageSource);
      }
    } catch {
      resolve(typeof imageSource === 'string' ? imageSource : '');
    }
  });
}
