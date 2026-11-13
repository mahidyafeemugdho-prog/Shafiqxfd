import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { StudentTransport, Student, TransportRoute } from '../../types';
import {
  Bus,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  MapPin,
  X,
  Check,
  TrendingUp,
  DollarSign,
  Filter,
} from 'lucide-react';

export const TransportStudentsTab: React.FC = () => {
  const { language, formatTaka, toBnNumber, formatDate } = useLanguage();
  const [transports, setTransports] = useState<StudentTransport[]>(() =>
    StorageService.getStudentTransports()
  );
  const students = StorageService.getStudents();
  const routes = StorageService.getRoutes();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<StudentTransport | null>(null);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'rt_1');
  const [pickupPoint, setPickupPoint] = useState<string>('Mirpur-10 Circle');
  const [monthlyFare, setMonthlyFare] = useState<number>(1500);

  // Total monthly transport revenue
  const totalMonthlyTransportFare = transports
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.monthlyFare, 0);

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    const unassigned = students.filter(
      (s) => !transports.some((t) => t.studentId === s.id && t.status === 'active')
    );
    setSelectedStudentId(unassigned[0]?.id || students[0]?.id || '');
    const firstRoute = routes[0];
    setSelectedRouteId(firstRoute?.id || 'rt_1');
    setPickupPoint(firstRoute?.stops[0] || 'School Gate');
    setMonthlyFare(firstRoute?.monthlyFare || 1500);
    setShowAddModal(true);
  };

  const handleOpenEdit = (assignment: StudentTransport) => {
    setEditingAssignment(assignment);
    setSelectedStudentId(assignment.studentId);
    setSelectedRouteId(assignment.routeId);
    setPickupPoint(assignment.pickupPoint);
    setMonthlyFare(assignment.monthlyFare);
    setShowAddModal(true);
  };

  const handleRouteChange = (rId: string) => {
    setSelectedRouteId(rId);
    const r = routes.find((route) => route.id === rId);
    if (r) {
      setPickupPoint(r.stops[0] || 'Pickup Point');
      setMonthlyFare(r.monthlyFare);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === selectedStudentId);
    const r = routes.find((route) => route.id === selectedRouteId);
    if (!st || !r) return;

    if (editingAssignment) {
      const updated: StudentTransport = {
        ...editingAssignment,
        routeId: r.id,
        routeName: r.routeName,
        pickupPoint,
        monthlyFare,
      };
      StorageService.updateStudentTransport(updated);
    } else {
      const newAssignment: StudentTransport = {
        id: `st_tr_${Date.now()}`,
        studentId: st.id,
        studentName: st.nameEn,
        studentNameBn: st.nameBn,
        className: st.className,
        section: st.section,
        roll: st.roll,
        guardianPhone: st.guardianPhone,
        routeId: r.id,
        routeName: r.routeName,
        pickupPoint,
        monthlyFare,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      StorageService.addStudentTransport(newAssignment);
    }

    setTransports(StorageService.getStudentTransports());
    setShowAddModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(language === 'bn' ? `${name}-কে পরিবহন তালিকা থেকে বাদ দিতে চান?` : `Remove ${name} from transport service?`)) {
      StorageService.deleteStudentTransport(id);
      setTransports(StorageService.getStudentTransports());
    }
  };

  const handleToggleStatus = (assignment: StudentTransport) => {
    const updated: StudentTransport = {
      ...assignment,
      status: assignment.status === 'active' ? 'inactive' : 'active',
    };
    StorageService.updateStudentTransport(updated);
    setTransports(StorageService.getStudentTransports());
  };

  const filteredTransports = transports.filter((t) => {
    if (routeFilter !== 'all' && t.routeId !== routeFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        t.studentName.toLowerCase().includes(q) ||
        t.studentNameBn.includes(q) ||
        t.roll.includes(q) ||
        t.className.toLowerCase().includes(q) ||
        t.pickupPoint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'bn'
                ? 'পরিবহন ব্যবহারকারী শিক্ষার্থী ও মাসিক ভাড়া (Student Transport Mapping)'
                : 'Student Transport Allocations & Monthly Bus Fares'}
            </h3>
            <p className="text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'কোন কোন শিক্ষার্থী স্কুল বাস বা পরিবহন ব্যবহার করে তা যুক্ত করুন এবং তাদের নির্দিষ্ট মাসিক ভাড়া নির্ধারণ করুন। প্রতি মাস শেষে এদের টিউশন ফি এর সাথে পরিবহন ভাড়াও স্বয়ংক্রিয়ভাবে বকেয়ায় যুক্ত হবে।'
                : 'Map individual students to transport routes and customize their monthly fare. Transport users auto-incur bus fares in their monthly fee dues.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? '+ শিক্ষার্থী যুক্ত করুন' : '+ Assign Student to Bus'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold text-xs block">
            {language === 'bn' ? 'মোট পরিবহন যাত্রী শিক্ষার্থী' : 'Enrolled Bus Students'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {language === 'bn' ? toBnNumber(transports.length) : transports.length}{' '}
            <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'জন' : 'Students'}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold text-xs block">
            {language === 'bn' ? 'মাসিক সম্ভাব্য পরিবহন আদায়' : 'Monthly Transport Revenue'}
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {formatTaka(totalMonthlyTransportFare)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-semibold text-xs block">
            {language === 'bn' ? 'চালু রুট সংখ্যা' : 'Active Bus Routes'}
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
            {routes.length} {language === 'bn' ? 'টি রুট' : 'Routes'}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'bn'
                ? 'শিক্ষার্থীর নাম, রোল, শ্রেণি, পিকআপ পয়েন্ট...'
                : 'Search by student name, roll, class, pickup stop...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="sm:w-64">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
          >
            <option value="all">{language === 'bn' ? 'সকল বাস রুট' : 'All Routes'}</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transport Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">Student & Class (শিক্ষার্থী)</th>
                <th className="py-3 px-4">Assigned Bus Route (বাস রুট)</th>
                <th className="py-3 px-4">Pickup Point (পিকআপ পয়েন্ট)</th>
                <th className="py-3 px-4">Guardian Contact (যোগাযোগ)</th>
                <th className="py-3 px-4 text-right">Monthly Fare (মাসিক ভাড়া)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransports.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.studentName}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.className} ({item.section}) • Roll: {item.roll}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{item.routeName}</div>
                    <div className="text-[10px] text-blue-600 font-mono">Assigned: {item.assignedDate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 font-medium text-slate-700">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{item.pickupPoint}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{item.guardianPhone}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-sm text-emerald-700">
                    {formatTaka(item.monthlyFare)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-blue-600 transition-colors"
                        title="Edit Fare / Stop"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.studentName)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"
                        title="Delete from Transport"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    {language === 'bn'
                      ? 'কোনো পরিবহন শিক্ষার্থী পাওয়া যায়নি। নতুন শিক্ষার্থী যুক্ত করতে উপরের বাটনে চাপুন।'
                      : 'No transport students found matching filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Bus className="w-4 h-4 text-emerald-600" />
                <span>
                  {editingAssignment
                    ? (language === 'bn' ? 'পরিবহন ফি ও স্টপ পরিবর্তন' : 'Edit Transport Fare & Stop')
                    : (language === 'bn' ? 'শিক্ষার্থীকে পরিবহন সেবায় যুক্ত করুন' : 'Assign Student to Transport')}
                </span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              {/* Select Student */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন *' : 'Select Student *'}
                </label>
                <select
                  required
                  disabled={Boolean(editingAssignment)}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-900 disabled:bg-slate-100"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn} ({s.className} - Roll {s.roll})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Route */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'বাস রুট নির্বাচন করুন *' : 'Select Route *'}
                </label>
                <select
                  required
                  value={selectedRouteId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-900"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({formatTaka(r.monthlyFare)}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Point */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'পিকআপ পয়েন্ট / স্টপ *' : 'Pickup Point / Stop *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mirpur-10 Circle / Sony Hall"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                />
              </div>

              {/* Individual Monthly Fare */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  {language === 'bn' ? 'নির্দিষ্ট শিক্ষার্থীর মাসিক ভাড়া (৳) *' : 'Student Monthly Transport Fare (৳) *'}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={monthlyFare}
                  onChange={(e) => setMonthlyFare(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-emerald-800 text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'bn'
                    ? 'প্রতি মাসে ফি কাউন্টারে এই শিক্ষার্থীর জন্য উক্ত ভাড়ার বকেয়া নির্ধারিত হবে।'
                    : 'This customized monthly fare applies automatically in the student’s dues.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingAssignment ? 'Save Changes' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
