import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { WebsiteMessage } from '../../types';
import {
  Mail,
  Phone,
  Calendar,
  Trash2,
  CheckCircle,
  X,
  Search,
  MessageSquare,
  ShieldCheck,
  User,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface WebsiteMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebsiteMessagesModal: React.FC<WebsiteMessagesModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<WebsiteMessage[]>(() => StorageService.getWebsiteMessages());
  const [selectedMessage, setSelectedMessage] = useState<WebsiteMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    StorageService.markMessageAsRead(id);
    const updated = StorageService.getWebsiteMessages();
    setMessages(updated);
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage({ ...selectedMessage, isRead: true });
    }
  };

  const handleDeleteMessage = (id: string) => {
    if (
      confirm(
        language === 'bn'
          ? 'আপনি কি নিশ্চিত যে এই বার্তাটি মুছে ফেলতে চান?'
          : 'Are you sure you want to delete this message?'
      )
    ) {
      StorageService.deleteWebsiteMessage(id);
      const updated = StorageService.getWebsiteMessages();
      setMessages(updated);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterType === 'unread' && m.isRead) return false;
    if (filterType === 'read' && !m.isRead) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.senderName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {language === 'bn' ? 'সুপার অ্যাডমিন ইনবক্স: ওয়েবসাইট বার্তা' : 'Super Admin Inbox: Website Messages'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Super Admin Only
                </span>
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5">
                {language === 'bn'
                  ? 'ওয়েবসাইটের "বার্তা বা অনুসন্ধান পাঠান" ফর্ম থেকে পাঠানো সকল বার্তা শুধুমাত্র সুপার অ্যাডমিন দেখতে পাবেন।'
                  : 'Messages submitted via website contact form, accessible strictly by Super Admin.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'প্রেরকের নাম, ফোন বা বার্তা দিয়ে খুঁজুন...' : 'Search by name, phone or message...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'} ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1 ${
                filterType === 'unread'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{language === 'bn' ? 'অপঠিত' : 'Unread'} ({unreadCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('read')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                filterType === 'read'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'পঠিত' : 'Read'} ({messages.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Messages 2-Column Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[350px]">
          {/* Left Column: Message List */}
          <div className="md:col-span-5 overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-semibold">{language === 'bn' ? 'কোনো বার্তা পাওয়া যায়নি' : 'No messages found'}</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.isRead) {
                        handleMarkAsRead(msg.id);
                      }
                    }}
                    className={`p-3.5 transition-all cursor-pointer hover:bg-blue-50/50 flex flex-col justify-between ${
                      isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : ''
                    } ${!msg.isRead ? 'bg-amber-50/30' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          {!msg.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Unread" />
                          )}
                          <strong className="text-slate-900 truncate font-bold">{msg.senderName}</strong>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          {msg.sentAt.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-700 font-mono flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{msg.phone}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Message Full View */}
          <div className="md:col-span-7 p-4 sm:p-6 overflow-y-auto bg-white flex flex-col justify-between">
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {selectedMessage.senderName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedMessage.isRead
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {selectedMessage.isRead ? 'পঠিত (Read)' : 'নতুন বার্তা (Unread)'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        className="flex items-center space-x-1 text-emerald-700 font-bold hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedMessage.phone}</span>
                      </a>
                      {selectedMessage.email && (
                        <span>• {selectedMessage.email}</span>
                      )}
                      <span>• সময়: {selectedMessage.sentAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body Box */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'bn' ? 'বার্তার বিবরণ:' : 'Message Content:'}
                  </span>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Quick Call / Action Box */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-blue-900 block">
                      {language === 'bn' ? 'অভিভাবক/প্রেরকের সাথে যোগাযোগ করুন' : 'Contact the Sender'}
                    </span>
                    <span className="text-[11px] text-blue-700">{selectedMessage.phone}</span>
                  </div>
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'সরাসরি কল দিন' : 'Call Sender'}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">
                  {language === 'bn' ? 'বামপাশ থেকে একটি বার্তা সিলেক্ট করুন' : 'Select a message to view details'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {language === 'bn'
                    ? 'ওয়েবসাইটের ফর্ম থেকে কোনো বার্তা এলে সুপার অ্যাডমিন এখানে দেখতে ও যোগাযোগ করতে পারবেন।'
                    : 'Website inquiries appear here for Super Admin review and follow-up.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'bn'
                ? 'এই বার্তাসমূহ সম্পূর্ণ সুরক্ষিত এবং শুধুমাত্র সুপার অ্যাডমিন দেখতে পাবেন।'
                : 'Messages are confidential and accessible only to Super Admin.'}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
