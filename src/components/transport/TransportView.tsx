import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { TransportRoute } from '../../types';
import {
  Bus,
  Search,
  Plus,
  Phone,
  User,
  MapPin,
  Users,
  DollarSign,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';

export const TransportView: React.FC = () => {
  const { activeRole } = useAuth();
  const { language, formatTaka } = useLanguage();
  const [routes, setRoutes] = useState<TransportRoute[]>(() => StorageService.getRoutes());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  // Form State
  const [routeName, setRouteName] = useState<string>('');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [monthlyFare, setMonthlyFare] = useState<number>(1800);
  const [stopsText, setStopsText] = useState<string>('Mirpur-10, Kazipara, Shewrapara, Agargaon, School');

  const canManage = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'master_admin';

  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setRouteName('');
    setVehicleNo('');
    setDriverName('');
    setDriverPhone('');
    setMonthlyFare(1800);
    setStopsText('Mirpur-10, Kazipara, Shewrapara, Agargaon, School');
    setShowAddModal(true);
  };

  const handleOpenEditRoute = (route: TransportRoute) => {
    setEditingRoute(route);
    setRouteName(route.routeName);
    setVehicleNo(route.vehicleNo);
    setDriverName(route.driverName);
    setDriverPhone(route.driverPhone);
    setMonthlyFare(route.monthlyFare);
    setStopsText(route.stops.join(', '));
    setShowAddModal(true);
  };

  const handleDeleteRoute = (id: string, name: string) => {
    if (!canManage) return;
    const confirmMsg = language === 'bn'
      ? `আপনি কি নিশ্চিতভাবে "${name}" বাস রুটটি মুছে ফেলতে চান?`
      : `Are you sure you want to delete transport route "${name}"?`;
    if (confirm(confirmMsg)) {
      StorageService.deleteRoute(id);
      setRoutes(StorageService.getRoutes());
    }
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName || !driverName) return;

    const stops = stopsText.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingRoute) {
      const updatedRoute: TransportRoute = {
        ...editingRoute,
        routeName,
        vehicleNo: vehicleNo || editingRoute.vehicleNo,
        driverName,
        driverPhone,
        monthlyFare,
        stops,
      };
      StorageService.saveRoute(updatedRoute);
      setRoutes(StorageService.getRoutes());
      setShowAddModal(false);
      setEditingRoute(null);
    } else {
      const newRoute: TransportRoute = {
        id: `rt_${Date.now()}`,
        routeName,
        vehicleNo: vehicleNo || 'Dhaka Metro-Cha-11-9988',
        driverName,
        driverPhone,
        monthlyFare,
        stops,
        assignedStudentsCount: 0,
      };
      StorageService.saveRoute(newRoute);
      setRoutes(StorageService.getRoutes());
      setShowAddModal(false);
    }
    setRouteName('');
    setDriverName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'স্কুল পরিবহন ও বাস সার্ভিস' : 'Transport & Bus Fleet Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'স্কুল বাস রুট, পিক-আপ ও ড্রপ পয়েন্ট, চালক তথ্য ও মাসিক ভাড়া'
              : 'Routes, vehicle fleet, driver contacts, pickup stops & monthly fares'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleOpenAddRoute}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন রুট যোগ করুন' : 'Add New Route'}</span>
          </button>
        )}
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between text-xs"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{route.routeName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
                    {route.vehicleNo}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatTaka(route.monthlyFare)}
                  </span>
                  <div className="text-[10px] text-slate-400">Monthly Fare</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Driver:
                  </span>
                  <strong className="text-slate-800">{route.driverName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Contact:
                  </span>
                  <span className="text-blue-700 font-medium">{route.driverPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Enrolled Students:
                  </span>
                  <span className="font-bold text-slate-800">{route.assignedStudentsCount} Students</span>
                </div>
              </div>

              {/* Stops */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="font-semibold text-slate-700 text-[11px] block mb-1.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  Stops & Pick-up Points:
                </span>
                <div className="flex flex-wrap gap-1">
                  {route.stops.map((stop, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
                      {stop}
                    </span>
                  ))}
                </div>
              </div>

              {canManage && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEditRoute(route)}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center space-x-1 transition-colors"
                    title={language === 'bn' ? 'রুট এডিট করুন' : 'Edit Route'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(route.id, route.routeName)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={language === 'bn' ? 'রুট মুছুন' : 'Delete Route'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingRoute
                  ? (language === 'bn' ? 'বাস রুট সম্পাদনা করুন' : 'Edit Transport Route')
                  : (language === 'bn' ? 'নতুন পরিবহন রুট যোগ করুন' : 'Add New Transport Route')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRoute} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route 3: Dhanmondi - Mohammadpur - School"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Vehicle Reg No</label>
                  <input
                    type="text"
                    placeholder="Dhaka Metro-Cha-11-2090"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Monthly Fare (৳)</label>
                  <input
                    type="number"
                    value={monthlyFare}
                    onChange={(e) => setMonthlyFare(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Md. Rafiqul"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Driver Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-xxxxxx"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Stops (comma separated)</label>
                <input
                  type="text"
                  value={stopsText}
                  onChange={(e) => setStopsText(e.target.value)}
                  placeholder="Stop 1, Stop 2, School Gate"
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
                  {editingRoute
                    ? (language === 'bn' ? 'রুট পরিবর্তন সংরক্ষণ করুন' : 'Update Route')
                    : (language === 'bn' ? 'রুট যোগ করুন' : 'Save Route')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
