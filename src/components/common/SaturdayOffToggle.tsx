import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, CheckCircle2, Moon, Sun, ToggleLeft, ToggleRight } from 'lucide-react';

interface SaturdayOffToggleProps {
  compact?: boolean;
  className?: string;
  onChange?: (isOff: boolean) => void;
}

export const SaturdayOffToggle: React.FC<SaturdayOffToggleProps> = ({ compact = false, className = '', onChange }) => {
  const { language } = useLanguage();
  const [isSaturdayOff, setIsSaturdayOff] = useState<boolean>(() => StorageService.isSaturdayOff());

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e.detail && typeof e.detail.isSaturdayOff === 'boolean') {
        setIsSaturdayOff(e.detail.isSaturdayOff);
      } else {
        setIsSaturdayOff(StorageService.isSaturdayOff());
      }
    };
    window.addEventListener('saturday_off_toggled', handleToggle);
    return () => window.removeEventListener('saturday_off_toggled', handleToggle);
  }, []);

  const handleToggle = () => {
    const newState = StorageService.toggleSaturdayOff();
    setIsSaturdayOff(newState);
    if (onChange) onChange(newState);
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        type="button"
        title={
          isSaturdayOff
            ? language === 'bn'
              ? 'শনিবার সাপ্তাহিক ছুটি সক্রিয় (স্কুল মোড)। মাদরাসার জন্য শনিবার ক্লাস চালু করতে ১-ক্লিক করুন।'
              : 'Saturday Weekend Off (School mode). Click to make Saturday an Open working day (Madrasha mode).'
            : language === 'bn'
              ? 'শনিবার খোলা ও ক্লাস চালু (মাদরাসা মোড)। শনিবার সাপ্তাহিক ছুটি করতে ১-ক্লিক করুন।'
              : 'Saturday is Open & Working (Madrasha mode). Click to make Saturday a Weekend Off.'
        }
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition-all shadow-2xs border ${
          isSaturdayOff
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
        } ${className}`}
      >
        <span className="flex items-center space-x-1">
          <span
            className={`w-2 h-2 rounded-full ${isSaturdayOff ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
          />
          <span>
            {language === 'bn'
              ? isSaturdayOff
                ? 'শনিবার: ছুটি (School Off)'
                : 'শনিবার: খোলা (Madrasha Open)'
              : isSaturdayOff
              ? 'Saturday: Off (School)'
              : 'Saturday: Open (Madrasha)'}
          </span>
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
            isSaturdayOff ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
          }`}
        >
          {language === 'bn' ? '১-ক্লিক' : 'Toggle'}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        isSaturdayOff
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isSaturdayOff ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-sm">
                {language === 'bn' ? 'শনিবার সাপ্তাহিক ছুটি ও ক্লাসের সময়সূচি' : 'Saturday Weekend & Class Schedule'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                  isSaturdayOff
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isSaturdayOff
                  ? language === 'bn'
                    ? 'স্কুল মোড: শনিবার ছুটি'
                    : 'School Mode: Weekend Off'
                  : language === 'bn'
                  ? 'মাদরাসা মোড: শনিবার খোলা'
                  : 'Madrasha Mode: Open Working Day'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isSaturdayOff
                ? language === 'bn'
                  ? 'সাধারণ স্কুলে শনিবার সাপ্তাহিক ছুটি থাকে। মাদরাসা বা যে প্রতিষ্ঠানে শনিবার ক্লাস হয়, তারা ১-ক্লিকে খোলা রাখতে পারেন।'
                  : 'Schools normally keep Saturday as weekend. For Madrashas or institutions with Saturday classes, toggle to Open with 1-click.'
                : language === 'bn'
                ? 'মাদরাসা ও বিশেষ প্রতিষ্ঠানে শনিবার নিয়মিত ক্লাস ও হাজিরা সক্রিয় রয়েছে। ছুটি করতে ১-ক্লিকে বন্ধ করুন।'
                : 'Madrashas operate on Saturdays. Click button to switch to Saturday Off.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          type="button"
          className={`shrink-0 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 border ${
            isSaturdayOff
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
          }`}
        >
          {isSaturdayOff ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
          <span>
            {isSaturdayOff
              ? language === 'bn'
                ? 'শনিবার খোলা করুন (মাদরাসা)'
                : 'Switch to Saturday Open'
              : language === 'bn'
              ? 'শনিবার ছুটি করুন (স্কুল)'
              : 'Switch to Saturday Off'}
          </span>
        </button>
      </div>
    </div>
  );
};
