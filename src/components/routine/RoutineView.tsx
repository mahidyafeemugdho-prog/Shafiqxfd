import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { RoutinePeriod, DayOfWeek } from '../../types';
import {
  CalendarDays,
  Printer,
  Plus,
  Clock,
  AlertTriangle,
  Building,
  User,
  BookOpen,
  X,
  Check,
  Edit2,
  Trash2,
  Sliders,
} from 'lucide-react';
import { SaturdayOffToggle } from '../common/SaturdayOffToggle';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';

export const RoutineView: React.FC = () => {
  const { activeRole } = useAuth();
  const { t, language } = useLanguage();
  const school = StorageService.getSchoolProfile();
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'room'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('Selina Parvin');
  const [selectedRoom, setSelectedRoom] = useState<string>('Room 301');

  const [routines, setRoutines] = useState<RoutinePeriod[]>(() => StorageService.getRoutines());
  const teachers = StorageService.getStaff().filter((s) => s.role === 'teacher' || s.role === 'admin');
  const subjects = StorageService.getSubjects();

  // Add / Edit Period Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<RoutinePeriod | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [newDay, setNewDay] = useState<DayOfWeek>('Saturday');
  const [newPeriodNum, setNewPeriodNum] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState<string>('08:30 AM');
  const [newEndTime, setNewEndTime] = useState<string>('09:15 AM');
  const [newSubject, setNewSubject] = useState<string>('Bangla 1st & 2nd');
  const [newTeacherId, setNewTeacherId] = useState<string>(teachers[0]?.id || 'st_2');
  const [newRoom, setNewRoom] = useState<string>('Room 301');
  const [conflictWarning, setConflictWarning] = useState<string>('');

  const canEdit = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'master_admin';

  // Customizable Tiffin Time state (persisted)
  const [tiffinTime, setTiffinTime] = useState<string>(() => {
    try {
      return localStorage.getItem('school_routine_tiffin_time') || '10:45-11:15';
    } catch {
      return '10:45-11:15';
    }
  });

  // Customizable Tiffin Break Position (after which period does tiffin occur: 3, 4, 5, 6, etc.)
  const [tiffinAfterPeriod, setTiffinAfterPeriod] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('school_routine_tiffin_after');
      return saved !== null ? parseInt(saved, 10) : 4;
    } catch {
      return 4;
    }
  });

  const handleUpdateTiffinTime = (newTime: string) => {
    setTiffinTime(newTime);
    try {
      localStorage.setItem('school_routine_tiffin_time', newTime);
    } catch {}
  };

  const handleUpdateTiffinAfter = (afterPeriod: number) => {
    setTiffinAfterPeriod(afterPeriod);
    try {
      localStorage.setItem('school_routine_tiffin_after', String(afterPeriod));
    } catch {}
  };

  const getPeriodTimeLabel = (periodNum: number) => {
    // If user has routines for this class & period, check if there's a defined time
    const existing = routines.find(
      (r) => r.className === selectedClass && r.section === selectedSection && r.periodNumber === periodNum
    );
    if (existing?.startTime && existing?.endTime) {
      return `${existing.startTime}-${existing.endTime}`;
    }

    if (tiffinAfterPeriod === 5) {
      const times: Record<number, string> = {
        1: '08:30-09:15',
        2: '09:15-10:00',
        3: '10:00-10:45',
        4: '10:45-11:30',
        5: '11:30-12:15',
        6: '12:45-01:30',
        7: '01:30-02:15',
        8: '02:15-03:00',
      };
      return times[periodNum] || '';
    }

    if (tiffinAfterPeriod === 4) {
      const times: Record<number, string> = {
        1: '08:30-09:15',
        2: '09:15-10:00',
        3: '10:00-10:45',
        4: '10:45-11:30',
        5: '12:00-12:45',
        6: '12:45-01:30',
        7: '01:30-02:15',
        8: '02:15-03:00',
      };
      return times[periodNum] || '';
    }

    if (tiffinAfterPeriod === 6) {
      const times: Record<number, string> = {
        1: '08:30-09:15',
        2: '09:15-10:00',
        3: '10:00-10:45',
        4: '10:45-11:30',
        5: '11:30-12:15',
        6: '12:15-01:00',
        7: '01:30-02:15',
        8: '02:15-03:00',
      };
      return times[periodNum] || '';
    }

    // Default (after period 3):
    const times: Record<number, string> = {
      1: '08:30-09:15',
      2: '09:15-10:00',
      3: '10:00-10:45',
      4: '11:15-12:00',
      5: '12:00-12:45',
      6: '12:45-01:30',
      7: '01:30-02:15',
      8: '02:15-03:00',
    };
    return times[periodNum] || '';
  };

  const periodNameBn: Record<number, string> = {
    1: '১ম পিরিয়ড',
    2: '২য় পিরিয়ড',
    3: '৩য় পিরিয়ড',
    4: '৪র্থ পিরিয়ড',
    5: '৫ম পিরিয়ড',
    6: '৬ষ্ঠ পিরিয়ড',
    7: '৭ম পিরিয়ড',
    8: '৮ম পিরিয়ড',
  };

  const [isSaturdayOff, setIsSaturdayOff] = useState<boolean>(() => StorageService.isSaturdayOff());

  useEffect(() => {
    const handleSat = (e: any) => {
      setIsSaturdayOff(StorageService.isSaturdayOff());
    };
    window.addEventListener('saturday_off_toggled', handleSat);
    return () => window.removeEventListener('saturday_off_toggled', handleSat);
  }, []);

  const days: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const dayNamesBn: Record<DayOfWeek, string> = {
    Saturday: 'শনিবার',
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
  };

  const handleOpenAddPeriod = () => {
    setEditingPeriod(null);
    setNewDay('Saturday');
    setNewPeriodNum(1);
    setNewStartTime('08:30 AM');
    setNewEndTime('09:15 AM');
    setNewSubject('Bangla 1st & 2nd');
    setNewTeacherId(teachers[0]?.id || 'st_2');
    setNewRoom('Room 301');
    setConflictWarning('');
    setShowAddModal(true);
  };

  const handleOpenEditPeriod = (p: RoutinePeriod) => {
    setEditingPeriod(p);
    setNewDay(p.day);
    setNewPeriodNum(p.periodNumber);
    setNewStartTime(p.startTime);
    setNewEndTime(p.endTime);
    setNewSubject(p.subjectName);
    setNewTeacherId(p.teacherId);
    setNewRoom(p.roomNo);
    setConflictWarning('');
    setShowAddModal(true);
  };

  const handleDeletePeriod = (id: string, name: string) => {
    setPeriodToDelete({ id, name });
  };

  const confirmDeletePeriod = () => {
    if (!periodToDelete) return;
    StorageService.deleteRoutine(periodToDelete.id);
    const updated = StorageService.getRoutines();
    setRoutines(updated);
    setPeriodToDelete(null);
  };

  // Conflict Detector Logic: Check if Teacher or Room is double booked on the same day and period
  const checkConflicts = (day: DayOfWeek, period: number, teacherId: string, room: string, currentId?: string): string | null => {
    const teacherConflict = routines.find(
      (r) => r.id !== currentId && r.day === day && r.periodNumber === period && r.teacherId === teacherId
    );
    if (teacherConflict) {
      return `Teacher conflict: ${teacherConflict.teacherName} is already assigned to ${teacherConflict.className} (${teacherConflict.section}) in Period ${period} on ${day}!`;
    }
    const roomConflict = routines.find(
      (r) => r.id !== currentId && r.day === day && r.periodNumber === period && r.roomNo === room
    );
    if (roomConflict) {
      return `Room conflict: ${room} is already in use by ${roomConflict.className} (${roomConflict.section}) in Period ${period} on ${day}!`;
    }
    return null;
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkConflicts(newDay, newPeriodNum, newTeacherId, newRoom, editingPeriod?.id);
    if (conflict) {
      setConflictWarning(conflict);
      return;
    }

    const tObj = teachers.find((t) => t.id === newTeacherId);

    if (editingPeriod) {
      const updated = routines.map((r) =>
        r.id === editingPeriod.id
          ? {
              ...r,
              day: newDay,
              periodNumber: newPeriodNum,
              startTime: newStartTime,
              endTime: newEndTime,
              subjectName: newSubject,
              teacherId: newTeacherId,
              teacherName: tObj?.nameEn || r.teacherName,
              roomNo: newRoom,
            }
          : r
      );
      StorageService.saveRoutines(updated);
      setRoutines(updated);
      setShowAddModal(false);
      setEditingPeriod(null);
      setConflictWarning('');
    } else {
      const newPeriod: RoutinePeriod = {
        id: `rt_${Date.now()}`,
        day: newDay,
        periodNumber: newPeriodNum,
        startTime: newStartTime,
        endTime: newEndTime,
        className: selectedClass as any,
        section: selectedSection,
        shift: 'Day',
        subjectName: newSubject,
        teacherId: newTeacherId,
        teacherName: tObj?.nameEn || 'Teacher',
        roomNo: newRoom,
      };

      const updated = [...routines, newPeriod];
      StorageService.saveRoutines(updated);
      setRoutines(updated);
      setShowAddModal(false);
      setConflictWarning('');
    }
  };

  // Filter routines based on current view
  const currentRoutines = routines.filter((r) => {
    if (viewMode === 'class') {
      return r.className === selectedClass && r.section === selectedSection;
    }
    if (viewMode === 'teacher') {
      return r.teacherName === selectedTeacher;
    }
    if (viewMode === 'room') {
      return r.roomNo === selectedRoom;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'ক্লাস রুটিন ও সাপ্তাহিক সময়সূচি' : 'Class Routine & Weekly Timetable'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'শনিবার থেকে বৃহস্পতিবার সম্পূর্ণ ক্লাস রুটিন ও শিক্ষক-রুম কনফ্লিক্ট ডিটেকশন'
              : 'Saturday to Thursday timetable with teacher & room conflict detection'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="p-1 bg-slate-100 rounded-lg flex space-x-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('class')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'class' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              By Class
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'teacher' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              By Teacher
            </button>
            <button
              onClick={() => setViewMode('room')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'room' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              By Room
            </button>
          </div>

          {/* Saturday Weekend / Working Day 1-Click Toggle */}
          <SaturdayOffToggle compact={true} />

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">{language === 'bn' ? 'রুটিন প্রিন্ট' : 'Print Timetable'}</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAddPeriod}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'পিরিয়ড যোগ করুন' : 'Add Period'}</span>
            </button>
          )}
        </div>
      </div>

      {/* View Selectors */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {viewMode === 'class' && (
          <>
            <div className="flex items-center space-x-2">
              <label className="font-semibold text-slate-700">Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="font-semibold text-slate-700">Section:</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </>
        )}

        {viewMode === 'teacher' && (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-slate-400" />
            <label className="font-semibold text-slate-700">Teacher:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.nameEn}>{t.nameEn} ({t.designation})</option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'room' && (
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-slate-400" />
            <label className="font-semibold text-slate-700">Room / Facility:</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              {['Room 301', 'Room 302', 'Science Lab 1', 'Computer Lab', 'Library Hall'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Routine Grid (Saturday to Thursday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map((day) => {
          const isSat = day === 'Saturday';
          const dayPeriods = currentRoutines
            .filter((r) => r.day === day)
            .sort((a, b) => a.periodNumber - b.periodNumber);

          return (
            <div
              key={day}
              className={`rounded-xl border shadow-xs overflow-hidden flex flex-col ${
                isSat && isSaturdayOff ? 'bg-amber-50/20 border-amber-300' : 'bg-white border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 text-white flex items-center justify-between ${
                  isSat && isSaturdayOff ? 'bg-amber-950' : 'bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-xs">{day}</h3>
                    {isSat && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          isSaturdayOff ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
                        }`}
                      >
                        {isSaturdayOff ? '🏖️ ছুটি' : '📖 খোলা'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{dayNamesBn[day]}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold">
                  {isSat && isSaturdayOff ? 'সাপ্তাহিক ছুটি' : `${dayPeriods.length} Periods`}
                </span>
              </div>

              {/* Period List */}
              <div className="p-3 space-y-2 flex-1">
                {isSat && isSaturdayOff ? (
                  <div className="py-6 px-3 text-center text-amber-900 text-xs font-semibold bg-amber-50/60 rounded-lg border border-amber-200">
                    <p className="font-bold">🏖️ শনিবার সাপ্তাহিক ছুটি (School Weekend)</p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      মাদরাসা বা শনিবার ক্লাস চালু রাখতে ওপরের ১-ক্লিক বাটনে ক্লিক করুন।
                    </p>
                  </div>
                ) : dayPeriods.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No periods assigned for this day.
                  </div>
                ) : (
                  dayPeriods.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 transition-colors text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700">Period {p.periodNumber}</span>
                          <span className="text-[10px] font-medium text-slate-500">{p.startTime} - {p.endTime}</span>
                        </div>
                        <div className="font-bold text-slate-900 mt-1">{p.subjectName}</div>
                        <div className="text-[11px] text-slate-600 flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60">
                          <span>{p.teacherName}</span>
                          <span className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-[10px] font-semibold text-slate-700">
                            {p.roomNo}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center justify-end space-x-1.5 mt-2 pt-1.5 border-t border-slate-200/50">
                          <button
                            onClick={() => handleOpenEditPeriod(p)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center space-x-1 transition-colors"
                            title={language === 'bn' ? 'পিরিয়ড এডিট করুন' : 'Edit Period'}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePeriod(p.id, `${p.subjectName} (Period ${p.periodNumber})`)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={language === 'bn' ? 'পিরিয়ড মুছুন' : 'Delete Period'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPeriod
                  ? (language === 'bn' ? 'রুটিন পিরিয়ড সম্পাদনা করুন' : 'Edit Routine Period')
                  : (language === 'bn' ? 'নতুন রুটিন পিরিয়ড যোগ করুন' : 'Add Routine Period')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {conflictWarning && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleSavePeriod} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>{d} ({dayNamesBn[d]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Period Number</label>
                  <select
                    value={newPeriodNum}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setNewPeriodNum(num);
                      const label = getPeriodTimeLabel(num);
                      if (label && label.includes('-')) {
                        const [s, eTime] = label.split('-');
                        if (s && eTime) {
                          setNewStartTime(s.trim());
                          setNewEndTime(eTime.trim());
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {subjects.filter((s) => s.className === selectedClass).map((sub) => (
                    <option key={sub.id} value={sub.nameEn}>{sub.nameEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Teacher</label>
                <select
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Room No</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {editingPeriod
                    ? (language === 'bn' ? 'রুটিন আপডেট করুন' : 'Update Period')
                    : (language === 'bn' ? 'রুটিনে যোগ করুন' : 'Assign Period')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Period Confirmation Modal (Eliminates blocked browser confirms) */}
      {periodToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'পিরিয়ড মুছে ফেলতে চান?' : 'Delete Routine Period?'}
                </h4>
                <p className="text-slate-500 text-[11px] truncate max-w-[200px]">
                  {periodToDelete.name}
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              {language === 'bn'
                ? 'এই পিরিয়ডটি রুটিন সময়সূচি থেকে সম্পূর্ণভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?'
                : 'This period entry will be permanently deleted from the class schedule.'}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPeriodToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeletePeriod}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'হ্যাঁ, মুছুন' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Timetable Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full p-4 sm:p-6 text-xs max-h-[96vh] overflow-y-auto flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden shrink-0">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    {language === 'bn' ? 'ক্লাস রুটিন অফিসিয়াল প্রিন্ট প্রিভিউ' : 'Official Timetable Print Preview'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedClass} • Section {selectedSection} • সেশন: ২০২৬
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'bn' ? '🖨️ প্রিন্ট করুন (A4)' : 'Print (A4)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Timetable Document Sheet */}
            <div className="printable-timetable-sheet bg-white p-6 sm:p-8 border-2 border-slate-900 rounded-xl my-4 text-slate-900">
              {/* Institutional Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <img
                    src={school.logoUrl || DEFAULT_SCHOOL_LOGO}
                    alt="Logo"
                    className="w-14 h-14 object-contain"
                  />
                  <div className="text-center">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {school.nameBn || school.nameEn}
                    </h1>
                    <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                      {school.nameEn}
                    </h2>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  {school.addressBn} • EIIN: {school.eiin} • ফোন: {school.phone}
                </p>
                <div className="inline-block mt-2.5 px-5 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md">
                  {language === 'bn' ? 'অফিসিয়াল শ্রেণি সময়সূচি ও ক্লাস রুটিন - ২০২৬' : 'OFFICIAL CLASS TIMETABLE - 2026'}
                </div>
              </div>

              {/* Info Details Bar */}
              <div className="flex flex-wrap items-center justify-between py-2 px-3 bg-slate-100 border-b border-slate-300 text-xs font-bold my-3">
                <span>শ্রেণি: <strong className="text-blue-900">{selectedClass}</strong></span>
                <span>শাখা: <strong className="text-blue-900">Section {selectedSection}</strong></span>
                <span>সেশন: <strong>২০২৬ (Academic Year 2026)</strong></span>
                <span>কার্যকর: <strong>জানুয়ারি ২০২৬ থেকে</strong></span>
              </div>

              {/* Routine Grid Table */}
              <div className="overflow-x-auto">
                {/* Customizable Tiffin Position & Time Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs mb-3 text-amber-950 print:hidden shadow-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tiffin Break Position Selector */}
                    <div className="flex items-center space-x-1.5">
                      <Sliders className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-bold">টিফিন বিরতির অবস্থান:</span>
                      <select
                        value={tiffinAfterPeriod}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateTiffinAfter(val);
                          if (val === 4 && (!tiffinTime || tiffinTime === '10:45-11:15')) {
                            handleUpdateTiffinTime('11:30-12:00');
                          } else if (val === 5 && (!tiffinTime || tiffinTime === '10:45-11:15')) {
                            handleUpdateTiffinTime('12:15-12:45');
                          } else if (val === 6 && (!tiffinTime || tiffinTime === '10:45-11:15')) {
                            handleUpdateTiffinTime('01:00-01:30');
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold bg-white border border-amber-300 rounded-lg text-amber-950 focus:ring-2 focus:ring-amber-500 shadow-xs"
                      >
                        <option value={3}>৩য় পিরিয়ডের পর (After Period 3)</option>
                        <option value={4}>৪র্থ পিরিয়ডের পর (After Period 4)</option>
                        <option value={5}>৫ম পিরিয়ডের পর (After Period 5)</option>
                        <option value={6}>৬ষ্ঠ পিরিয়ডের পর (After Period 6)</option>
                        <option value={2}>২য় পিরিয়ডের পর (After Period 2)</option>
                        <option value={0}>টিফিন কলাম ছাড়া (No Tiffin Column)</option>
                      </select>
                    </div>

                    {/* Tiffin Time Input */}
                    {tiffinAfterPeriod > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-bold">টিফিন সময়:</span>
                        <input
                          type="text"
                          value={tiffinTime}
                          onChange={(e) => handleUpdateTiffinTime(e.target.value)}
                          className="px-2.5 py-1 text-xs font-black bg-white border border-amber-300 rounded-lg text-amber-900 w-32 focus:ring-2 focus:ring-amber-500 shadow-xs"
                          placeholder="e.g. 12:45-1:15"
                        />
                        <span className="text-[10px] text-amber-700 hidden sm:inline">(প্রিন্ট শিটে তাৎক্ষণিক কার্যকর হবে)</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    {tiffinAfterPeriod > 0
                      ? `মোট পিরিয়ড: ৮টি (${tiffinAfterPeriod}ম পিরিয়ডের পর টিফিন)`
                      : 'মোট পিরিয়ড: ৮টি (একটানা)'}
                  </span>
                </div>

                {(() => {
                  const beforeTiffin = tiffinAfterPeriod > 0
                    ? [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n <= tiffinAfterPeriod)
                    : [1, 2, 3, 4, 5, 6, 7, 8];
                  const afterTiffin = tiffinAfterPeriod > 0
                    ? [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => n > tiffinAfterPeriod)
                    : [];
                  const totalCols = tiffinAfterPeriod > 0 ? 10 : 9;

                  return (
                    <table className="w-full text-left border-collapse text-xs border-2 border-slate-900">
                      <thead>
                        <tr className="bg-slate-200 border-b-2 border-slate-900 text-slate-900 font-black text-center">
                          <th className="py-2 px-2 border border-slate-900 w-24">বার (Day)</th>
                          {beforeTiffin.map((num) => (
                            <th key={num} className="py-2 px-1 border border-slate-900">
                              {periodNameBn[num]}<br/>
                              <span className="text-[9px] font-normal">{getPeriodTimeLabel(num)}</span>
                            </th>
                          ))}
                          {tiffinAfterPeriod > 0 && (
                            <th className="py-2 px-1 border border-slate-900 bg-amber-100 text-amber-950 w-20">
                              টিফিন বিরতি<br/>
                              <span className="text-[8px] font-normal">{tiffinTime}</span>
                            </th>
                          )}
                          {afterTiffin.map((num) => (
                            <th key={num} className="py-2 px-1 border border-slate-900">
                              {periodNameBn[num]}<br/>
                              <span className="text-[9px] font-normal">{getPeriodTimeLabel(num)}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((day) => {
                          const isSat = day === 'Saturday';
                          const dayPeriods = routines.filter(
                            (r) => r.day === day && r.className === selectedClass && r.section === selectedSection
                          );

                          return (
                            <tr key={day} className="border-b border-slate-900 text-center">
                              <td className="py-2.5 px-2 font-bold border border-slate-900 bg-slate-50">
                                {dayNamesBn[day]}<br/><span className="text-[9px] text-slate-500 font-normal">{day}</span>
                              </td>
                              {isSat && isSaturdayOff ? (
                                <td colSpan={totalCols} className="py-3 px-2 border border-slate-900 bg-amber-50 text-amber-900 font-bold text-xs tracking-wider">
                                  🏖️ সাপ্তাহিক ছুটি (Weekly Holiday)
                                </td>
                              ) : (
                                <>
                                  {beforeTiffin.map((num) => {
                                    const p = dayPeriods.find((x) => x.periodNumber === num);
                                    return (
                                      <td key={num} className="py-2 px-1 border border-slate-900 align-top">
                                        {p ? (
                                          <div>
                                            <div className="font-bold text-slate-900 text-[11px] leading-tight">{p.subjectName}</div>
                                            <div className="text-[9px] text-slate-600 mt-0.5">{p.teacherName}</div>
                                            <div className="text-[8px] text-slate-500 font-mono font-bold mt-0.5">{p.roomNo}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 font-mono">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  {tiffinAfterPeriod > 0 && (
                                    <td className="py-2 px-1 border border-slate-900 bg-amber-50 text-amber-950 font-black text-[9px]">
                                      টিফিন বিরতি<br/><span className="text-[8px] font-normal text-amber-800">{tiffinTime}</span>
                                    </td>
                                  )}
                                  {afterTiffin.map((num) => {
                                    const p = dayPeriods.find((x) => x.periodNumber === num);
                                    return (
                                      <td key={num} className="py-2 px-1 border border-slate-900 align-top">
                                        {p ? (
                                          <div>
                                            <div className="font-bold text-slate-900 text-[11px] leading-tight">{p.subjectName}</div>
                                            <div className="text-[9px] text-slate-600 mt-0.5">{p.teacherName}</div>
                                            <div className="text-[8px] text-slate-500 font-mono font-bold mt-0.5">{p.roomNo}</div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 font-mono">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Institutional Signatures */}
              <div className="flex justify-between items-end pt-12 mt-6 text-xs text-slate-800">
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 w-44 font-bold">
                    শ্রেণি শিক্ষকের স্বাক্ষর
                  </div>
                  <span className="text-[10px] text-slate-500">Class Teacher</span>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-slate-800 pt-1 w-44 font-bold">
                    রুটিন কমিটির আহ্বায়ক
                  </div>
                  <span className="text-[10px] text-slate-500">Routine In-charge</span>
                </div>
                <div className="text-center">
                  <div className="font-serif italic font-black text-sm text-slate-900 mb-0.5">
                    {school.principalNameEn || school.principalNameBn || 'Principal'}
                  </div>
                  <div className="border-t-2 border-slate-800 pt-1 w-48 font-bold">
                    অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর ও সিল
                  </div>
                  <span className="text-[10px] text-slate-500">Principal Signature & Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
