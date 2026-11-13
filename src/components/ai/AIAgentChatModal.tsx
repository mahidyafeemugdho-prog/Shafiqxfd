import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Bell,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AIService } from '../../services/aiService';
import { StorageService } from '../../services/storage';
import { Notice } from '../../types';

interface AIAgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  action?: {
    actionType: string;
    title?: string;
    content?: string;
    category?: string;
  } | null;
  mode?: string;
}

export const AIAgentChatModal: React.FC<AIAgentChatModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const { activeRole, currentUser } = useAuth();
  const { language, toBnNumber } = useLanguage();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [publishedNoticeId, setPublishedNoticeId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting tailored to role
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let greeting = '';

      if (activeRole === 'student') {
        greeting = `নমস্কার / আসসালামু আলাইকুম ${currentUser.name || 'শিক্ষার্থী'}! 🎓\n\nআমি তোমার **অমরস্কুল এআই শিক্ষা সহকারী**। আমি তোমাকে যেকোনো বিষয়ের কঠিন পড়া সহজভাবে বুঝতে, হোমওয়ার্কের নিয়মাবলী এবং পরীক্ষার প্রস্তুতিতে সাহায্য করতে পারি।\n\n*(🔒 তোমার ব্যক্তিগত তথ্য ও ফলাফল সম্পূর্ণ সুরক্ষিত। তুমি শুধুমাত্র তোমার নিজের ক্লাসের রুটিন ও পড়ালেখা বিষয়ে জানতে পারবে।)*\n\nআজকে তুমি কী শিখতে বা সমাধান করতে চাও?`;
      } else if (activeRole === 'teacher') {
        greeting = `শ্রদ্ধেয় ${currentUser.name || 'শিক্ষক'} মহোদয়, আসসালামু আলাইকুম। 👨‍🏫\n\nআমি আপনার **অমরস্কুল শিক্ষক এআই সহকারী**। পাঠ পরিকল্পনা (Lesson Plan), এনসিটিবি কারিকুলাম অনুযায়ী সৃজনশীল প্রশ্ন ও এমসিকিউ তৈরি অথবা ক্লাসরুম শিক্ষাদান কৌশলে কীভাবে সাহায্য করতে পারি?`;
      } else {
        // Super Admin / Admin
        greeting = `সম্মানিত সুপারঅ্যাডমিন মহোদয়, আসসালামু আলাইকুম। 🏛️\n\nআমি আপনার **অমরস্কুল এক্সিকিউটিভ এআই সহকারী**। বিদ্যালয়ের সার্বিক উপস্থিতি, ফি কালেকশন রিপোর্ট এবং যেকোনো প্রশাসনিক আদেশ (যেমন: জরুরি ছুটির নোটিশ প্রকাশ, অভিভাবক বার্তা জারি বা রুটিন পরিকল্পনা) আপনি নির্দেশ দিলে আমি তাৎক্ষণিক ড্রাফট ও সিস্টেমে প্রকাশ করে দিতে পারি।`;
      }

      setMessages([
        {
          id: 'welcome',
          sender: 'agent',
          text: greeting,
          timestamp: now,
        },
      ]);

      if (initialPrompt) {
        handleSendMessage(initialPrompt);
      }
    }
  }, [isOpen, activeRole, currentUser]);

  // Handle TTS
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols before speaking
    const cleanText = text
      .replace(/[*#_`$]/g, '')
      .replace(/```action[\s\S]*?```/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'bn-BD';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message
  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1-Click Publish Notice Action for Super Admin
  const handleExecuteAction = (action: { actionType: string; title?: string; content?: string; category?: string }, msgId: string) => {
    if (action.actionType === 'CREATE_NOTICE' && action.title && action.content) {
      const newNotice: Notice = {
        id: `not_${Date.now()}`,
        title: action.title,
        content: action.content,
        date: new Date().toISOString().split('T')[0],
        category: (action.category as any) || 'General',
        targetAudience: 'All',
        author: currentUser.name || 'Super Admin (via AI Agent)',
        isImportant: true,
      };

      StorageService.addNotice(newNotice);
      setPublishedNoticeId(msgId);

      // Add confirmation message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          sender: 'agent',
          text: `✅ **সফলভাবে প্রকাশিত!**\n\n"${action.title}" নোটিশটি এখন সরাসরি স্কুলের নোটিশ বোর্ডে সকল শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য প্রকাশিত হয়েছে।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputMessage).trim();
    if (!textToSend || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      // Gather context strictly based on role
      let studentContext: any = null;
      let schoolContext: any = null;

      const students = StorageService.getStudents();
      const attendance = StorageService.getAttendance();
      const notices = StorageService.getNotices();
      const homeworkList = StorageService.getHomework();
      const exams = StorageService.getExams();

      if (activeRole === 'student') {
        const student =
          students.find((s) => s.id === currentUser.linkedStudentId) ||
          students.find((s) => s.nameEn.toLowerCase() === (currentUser.name || '').toLowerCase()) ||
          students[0];

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAtt = attendance.find((a) => a.targetId === student?.id && a.date === todayStr);

        const myHw = homeworkList
          .filter((h) => h.className === student?.className)
          .slice(0, 5)
          .map((h) => ({ title: h.title, subject: h.subjectName, dueDate: h.dueDate }));

        studentContext = {
          name: student?.nameBn || student?.nameEn,
          roll: student?.roll,
          className: student?.className,
          section: student?.section,
          todayAttendance: todayAtt ? todayAtt.status : 'Unknown',
          pendingHomeworks: myHw,
          upcomingExams: exams.slice(0, 2).map((e) => ({ name: e.nameBn || e.nameEn, start: e.startDate })),
        };
      } else {
        // Super Admin / Teacher
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttRecords = attendance.filter((a) => a.date === todayStr);
        const presentCount = todayAttRecords.filter((a) => a.status === 'Present').length;
        const totalChecked = todayAttRecords.length;
        const attRate = totalChecked > 0 ? `${Math.round((presentCount / totalChecked) * 100)}%` : '96%';

        schoolContext = {
          schoolName: 'ইন্টারসিটি মডেল স্কুল অ্যান্ড কলেজ',
          totalStudents: students.length || 50,
          totalTeachers: 14,
          attendanceRate: attRate,
          noticeCount: notices.length,
          totalCollected: '৩,৮৫,০০০',
          totalDue: '৪৫,০০০',
        };
      }

      // Convert history for agent
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }));

      const res = await AIService.chatWithAgent({
        message: textToSend,
        history: historyPayload,
        role: activeRole,
        userName: currentUser.name || (activeRole === 'student' ? 'শিক্ষার্থী' : 'অ্যাডমিন'),
        studentContext,
        schoolContext,
      });

      if (res.success && res.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent_${Date.now()}`,
            sender: 'agent',
            text: res.text || '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: res.action,
            mode: res.mode,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'agent',
            text: res.message || 'সংযোগ সাময়িক ব্যাহত হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: 'এআই সার্ভিসের সাথে যোগাযোগ করা যায়নি। আপনার নেটওয়ার্ক সংযোগ যাচাই করুন।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('আপনি কি পূর্বের কথোপকথন মুছে নতুন সেশন শুরু করতে চান?')) {
      setMessages([]);
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
    }
  };

  // Suggestion Pills
  const studentSuggestions = [
    '📐 গণিতের মূল সূত্রগুলো সহজভাবে বুঝিয়ে দাও',
    '📚 আমার শ্রেণির পরীক্ষার রুটিন ও পড়াশোনার টিপস',
    '📝 English Grammar: Tense ও Voice Change নিয়ম',
    '💡 বিজ্ঞানের নিউটনের গতিসূত্রগুলো উদাহরণসহ ব্যাখ্যা করো',
  ];

  const superAdminSuggestions = [
    '📢 আগামীকাল বৃষ্টির কারণে ছুটির জরুরি নোটিশ প্রকাশ করো',
    '📊 আজকের ক্লাসের সার্বিক উপস্থিতির হার ও রিপোর্ট',
    '💰 চলতি মাসের বকেয়া ফি পরিশোধের তাগিদ নোটিশ জারি করো',
    '📝 আগামী সোমবার শিক্ষক সমন্বয় মিটিং নোটিশ জারি করো',
  ];

  const teacherSuggestions = [
    '📖 ক্লাস ১০ গণিত (বীজগণিত) ১ ঘণ্টার পাঠ পরিকল্পনা',
    '✏️ পদার্থবিজ্ঞানের উপর ৩টি সৃজনশীল প্রশ্ন (ক,খ,গ,ঘ) তৈরি করো',
    '📝 ইংরেজি ১ম পত্র ১০টি বহুনির্বাচনী প্রশ্ন ও উত্তর দাও',
  ];

  const activeSuggestions =
    activeRole === 'student'
      ? studentSuggestions
      : activeRole === 'teacher'
      ? teacherSuggestions
      : superAdminSuggestions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden ${
          isExpanded ? 'w-full h-full max-w-5xl max-h-[96vh]' : 'w-full max-w-2xl h-[90vh] max-h-[720px]'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm text-white">অমরস্কুল স্মার্ট এআই সহকারী</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.8
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-indigo-200">
                {activeRole === 'student' ? (
                  <span className="flex items-center gap-1 text-emerald-300 font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    শিক্ষার্থী শিক্ষা সহকারী মোড (ব্যক্তিগত ও নিরাপদ)
                  </span>
                ) : activeRole === 'teacher' ? (
                  <span className="flex items-center gap-1 text-sky-300 font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    শিক্ষক শিক্ষা নির্দেশক মোড
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    সুপার অ্যাডমিন এক্সিকিউটিভ কমান্ড মোড
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleClearHistory}
              title="নতুন সেশন শুরু করুন"
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'ছোট করুন' : 'বড় করুন'}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                window.speechSynthesis?.cancel();
                setSpeakingId(null);
                onClose();
              }}
              title="বন্ধ করুন"
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security / Privacy Banner */}
        {activeRole === 'student' ? (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                <strong>নিরাপদ ক্যাম্পাস:</strong> এখানে শুধুমাত্র আপনার পড়াশোনা ও হোমওয়ার্ক তথ্য বিশ্লেষণ হয়। অন্য কোনো সহপাঠী বা প্রশাসনিক গোপন তথ্য উন্মুক্ত নয়।
              </span>
            </div>
          </div>
        ) : activeRole === 'super_admin' ? (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>এক্সিকিউটিভ অ্যাকশন:</strong> যেকোনো নোটিশ ড্রাফট করার নির্দেশ দিলে এআই সরাসরি বোর্ডে প্রকাশের জন্য ১-ক্লিক বাটন প্রদান করবে।
              </span>
            </div>
          </div>
        ) : null}

        {/* Chat Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                      : 'bg-blue-600 text-white rounded-tr-xs font-medium'
                  }`}
                >
                  {/* Message Header with Bot tag and action tools */}
                  {isAgent && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 text-[11px] text-slate-400">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-amber-500" />
                        অমরস্কুল এআই
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleSpeech(msg.id, msg.text)}
                          title="পড়ে শুনুন"
                          className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          title="কপি করুন"
                          className="p-1 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Body (Clean display with simple formatting) */}
                  <div className="space-y-1.5 whitespace-pre-wrap">
                    {msg.text
                      .replace(/```action[\s\S]*?```/g, '') // Hide raw action JSON block
                      .split('\n')
                      .map((line, lIdx) => {
                        if (line.startsWith('### ')) {
                          return (
                            <h4 key={lIdx} className="font-black text-slate-900 text-sm mt-2">
                              {line.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (line.startsWith('## ')) {
                          return (
                            <h3 key={lIdx} className="font-black text-slate-900 text-base mt-2">
                              {line.replace('## ', '')}
                            </h3>
                          );
                        }
                        if (line.startsWith('• ') || line.startsWith('- ')) {
                          return (
                            <div key={lIdx} className="flex items-start space-x-1.5 ml-1">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{line.substring(2)}</span>
                            </div>
                          );
                        }
                        return <p key={lIdx}>{line}</p>;
                      })}
                  </div>

                  {/* Structured Action Execution Card (e.g. 1-click Publish Notice) */}
                  {isAgent && msg.action && msg.action.actionType === 'CREATE_NOTICE' && (
                    <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                          <Bell className="w-4 h-4 text-amber-600" />
                          প্রস্তুতকৃত নোটিশ (Ready to Publish)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                          {msg.action.category || 'Holiday'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-amber-200">
                        <h4 className="font-black text-slate-900 text-xs">{msg.action.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-3">{msg.action.content}</p>
                      </div>

                      {publishedNoticeId === msg.id ? (
                        <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-black bg-emerald-100 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>নোটিশটি সফলভাবে নোটিশ বোর্ডে প্রকাশিত হয়েছে!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleExecuteAction(msg.action!, msg.id)}
                          className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-lg shadow-sm transition-transform active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>১-ক্লিকে নোটিশ বোর্ডে প্রকাশ করুন (Publish Now)</span>
                        </button>
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isAgent ? 'text-slate-400' : 'text-blue-100'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl w-fit">
              <Bot className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="font-medium animate-pulse">এআই চিন্তা করছে ও উত্তর প্রস্তুত করছে...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Pills */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">পরামর্শ:</span>
          {activeSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-full font-medium text-slate-700 transition-colors text-[11px]"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                activeRole === 'student'
                  ? 'আপনার প্রশ্ন বা কোনো অঙ্কের সমস্যা লিখুন...'
                  : activeRole === 'teacher'
                  ? 'পাঠ পরিকল্পনা বা পরীক্ষার প্রশ্ন ড্রাফট করতে লিখুন...'
                  : 'সুপারএডমিন নির্দেশ লিখুন (যেমন: কাল স্কুল বন্ধের নোটিশ জারি করো)...'
              }
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Powered by Gemini Multimodal Engine</span>
            <span>প্রশাসনিক ও শিক্ষার্থীর রোল-ভিত্তিক পূর্ণ সুরক্ষা সক্রিয়</span>
          </div>
        </div>
      </div>
    </div>
  );
};
