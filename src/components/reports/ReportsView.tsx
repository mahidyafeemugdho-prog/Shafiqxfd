import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import {
  BarChart3,
  Printer,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Users,
  Wallet,
  CalendarCheck2,
  Award,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { language, formatTaka, toBnNumber } = useLanguage();
  const [reportType, setReportType] = useState<string>('students');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const students = StorageService.getStudents();
  const staff = StorageService.getStaff();
  const invoices = StorageService.getInvoices();
  const payments = StorageService.getPayments();
  const attendance = StorageService.getAttendance();

  // Export CSV Helper
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (reportType === 'students') {
      const headers = ['Student ID', 'Roll', 'Name (English)', 'Name (Bengali)', 'Class', 'Section', 'Shift', 'Guardian Phone', 'Address'];
      const rows = students.map((s) => [s.studentId, s.roll, s.nameEn, s.nameBn, s.className, s.section, s.shift, s.guardianPhone, s.presentAddress]);
      handleExportCSV('student_register_report', headers, rows);
    } else if (reportType === 'fees') {
      const headers = ['Invoice No', 'Student Name', 'Class', 'Fee Type', 'Net Amount', 'Paid Amount', 'Due Amount', 'Status'];
      const rows = invoices.map((i) => [i.invoiceNo, i.studentNameEn, `${i.className} (${i.section})`, i.feeType, i.netAmount, i.paidAmount, i.dueAmount, i.status]);
      handleExportCSV('fee_collection_dues_report', headers, rows);
    } else if (reportType === 'staff') {
      const headers = ['Employee ID', 'Name', 'Designation', 'Department', 'Phone', 'Basic Salary'];
      const rows = staff.map((st) => [st.employeeId, st.nameEn, st.designation, st.department, st.phone, st.basicSalary]);
      handleExportCSV('staff_payroll_directory', headers, rows);
    }
  };

  const filteredStudents = selectedClass === 'all' ? students : students.filter((s) => s.className === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'রিপোর্ট ও বিশ্লেষণ এক্সপোর্ট সেন্টার' : 'Reports & Analytics Export Center'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'শিক্ষার্থী রেজিস্ট্রি, ফি বকেয়া হিসাব এবং স্টাফ বেতন বিবরণী ডাউনলোড করুন'
              : 'Generate and download printable registers and CSV spreadsheets'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCurrent}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Select Report Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {[
          { id: 'students', label: 'Student Enrollment Register', icon: Users, count: students.length },
          { id: 'fees', label: 'Fee Collection & Dues Register', icon: Wallet, count: invoices.length },
          { id: 'staff', label: 'Faculty & Payroll Directory', icon: BarChart3, count: staff.length },
        ].map((rep) => {
          const Icon = rep.icon;
          const isSelected = reportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setReportType(rep.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {rep.count} Records
                </span>
              </div>
              <h4 className="font-bold text-slate-900 mt-2 text-xs">{rep.label}</h4>
            </button>
          );
        })}
      </div>

      {/* Report Table Display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            {reportType === 'students' && 'Complete Student Directory Register'}
            {reportType === 'fees' && 'Fee Invoices and Receivables Audit Log'}
            {reportType === 'staff' && 'Employee Personnel & Salary Scale Report'}
          </span>
          <span className="text-slate-500 font-medium">Session: 2026</span>
        </div>
        <div className="overflow-x-auto">
          {reportType === 'students' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-2.5 px-4">ID & Roll</th>
                  <th className="py-2.5 px-4">Student Name (EN / BN)</th>
                  <th className="py-2.5 px-4">Class & Shift</th>
                  <th className="py-2.5 px-4">Guardian Contact</th>
                  <th className="py-2.5 px-4">Admission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-blue-700">{s.studentId} (Roll {s.roll})</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.nameEn} ({s.nameBn})</td>
                    <td className="py-2.5 px-4">{s.className} - {s.section} ({s.shift})</td>
                    <td className="py-2.5 px-4 text-slate-700">{s.guardianName} ({s.guardianPhone})</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.admissionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'fees' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-2.5 px-4">Invoice No</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Fee Month</th>
                  <th className="py-2.5 px-4 text-right">Net Amount</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Due</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-blue-700">{i.invoiceNo}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{i.studentNameEn}</td>
                    <td className="py-2.5 px-4 text-slate-700">{i.month || i.feeType}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatTaka(i.netAmount)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{formatTaka(i.paidAmount)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">{formatTaka(i.dueAmount)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${i.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'staff' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-2.5 px-4">Emp ID</th>
                  <th className="py-2.5 px-4">Full Name</th>
                  <th className="py-2.5 px-4">Designation & Department</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-right">Basic Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-700">{st.employeeId}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{st.nameEn} ({st.nameBn})</td>
                    <td className="py-2.5 px-4 text-slate-700">{st.designation} • {st.department}</td>
                    <td className="py-2.5 px-4 text-slate-600">{st.phone}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{formatTaka(st.basicSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
