import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { Book, BookIssue } from '../../types';
import {
  Library as LibraryIcon,
  Search,
  Plus,
  BookMarked,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';

export const LibraryView: React.FC = () => {
  const { activeRole } = useAuth();
  const { t, language, formatTaka } = useLanguage();
  const [books, setBooks] = useState<Book[]>(() => StorageService.getBooks());
  const [issues, setIssues] = useState<BookIssue[]>(() => StorageService.getBookIssues());
  const [activeTab, setActiveTab] = useState<'catalog' | 'issues'>('catalog');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Issue Book Modal State
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || 'bk_1');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerId, setBorrowerId] = useState<string>('std_1');
  const [dueDate, setDueDate] = useState<string>('2026-10-30');

  // Add / Edit Book Modal State
  const [showAddBookModal, setShowAddBookModal] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<Book | null>(null);

  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [bookIsbn, setBookIsbn] = useState<string>('');
  const [bookCategory, setBookCategory] = useState<string>('Literature');
  const [bookRack, setBookRack] = useState<string>('A-101');
  const [bookQuantity, setBookQuantity] = useState<number>(10);
  const [bookPrice, setBookPrice] = useState<number>(350);

  const canManage = activeRole === 'super_admin' || activeRole === 'admin' || activeRole === 'librarian' || activeRole === 'master_admin';

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookIsbn('');
    setBookTitle('');
    setBookAuthor('');
    setBookCategory('Literature');
    setBookRack('A-101');
    setBookQuantity(10);
    setBookPrice(350);
    setShowAddBookModal(true);
  };

  const handleOpenEditBook = (bk: Book) => {
    setEditingBook(bk);
    setBookIsbn(bk.isbn);
    setBookTitle(bk.title);
    setBookAuthor(bk.author);
    setBookCategory(bk.category);
    setBookRack(bk.rack);
    setBookQuantity(bk.quantity);
    setBookPrice(bk.price);
    setShowAddBookModal(true);
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const bk = books.find((b) => b.id === selectedBookId);
    if (!bk || bk.available <= 0 || !borrowerName) return;

    const issue: BookIssue = {
      id: `bi_${Date.now()}`,
      bookId: bk.id,
      bookTitle: bk.title,
      borrowerType: 'student',
      borrowerId,
      borrowerName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      fine: 0,
      status: 'Issued',
    };
    StorageService.issueBook(issue);
    setBooks(StorageService.getBooks());
    setIssues(StorageService.getBookIssues());
    setShowIssueModal(false);
    setBorrowerName('');
  };

  const handleReturnBook = (issueId: string) => {
    StorageService.returnBook(issueId);
    setBooks(StorageService.getBooks());
    setIssues(StorageService.getBookIssues());
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    if (editingBook) {
      // Calculate adjusted available copies
      const qtyDiff = bookQuantity - editingBook.quantity;
      const newAvail = Math.max(0, Math.min(bookQuantity, editingBook.available + qtyDiff));

      const updated: Book = {
        ...editingBook,
        isbn: bookIsbn.trim() || editingBook.isbn,
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category: bookCategory,
        rack: bookRack.trim() || 'A-101',
        quantity: bookQuantity,
        available: newAvail,
        price: bookPrice,
      };
      StorageService.updateBook(updated);
      setBooks(StorageService.getBooks());
      setShowAddBookModal(false);
      setEditingBook(null);
    } else {
      const newBook: Book = {
        id: `bk_${Date.now()}`,
        isbn: bookIsbn.trim() || `978-984-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        category: bookCategory,
        rack: bookRack.trim() || 'A-101',
        quantity: bookQuantity,
        available: bookQuantity,
        price: bookPrice,
      };
      StorageService.addBook(newBook);
      setBooks(StorageService.getBooks());
      setShowAddBookModal(false);
      setBookTitle('');
      setBookAuthor('');
    }
  };

  const handleConfirmDeleteBook = () => {
    if (!deleteConfirmBook) return;
    StorageService.deleteBook(deleteConfirmBook.id);
    setBooks(StorageService.getBooks());
    setDeleteConfirmBook(null);
  };

  const filteredBooks = books.filter((b) => {
    if (searchTerm.trim() === '') return true;
    const q = searchTerm.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'bn' ? 'গ্রন্থাগার ও পাঠাগার ব্যবস্থাপনা (Library)' : 'Library Management System'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'বই ক্যাটালগ, বই সংযোজন, সম্পাদনা, মুছে ফেলা, ইস্যু ও রিটার্ন রেজিস্টার'
              : 'Book catalog, circulation, borrowing logs, and overdue fine tracking'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-slate-100 rounded-lg flex space-x-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'catalog' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'bn' ? 'বই ক্যাটালগ' : 'Book Catalog'}
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'issues' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {language === 'bn' ? 'ইস্যু ও জমা রেজিস্টার' : 'Circulation & Issues'}
            </button>
          </div>
          {canManage && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowIssueModal(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <BookMarked className="w-4 h-4" />
                <span>{language === 'bn' ? 'বই ইস্যু' : 'Issue Book'}</span>
              </button>
              <button
                onClick={handleOpenAddBook}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bn' ? 'নতুন বই যোগ' : 'Add Book'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'বইয়ের নাম, লেখক বা ISBN দিয়ে খুঁজুন...' : 'Search books by title, author, or ISBN...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* TAB 1: Books Catalog */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Author / Writer</th>
                  <th className="py-3 px-4">Category & Shelf</th>
                  <th className="py-3 px-4 text-center">Available / Total</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  {canManage && <th className="py-3 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="py-8 text-center text-slate-400">
                      {language === 'bn' ? 'কোনো বই পাওয়া যায়নি।' : 'No books found in the library catalog.'}
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{bk.isbn}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{bk.title}</td>
                      <td className="py-3 px-4 text-slate-700">{bk.author}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {bk.category} ({bk.rack})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${bk.available > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {bk.available}
                        </span>{' '}
                        / {bk.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        {formatTaka(bk.price)}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEditBook(bk)}
                              className="px-2 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg flex items-center space-x-1 transition-colors"
                              title={language === 'bn' ? 'বই সম্পাদনা করুন' : 'Edit Book'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmBook(bk)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={language === 'bn' ? 'বই মুছুন' : 'Delete Book'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Circulation Issues */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Fine (৳)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {language === 'bn' ? 'কোনো বই ইস্যুর রেকর্ড পাওয়া যায়নি।' : 'No book circulation records found.'}
                    </td>
                  </tr>
                ) : (
                  issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{iss.bookTitle}</td>
                      <td className="py-3 px-4 text-slate-700">{iss.borrowerName}</td>
                      <td className="py-3 px-4 text-slate-500">{iss.issueDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{iss.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">
                        {iss.fine > 0 ? formatTaka(iss.fine) : '৳ 0'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            iss.status === 'Returned'
                              ? 'bg-slate-100 text-slate-600'
                              : iss.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {iss.status === 'Issued' && canManage && (
                          <button
                            onClick={() => handleReturnBook(iss.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                          >
                            Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBook
                  ? (language === 'bn' ? 'বই তথ্য সম্পাদনা করুন (Edit Book)' : 'Edit Book Information')
                  : (language === 'bn' ? 'নতুন বই যুক্ত করুন (Add Book)' : 'Add New Book to Library')}
              </h3>
              <button
                onClick={() => {
                  setShowAddBookModal(false);
                  setEditingBook(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveBook} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Book Title (বইয়ের নাম) *</label>
                <input
                  type="text"
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="e.g. সঞ্চয়িতা (Sanchayita)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Author / Writer (লেখক) *</label>
                <input
                  type="text"
                  required
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="e.g. রবীন্দ্রনাথ ঠাকুর"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">ISBN Code</label>
                <input
                  type="text"
                  value={bookIsbn}
                  onChange={(e) => setBookIsbn(e.target.value)}
                  placeholder="e.g. 978-984-123-45"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category (বিভাগ)</label>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Literature">Literature (সাহিত্য)</option>
                    <option value="Science">Science (বিজ্ঞান)</option>
                    <option value="Mathematics">Mathematics (গণিত)</option>
                    <option value="Grammar">English & Bangla Grammar</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="History & Islamic">History & Religious</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Shelf / Rack (তাক)</label>
                  <input
                    type="text"
                    value={bookRack}
                    onChange={(e) => setBookRack(e.target.value)}
                    placeholder="e.g. A-101"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Total Copies (মোট সংখ্যা)</label>
                  <input
                    type="number"
                    min={1}
                    value={bookQuantity}
                    onChange={(e) => setBookQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Price (মূল্য ৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={bookPrice}
                    onChange={(e) => setBookPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBookModal(false);
                    setEditingBook(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingBook
                    ? (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Update Book')
                    : (language === 'bn' ? 'বই সংরক্ষণ করুন' : 'Save Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'bn' ? 'বই মুছে ফেলতে চান?' : 'Delete this Book?'}
              </h3>
              <p className="text-slate-500 mt-1">
                {language === 'bn'
                  ? `আপনি কি নিশ্চিতভাবে "${deleteConfirmBook.title}" বইটি লাইব্রেরি ক্যাটালগ থেকে মুছে ফেলতে চান?`
                  : `Are you sure you want to permanently delete "${deleteConfirmBook.title}" from library?`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmBook(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                {language === 'bn' ? 'না, রাখুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBook}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs"
              >
                {language === 'bn' ? 'হ্যাঁ, মুছুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Issue Book to Student</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleIssueBook} className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Book</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.available <= 0}>
                      {b.title} ({b.available} copies available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Borrower Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed (Roll: 01)"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Student ID</label>
                  <input
                    type="text"
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
                    placeholder="S-2026-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Return Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
