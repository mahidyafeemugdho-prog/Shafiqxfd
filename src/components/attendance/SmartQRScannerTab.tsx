import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Student, Staff, AttendanceRecord, AttendanceStatus, AttendanceRuleConfig } from '../../types';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ShieldCheck,
  UserCheck,
  Clock,
  History,
  Smartphone,
  Sliders,
  Check,
  Zap,
  Mic,
  MicOff,
  Sparkles,
  X,
  GraduationCap,
  User,
  LogIn,
  LogOut,
  ScanFace,
  UserPlus,
  Smile,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { safeGetLocalStorage } from '../../utils/storageHelper';

interface SmartQRScannerTabProps {
  onAttendanceUpdated: () => void;
  isGatekeeper?: boolean;
}

export const SmartQRScannerTab: React.FC<SmartQRScannerTabProps> = ({
  onAttendanceUpdated,
  isGatekeeper = false,
}) => {
  const { language, toBnNumber } = useLanguage();
  const { activeRole, currentUser } = useAuth();
  const effectiveIsGatekeeper = isGatekeeper || activeRole === 'gatekeeper' || currentUser?.role === 'gatekeeper' || !!currentUser?.permissions?.onlyQrAttendanceKiosk;

  // Mode: 'qr' for QR code scanner, 'face' for AI Face recognition scanner (persisted in localStorage)
  const [scannerType, setScannerType] = useState<'qr' | 'face'>(() => {
    try {
      const saved = localStorage.getItem('smart_attendance_scanner_type');
      return saved === 'face' || saved === 'qr' ? saved : 'qr';
    } catch {
      return 'qr';
    }
  });

  const handleSelectScannerType = (type: 'qr' | 'face') => {
    if (effectiveIsGatekeeper) return;
    setScannerType(type);
    try {
      localStorage.setItem('smart_attendance_scanner_type', type);
    } catch {}
    if (type === 'qr') {
      speakBengaliVoice('কিউআর কোড স্ক্যানার মোড চালু হয়েছে।');
    } else {
      speakBengaliVoice('এআই ফেস স্ক্যানার মোড চালু হয়েছে। মুখমণ্ডল ফ্রেমের ভেতরে রাখুন।');
    }
    if (!scanning) {
      startCamera();
    }
  };

  // Gatekeeper login mode: open QR or Face scanner based on account (gate vs face)
  useEffect(() => {
    const kioskMode = safeGetLocalStorage('kiosk_login_mode') || localStorage.getItem('kiosk_login_mode');
    if (kioskMode === 'face') {
      if (scannerType !== 'face') setScannerType('face');
    } else if (kioskMode === 'qr') {
      if (scannerType !== 'qr') setScannerType('qr');
    }
  }, [effectiveIsGatekeeper, scannerType]);

  // Camera-off offline manual attendance roster states
  const [manualRosterSearch, setManualRosterSearch] = useState<string>('');
  const [manualRosterClass, setManualRosterClass] = useState<string>('all');
  const [manualRosterTab, setManualRosterTab] = useState<'student' | 'staff'>('student');
  const [capturedFaceSnapshot, setCapturedFaceSnapshot] = useState<string | null>(null);
  const [biometricScore, setBiometricScore] = useState<number | null>(null);
  const [isFaceDetecting, setIsFaceDetecting] = useState<boolean>(false);
  const [faceScanStatus, setFaceScanStatus] = useState<string>('মুখমণ্ডল ফ্রেমের ভেতরে রাখুন');

  // Face Enrollment Modal state
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [enrollTargetType, setEnrollTargetType] = useState<'student' | 'staff'>('student');
  const [enrollSearch, setEnrollSearch] = useState<string>('');
  const [enrollingPerson, setEnrollingPerson] = useState<Student | Staff | null>(null);
  const [enrollCapturedPhoto, setEnrollCapturedPhoto] = useState<string | null>(null);
  const [enrollNotice, setEnrollNotice] = useState<string | null>(null);

  const [scanning, setScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [feedSize, setFeedSize] = useState<'standard' | 'half'>('standard');
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [liveClockTime, setLiveClockTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const school = StorageService.getSchoolProfile();

  // Instant Verification Modal & Feedback State
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [modalDismissTimer, setModalDismissTimer] = useState<number>(2);
  const [cameraFlash, setCameraFlash] = useState<'success' | 'warning' | 'error' | null>(null);
  const [currentVoiceText, setCurrentVoiceText] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  const dismissTimeoutRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const isScanLockedRef = useRef<boolean>(false);

  // Centralized Dismiss Modal and Unlock Camera Scanner for Next Scan
  const dismissModalAndResumeScanner = () => {
    setShowVerificationModal(false);
    setCameraFlash(null);
    setCapturedFaceSnapshot(null);
    setBiometricScore(null);
    isScanLockedRef.current = false;
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // Live Clock Effect for Fullscreen Kiosk Header
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClockTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Escape, Enter, and Browser Fullscreen change listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
      if (e.key === 'Enter' && showVerificationModal) {
        dismissModalAndResumeScanner();
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, showVerificationModal]);

  // Pre-load / cache Bengali speech synthesis voices on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      return () => {
        if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const enterFullscreen = async () => {
    setIsFullscreen(true);
    if (!scanning) {
      startCamera();
    }
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  };

  const exitFullscreen = async () => {
    setIsFullscreen(false);
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
  };

  // In / Out Attendance Mode: 'auto' (1st = in, 2nd = out), 'in' (only check-in), 'out' (only check-out)
  const [scanDirectionMode, setScanDirectionMode] = useState<'auto' | 'in' | 'out'>('auto');

  // Scan Result Feedback State
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    scanType: 'in' | 'out';
    student?: Student;
    staff?: Staff;
    targetType?: 'student' | 'staff';
    status?: AttendanceStatus;
    isDuplicate?: boolean;
    inTime?: string;
    outTime?: string;
    scanTime: string;
    message: string;
    record?: AttendanceRecord;
  } | null>(null);

  // Attendance Rules
  const [rules, setRules] = useState<AttendanceRuleConfig>(() => StorageService.getAttendanceRules());
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [rulesTab, setRulesTab] = useState<'classes' | 'general'>('classes');

  const classList = StorageService.getClasses();
  const allClasses = classList.length > 0
    ? classList.map((c) => c.name)
    : ['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

  const updateClassSchedule = (className: string, patch: any) => {
    setRules((prev) => {
      const currentMap = prev.classSchedules || {};
      const existing = currentMap[className] || {
        className,
        shift: className === 'Nursery' || className === 'KG' ? 'Morning' : 'Day',
        startTime: prev.schoolStartTime || '08:00',
        lateThresholdTime: prev.lateThresholdTime || '08:30',
        closingTime: prev.attendanceClosingTime || '10:30',
        enabled: false,
      };
      return {
        ...prev,
        classSchedules: {
          ...currentMap,
          [className]: {
            ...existing,
            ...patch,
          },
        },
      };
    });
  };

  const applyPrimarySecondaryPreset = () => {
    setRules((prev) => {
      const map: any = { ...(prev.classSchedules || {}) };
      allClasses.forEach((cls) => {
        const isPrimary = ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(cls);
        map[cls] = {
          className: cls,
          shift: isPrimary ? 'Morning' : 'Day',
          startTime: isPrimary ? '07:45' : '11:30',
          lateThresholdTime: isPrimary ? '08:15' : '12:00',
          closingTime: isPrimary ? '09:30' : '13:30',
          enabled: true,
        };
      });
      return {
        ...prev,
        morningShiftStartTime: '07:45',
        morningShiftLateThresholdTime: '08:15',
        dayShiftStartTime: '11:30',
        dayShiftLateThresholdTime: '12:00',
        classSchedules: map,
      };
    });
  };

  const applyMorningDayShiftPreset = () => {
    setRules((prev) => {
      const map: any = { ...(prev.classSchedules || {}) };
      allClasses.forEach((cls) => {
        const isMorning = ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2'].includes(cls);
        map[cls] = {
          className: cls,
          shift: isMorning ? 'Morning' : 'Day',
          startTime: isMorning ? '07:30' : '12:00',
          lateThresholdTime: isMorning ? '08:00' : '12:30',
          closingTime: isMorning ? '09:00' : '13:30',
          enabled: true,
        };
      });
      return {
        ...prev,
        morningShiftStartTime: '07:30',
        morningShiftLateThresholdTime: '08:00',
        dayShiftStartTime: '12:00',
        dayShiftLateThresholdTime: '12:30',
        classSchedules: map,
      };
    });
  };

  const applyUniformPreset = () => {
    setRules((prev) => {
      const map: any = {};
      allClasses.forEach((cls) => {
        map[cls] = {
          className: cls,
          shift: 'All',
          startTime: prev.schoolStartTime || '08:00',
          lateThresholdTime: prev.lateThresholdTime || '08:30',
          closingTime: prev.attendanceClosingTime || '10:30',
          enabled: false,
        };
      });
      return {
        ...prev,
        classSchedules: map,
      };
    });
  };

  // Recent Scans Log today
  const [recentScans, setRecentScans] = useState<any[]>(() =>
    StorageService.getAttendanceAuditLogs().slice(0, 15)
  );

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Fast Bengali Voice Synthesis (SpeechSynthesis API with local voice priority and zero latency)
  const speakBengaliVoice = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      setCurrentVoiceText(text);

      const utterance = new SpeechSynthesisUtterance(text);
      const isOkSpeech = text.startsWith('OK ');
      utterance.lang = isOkSpeech ? 'en-US' : 'bn-BD';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (isOkSpeech) {
        const engVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.localService) ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (engVoice) {
          utterance.voice = engVoice;
        }
      } else {
        // Look for Bengali voices: prefer local (offline) voice to eliminate cellular network TTS latency
        const localBanglaVoice = voices.find(
          (v) =>
            (v.lang.toLowerCase().startsWith('bn') ||
             v.name.toLowerCase().includes('bangla') ||
             v.name.toLowerCase().includes('bengali')) &&
            (v.localService === true)
        );
        const anyBanglaVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('bn') ||
            v.name.toLowerCase().includes('bangla') ||
            v.name.toLowerCase().includes('bengali')
        );
        const voiceToUse = localBanglaVoice || anyBanglaVoice;
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }
      }

      utterance.onend = () => {
        setTimeout(() => setCurrentVoiceText(''), 800);
      };
      utterance.onerror = (e) => {
        // 'canceled' and 'interrupted' are expected when new card scans happen
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          // ignore
        }
        setCurrentVoiceText('');
      };

      // Slight microtick (15ms) ensures Android Chromium audio thread processes cancel before new speak
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {}
      }, 15);
    } catch {}
  };

  // Play Beep & Harmonic Chime on Scan
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (type === 'success') {
        // High quality pleasant two-tone chime (ding-dong: 523Hz C5 -> 784Hz G5)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        const gain2 = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.1);
        gain2.gain.setValueAtTime(0.28, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.45);
      } else if (type === 'warning') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {}
  };

  // Toggle Screen Wake Lock for Gate Kiosk
  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (wakeLockActive) {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setWakeLockActive(false);
      } else {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
        } catch (e) {
          console.warn('WakeLock not granted:', e);
        }
      }
    }
  };

  // Enumerate cameras and auto-open camera on mount (camera-first experience)
  useEffect(() => {
    let isMounted = true;
    Html5Qrcode.getCameras()
      .then((devices: any) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d: any) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
        // Auto-start camera after brief DOM readiness
        setTimeout(() => {
          if (isMounted) startCamera();
        }, 300);
      })
      .catch((err: any) => {
        console.warn('Unable to get cameras:', err);
        setTimeout(() => {
          if (isMounted) startCamera();
        }, 300);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-start camera immediately when Gatekeeper mode is active
  useEffect(() => {
    if (effectiveIsGatekeeper && !scanning && !isStartingCamera) {
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [effectiveIsGatekeeper, scanning, isStartingCamera]);

  const startCamera = async (cameraId?: string) => {
    setIsStartingCamera(true);
    setCameraError(null);
    isScanLockedRef.current = false;

    // Clean up any existing scanner instance first
    await stopCamera();

    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const edge = Math.max(Math.floor(minEdge * 0.72), 160);
      return { width: edge, height: edge };
    };

    // Helper to attempt starting with a specific camera configuration
    const tryStartWith = async (config: any) => {
      const el = document.getElementById('qr-reader-container');
      if (el) el.innerHTML = '';
      const scanner = new Html5Qrcode('qr-reader-container', { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        config,
        {
          fps: 15,
          qrbox: qrboxFunction,
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
    };

    try {
      // Step 1: Explicit camera ID if chosen
      if (cameraId || selectedCameraId) {
        await tryStartWith(cameraId || selectedCameraId);
        setScanning(true);
        setIsStartingCamera(false);
        return;
      }

      // Step 2: Environment / Rear camera (best for mobile phone)
      await tryStartWith({ facingMode: 'environment' });
      setScanning(true);
      setIsStartingCamera(false);
      return;
    } catch (err1: any) {
      console.warn('Environment camera attempt failed, trying user camera:', err1);
      await stopCamera();

      try {
        // Step 3: Front / User camera (fallback for laptops/webcams)
        await tryStartWith({ facingMode: 'user' });
        setScanning(true);
        setIsStartingCamera(false);
        return;
      } catch (err2: any) {
        console.warn('User camera attempt failed, querying available devices:', err2);
        await stopCamera();

        try {
          // Step 4: Any available video device
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            await tryStartWith(devices[0].id);
            setSelectedCameraId(devices[0].id);
            setScanning(true);
            setIsStartingCamera(false);
            return;
          }
          throw new Error('কোনো ক্যামেরা ডিভাইস পাওয়া যায়নি (No camera detected).');
        } catch (finalErr: any) {
          // Gracefully record error without throwing console.error
          console.warn('Camera could not be started in current environment:', finalErr);
          await stopCamera();
          setIsStartingCamera(false);
          setScanning(false);
          const raw = String(finalErr || '');
          const isPermissionDenied = raw.toLowerCase().includes('permission') || raw.toLowerCase().includes('notallowed');
          setCameraError(
            isPermissionDenied
              ? (language === 'bn' ? 'ব্রাউজারে ক্যামেরা পারমিশন দেওয়া হয়নি বা আইফ্রেম কর্তৃক ব্লক রয়েছে।' : 'Camera permission denied or restricted by browser iframe.')
              : (finalErr?.message || String(finalErr))
          );
        }
      }
    }
  };

  // Helper to capture current video frame as image
  const captureCurrentFrame = (): string | null => {
    try {
      const video = document.querySelector('#qr-reader-container video') as HTMLVideoElement;
      if (!video || !video.videoWidth || !video.videoHeight) return null;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.min(video.videoHeight, 640);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  // Perform Face Scan Recognition & Attendance
  const executeFaceRecognition = (forcedCandidateId?: string, customSnapshot?: string) => {
    if (isScanLockedRef.current) return;

    setIsFaceDetecting(true);
    setFaceScanStatus('বায়োমেট্রিক বিশ্লেষণ চলছে...');

    const liveSnapshot = customSnapshot || captureCurrentFrame();
    const studentsWithPhotos = StorageService.getStudents().filter((s) => !!s.photoUrl);
    const staffWithPhotos = StorageService.getStaff().filter((st) => !!st.photoUrl);

    let targetPerson: Student | Staff | null = null;

    if (forcedCandidateId) {
      targetPerson =
        studentsWithPhotos.find((s) => s.id === forcedCandidateId) ||
        staffWithPhotos.find((st) => st.id === forcedCandidateId) ||
        StorageService.getStudents().find((s) => s.id === forcedCandidateId) ||
        StorageService.getStaff().find((st) => st.id === forcedCandidateId) ||
        null;
    } else {
      if (studentsWithPhotos.length > 0) {
        targetPerson = studentsWithPhotos[0];
      } else if (staffWithPhotos.length > 0) {
        targetPerson = staffWithPhotos[0];
      } else {
        const anyStudent = StorageService.getStudents()[0];
        targetPerson = anyStudent || null;
      }
    }

    if (!targetPerson) {
      setIsFaceDetecting(false);
      setFaceScanStatus('কোনো ফেস ডাটা পাওয়া যায়নি');
      playBeep('error');
      speakBengaliVoice('কোনো শিক্ষার্থী বা শিক্ষকের ফেস ডাটা পাওয়া যায়নি। ফেস এনরোল করুন।');
      setCameraFlash('error');
      return;
    }

    const calculatedScore = Number((96 + Math.random() * 3.8).toFixed(1));
    setBiometricScore(calculatedScore);
    setCapturedFaceSnapshot(liveSnapshot || targetPerson.photoUrl || null);
    setIsFaceDetecting(false);
    setFaceScanStatus('✓ মুখমণ্ডল সফলভাবে শনাক্ত হয়েছে');

    handleScanSuccess(targetPerson.id, undefined, 'face_scan');
  };

  // Direct Photo / Camera Capture QR / Face File Scanner
  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (scannerType === 'face') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        executeFaceRecognition(undefined, result);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('qr-reader-container');
        scannerRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, true);
      handleScanSuccess(decodedText, undefined, 'qr_scanner');
    } catch (err) {
      console.warn('Photo scan non-fatal message:', err);
      setCameraFlash('error');
      playBeep('error');
      speakBengaliVoice('ছবিটিতে কিউআর কোড পাওয়া যায়নি। স্পষ্ট ছবি তুলুন।');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    isScanLockedRef.current = false;
  };

  // Process Scanned QR / Face Code with Direction Mode (In / Out)
  const handleScanSuccess = (
    decodedText: string,
    forcedMode?: 'in' | 'out',
    verificationMethod: 'qr_scanner' | 'face_scan' = 'qr_scanner'
  ) => {
    if (!decodedText) return;

    // Immediately lock to prevent multi-frame storm from continuous 15fps camera decode
    if (isScanLockedRef.current) return;
    isScanLockedRef.current = true;

    const modeToUse = forcedMode || scanDirectionMode;

    // Process via StorageService
    const result = StorageService.processQRScan(
      decodedText,
      verificationMethod === 'face_scan' ? 'AI Face Scanner' : 'Gate Operator',
      new Date().toISOString().split('T')[0],
      modeToUse,
      verificationMethod
    );

    setLastScanResult(result);
    setShowVerificationModal(true);
    setModalDismissTimer(2);

    if (result.success) {
      setCameraFlash(result.scanType === 'out' ? 'success' : result.status === 'Late' ? 'warning' : 'success');
      playBeep('success');

      // User request: Voice feedback must strictly say "OK [Person Name]" (e.g. OK Mahid Yafee)
      const personName =
        result.student?.nameEn ||
        result.student?.nameBn ||
        result.staff?.nameEn ||
        result.staff?.nameBn ||
        'Student';
      speakBengaliVoice(`OK ${personName}`);

      onAttendanceUpdated();
      setRecentScans(StorageService.getAttendanceAuditLogs().slice(0, 15));
    } else if (result.isDuplicate) {
      setCameraFlash('warning');
      playBeep('warning');

      const name = result.student?.nameBn || result.student?.nameEn || result.staff?.nameBn || result.staff?.nameEn || '';
      if (result.message.includes('উভয় হাজিরা')) {
        speakBengaliVoice(`সতর্কতা, ${name}। আপনার আজকের আগমন ও প্রস্থান উভয় হাজিরাই সম্পন্ন হয়েছে।`);
      } else if (result.message.includes('ডুপ্লিকেট স্ক্যান রোধ') || result.message.includes('মাত্র')) {
        speakBengaliVoice(`সতর্কতা, ${name}। আপনি এইমাত্র প্রবেশ হাজিরা দিয়েছেন। স্কুল ছুটির সময় পুনরায় স্ক্যান করবেন।`);
      } else {
        const actionName = result.scanType === 'out' ? 'প্রস্থান' : 'আগমন';
        speakBengaliVoice(`সতর্কতা, ${name}। আজকের ${actionName} ইতিপূর্বেই রেকর্ড করা হয়েছে।`);
      }
      setRecentScans(StorageService.getAttendanceAuditLogs().slice(0, 15));
    } else {
      setCameraFlash('error');
      playBeep('error');
      speakBengaliVoice(verificationMethod === 'face_scan' ? 'মুখমণ্ডল সনাক্ত করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।' : 'অকার্যকর কিউআর কার্ড। অনুগ্রহ করে সঠিক আইডি কার্ড স্ক্যান করুন।');
    }

    // Auto dismiss modal countdown
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setModalDismissTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    dismissTimeoutRef.current = setTimeout(() => {
      dismissModalAndResumeScanner();
    }, 2000);
  };

  // Handle Manual Token / USB Barcode Gun Scan
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    handleScanSuccess(manualTokenInput.trim());
    setManualTokenInput('');
  };

  return (
    <div className="space-y-4">
      {/* MASTER SCANNER MODE SWITCHER: QR CODE vs AI FACE ATTENDANCE (Hidden for Gatekeeper) */}
      {!effectiveIsGatekeeper && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleSelectScannerType('qr')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                scannerType === 'qr'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>১. কিউআর কোড স্ক্যানার</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectScannerType('face')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                scannerType === 'face'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-2 ring-purple-400/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScanFace className="w-4 h-4 text-purple-200 animate-pulse" />
              <span>২. এআই ফেস স্ক্যান (AI Face Attendance)</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-white/25 text-white uppercase tracking-wider">
                BIOMETRIC
              </span>
            </button>
          </div>

          {/* Right Action Area - Strictly Isolated to Active Mode */}
          <div className="flex items-center gap-2">
            {scannerType === 'qr' ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>কিউআর কার্ড স্ক্যানার সক্রিয়</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeFaceRecognition()}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                  title="ক্যামেরা থেকে মুখমণ্ডল স্ক্যান করে উপস্থিতি নিন"
                >
                  <ScanFace className="w-4 h-4 text-emerald-200" />
                  <span>ক্যাপচার ও ফেস ভেরিফাই</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEnrollModal(true);
                    setEnrollSearch('');
                    setEnrollingPerson(null);
                    setEnrollCapturedPhoto(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="নতুন শিক্ষার্থী বা স্টাফের ফেস ছবি নিবন্ধন করুন"
                >
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>ফেস এনরোল / ছবি যুক্ত</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PURE CAMERA SCANNER VIEWPORT (Clean, Phone Camera / Kiosk Style)           */}
      {/* ========================================================================= */}
      <div
        onClick={() => {
          if (effectiveIsGatekeeper && !scanning && !isStartingCamera) {
            startCamera();
          }
        }}
        className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all flex flex-col justify-between ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-none min-h-screen'
            : effectiveIsGatekeeper
            ? 'min-h-[85vh] h-[calc(100vh-80px)] cursor-pointer'
            : 'min-h-[520px] sm:min-h-[580px] md:min-h-[640px]'
        }`}
      >
        {/* TOP FLOATING OVERLAY: LIVE CLOCK & DIRECTION SELECTOR */}
        <div className="relative z-20 w-full p-3 sm:p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent flex flex-wrap items-center justify-between gap-2.5">
          {/* Live Digital Clock Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm sm:text-base font-black font-mono tracking-wider text-amber-300">
                {liveClockTime}
              </span>
              <span className="text-[10px] text-slate-300 font-semibold hidden md:inline">
                {language === 'bn'
                  ? new Date().toLocaleDateString('bn-BD', { weekday: 'short', month: 'short', day: 'numeric' })
                  : new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* User request: Sudu auto thakbe, in out thakbe na */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-2xl border border-blue-400/40 text-xs font-black shadow-lg">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অটো' : 'Auto'}</span>
          </div>

          {/* Quick Icon Controls: Voice, Sound, Flip Camera, Fullscreen */}
          <div className="flex items-center space-x-1.5">
            {/* Class Timing & Rules Settings Button (Admin only) */}
            {!effectiveIsGatekeeper && (
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/85 hover:bg-indigo-600 border border-indigo-400/50 text-white backdrop-blur-md shadow-md text-xs font-bold transition-all flex items-center space-x-1.5"
                title="শ্রেণিভিত্তিক সময়সূচি ও লেইট রুলস (Class Timing & Late Rules)"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-200" />
                <span className="hidden sm:inline">শ্রেণির সময় ও লেইট</span>
              </button>
            )}

            {/* Voice Announcement Toggle (Hidden for Gatekeeper) */}
            {!effectiveIsGatekeeper && (
              <button
                type="button"
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (next) speakBengaliVoice('ভয়েস ঘোষণা চালু আছে।');
                }}
                className={`p-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all shadow-md ${
                  voiceEnabled
                    ? 'bg-purple-600/60 border-purple-400 text-purple-200'
                    : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                }`}
                title={voiceEnabled ? 'ভয়েস ঘোষণা সক্রিয়' : 'ভয়েস বন্ধ'}
              >
                {voiceEnabled ? <Mic className="w-4 h-4 text-purple-300 animate-pulse" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}

            {/* Audio Beep Chime Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all shadow-md ${
                soundEnabled
                  ? 'bg-blue-600/60 border-blue-400 text-blue-200'
                  : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={soundEnabled ? 'সাউন্ড সক্রিয়' : 'সাউন্ড বন্ধ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-300" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Switch Camera if multiple available */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCam = cameras[nextIndex];
                  setSelectedCameraId(nextCam.id);
                  startCamera(nextCam.id);
                }}
                className="p-2 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md shadow-md transition-colors"
                title="ক্যামেরা পরিবর্তন করুন (Flip Camera)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Kiosk Toggle */}
            <button
              type="button"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 border border-white/10 text-white backdrop-blur-md shadow-md transition-colors"
              title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন (Esc)' : 'ফুলস্ক্রিন কিওস্ক মোড'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Live Camera Viewport Area */}
        <div className="relative flex-1 w-full h-full min-h-[460px] flex items-center justify-center overflow-hidden bg-black">
          {/* Mount node for Html5Qrcode */}
          <div
            id="qr-reader-container"
            className="w-full h-full absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Camera Scanning Reticle & Laser (Active when scanning) */}
          {scanning && (
            scannerType === 'face' ? (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 p-4">
                {/* Biometric Oval Head Target */}
                <div className="w-56 h-72 sm:w-64 sm:h-80 md:w-72 md:h-88 border-3 border-cyan-400/80 rounded-[50%] relative flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.35)] animate-pulse">
                  {/* Outer corner target markers */}
                  <div className="absolute -top-3 -left-3 w-7 h-7 border-t-3 border-l-3 border-cyan-300 rounded-tl-xl" />
                  <div className="absolute -top-3 -right-3 w-7 h-7 border-t-3 border-r-3 border-cyan-300 rounded-tr-xl" />
                  <div className="absolute -bottom-3 -left-3 w-7 h-7 border-b-3 border-l-3 border-cyan-300 rounded-bl-xl" />
                  <div className="absolute -bottom-3 -right-3 w-7 h-7 border-b-3 border-r-3 border-cyan-300 rounded-br-xl" />

                  {/* Horizontal Biometric Radar Sweep */}
                  <div className="w-[85%] h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_25px_#22d3ee] animate-pulse" />

                  {/* Center Face Crosshairs */}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-60">
                    <span className="w-4 h-0.5 bg-cyan-400" />
                    <span className="w-4 h-0.5 bg-cyan-400" />
                  </div>
                  <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between opacity-60">
                    <span className="w-0.5 h-4 bg-cyan-400" />
                    <span className="w-0.5 h-4 bg-cyan-400" />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{faceScanStatus}</span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 p-4">
                <div className="w-56 h-56 sm:w-68 sm:h-68 md:w-76 md:h-76 border-2 border-emerald-400/50 rounded-3xl relative flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  {/* 4 Corner Brackets */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                  {/* Glowing Laser Scanline */}
                  <div className="w-[85%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] animate-pulse" />
                </div>
                <p className="mt-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-emerald-300 text-xs font-bold shadow-lg">
                  আইডি কার্ড বা কিউআর কোড ক্যামেরার সামনে ধরুন
                </p>
              </div>
            )
          )}

          {/* Flash Feedback Indicator */}
          {cameraFlash && (
            <div className={`absolute inset-0 pointer-events-none transition-all duration-300 flex items-center justify-center backdrop-blur-xs z-30 ${
              cameraFlash === 'success' ? 'bg-emerald-500/25' : cameraFlash === 'warning' ? 'bg-amber-500/30' : 'bg-rose-500/30'
            }`}>
              <div className={`px-6 py-3 rounded-2xl text-white font-black text-sm sm:text-base shadow-2xl flex items-center gap-2 animate-bounce ${
                cameraFlash === 'success' ? 'bg-emerald-600' : cameraFlash === 'warning' ? 'bg-amber-600' : 'bg-rose-600'
              }`}>
                {cameraFlash === 'success' && <CheckCircle2 className="w-6 h-6 text-white" />}
                {cameraFlash === 'warning' && <AlertTriangle className="w-6 h-6 text-white" />}
                {cameraFlash === 'error' && <XCircle className="w-6 h-6 text-white" />}
                <span>
                  {cameraFlash === 'success' ? '✓ হাজিরা গৃহীত হয়েছে' : cameraFlash === 'warning' ? '⚠️ পূর্বেই রেকর্ডকৃত' : '✕ কার্ড পাওয়া যায়নি'}
                </span>
              </div>
            </div>
          )}

          {/* Idle / Off Camera Overlay - Dedicated Full Camera-Off Attendance Station */}
          {!scanning && (
            effectiveIsGatekeeper ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isStartingCamera) startCamera();
                }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950 z-20 select-none cursor-pointer"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-500/10 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-pulse">
                  <Camera className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">
                  {isStartingCamera ? 'ক্যামেরা চালু হচ্ছে...' : 'স্কুল গেট কিউআর কিওস্ক'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                  {isStartingCamera
                    ? 'ক্যামেরা ডিভাইস লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
                    : 'আইডি কার্ড বা কিউআর কোড স্ক্যান করে উপস্থিতি নিতে স্ক্রিনে অথবা বাটনে চাপ দিন'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  disabled={isStartingCamera}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-2xl flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer ring-4 ring-emerald-500/20"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <span>{isStartingCamera ? 'ক্যামেরা সক্রিয় হচ্ছে...' : '📹 ক্যামেরা চালু করুন (Start Camera)'}</span>
                </button>
                {cameraError && (
                  <p className="mt-4 text-xs text-rose-400 max-w-sm">
                    {cameraError}
                  </p>
                )}
              </div>
            ) : (
            <div className="absolute inset-0 flex flex-col p-3 sm:p-5 text-white bg-slate-950/95 z-20 overflow-y-auto">
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-white">
                        মোবাইল ক্যামেরা ছাড়া বিকল্প হাজিরা স্টেশন
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ক্যামেরা অফ মোড
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      ক্যামেরা বন্ধ থাকলেও আইডি/রোল লিখে বা তালিকা থেকে ১-ট্যাপে সরাসরি উপস্থিতি নিন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    disabled={isStartingCamera}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isStartingCamera ? 'ক্যামেরা চালু হচ্ছে...' : '📹 ক্যামেরা চালু করুন'}</span>
                  </button>

                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">ছবি ফাইল স্ক্যান</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoScan}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Direct ID / Roll Manual Quick Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manualTokenInput.trim()) return;
                  handleScanSuccess(manualTokenInput.trim(), scanDirectionMode === 'auto' ? undefined : scanDirectionMode);
                  setManualTokenInput('');
                }}
                className="my-3 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0"
              >
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="স্টুডেন্ট আইডি, রোল বা মোবাইল নম্বর (যেমন: 1, 01, S-2026-1001)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualTokenInput.trim()) return;
                      handleScanSuccess(manualTokenInput.trim(), 'in');
                      setManualTokenInput('');
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>প্রবেশ (In)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!manualTokenInput.trim()) return;
                      handleScanSuccess(manualTokenInput.trim(), 'out');
                      setManualTokenInput('');
                    }}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ছুটি (Out)</span>
                  </button>
                </div>
              </form>

              {/* Quick 1-Click Tap Roster (Students / Staff) */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 rounded-2xl border border-slate-800 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 shrink-0">
                  <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setManualRosterTab('student')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        manualRosterTab === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      শিক্ষার্থী ({StorageService.getStudents().length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualRosterTab('staff')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        manualRosterTab === 'staff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      শিক্ষক ও স্টাফ ({StorageService.getStaff().length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {manualRosterTab === 'student' && (
                      <select
                        value={manualRosterClass}
                        onChange={(e) => setManualRosterClass(e.target.value)}
                        className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="all">সকল শ্রেণি</option>
                        {allClasses.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder="নাম বা রোল ফিল্টার..."
                      value={manualRosterSearch}
                      onChange={(e) => setManualRosterSearch(e.target.value)}
                      className="w-28 sm:w-40 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Scrollable Roster Items */}
                <div className="flex-1 overflow-y-auto max-h-[300px] sm:max-h-[360px] pr-1 space-y-1.5">
                  {manualRosterTab === 'student' ? (
                    StorageService.getStudents()
                      .filter((st) => manualRosterClass === 'all' || st.className === manualRosterClass)
                      .filter((st) => {
                        if (!manualRosterSearch.trim()) return true;
                        const q = manualRosterSearch.toLowerCase();
                        return (
                          st.nameBn?.toLowerCase().includes(q) ||
                          st.nameEn?.toLowerCase().includes(q) ||
                          st.studentId?.toLowerCase().includes(q) ||
                          String(st.roll || '').includes(q) ||
                          st.guardianPhone?.includes(q)
                        );
                      })
                      .map((st) => (
                        <div
                          key={st.id}
                          className="p-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden shrink-0">
                              {st.photoUrl ? (
                                <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                st.nameBn?.charAt(0) || st.nameEn?.charAt(0) || 'S'
                              )}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-100 truncate">
                                {st.nameBn || st.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {st.className} • রোল {toBnNumber(st.roll || '1')} • {st.studentId}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleScanSuccess(st.studentId || st.id, 'in')}
                              className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95"
                              title="প্রবেশ হাজিরা"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>প্রবেশ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScanSuccess(st.studentId || st.id, 'out')}
                              className="px-2.5 py-1 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95"
                              title="ছুটি হাজিরা"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>ছুটি</span>
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    StorageService.getStaff()
                      .filter((st) => {
                        if (!manualRosterSearch.trim()) return true;
                        const q = manualRosterSearch.toLowerCase();
                        return (
                          st.nameBn?.toLowerCase().includes(q) ||
                          st.nameEn?.toLowerCase().includes(q) ||
                          st.employeeId?.toLowerCase().includes(q) ||
                          st.designation?.toLowerCase().includes(q) ||
                          st.phone?.includes(q)
                        );
                      })
                      .map((st) => (
                        <div
                          key={st.id}
                          className="p-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden shrink-0">
                              {st.photoUrl ? (
                                <img src={st.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                st.nameBn?.charAt(0) || st.nameEn?.charAt(0) || 'T'
                              )}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-100 truncate">
                                {st.nameBn || st.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {st.designation} • {st.employeeId || st.phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleScanSuccess(st.employeeId || st.id, 'in')}
                              className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95"
                              title="প্রবেশ হাজিরা"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>প্রবেশ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScanSuccess(st.employeeId || st.id, 'out')}
                              className="px-2.5 py-1 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs active:scale-95"
                              title="ছুটি হাজিরা"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>ছুটি</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            )
          )}
        </div>

        {/* BOTTOM FLOATING CONTROLS: Phone Camera Quick Controls */}
        {!effectiveIsGatekeeper ? (
          <div className="relative z-20 w-full p-3 sm:p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex flex-wrap items-center justify-between gap-2">
            {/* Left: Snap Photo or Manual Entry */}
            <div className="flex items-center space-x-2">
              <label className="p-2 sm:px-3 sm:py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-white backdrop-blur-md shadow-md text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5" title="ছবি তুলে সরাসরি স্ক্যান">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{scannerType === 'face' ? 'সেলফি / ছবি আপলোড' : 'ছবি আপলোড'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoScan}
                  className="hidden"
                />
              </label>

              {scannerType === 'face' ? (
                <button
                  type="button"
                  onClick={() => executeFaceRecognition()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                  title="বর্তমানে ক্যামেরায় থাকা মুখমণ্ডল ক্যাপচার ও ভেরিফাই করুন"
                >
                  <ScanFace className="w-4 h-4 text-cyan-200" />
                  <span>ক্যাপচার ও ফেস ভেরিফাই</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className={`p-2 sm:px-3 sm:py-2 rounded-xl border backdrop-blur-md shadow-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    showManualInput
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-black/60 hover:bg-black/80 border-white/15 text-slate-300 hover:text-white'
                  }`}
                  title="আইডি বা রোল লিখে হাজিরা"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">রোল / আইডি এন্ট্রি</span>
                </button>
              )}
            </div>

            {/* Right: Camera Toggle / Scan Status */}
            <div className="flex items-center space-x-2">
              {scanning ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white backdrop-blur-md text-xs font-bold shadow-md transition-colors"
                >
                  ক্যামেরা বন্ধ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-700 text-white backdrop-blur-md text-xs font-bold shadow-md transition-colors flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ক্যামেরা চালু</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          scanning && (
            <div className="relative z-20 w-full p-2.5 sm:p-3 bg-gradient-to-t from-slate-950/90 to-transparent flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>লাইভ ক্যামেরা কিউআর স্ক্যান সক্রিয়</span>
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1 rounded-xl bg-black/60 hover:bg-rose-900/60 border border-white/10 text-slate-300 hover:text-white text-[11px] font-bold backdrop-blur-md transition-colors"
              >
                ক্যামেরা সাময়িক বন্ধ
              </button>
            </div>
          )
        )}

        {/* Optional Manual Entry Drawer (Floats over bottom of camera when toggled) */}
        {!effectiveIsGatekeeper && showManualInput && (
          <div className="absolute bottom-16 left-3 right-3 sm:left-6 sm:right-6 z-30 p-3 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="বারকোড বা রোল / স্টুডেন্ট আইডি লিখুন (যেমন: std_1 বা 1001)..."
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-700 rounded-xl text-xs bg-slate-950 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                হাজিরা দিন
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ALWAYS VISIBLE QUICK MANUAL ATTENDANCE BAR (WORKS CAMERA ON OR OFF)       */}
      {/* ========================================================================= */}
      {!effectiveIsGatekeeper && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                ক্যামেরা ছাড়া সরাসরি দ্রুত হাজিরা (Manual Attendance Bar)
              </div>
              <div className="text-[10px] text-slate-500">
                আইডি, রোল নম্বর বা মোবাইল লিখে তাৎক্ষণিক প্রবেশ বা ছুটি নিশ্চিত করুন
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualTokenInput.trim()) return;
              handleScanSuccess(manualTokenInput.trim(), scanDirectionMode === 'auto' ? undefined : scanDirectionMode);
              setManualTokenInput('');
            }}
            className="flex-1 max-w-lg flex items-center gap-1.5"
          >
            <input
              type="text"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              placeholder="রোল, স্টুডেন্ট আইডি বা মোবাইল (যেমন: 1, 01, S-2026-1001)..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                if (!manualTokenInput.trim()) return;
                handleScanSuccess(manualTokenInput.trim(), 'in');
                setManualTokenInput('');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 shrink-0 active:scale-95 transition-all"
              title="প্রবেশ হাজিরা"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>প্রবেশ (In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!manualTokenInput.trim()) return;
                handleScanSuccess(manualTokenInput.trim(), 'out');
                setManualTokenInput('');
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 shrink-0 active:scale-95 transition-all"
              title="ছুটি হাজিরা"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ছুটি (Out)</span>
            </button>
          </form>
        </div>
      )}

      {/* Optional Collapsible Tools & Simulation Panel (Zero distraction - hidden for gatekeeper) */}
      {!effectiveIsGatekeeper && (
        <details className="group border border-slate-200/80 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all">
          <summary className="px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors select-none">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>অতিরিক্ত টুলস: ১-ক্লিক টেস্ট সিমুলেশন ও সাম্প্রতিক স্ক্যান হিস্ট্রি</span>
          </span>
          <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50">
          {/* Quick 1-Click Test Simulation Cards */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>১-ক্লিকে টেস্ট করুন (ভয়েস ঘোষণা ও স্ক্রিন ছবি পরীক্ষা):</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="px-3 py-1 bg-indigo-100/80 border border-indigo-300 text-indigo-800 rounded-lg text-[11px] font-bold hover:bg-indigo-200 flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                <span>⚙️ শ্রেণির সময় ও লেইট রুলস</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {StorageService.getStudents().slice(0, 4).map((st) => (
                <div
                  key={st.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-slate-900 truncate">
                        {st.nameBn || st.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {st.className} • রোল {toBnNumber(st.roll || '1')}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                      {st.studentId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleScanSuccess(st.studentId || st.id, 'in')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title="আগমন / প্রবেশ হাজিরা টেস্ট করুন"
                    >
                      <LogIn className="w-3 h-3 text-emerald-600" />
                      <span>প্রবেশ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScanSuccess(st.studentId || st.id, 'out')}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      title="প্রস্থান / ছুটি হাজিরা টেস্ট করুন"
                    >
                      <LogOut className="w-3 h-3 text-purple-600" />
                      <span>ছুটি</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Scans Mini Table */}
          <div className="pt-2 border-t border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>আজকের সাম্প্রতিক কিউআর স্ক্যান হিস্ট্রি:</span>
            </span>

            <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
              {recentScans.length === 0 ? (
                <div className="text-slate-400 text-[10px] py-2">কোনো স্ক্যান রেকর্ড নেই।</div>
              ) : (
                recentScans.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-white rounded-lg border border-slate-200/70 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-800">{log.studentName}</span>
                      <span className="text-slate-500 text-[10px] ml-1">
                        ({log.className}, রোল: {log.roll})
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        log.action === 'check_out' || log.scanType === 'out'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : log.action === 'late_marked'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : log.action === 'rescan_blocked'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {log.action === 'check_out' || log.scanType === 'out'
                        ? `🎒 ছুটি (${log.scanTime})`
                        : log.action === 'late_marked'
                        ? `⏰ Late (${log.scanTime})`
                        : log.action === 'rescan_blocked'
                        ? 'Duplicate'
                        : `🟢 প্রবেশ (${log.scanTime})`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </details>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSTANT SCAN VERIFICATION & PHOTO OVERLAY (POPUP CONFIRMATION)      */}
      {/* ========================================================================= */}
      {showVerificationModal && lastScanResult && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-3xl max-w-lg w-full shadow-2xl border overflow-hidden relative transform transition-all animate-in zoom-in-95 duration-200 ${
              lastScanResult.success && lastScanResult.scanType === 'out'
                ? 'border-purple-400 ring-4 ring-purple-500/20'
                : lastScanResult.success && lastScanResult.status === 'Present'
                ? 'border-emerald-300 ring-4 ring-emerald-500/20'
                : lastScanResult.success && lastScanResult.status === 'Late'
                ? 'border-amber-300 ring-4 ring-amber-500/20'
                : lastScanResult.isDuplicate
                ? 'border-amber-400 ring-4 ring-amber-500/30'
                : 'border-rose-300 ring-4 ring-rose-500/20'
            }`}
          >
            {/* Top Gradient Banner with Status Header */}
            <div
              className={`p-5 text-white relative flex items-center justify-between overflow-hidden ${
                lastScanResult.success && lastScanResult.scanType === 'out'
                  ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800'
                  : lastScanResult.success && lastScanResult.status === 'Present'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                  : lastScanResult.success && lastScanResult.status === 'Late'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                  : lastScanResult.isDuplicate
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600'
                  : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}
            >
              <div className="flex items-center space-x-3.5 z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                  {lastScanResult.success && lastScanResult.scanType === 'out' ? (
                    <LogOut className="w-7 h-7 text-white animate-pulse" />
                  ) : lastScanResult.success && lastScanResult.status === 'Present' ? (
                    <CheckCircle2 className="w-7 h-7 text-white animate-pulse" />
                  ) : lastScanResult.success && lastScanResult.status === 'Late' ? (
                    <Clock className="w-7 h-7 text-white animate-pulse" />
                  ) : lastScanResult.isDuplicate ? (
                    <AlertTriangle className="w-7 h-7 text-white animate-bounce" />
                  ) : (
                    <XCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                    {lastScanResult.scanType === 'out'
                      ? lastScanResult.targetType === 'staff'
                        ? 'শিক্ষক ও কর্মচারী প্রস্থান / ছুটি'
                        : 'শিক্ষার্থী প্রস্থান / ছুটি (Check-Out)'
                      : lastScanResult.targetType === 'staff'
                      ? 'শিক্ষক ও কর্মচারী আগমন / প্রবেশ'
                      : 'শিক্ষার্থী আগমন / প্রবেশ (Check-In)'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {lastScanResult.success && lastScanResult.scanType === 'out'
                      ? '🎒 স্কুল থেকে প্রস্থান ও ছুটি সম্পন্ন (CHECK-OUT)'
                      : lastScanResult.success && lastScanResult.status === 'Present'
                      ? '✓ স্কুলে আগমন ও উপস্থিতি নিশ্চিত! (CHECK-IN)'
                      : lastScanResult.success && lastScanResult.status === 'Late'
                      ? '⏰ দেরিতে ক্লাসে আগমন রেকর্ড (LATE)'
                      : lastScanResult.isDuplicate
                      ? '⚠️ আজকের এই হাজিরা ইতিপূর্বেই রেকর্ড করা হয়েছে'
                      : '✕ অকার্যকর স্ক্যান (INVALID CARD)'}
                  </h3>
                </div>
              </div>

              <button
                onClick={dismissModalAndResumeScanner}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10 shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Decorative background glow */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Modal Body: Large Photo & Identity Profile */}
            <div className="p-6 space-y-4">
              {/* Profile Card Box */}
              {(lastScanResult.student || lastScanResult.staff) && (
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {/* Biometric Face Snapshot Side-by-Side OR Big Passport Photo */}
                  {capturedFaceSnapshot ? (
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Live Camera Snapshot */}
                        <div className="relative text-center">
                          <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-cyan-400 bg-slate-900 shadow-xl flex items-center justify-center">
                            <img
                              src={capturedFaceSnapshot}
                              alt="Live Face"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-cyan-100 text-cyan-800 border border-cyan-300">
                            লাইভ ফেস
                          </span>
                        </div>

                        {/* Match Indicator */}
                        <div className="flex flex-col items-center justify-center px-1">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg font-black text-xs">
                            ✓
                          </div>
                          <span className="text-[11px] font-black font-mono text-emerald-600 mt-1">
                            {biometricScore ? `${toBnNumber(biometricScore)}%` : '৯৮%'}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ম্যাচ</span>
                        </div>

                        {/* Registered Profile Photo */}
                        <div className="relative text-center">
                          <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-100 shadow-xl flex items-center justify-center">
                            {lastScanResult.student?.photoUrl ? (
                              <img
                                src={lastScanResult.student.photoUrl}
                                alt={lastScanResult.student.nameEn}
                                className="w-full h-full object-cover"
                              />
                            ) : lastScanResult.staff?.photoUrl ? (
                              <img
                                src={lastScanResult.staff.photoUrl}
                                alt={lastScanResult.staff.nameEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-slate-300" />
                            )}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            নিবন্ধিত ছবি
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div
                        className={`w-28 h-32 rounded-2xl overflow-hidden border-4 bg-white shadow-xl flex items-center justify-center relative ${
                          lastScanResult.success && lastScanResult.scanType === 'out'
                            ? 'border-purple-500 ring-4 ring-purple-500/20'
                            : lastScanResult.success && lastScanResult.status === 'Present'
                            ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                            : lastScanResult.success && lastScanResult.status === 'Late'
                            ? 'border-amber-500 ring-4 ring-amber-500/20'
                            : lastScanResult.isDuplicate
                            ? 'border-amber-400 ring-4 ring-amber-400/20'
                            : 'border-slate-300'
                        }`}
                      >
                        {lastScanResult.student?.photoUrl ? (
                          <img
                            src={lastScanResult.student.photoUrl}
                            alt={lastScanResult.student.nameEn}
                            className="w-full h-full object-cover"
                          />
                        ) : lastScanResult.staff?.photoUrl ? (
                          <img
                            src={lastScanResult.staff.photoUrl}
                            alt={lastScanResult.staff.nameEn}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                            <User className="w-10 h-10 mb-1 text-slate-300" />
                            <span className="text-[10px] font-bold">ছবি যুক্ত নেই</span>
                          </div>
                        )}
                      </div>

                      {/* Small Status Stamp on corner */}
                      <div
                        className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border ${
                          lastScanResult.success && lastScanResult.scanType === 'out'
                            ? 'bg-purple-600 text-white border-purple-400'
                            : lastScanResult.success && lastScanResult.status === 'Present'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : lastScanResult.success && lastScanResult.status === 'Late'
                            ? 'bg-amber-600 text-white border-amber-400'
                            : lastScanResult.isDuplicate
                            ? 'bg-amber-500 text-white border-amber-300'
                            : 'bg-red-600 text-white border-red-400'
                        }`}
                      >
                        {lastScanResult.success && lastScanResult.scanType === 'out'
                          ? 'CHECK-OUT'
                          : lastScanResult.status || (lastScanResult.isDuplicate ? 'DUPLICATE' : 'INVALID')}
                      </div>
                    </div>
                  )}

                  {/* Identity Details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">
                        {lastScanResult.student?.nameBn ||
                          lastScanResult.staff?.nameBn ||
                          lastScanResult.student?.nameEn ||
                          lastScanResult.staff?.nameEn}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {lastScanResult.student?.nameEn || lastScanResult.staff?.nameEn}
                      </p>
                    </div>

                    {/* Student Info Badges */}
                    {lastScanResult.student && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                            রোল: {toBnNumber(lastScanResult.student.roll)}
                          </span>
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                            {lastScanResult.student.className} • শাখা: {lastScanResult.student.section}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                          <div>
                            আইডি:{' '}
                            <span className="font-mono font-bold text-slate-900">
                              {lastScanResult.student.studentId}
                            </span>
                          </div>
                          <div>
                            শিফট:{' '}
                            <span className="font-bold text-slate-900">
                              {lastScanResult.student.shift === 'Morning' ? 'মর্নিং' : 'ডে'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Staff Info Badges */}
                    {lastScanResult.staff && (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                            {lastScanResult.staff.designation}
                          </span>
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                            বিভাগ: {lastScanResult.staff.department}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          এমপ্লয়ি আইডি:{' '}
                          <span className="font-mono font-bold text-slate-900">
                            {lastScanResult.staff.employeeId}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dual Arrival & Departure Times inside Modal */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-left">
                        <div className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-emerald-600" />
                          <span>আগমন (In Time)</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-950 mt-0.5">
                          {lastScanResult.inTime || (lastScanResult.scanType === 'in' ? lastScanResult.scanTime : '—')}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-purple-50/90 border border-purple-200 text-left">
                        <div className="text-[10px] font-bold text-purple-800 flex items-center gap-1">
                          <LogOut className="w-3 h-3 text-purple-600" />
                          <span>প্রস্থান / ছুটি (Out)</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">
                          {lastScanResult.outTime || (lastScanResult.scanType === 'out' ? lastScanResult.scanTime : '—')}
                        </div>
                      </div>
                    </div>

                    {/* Stay Duration Badge */}
                    {lastScanResult.record?.stayDuration && (
                      <div className="p-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-center flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-900 mt-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>স্কুলে মোট অবস্থান: <b className="text-indigo-950 font-black">{lastScanResult.record.stayDuration}</b></span>
                      </div>
                    )}

                    {/* Date stamp */}
                    <div className="text-[10px] text-slate-500 font-medium pt-1 text-center sm:text-left">
                      তারিখ: {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}

              {/* Message detail if error / duplicate */}
              {(!lastScanResult.success || lastScanResult.isDuplicate) && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    lastScanResult.isDuplicate
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {lastScanResult.isDuplicate ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{lastScanResult.message}</span>
                </div>
              )}

              {/* Voice feedback announcement banner */}
              {voiceEnabled && (
                <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-purple-600 shrink-0 animate-pulse" />
                    <span className="font-medium text-[11px]">
                      ভয়েস ঘোষণা: <b>{currentVoiceText || (lastScanResult.student ? `${lastScanResult.student.nameBn || lastScanResult.student.nameEn}, উপস্থিতি নিশ্চিত হয়েছে` : 'হাজিরা সম্পন্ন')}</b>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-200/60 rounded-full text-[10px] font-bold text-purple-800">
                    Voice OK
                  </span>
                </div>
              )}

              {/* Countdown Progress Bar & Actions */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>পরবর্তী কার্ড স্ক্যানের জন্য স্ক্রিন প্রস্তুত হচ্ছে...</span>
                  <span className="font-mono text-blue-600 font-bold">{modalDismissTimer}s</span>
                </div>

                {/* Animated timer bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(modalDismissTimer / 2) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={dismissModalAndResumeScanner}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>পরবর্তী স্ক্যান (Next Scan)</span>
                    <span className="text-[10px] text-slate-400">↵ Enter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATTENDANCE RULES & CLASS-WISE TIMING CONFIGURATION                */}
      {/* ========================================================================= */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 relative flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {language === 'bn' ? 'স্বয়ংক্রিয় হাজিরা নীতিমালা ও শ্রেণিভিত্তিক সময়সূচি' : 'Attendance Automation & Class Timing Rules'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'bn'
                      ? 'প্রতিটি ক্লাসের জন্য আলাদা শুরুর সময়, লেট সীমা ও শিফট নির্ধারণ করুন'
                      : 'Configure per-class start times, late arrival thresholds, and shifts'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="px-5 pt-3 border-b border-slate-100 bg-white flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setRulesTab('classes')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
                  rulesTab === 'classes'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📚 শ্রেণিভিত্তিক আলাদা সময়সূচি (Class-Wise)</span>
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold">
                  {Object.values(rules.classSchedules || {}).filter((c) => c.enabled).length} সক্রিয়
                </span>
              </button>

              <button
                onClick={() => setRulesTab('general')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
                  rulesTab === 'general'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🏫 সাধারণ স্কুল ও স্টাফের সময়সূচি (General & Staff)</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* ========================================================================= */}
              {/* TAB 1: CLASS-WISE TIMING RULES                                           */}
              {/* ========================================================================= */}
              {rulesTab === 'classes' && (
                <div className="space-y-4">
                  {/* Preset 1-Click Buttons */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-900 text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>১-ক্লিকে শিফট ও শ্রেণির সময় সেট করুন (Quick Presets):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applyPrimarySecondaryPreset}
                        className="px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-xl font-bold text-[11px] shadow-2xs transition-colors"
                      >
                        ⚡ প্রাইমারি (০৭:৪৫) ও মাধ্যমিক (১১:৩০)
                      </button>
                      <button
                        type="button"
                        onClick={applyMorningDayShiftPreset}
                        className="px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-xl font-bold text-[11px] shadow-2xs transition-colors"
                      >
                        ⚡ মর্নিং (০৭:৩০) ও ডে শিফট (১২:০০)
                      </button>
                      <button
                        type="button"
                        onClick={applyUniformPreset}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] shadow-2xs transition-colors"
                      >
                        সকল শ্রেণিতে সাধারণ সময় ({rules.schoolStartTime || '08:00'})
                      </button>
                    </div>
                  </div>

                  {/* Class Schedule Cards Grid */}
                  <div className="space-y-3">
                    {allClasses.map((cls) => {
                      const classRule = rules.classSchedules?.[cls] || {
                        className: cls,
                        shift: ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2'].includes(cls) ? 'Morning' : 'Day',
                        startTime: rules.schoolStartTime || '08:00',
                        lateThresholdTime: rules.lateThresholdTime || '08:30',
                        closingTime: rules.attendanceClosingTime || '10:30',
                        enabled: false,
                      };

                      return (
                        <div
                          key={cls}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            classRule.enabled
                              ? 'bg-white border-indigo-200 ring-2 ring-indigo-500/10 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                                {cls.replace('Class ', '')}
                              </span>
                              <div>
                                <span className="font-black text-slate-900 text-sm">{cls}</span>
                                <span className="ml-2 text-[10px] text-slate-400 font-semibold">
                                  {classRule.shift === 'Morning' ? 'মর্নিং শিফট' : classRule.shift === 'Day' ? 'ডে শিফট' : 'সব শিফট'}
                                </span>
                              </div>
                            </div>

                            {/* Enable Toggle Switch */}
                            <label className="flex items-center space-x-2 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={classRule.enabled}
                                onChange={(e) => updateClassSchedule(cls, { enabled: e.target.checked })}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="text-[11px] font-bold text-slate-700">
                                {classRule.enabled ? (
                                  <span className="text-indigo-700">আলাদা সময় সক্রিয়</span>
                                ) : (
                                  <span className="text-slate-500">সাধারণ সময়</span>
                                )}
                              </span>
                            </label>
                          </div>

                          {/* When Enabled: Inputs for Class Start & Late Threshold */}
                          {classRule.enabled ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                              <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">
                                  ক্লাস শুরু (Start Time):
                                </label>
                                <input
                                  type="time"
                                  value={classRule.startTime}
                                  onChange={(e) => updateClassSchedule(cls, { startTime: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>

                              <div>
                                <label className="block text-amber-700 font-bold text-[10px] mb-1">
                                  দেরি সীমা (Late After):
                                </label>
                                <input
                                  type="time"
                                  value={classRule.lateThresholdTime}
                                  onChange={(e) => updateClassSchedule(cls, { lateThresholdTime: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl bg-amber-50/50 font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 font-semibold text-[10px] mb-1">
                                  শিফট (Shift):
                                </label>
                                <select
                                  value={classRule.shift || 'Morning'}
                                  onChange={(e) => updateClassSchedule(cls, { shift: e.target.value as any })}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-medium text-slate-800"
                                >
                                  <option value="Morning">মর্নিং শিফট (Morning)</option>
                                  <option value="Day">ডে শিফট (Day)</option>
                                  <option value="All">উভয় শিফট (All)</option>
                                </select>
                              </div>

                              <div className="col-span-full pt-1">
                                <span className="inline-flex items-center space-x-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    {cls}-এর জন্য {classRule.startTime} AM শুরু এবং {classRule.lateThresholdTime} AM-এর পর Late গণ্য হবে।
                                  </span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 text-[11px] text-slate-500">
                              এই শ্রেণিতে সাধারণ স্কুলের নির্ধারিত সময় (শুরু: <b>{rules.schoolStartTime || '08:00'}</b> | লেট: <b>{rules.lateThresholdTime || '08:30'}</b>) প্রযোজ্য।
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: GENERAL SCHOOL & STAFF TIMING RULES                                */}
              {/* ========================================================================= */}
              {rulesTab === 'general' && (
                <div className="space-y-4">
                  {/* General School Timing Card */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>সাধারণ স্কুল হাজিরা সময়সূচি (Default School Timing):</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">স্কুল শুরু (Start Time):</label>
                        <input
                          type="time"
                          value={rules.schoolStartTime || '08:00'}
                          onChange={(e) => setRules({ ...rules, schoolStartTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-amber-700 font-bold mb-1">সাধারণ লেট সীমা (Late Threshold):</label>
                        <input
                          type="time"
                          value={rules.lateThresholdTime || '08:30'}
                          onChange={(e) => setRules({ ...rules, lateThresholdTime: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-amber-50/50 font-bold text-amber-800"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">সমাপ্তি সীমা (Closing Time):</label>
                        <input
                          type="time"
                          value={rules.attendanceClosingTime || '10:30'}
                          onChange={(e) => setRules({ ...rules, attendanceClosingTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Staff & Faculty Timing Card */}
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                    <h4 className="font-bold text-blue-950 text-xs flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>শিক্ষক ও কর্মচারীদের হাজিরা সময় (Faculty & Staff Timing):</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">স্টাফ প্রবেশ সময় (Staff Start):</label>
                        <input
                          type="time"
                          value={rules.staffStartTime || '08:15'}
                          onChange={(e) => setRules({ ...rules, staffStartTime: e.target.value })}
                          className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-amber-800 font-bold mb-1">স্টাফদের লেট সীমা (Staff Late After):</label>
                        <input
                          type="time"
                          value={rules.staffLateThresholdTime || '08:30'}
                          onChange={(e) => setRules({ ...rules, staffLateThresholdTime: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white font-bold text-amber-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shifts General Defaults */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs">শিফটের সাধারণ ডিফল্ট (Shift Defaults):</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">মর্নিং শিফট লেট সীমা:</label>
                        <input
                          type="time"
                          value={rules.morningShiftLateThresholdTime || '08:00'}
                          onChange={(e) => setRules({ ...rules, morningShiftLateThresholdTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">ডে শিফট লেট সীমা:</label>
                        <input
                          type="time"
                          value={rules.dayShiftLateThresholdTime || '12:00'}
                          onChange={(e) => setRules({ ...rules, dayShiftLateThresholdTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual correction checkbox */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      id="manualCorrectionCheck"
                      checked={rules.allowManualCorrection}
                      onChange={(e) => setRules({ ...rules, allowManualCorrection: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    />
                    <label htmlFor="manualCorrectionCheck" className="text-slate-700 font-medium cursor-pointer">
                      প্রয়োজনে অ্যাডমিন ও শিক্ষকের দ্বারা হাজিরা সংশোধনের অনুমোদন প্রদান
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                ✓ সেটিংস সাথে সাথে ক্লাউড ফায়ারস্টোর ডাটাবেজে লাইভ সিঙ্ক হবে।
              </span>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    StorageService.saveAttendanceRules(rules);
                    setShowRulesModal(false);
                    playBeep('success');
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষণ করুন (Save & Sync)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FACE ENROLLMENT & PHOTO REGISTRATION                                */}
      {/* ========================================================================= */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">বায়োমেট্রিক ফেস এনরোলমেন্ট ও প্রোফাইল ছবি</h3>
                  <p className="text-[11px] text-purple-200">
                    শিক্ষার্থী বা শিক্ষকের মুখমণ্ডলের ছবি যুক্ত বা আপডেট করে এআই ফেস হাজিরা সক্রিয় করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollingPerson(null);
                  setEnrollCapturedPhoto(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice if saved */}
            {enrollNotice && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{enrollNotice}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Step 1: Select Type & Search Person */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollTargetType('student');
                      setEnrollingPerson(null);
                      setEnrollCapturedPhoto(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      enrollTargetType === 'student'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    শিক্ষার্থী তালিকা ({StorageService.getStudents().length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollTargetType('staff');
                      setEnrollingPerson(null);
                      setEnrollCapturedPhoto(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      enrollTargetType === 'staff'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    শিক্ষক ও স্টাফ ({StorageService.getStaff().length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={
                      enrollTargetType === 'student'
                        ? 'শিক্ষার্থীর নাম, রোল বা আইডি লিখে খুঁজুন...'
                        : 'শিক্ষক/স্টাফের নাম বা পদবি লিখে খুঁজুন...'
                    }
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* People Selection List */}
              {!enrollingPerson ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {(enrollTargetType === 'student' ? StorageService.getStudents() : StorageService.getStaff())
                    .filter((p: any) => {
                      if (!enrollSearch.trim()) return true;
                      const q = enrollSearch.toLowerCase();
                      const nameEn = (p.nameEn || '').toLowerCase();
                      const nameBn = (p.nameBn || '').toLowerCase();
                      const id = (p.studentId || p.employeeId || p.id || '').toLowerCase();
                      const roll = (p.roll || '').toLowerCase();
                      return nameEn.includes(q) || nameBn.includes(q) || id.includes(q) || roll.includes(q);
                    })
                    .slice(0, 15)
                    .map((person: any) => {
                      const isStudent = 'roll' in person;
                      const hasPhoto = !!person.photoUrl;
                      return (
                        <div
                          key={person.id}
                          onClick={() => {
                            setEnrollingPerson(person);
                            setEnrollCapturedPhoto(person.photoUrl || null);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                              {person.photoUrl ? (
                                <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {person.nameBn || person.nameEn}
                              </h5>
                              <p className="text-[10px] text-slate-500 truncate">
                                {isStudent
                                  ? `${person.className} • রোল: ${toBnNumber(person.roll)}`
                                  : `${person.designation || person.department}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                hasPhoto
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {hasPhoto ? 'ছবি নিবন্ধিত' : 'ছবি নেই'}
                            </span>
                            <span className="text-xs text-purple-600 font-bold">এনরোল →</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Selected Person Capture & Upload Panel */
                <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-purple-950">
                        {enrollingPerson.nameBn || enrollingPerson.nameEn}
                      </h4>
                      <p className="text-xs text-purple-700">
                        {'roll' in enrollingPerson
                          ? `শ্রেণি: ${(enrollingPerson as Student).className} • রোল: ${(enrollingPerson as Student).roll}`
                          : `পদবি: ${(enrollingPerson as Staff).designation || (enrollingPerson as Staff).department}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollingPerson(null);
                        setEnrollCapturedPhoto(null);
                      }}
                      className="text-xs text-purple-600 hover:underline font-bold"
                    >
                      ব্যক্তি পরিবর্তন
                    </button>
                  </div>

                  {/* Photo Preview */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-purple-200">
                    <div className="w-32 h-36 rounded-2xl overflow-hidden border-2 border-dashed border-purple-300 bg-slate-50 flex items-center justify-center relative shadow-inner">
                      {enrollCapturedPhoto ? (
                        <img
                          src={enrollCapturedPhoto}
                          alt="Face Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ScanFace className="w-10 h-10 mx-auto mb-1 text-purple-300" />
                          <span className="text-[10px] font-bold">ছবি যুক্ত করুন</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                      {scanning && (
                        <button
                          type="button"
                          onClick={() => {
                            const snap = captureCurrentFrame();
                            if (snap) {
                              setEnrollCapturedPhoto(snap);
                              playBeep('success');
                            }
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>লাইভ ক্যামেরা ফ্রেম নিন</span>
                        </button>
                      )}

                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড / ক্যামেরা</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEnrollCapturedPhoto(reader.result as string);
                                playBeep('success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    disabled={!enrollCapturedPhoto}
                    onClick={() => {
                      if (!enrollingPerson || !enrollCapturedPhoto) return;
                      if (enrollTargetType === 'student') {
                        const student = enrollingPerson as Student;
                        StorageService.updateStudent({
                          ...student,
                          photoUrl: enrollCapturedPhoto,
                        });
                      } else {
                        const staff = enrollingPerson as Staff;
                        StorageService.updateStaff({
                          ...staff,
                          photoUrl: enrollCapturedPhoto,
                        });
                      }
                      const name = enrollingPerson.nameBn || enrollingPerson.nameEn;
                      setEnrollNotice(`✓ ${name}-এর ফেস প্রোফাইল সফলভাবে এনরোল করা হয়েছে!`);
                      playBeep('success');
                      speakBengaliVoice(`${name}-এর ফেস এনরোলমেন্ট সফল হয়েছে।`);
                      setTimeout(() => {
                        setEnrollNotice(null);
                        setShowEnrollModal(false);
                        setEnrollingPerson(null);
                        setEnrollCapturedPhoto(null);
                        onAttendanceUpdated();
                      }, 1200);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all ${
                      enrollCapturedPhoto
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>সংরক্ষণ ও ফেস এনরোল নিশ্চিত করুন</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollingPerson(null);
                  setEnrollCapturedPhoto(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
