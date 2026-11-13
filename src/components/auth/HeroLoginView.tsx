import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSchool } from '../../context/SchoolContext';
import { StorageService } from '../../services/storage';
import { Notice, AdmissionEnquiry, ClassLevel, WebsiteMessage, BlogPost } from '../../types';
import { DEFAULT_SCHOOL_LOGO } from '../../data/schoolLogo';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Award,
  Wallet,
  BookOpen,
  Users,
  Globe,
  Sparkles,
  School,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Building,
  KeyRound,
  HelpCircle,
  Phone,
  Mail,
  ChevronRight,
  X,
  Send,
  Star,
  ExternalLink,
  Menu,
  Printer,
  CalendarDays,
  Newspaper,
  Tag,
} from 'lucide-react';

export const HeroLoginView: React.FC = () => {
  const { loginWithCredentials, systemAccessControl } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { schoolProfile } = useSchool();

  // Ensure landing page always opens at top Hero Section
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Navigation State
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'blog' | 'notice' | 'contact'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccessBlocked, setIsAccessBlocked] = useState<boolean>(false);
  const [blockedReason, setBlockedReason] = useState<string>('');

  // Blog State
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [blogCategoryFilter, setBlogCategoryFilter] = useState<string>('All');

  // Admission Enquiry Modal State
  const [showAdmissionModal, setShowAdmissionModal] = useState<boolean>(false);
  const [enquiryName, setEnquiryName] = useState<string>('');
  const [enquiryPhone, setEnquiryPhone] = useState<string>('');
  const [enquiryClass, setEnquiryClass] = useState<ClassLevel>('Class 1');
  const [enquiryNotes, setEnquiryNotes] = useState<string>('');
  const [enquirySuccess, setEnquirySuccess] = useState<boolean>(false);

  // Notice View State
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  // Data
  const [notices, setNotices] = useState<Notice[]>(() => StorageService.getNotices());
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => StorageService.getPublishedBlogPosts());

  useEffect(() => {
    const handleSync = () => {
      setNotices(StorageService.getNotices());
      setBlogPosts(StorageService.getPublishedBlogPosts());
    };
    window.addEventListener('school_cloud_data_synced', handleSync);
    window.addEventListener('school_profile_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('school_cloud_data_synced', handleSync);
      window.removeEventListener('school_profile_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const heroImageSrc =
    schoolProfile.heroImageUrl || '/assets/aistudio/school_hero.webp';
  const aboutImageSrc =
    schoolProfile.aboutImageUrl || schoolProfile.heroImageUrl || '/assets/aistudio/school_hero.webp';

  const scrollToSection = (sectionId: string, sectionKey: 'home' | 'about' | 'blog' | 'notice' | 'contact') => {
    setActiveSection(sectionKey);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড লিখুন'
          : 'Please enter your username and password'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsAccessBlocked(false);
    setBlockedReason('');

    setTimeout(() => {
      try {
        const result = loginWithCredentials(username, password);
        setIsLoading(false);

        if (!result.success) {
          if (result.errorType === 'SYSTEM_LOCKED' || result.errorType === 'ROLE_DISABLED') {
            setIsAccessBlocked(true);
            setBlockedReason(result.errorMessage || systemAccessControl.disabledMessage);
          } else {
            setErrorMessage(
              result.errorMessage ||
                (language === 'bn'
                  ? 'ভুল আইডি বা পাসওয়ার্ড! সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।'
                  : 'Invalid username or password! Please verify and try again.')
            );
          }
        } else {
          // Success: immediately close modal and reset state
          setShowLoginModal(false);
          setUsername('');
          setPassword('');
          setErrorMessage(null);
        }
      } catch (err: any) {
        console.error('Login process error:', err);
        setIsLoading(false);
        setErrorMessage(
          language === 'bn'
            ? 'লগইন যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Error verifying credentials. Please try again.'
        );
      }
    }, 250);
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryPhone) return;

    const newEnquiry: AdmissionEnquiry = {
      id: `enq_${Date.now()}`,
      applicationNo: `APP-${schoolProfile.currentSession || '2026'}-${Math.floor(1000 + Math.random() * 9000)}`,
      applicantNameEn: enquiryName,
      applicantNameBn: enquiryName,
      applyingClass: enquiryClass,
      gender: 'Male',
      dob: '2016-01-01',
      guardianName: enquiryName,
      phone: enquiryPhone,
      address: schoolProfile.addressBn || 'Dhaka',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      remarks: enquiryNotes || 'Online website application',
    };

    StorageService.addEnquiry(newEnquiry);
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setShowAdmissionModal(false);
      setEnquiryName('');
      setEnquiryPhone('');
      setEnquiryNotes('');
    }, 2000);
  };

  // Direct Submission to Super Admin Inbox
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;

    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMsg: WebsiteMessage = {
      id: `msg_${Date.now()}`,
      senderName: contactName,
      phone: contactPhone,
      message: contactMessage || (language === 'bn' ? 'সাধারণ যোগাযোগ ও তথ্য অনুসন্ধান' : 'General inquiry'),
      sentAt: nowFormatted,
      isRead: false,
    };
    StorageService.addWebsiteMessage(newMsg);

    // Also record as enquiry for record consistency
    const newEnquiry: AdmissionEnquiry = {
      id: `contact_${Date.now()}`,
      applicationNo: `MSG-${Date.now().toString().slice(-4)}`,
      applicantNameEn: contactName,
      applicantNameBn: contactName,
      applyingClass: 'Class 1',
      gender: 'Male',
      dob: '2016-01-01',
      guardianName: contactName,
      phone: contactPhone,
      address: schoolProfile.addressBn || 'Dhaka',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      remarks: `Website Message: ${contactMessage}`,
    };
    StorageService.addEnquiry(newEnquiry);

    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactName('');
      setContactPhone('');
      setContactMessage('');
    }, 3000);
  };

  const blogCategories = [
    { id: 'All', en: 'All Articles', bn: 'সকল বিষয়' },
    { id: 'Academic', en: 'Academic', bn: 'একাডেমিক' },
    { id: 'Science & Tech', en: 'Science & Tech', bn: 'বিজ্ঞান ও প্রযুক্তি' },
    { id: 'Co-Curricular', en: 'Co-Curricular', bn: 'সহ-পাঠ্যক্রম' },
    { id: 'Events', en: 'Events', bn: 'ইভেন্ট ও উৎসব' },
    { id: 'Sports', en: 'Sports', bn: 'ক্রীড়া' },
    { id: 'Moral & Values', en: 'Moral & Values', bn: 'নৈতিক শিক্ষা' },
  ];

  const filteredBlogPosts =
    blogCategoryFilter === 'All'
      ? blogPosts
      : blogPosts.filter(
          (p) => p.category === blogCategoryFilter || p.categoryBn === blogCategoryFilter
        );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAV CONTACT & LOGIN BAR (Matches image dark blue top bar) */}
      <div className="bg-[#0B1E36] text-white py-2 px-4 sm:px-8 text-xs border-b border-slate-800 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: Contact Info */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-200">
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>{schoolProfile.phone || '+880 1700 123456'}</span>
            </div>
            <span className="hidden sm:inline text-slate-600">•</span>
            <div className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>{schoolProfile.email || 'info@alamin.edu.bd'}</span>
            </div>
            <span className="hidden md:inline text-slate-600">•</span>
            <div className="hidden md:flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate max-w-xs">{schoolProfile.addressBn || 'কাওয়ালীপাড়া, ঢাকা'}</span>
            </div>
          </div>

          {/* Right: Social, Language, and Login Button */}
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-sky-300 font-bold hidden lg:inline">
              EIIN: {schoolProfile.eiin} • সেশন {schoolProfile.currentSession}
            </span>
            <button
              onClick={toggleLanguage}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {language === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-full text-xs font-bold transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লগইন' : 'Login'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER & NAVIGATION (Matches image clean white navbar) */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Logo & School Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('hero', 'home')}>
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
              {schoolProfile.logoUrl ? (
                <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <GraduationCap className="w-7 h-7 text-blue-700" />
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#0B1E36] leading-tight tracking-tight">
                {language === 'bn' ? schoolProfile.nameBn : schoolProfile.nameEn}
              </h1>
              <p className="text-[11px] text-teal-700 font-bold mt-0.5">
                {schoolProfile.mottoBn || 'জ্ঞান • নৈতিকতা • সুন্দর ভবিষ্যৎ'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-700">
            <button
              onClick={() => scrollToSection('hero', 'home')}
              className={`py-1 relative transition-colors ${
                activeSection === 'home' ? 'text-emerald-700 font-black' : 'hover:text-blue-700'
              }`}
            >
              <span>{language === 'bn' ? 'হোম' : 'Home'}</span>
              {activeSection === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => scrollToSection('about', 'about')}
              className={`py-1 relative transition-colors ${
                activeSection === 'about' ? 'text-emerald-700 font-black' : 'hover:text-blue-700'
              }`}
            >
              <span>{language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}</span>
              {activeSection === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => scrollToSection('blog', 'blog')}
              className={`py-1 relative transition-colors ${
                activeSection === 'blog' ? 'text-emerald-700 font-black' : 'hover:text-blue-700'
              }`}
            >
              <span>{language === 'bn' ? 'স্কুল ব্লগ' : 'School Blog'}</span>
              {activeSection === 'blog' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => scrollToSection('notice', 'notice')}
              className={`py-1 relative transition-colors ${
                activeSection === 'notice' ? 'text-emerald-700 font-black' : 'hover:text-blue-700'
              }`}
            >
              <span>{language === 'bn' ? 'নোটিশ' : 'Notice'}</span>
              {activeSection === 'notice' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => scrollToSection('contact', 'contact')}
              className={`py-1 relative transition-colors ${
                activeSection === 'contact' ? 'text-emerald-700 font-black' : 'hover:text-blue-700'
              }`}
            >
              <span>{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</span>
              {activeSection === 'contact' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl font-bold shadow-xs transition-all flex items-center space-x-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'পোর্টাল লগইন' : 'ERP Sign In'}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold"
            >
              {language === 'bn' ? 'লগইন' : 'Login'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 text-xs font-bold text-slate-700 animate-in slide-in-from-top-2">
            <button
              onClick={() => scrollToSection('hero', 'home')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              {language === 'bn' ? 'হোম' : 'Home'}
            </button>
            <button
              onClick={() => scrollToSection('about', 'about')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us'}
            </button>
            <button
              onClick={() => scrollToSection('blog', 'blog')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 font-bold text-emerald-700"
            >
              {language === 'bn' ? 'স্কুল ব্লগ ও আর্টিকেলের পাতা' : 'School Blog & Articles'}
            </button>
            <button
              onClick={() => scrollToSection('notice', 'notice')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              {language === 'bn' ? 'নোটিশ বোর্ড' : 'Notice Board'}
            </button>
            <button
              onClick={() => scrollToSection('contact', 'contact')}
              className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </button>
          </div>
        )}
      </header>

      {/* SYSTEM BROADCAST NOTICE (if locked) */}
      {systemAccessControl.isSystemLocked && (
        <div className="bg-rose-900 text-rose-100 py-3 px-4 sm:px-8 text-xs border-b border-rose-700 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider block sm:inline mr-2">
                {language === 'bn' ? 'সিস্টেম রক্ষণাবেক্ষণ নোটিশ:' : 'System Maintenance Alert:'}
              </span>
              <span>"{systemAccessControl.disabledMessage}"</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO SECTION (Exact visual design as uploaded screenshot) */}
      <section
        id="hero"
        className="relative bg-gradient-to-r from-[#17529E] via-[#2167BA] to-[#3B82F6] text-white overflow-hidden pt-8 pb-20 sm:pt-14 sm:pb-28"
      >
        {/* Soft Background Accent Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content (Text & CTA Buttons) */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Tagline Badge */}
              <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{schoolProfile.heroTaglineBn || 'শিক্ষাই আলো, শিক্ষাই শক্তি'}</span>
              </div>

              {/* Big Heading with Golden Yellow "স্বাগতম" */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                  {language === 'bn' ? schoolProfile.nameBn : schoolProfile.nameEn}
                </h1>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#FBBF24] leading-tight tracking-tight drop-shadow-sm">
                  {schoolProfile.heroWelcomeTitleBn || (language === 'bn' ? 'স্বাগতম' : 'Welcome')}
                </h2>
              </div>

              {/* Subtitle Description */}
              <p className="text-sm sm:text-base text-blue-50/95 leading-relaxed max-w-xl font-medium">
                {schoolProfile.heroSubtitleBn ||
                  'আধুনিক শিক্ষা, নৈতিকতা ও ইসলামিক মূল্যবোধের সমন্বয়ে গড়ে তুলছি আলোকিত প্রজন্ম।'}
              </p>

              {/* Action Buttons (Admission button only; login is available in top bar) */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => setShowAdmissionModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-full text-xs sm:text-sm font-black shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নতুন ভর্তি চলছে' : 'Admission Open'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-4 pt-2 text-[11px] text-blue-100 font-semibold">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Nursery থেকে Class 10</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>সেশন {schoolProfile.currentSession}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>ডিজিটাল ইআরপি</span>
                </span>
              </div>
            </div>

            {/* Right Hero Image (School Building & Smiling Students) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 bg-slate-800/40 relative group">
                <img
                  src={heroImageSrc}
                  alt="School & Students"
                  className="w-full h-72 sm:h-84 lg:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-white/95 backdrop-blur-md rounded-xl text-slate-900 flex items-center justify-between shadow-lg">
                  <div>
                    <h5 className="font-bold text-xs truncate">{schoolProfile.nameBn}</h5>
                    <p className="text-[10px] text-slate-500">শিক্ষার্থীবান্ধব আধুনিক ডিজিটাল ক্যাম্পাস</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    ভর্তি সেশন {schoolProfile.currentSession}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OVERLAPPING 4-STAT FLOATING CARD (Matches image exact 4 stat counters) */}
      <div className="-mt-10 sm:-mt-14 relative z-20 max-w-6xl w-full mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Stat 1: Students */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolProfile.statsStudents || '৫০০+'}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {language === 'bn' ? 'শিক্ষার্থী' : 'Students'}
            </div>
          </div>

          {/* Stat 2: Teachers */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolProfile.statsTeachers || '২৫+'}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {language === 'bn' ? 'শিক্ষক-শিক্ষিকা' : 'Teachers'}
            </div>
          </div>

          {/* Stat 3: Classrooms */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Building className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolProfile.statsClassrooms || '১০+'}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {language === 'bn' ? 'ক্লাস রুম' : 'Classrooms'}
            </div>
          </div>

          {/* Stat 4: Experience */}
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <Star className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolProfile.statsExperience || '১০+'}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {language === 'bn' ? 'বছরের অভিজ্ঞতা' : 'Years Experience'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. ABOUT US SECTION (Matches image "আমাদের সম্পর্কে") */}
      <section id="about" className="py-14 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B1E36] tracking-tight">
                {language === 'bn' ? 'আমাদের সম্পর্কে' : 'About Our Institute'}
              </h2>
              <div className="w-16 h-1 bg-teal-500 rounded-full mt-2" />
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal pt-2">
              {language === 'bn'
                ? 'আমরা আধুনিক শিক্ষা, নৈতিকতা ও ইসলামিক মূল্যবোধের সমন্বয়ে শিক্ষার্থীদের একটি সুন্দর ভবিষ্যৎ গড়ে তুলতে নিরলসভাবে কাজ করে যাচ্ছি।'
                : 'We are dedicated to building a brighter future for students by synthesizing modern academics, high ethical standards, and moral values.'}
            </p>

            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              {language === 'bn'
                ? `${schoolProfile.nameBn}-এ রয়েছে দক্ষ ও অভিজ্ঞ শিক্ষকমণ্ডলী, বিজ্ঞানাগার, আইসিটি ল্যাব, সমৃদ্ধ লাইব্রেরি, প্রশস্ত খেলার মাঠ এবং আধুনিক প্রযুক্তি নির্ভর মাল্টিমিডিয়া ক্লাসরুম। শিক্ষার্থীদের মেধা ও মনন বিকাশে আমরা সর্বদা সচেষ্ট।`
                : `Featuring certified faculty members, digital science laboratories, modern ICT facilities, automated libraries, and playground infrastructure.`}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">নৈতিক ও ডিজিটাল শিক্ষা</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">নিয়মিত উপস্থিতি ও এসএমএস</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">এনসিটিবি গ্রেডিং মার্কশিট</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">নিরাপদ ক্যাম্পাস ও পরিবহন</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => scrollToSection('contact', 'contact')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full border-2 border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
              >
                <span>{language === 'bn' ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Campus Building Photo (Matches image campus card) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200 bg-white relative group">
              <img
                src={aboutImageSrc}
                alt="School Campus Building"
                className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{schoolProfile.nameEn}</h4>
                  <p className="text-[11px] text-slate-500">Established {schoolProfile.establishedYear || '1988'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    EIIN: {schoolProfile.eiin}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SCHOOL BLOG & ARTICLES SECTION (স্কুল ব্লগ ও আর্টিকেলের পাতা) */}
      <section id="blog" className="py-14 sm:py-20 px-4 sm:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <Newspaper className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'bn' ? 'বিদ্যালয়ের সাম্প্রতিক ব্লগ ও আর্টিকেল' : 'School Blog & Articles'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B1E36]">
                {language === 'bn' ? 'জ্ঞানচর্চা, উদ্ভাবন ও বিদ্যালয়ের সমাচার' : 'Insights, Innovation & School Life'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {language === 'bn'
                  ? 'আমাদের শিক্ষক ও প্রশাসনের রচিত শিক্ষামূলক প্রবন্ধ, প্রযুক্তি ভাবনা ও বিভিন্ন একাডেমিক অর্জনের সংকলন।'
                  : 'Educational essays, tech innovations, and achievements authored by our faculty and administration.'}
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {filteredBlogPosts.length} {language === 'bn' ? 'টি প্রকাশিত আর্টিকেল' : 'Published Articles'}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {blogCategories.map((cat) => {
              const active = blogCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setBlogCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  {language === 'bn' ? cat.bn : cat.en}
                </button>
              );
            })}
          </div>

          {/* Blog Posts Grid */}
          {filteredBlogPosts.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-xs font-semibold">
                {language === 'bn'
                  ? 'এই ক্যাটাগরিতে বর্তমানে কোনো প্রকাশিত আর্টিকেল নেই।'
                  : 'No published articles found in this category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedBlogPost(post)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
                >
                  {/* Article Cover Image or Fallback */}
                  <div className="h-44 w-full bg-gradient-to-tr from-slate-800 to-slate-900 relative overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.titleBn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-4 text-center">
                        <BookOpen className="w-8 h-8 text-sky-400 mb-2 opacity-80" />
                        <span className="text-[11px] font-bold text-sky-200 tracking-wider uppercase">
                          {language === 'bn' ? post.categoryBn : post.category}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white/95 backdrop-blur-xs text-blue-900 shadow-xs border border-white/40">
                      {language === 'bn' ? post.categoryBn : post.category}
                    </span>
                    {post.featured && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400 text-amber-950 shadow-xs flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-amber-950" />
                        <span>{language === 'bn' ? 'সেরা' : 'Featured'}</span>
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mb-2">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {post.publishedAt}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          {language === 'bn' ? '৩ মিনিট পাঠ' : '3 min read'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                        {language === 'bn' ? post.titleBn : post.titleEn}
                      </h3>

                      <p className="text-slate-600 text-xs mt-2.5 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Read More Footer */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {post.authorName.charAt(0)}
                        </div>
                        <div className="truncate text-[11px]">
                          <span className="font-bold text-slate-800 block truncate">{post.authorName}</span>
                          <span className="text-slate-400 text-[10px] block truncate">{post.authorRole}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center font-bold text-blue-600 text-xs group-hover:text-blue-700 shrink-0">
                        <span>{language === 'bn' ? 'পড়ুন' : 'Read'}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. NOTICE BOARD SECTION */}
      <section id="notice" className="py-12 px-4 sm:px-8 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B1E36]">
                {language === 'bn' ? 'বিদ্যালয়ের নোটিশ বোর্ড' : 'Institutional Notice Board'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn' ? 'সকল জরুরি একাডেমিক ও প্রশাসনিক নোটিশ' : 'Latest academic announcements & notices'}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
              {notices.length} {language === 'bn' ? 'টি নোটিশ সক্রিয়' : 'Active Notices'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.slice(0, 6).map((notice) => (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {notice.date}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-1">{notice.title}</h3>
                  <p className="text-slate-600 mt-2 line-clamp-3 leading-relaxed">{notice.content}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-[11px]">
                  <span>{language === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read Notice'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT & LOCATION SECTION */}
      <section id="contact" className="py-14 px-4 sm:px-8 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Contact Info */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div>
                <h2 className="text-2xl font-black text-[#0B1E36]">
                  {language === 'bn' ? 'যোগাযোগ ও তথ্য কেন্দ্র' : 'Contact & Information Center'}
                </h2>
                <div className="w-14 h-1 bg-teal-500 rounded-full mt-2" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'bn'
                  ? 'ভর্তি সংক্রান্ত যেকোনো তথ্য, ফি বা প্রাতিষ্ঠানিক অনুসন্ধানের জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন অথবা বার্তা পাঠান।'
                  : 'For admissions, academic queries, or institutional information, reach out to our administration office.'}
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">ক্যাম্পাস ঠিকানা:</strong>
                    <span className="text-slate-600">{schoolProfile.addressBn || schoolProfile.addressEn}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">ফোন ও হেল্পলাইন:</strong>
                    <span className="text-slate-600">{schoolProfile.phone}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">অফিসিয়াল ইমেইল:</strong>
                    <span className="text-slate-600">{schoolProfile.email}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">অফিস সময়:</strong>
                    <span className="text-slate-600">শনিবার - বৃহস্পতিবার (সকাল ৯:০০ - বিকাল ৪:০০)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Message Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'বার্তা বা অনুসন্ধান পাঠান' : 'Send an Enquiry'}
                </h3>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  <span>{language === 'bn' ? 'সরাসরি সুপার অ্যাডমিন ইনবক্স' : 'Super Admin Inbox Only'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {language === 'bn'
                  ? 'আপনার বার্তা বা প্রশ্নটি সরাসরি প্রতিষ্ঠানের সুপার অ্যাডমিন প্রাপ্ত হবেন এবং দ্রুততম সময়ে আপনার সাথে যোগাযোগ করা হবে।'
                  : 'Your message will be sent directly to the Super Admin inbox and reviewed confidentially.'}
              </p>

              {contactSuccess && (
                <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{language === 'bn' ? 'বার্তাটি সুপার অ্যাডমিনের ইনবক্সে সফলভাবে পৌঁছেছে! ধন্যবাদ।' : 'Message delivered directly to Super Admin! Thank you.'}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">আপনার নাম (Full Name) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. মোঃ রফিকুল ইসলাম"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone) *</label>
                    <input
                      type="text"
                      required
                      placeholder="+880 1711-xxxxxx"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আপনার বার্তা বা অনুসন্ধান (Message)</label>
                  <textarea
                    rows={3}
                    placeholder="ভর্তি বা প্রতিষ্ঠান সম্পর্কিত আপনার প্রশ্ন লিখুন..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'বার্তা পাঠান' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER (Matches image footer with slogan) */}
      <footer className="bg-[#0B1E36] text-white pt-10 pb-6 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                <img
                  src={schoolProfile.logoUrl || DEFAULT_SCHOOL_LOGO}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{schoolProfile.nameBn}</h4>
                <p className="text-[11px] text-slate-400">{schoolProfile.nameEn} • EIIN: {schoolProfile.eiin}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
              >
                {language === 'bn' ? 'পোর্টাল লগইন' : 'ERP Login'}
              </button>
            </div>
          </div>

          {/* Central Slogan Bar (Matches image bottom: "শিক্ষা • নৈতিকতা • সুন্দর ভবিষ্যৎ") */}
          <div className="py-4 text-center">
            <div className="relative inline-flex items-center justify-center px-8 py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-700/60" />
              </div>
              <div className="relative px-6 bg-[#0B1E36] text-sky-300 font-extrabold text-sm sm:text-base tracking-widest uppercase">
                {schoolProfile.mottoBn || 'শিক্ষা • নৈতিকতা • সুন্দর ভবিষ্যৎ'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px] pt-2">
            <p>© {new Date().getFullYear()} {schoolProfile.nameEn}. All rights reserved.</p>
            <p>AmarSchool Digital Education ERP • Session {schoolProfile.currentSession}</p>
          </div>
        </div>
      </footer>

      {/* 10. LOGIN MODAL (Interactive, supports Master Admin, Super Admin, Teachers, Students, Accountants) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden text-xs">
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'bn' ? 'ইআরপি পোর্টালে প্রবেশ' : 'Sign in to ERP Portal'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {schoolProfile.nameBn} • সেশন {schoolProfile.currentSession}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* System Locked / Role Disabled Alert */}
            {isAccessBlocked && (
              <div className="my-3 p-3 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs space-y-1.5 animate-in zoom-in-95">
                <div className="flex items-center space-x-2 font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{language === 'bn' ? 'এক্সেস স্থগিত রয়েছে' : 'Access Restricted'}</span>
                </div>
                <p className="text-[11px] text-rose-100 bg-black/40 p-2 rounded border border-rose-800/60">
                  "{blockedReason}"
                </p>
              </div>
            )}

            {/* General Error Message */}
            {errorMessage && !isAccessBlocked && (
              <div className="my-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {language === 'bn' ? 'ইউজারনেম বা আইডি (Username / ID) *' : 'Username or ID *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === 'bn' ? 'ইউজারনেম বা আইডি লিখুন' : 'Enter username or ID'}
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড *' : 'Password *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 text-center text-[11px] text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center justify-center space-x-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {language === 'bn'
                      ? 'নিরাপদ SSL এনক্রিপ্টেড ইআরপি লগইন'
                      : 'Secure SSL Encrypted ERP Authentication'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'bn'
                    ? 'পাসওয়ার্ড বা অ্যাকাউন্টের তথ্যের জন্য সুপার অ্যাডমিন বা প্রধান শিক্ষকের সাথে যোগাযোগ করুন।'
                    : 'For credentials or access assistance, contact the Super Admin.'}
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. ONLINE ADMISSION ENQUIRY MODAL */}
      {showAdmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'অনলাইন নতুন শিক্ষার্থী ভর্তি আবেদন' : 'Online Student Admission Application'}
                </h3>
              </div>
              <button onClick={() => setShowAdmissionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-900 text-base">আবেদন সফলভাবে গৃহীত হয়েছে!</h4>
                <p className="text-slate-600 text-xs">আমাদের ভর্তি বিভাগ থেকে খুব শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থীর নাম (Student Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. তানভীর আহমেদ"
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অভিভাবকের মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-xxxxxx"
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">আবেদনকৃত শ্রেণি (Target Class) *</label>
                  <select
                    value={enquiryClass}
                    onChange={(e) => setEnquiryClass(e.target.value as ClassLevel)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
                  >
                    {['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">অতিরিক্ত তথ্য বা নোট (ঐচ্ছিক)</label>
                  <textarea
                    rows={2}
                    placeholder="পূর্ববর্তী বিদ্যালয় বা বিশেষ তথ্য..."
                    value={enquiryNotes}
                    onChange={(e) => setEnquiryNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAdmissionModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    আবেদন দাখিল করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 12. NOTICE DETAILS MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase text-[10px]">
                {selectedNotice.category}
              </span>
              <button onClick={() => setSelectedNotice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>প্রকাশের তারিখ: {selectedNotice.date}</span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900 leading-snug">{selectedNotice.title}</h3>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {selectedNotice.content}
              </p>
              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. BLOG POST READER MODAL */}
      {selectedBlogPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs text-slate-900 my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500 text-white">
                  {language === 'bn' ? selectedBlogPost.categoryBn : selectedBlogPost.category}
                </span>
                <span className="text-[11px] text-slate-300">
                  {selectedBlogPost.publishedAt}
                </span>
              </div>
              <button
                onClick={() => setSelectedBlogPost(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
              {selectedBlogPost.coverImage && (
                <div className="w-full h-56 sm:h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={selectedBlogPost.coverImage}
                    alt={selectedBlogPost.titleBn}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                {language === 'bn' ? selectedBlogPost.titleBn : selectedBlogPost.titleEn}
              </h2>

              {/* Author byline */}
              <div className="flex items-center space-x-3 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {selectedBlogPost.authorName.charAt(0)}
                </div>
                <div>
                  <strong className="block text-slate-900">{selectedBlogPost.authorName}</strong>
                  <span className="text-slate-500 text-[10px]">{selectedBlogPost.authorRole} • প্রকাশিত: {selectedBlogPost.publishedAt}</span>
                </div>
              </div>

              {/* Excerpt Lead */}
              {selectedBlogPost.excerpt && (
                <p className="text-xs sm:text-sm font-semibold text-slate-700 italic border-l-4 border-blue-600 pl-3 py-1 bg-blue-50/50 rounded-r-lg">
                  {selectedBlogPost.excerpt}
                </p>
              )}

              {/* Full Content */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans space-y-3 pt-2">
                {selectedBlogPost.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                {schoolProfile.nameBn} • স্কুল ব্লগ
              </span>
              <button
                onClick={() => setSelectedBlogPost(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors text-xs"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
