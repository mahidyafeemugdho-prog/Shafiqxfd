import { Appointment, Chamber, DoctorProfile, FeeConfig, Prescription } from '../types';
import { formatCurrency, formatDatePretty } from './feeCalculator';

/**
 * Downloads a compact, beautiful, standalone HTML Appointment Token Slip.
 * Can be opened offline, saved as PDF, or printed anytime.
 */
export function downloadTokenSlip(
  appointment: Appointment,
  chamber: Chamber | undefined,
  doctor: DoctorProfile,
  feeConfig: FeeConfig,
  isBn: boolean = false
) {
  const isFollowUp = appointment.visitType === 'FOLLOW_UP_2M';
  const currency = feeConfig.currencySymbol;

  const htmlContent = `<!DOCTYPE html>
<html lang="${isBn ? 'bn' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Token_#${String(appointment.serialNumber).padStart(2, '0')}_${appointment.patientName.replace(/\s+/g, '_')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #f1f5f9; padding: 20px; display: flex; justify-content: center; }
    .slip-card {
      background: #ffffff;
      width: 100%;
      max-width: 380px;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .header { background: #0f172a; color: #fff; padding: 14px; text-align: center; }
    .header h2 { font-size: 16px; font-weight: 800; }
    .header p { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .header .spec { font-size: 10px; color: #5eead4; text-transform: uppercase; font-weight: 700; margin-top: 2px; }

    .token-box {
      background: linear-gradient(135deg, #0d9488, #059669);
      color: #fff;
      padding: 14px;
      text-align: center;
    }
    .token-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #ccfbf1; font-weight: 700; }
    .token-box .num { font-size: 38px; font-weight: 900; line-height: 1.1; margin: 4px 0; }
    .token-box .slot { display: inline-block; background: rgba(0,0,0,0.25); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }

    .body-content { padding: 14px; color: #334155; font-size: 11px; }
    .chamber-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
    .chamber-box strong { font-size: 12px; color: #0f172a; display: block; }
    .chamber-box .room { display: inline-block; background: #e6fffa; color: #0f766e; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-top: 4px; font-size: 10px; }

    .patient-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 6px 0; }
    .patient-row .label { color: #64748b; font-weight: 600; }
    .patient-row .val { font-weight: 700; color: #0f172a; }

    .fee-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px; margin-top: 10px; }
    .fee-row { display: flex; justify-content: space-between; align-items: center; }
    .fee-row .amount { font-size: 16px; font-weight: 900; color: #065f46; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .badge-paid { background: #dcfce7; color: #15803d; }
    .badge-unpaid { background: #fef3c7; color: #b45309; }

    .instructions { font-size: 9px; color: #64748b; margin-top: 10px; line-height: 1.4; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    .btn-bar { padding: 10px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .btn { background: #0d9488; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .slip-card { border: none; box-shadow: none; max-width: 100%; width: 100%; }
      .btn-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="slip-card">
    <div class="header">
      <h2>${doctor.name}</h2>
      <p>${doctor.qualifications}</p>
      <div class="spec">${doctor.speciality} • Reg: ${doctor.bmdcRegNo}</div>
    </div>

    <div class="token-box">
      <div class="label">${isBn ? 'সিরিয়াল টোকেন নম্বর' : 'Appointment Serial Token'}</div>
      <div class="num">#${String(appointment.serialNumber).padStart(2, '0')}</div>
      <div class="slot">${appointment.timeSlot}</div>
    </div>

    <div class="body-content">
      <div class="chamber-box">
        <strong>${chamber?.hospitalName || 'Doctor Chamber'}</strong>
        <p>${chamber?.branchOrArea || ''} - ${chamber?.address || ''}</p>
        <span class="room">${chamber?.roomNumber || 'Room OPD'}</span>
        ${chamber?.phone ? `<p style="margin-top:4px;color:#64748b;">Helpline: ${chamber.phone}</p>` : ''}
      </div>

      <div class="patient-row">
        <span class="label">${isBn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
        <span class="val">${appointment.patientName}</span>
      </div>
      <div class="patient-row">
        <span class="label">${isBn ? 'বয়স / লিঙ্গ:' : 'Age / Gender:'}</span>
        <span class="val">${appointment.patientAge} Yrs • ${appointment.patientGender}</span>
      </div>
      <div class="patient-row">
        <span class="label">${isBn ? 'মোবাইল নম্বর:' : 'Mobile Phone:'}</span>
        <span class="val">${appointment.patientPhone}</span>
      </div>
      <div class="patient-row">
        <span class="label">${isBn ? 'তারিখ:' : 'Date:'}</span>
        <span class="val">${formatDatePretty(appointment.date)}</span>
      </div>

      <div class="fee-box">
        <div class="fee-row">
          <div>
            <span style="font-weight:700; color:#1e293b;">${
              isFollowUp
                ? isBn ? '২ মাসের ফলো-আপ' : '2-Month Follow-Up'
                : isBn ? '১ম ভিজিট' : '1st Visit'
            }</span>
            <span class="badge ${appointment.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}">
              ${appointment.paymentStatus === 'PAID' ? 'PAID' : 'DUE / UNPAID'}
            </span>
          </div>
          <div class="amount">${formatCurrency(appointment.payableAmount, currency)}</div>
        </div>
        ${
          appointment.daysSinceLastVisit !== undefined
            ? `<p style="font-size:9px;color:#047857;margin-top:4px;">✓ ${
                isBn
                  ? `শেষ ভিজিট: ${appointment.daysSinceLastVisit} দিন আগে (২ মাসের ফলো-আপ ফি কার্যকর)`
                  : `Last visit: ${appointment.daysSinceLastVisit}d ago (2M Follow-up auto rate)`
              }</p>`
            : ''
        }
      </div>

      <div class="instructions">
        <p>• ${isBn ? 'নির্ধারিত সময়ের ১৫ মিনিট পূর্বে উপস্থিত থাকুন।' : 'Report 15 minutes before your time.'}</p>
        <p>• ${isBn ? 'পূর্বের প্রেসক্রিপশন ও টেস্ট রিপোর্ট সাথে আনুন।' : 'Bring all prior prescriptions & lab reports.'}</p>
      </div>
    </div>

    <div class="btn-bar">
      <button class="btn" onclick="window.print()">${isBn ? 'প্রিন্ট বা পিডিএফ সেভ করুন' : 'Print / Save PDF'}</button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Token_#${String(appointment.serialNumber).padStart(2, '0')}_${appointment.patientName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a complete Digital Prescription (Digital Rx) as an offline HTML document.
 * Opens with authentic medical letterhead and triggers browser print-to-PDF.
 */
export function downloadDigitalPrescription(
  appointment: Appointment,
  prescription: Prescription,
  chamber: Chamber | undefined,
  doctor: DoctorProfile,
  isBn: boolean = false
) {
  const htmlContent = `<!DOCTYPE html>
<html lang="${isBn ? 'bn' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rx_${prescription.patientName.replace(/\s+/g, '_')}_${prescription.date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #f8fafc; padding: 24px; display: flex; justify-content: center; }
    .rx-page {
      background: #ffffff;
      width: 100%;
      max-width: 800px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .doctor-header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doctor-header h1 { font-size: 22px; font-weight: 900; color: #0f172a; }
    .doctor-header .qual { font-size: 13px; font-weight: 600; color: #0f766e; margin-top: 2px; }
    .doctor-header .spec { font-size: 12px; color: #475569; }
    .doctor-header .chamber-info { text-align: right; font-size: 12px; color: #475569; }
    .doctor-header .chamber-info strong { color: #0f172a; font-size: 13px; display: block; }

    .patient-bar {
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: 8px;
      margin: 14px 0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #1e293b;
    }
    .patient-bar strong { font-weight: 700; color: #0f172a; }

    .vitals-row {
      display: flex;
      gap: 12px;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
    }
    .vitals-row span { color: #64748b; }
    .vitals-row strong { color: #0f172a; margin-left: 4px; }

    .rx-body { display: grid; grid-template-columns: 240px 1fr; gap: 24px; min-height: 420px; }
    .left-col { border-right: 1px solid #e2e8f0; padding-right: 16px; font-size: 12px; }
    .left-col h3 { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 6px; }
    .left-col ul { list-style: square; padding-left: 16px; color: #334155; line-height: 1.6; }

    .right-col { padding-left: 8px; }
    .rx-sym { font-family: serif; font-size: 32px; font-weight: 900; color: #0f766e; line-height: 1; margin-bottom: 12px; }
    .med-item { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
    .med-name { font-size: 14px; font-weight: 800; color: #0f172a; }
    .med-dose { font-size: 12px; color: #0f766e; font-weight: 700; margin-top: 2px; }
    .med-sub { font-size: 11px; color: #64748b; }

    .advice-box { background: #f8fafc; border-left: 3px solid #0f766e; padding: 10px 14px; margin-top: 20px; font-size: 12px; }
    .advice-box strong { display: block; color: #0f172a; margin-bottom: 4px; }

    .follow-up-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #065f46; font-weight: 600; margin-top: 12px; }

    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #94a3b8; }
    .signature { text-align: center; }
    .signature .sign-line { width: 160px; border-bottom: 1px solid #64748b; padding-bottom: 4px; font-family: serif; font-style: italic; font-size: 15px; color: #0f766e; }

    .btn-bar { text-align: center; margin-top: 20px; }
    .btn { background: #0f766e; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; }

    @media print {
      body { background: #fff; padding: 0; }
      .rx-page { border: none; box-shadow: none; max-width: 100%; padding: 0; }
      .btn-bar { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="rx-page">
      <div class="doctor-header">
        <div>
          <h1>${doctor.name}</h1>
          <div class="qual">${doctor.qualifications}</div>
          <div class="spec">${doctor.title} • ${doctor.speciality}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">BMDC Reg. No: ${doctor.bmdcRegNo}</div>
        </div>
        <div class="chamber-info">
          <strong>${chamber?.hospitalName || 'Doctor Chamber'}</strong>
          <p>${chamber?.branchOrArea || ''} - ${chamber?.roomNumber || ''}</p>
          <p>Helpline: ${chamber?.phone || doctor.phone}</p>
        </div>
      </div>

      <div class="patient-bar">
        <div><span>Patient: </span><strong>${prescription.patientName}</strong></div>
        <div><span>Age/Sex: </span><strong>${prescription.patientAge} Yrs / ${prescription.patientGender}</strong></div>
        <div><span>Date: </span><strong>${formatDatePretty(prescription.date)}</strong></div>
        <div><span>Token: </span><strong>#${String(appointment.serialNumber).padStart(2, '0')}</strong></div>
      </div>

      <div class="vitals-row">
        <div><span>BP:</span><strong>${prescription.vitals.bloodPressure || 'N/A'}</strong></div>
        <div><span>Pulse:</span><strong>${prescription.vitals.pulseRate || 'N/A'}</strong></div>
        <div><span>Weight:</span><strong>${prescription.vitals.weightKg || 'N/A'}</strong></div>
        <div><span>Temp:</span><strong>${prescription.vitals.temperature || 'N/A'}</strong></div>
        <div><span>SpO2:</span><strong>${prescription.vitals.spo2 || 'N/A'}</strong></div>
      </div>

      <div class="rx-body">
        <div class="left-col">
          <h3>Chief Complaints</h3>
          <p style="margin-bottom:12px;color:#334155;">${prescription.chiefComplaints}</p>

          <h3>Diagnosis</h3>
          <p style="margin-bottom:16px;color:#0f766e;font-weight:700;">${prescription.diagnosis}</p>

          <h3>Advised Investigations</h3>
          <ul>
            ${prescription.investigations.map((inv) => `<li>${inv}</li>`).join('')}
          </ul>
        </div>

        <div class="right-col">
          <div class="rx-sym">℞</div>
          ${prescription.medicines
            .map(
              (m, idx) => `
            <div class="med-item">
              <div class="med-name">${idx + 1}. ${m.name}</div>
              <div class="med-dose">${m.dosage} &nbsp;&nbsp;(${m.timing}) &nbsp;&nbsp;[${m.duration}]</div>
              ${m.instructions ? `<div class="med-sub">Note: ${m.instructions}</div>` : ''}
            </div>
          `
            )
            .join('')}

          ${
            prescription.advice
              ? `
            <div class="advice-box">
              <strong>Advice & Guidance:</strong>
              <p>${prescription.advice}</p>
            </div>
          `
              : ''
          }

          ${
            prescription.nextFollowUpNote
              ? `
            <div class="follow-up-box">
              ✓ Follow-up: ${prescription.nextFollowUpNote}
            </div>
          `
              : ''
          }
        </div>
      </div>

      <div class="footer">
        <div>
          <p>DocChamber Digital Prescription Pad</p>
          <p>Rx ID: ${prescription.id}</p>
        </div>
        <div class="signature">
          <div class="sign-line">${doctor.name}</div>
          <p style="margin-top:2px;">Specialist Signature</p>
        </div>
      </div>
    </div>

    <div class="btn-bar">
      <button class="btn" onclick="window.print()">${isBn ? 'প্রিন্ট বা পিডিএফ সেভ করুন' : 'Print / Save PDF'}</button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Prescription_Rx_${prescription.patientName.replace(/\s+/g, '_')}_${prescription.date}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
