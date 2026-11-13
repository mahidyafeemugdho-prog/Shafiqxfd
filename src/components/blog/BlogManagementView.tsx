import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StorageService } from '../../services/storage';
import { BlogPost } from '../../types';
import { compressImageToPassportSize } from '../../utils/storageHelper';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Tag,
  Upload,
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';

export const BlogManagementView: React.FC = () => {
  const { activeRole, currentUser } = useAuth();
  const { language, toBnNumber } = useLanguage();

  const [posts, setPosts] = useState<BlogPost[]>(() => StorageService.getBlogPosts());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  // Form State
  const [titleBn, setTitleBn] = useState<string>('');
  const [titleEn, setTitleEn] = useState<string>('');
  const [category, setCategory] = useState<BlogPost['category']>('Academic');
  const [categoryBn, setCategoryBn] = useState<string>('একাডেমিক');
  const [excerpt, setExcerpt] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [formMsg, setFormMsg] = useState<string>('');

  const canManage = activeRole === 'super_admin' || activeRole === 'master_admin' || activeRole === 'admin';

  const categoriesMap: { en: BlogPost['category']; bn: string }[] = [
    { en: 'Academic', bn: 'একাডেমিক' },
    { en: 'Science & Tech', bn: 'বিজ্ঞান ও প্রযুক্তি' },
    { en: 'Co-Curricular', bn: 'সহশিক্ষা ও বিতর্ক' },
    { en: 'Events', bn: 'স্কুল অনুষ্ঠান ও উৎসব' },
    { en: 'Sports', bn: 'খেলাধুলা ও শরীরচর্চা' },
    { en: 'Moral & Values', bn: 'নৈতিকতা ও চরিত্র গঠন' },
  ];

  const handleCategoryChange = (val: BlogPost['category']) => {
    setCategory(val);
    const found = categoriesMap.find((c) => c.en === val);
    setCategoryBn(found?.bn || 'একাডেমিক');
  };

  const refreshPosts = () => {
    setPosts(StorageService.getBlogPosts());
  };

  const handleOpenAdd = () => {
    setEditingPost(null);
    setTitleBn('');
    setTitleEn('');
    setCategory('Academic');
    setCategoryBn('একাডেমিক');
    setExcerpt('');
    setContent('');
    setCoverImage('/assets/aistudio/school_hero.webp');
    setIsPublished(true);
    setIsFeatured(false);
    setFormMsg('');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitleBn(post.titleBn);
    setTitleEn(post.titleEn);
    setCategory(post.category);
    setCategoryBn(post.categoryBn);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setCoverImage(post.coverImage || '');
    setIsPublished(post.published);
    setIsFeatured(!!post.featured);
    setFormMsg('');
    setShowAddEditModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToPassportSize(file, 640, 400, 0.75);
      setCoverImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim() || !content.trim()) {
      setFormMsg(language === 'bn' ? 'দয়া করে শিরোনাম ও মূল বিবরণ লিখুন।' : 'Please enter title and content.');
      return;
    }

    if (editingPost) {
      const updated: BlogPost = {
        ...editingPost,
        titleBn: titleBn.trim(),
        titleEn: titleEn.trim() || titleBn.trim(),
        category,
        categoryBn,
        excerpt: excerpt.trim() || content.trim().slice(0, 150) + '...',
        content: content.trim(),
        coverImage,
        published: isPublished,
        featured: isFeatured,
      };
      StorageService.updateBlogPost(updated);
      setFormMsg(language === 'bn' ? 'আর্টিকেল সফলভাবে আপডেট করা হয়েছে!' : 'Post updated successfully!');
    } else {
      const newPost: BlogPost = {
        id: `blog_${Date.now()}`,
        titleBn: titleBn.trim(),
        titleEn: titleEn.trim() || titleBn.trim(),
        slug: titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
        category,
        categoryBn,
        excerpt: excerpt.trim() || content.trim().slice(0, 150) + '...',
        content: content.trim(),
        coverImage: coverImage || '/assets/aistudio/school_hero.webp',
        authorName: currentUser.name || 'সুপার অ্যাডমিন',
        authorRole: activeRole === 'master_admin' ? 'Master Admin' : 'Super Admin',
        published: isPublished,
        publishedAt: new Date().toISOString().split('T')[0],
        views: 1,
        featured: isFeatured,
      };
      StorageService.addBlogPost(newPost);
      setFormMsg(language === 'bn' ? 'আর্টিকেল সফলভাবে প্রকাশিত হয়েছে!' : 'Post published successfully!');
    }

    refreshPosts();
    setTimeout(() => {
      setShowAddEditModal(false);
      setFormMsg('');
    }, 800);
  };

  const handleDeletePost = (id: string, titleStr: string) => {
    const confirmMsg =
      language === 'bn'
        ? `আপনি কি নিশ্চিত যে "${titleStr}" আর্টিকেলটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete post "${titleStr}"?`;
    if (window.confirm(confirmMsg)) {
      StorageService.deleteBlogPost(id);
      refreshPosts();
    }
  };

  const handleTogglePublish = (id: string) => {
    StorageService.togglePublishBlogPost(id);
    refreshPosts();
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (statusFilter === 'published' && !p.published) return false;
    if (statusFilter === 'draft' && p.published) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchBn = p.titleBn.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
      const matchEn = p.titleEn.toLowerCase().includes(q);
      return matchBn || matchEn;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'bn' ? 'স্কুল ব্লগ ও পাবলিকেশন ম্যানেজমেন্ট' : 'School Blog & Publications'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {language === 'bn' ? `মোট ${toBnNumber(posts.length)}টি ব্লগ` : `${posts.length} posts`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'bn'
              ? 'সুপার অ্যাডমিন এখান থেকে যেকোনো ব্লগ প্রকাশ, এডিট অথবা ডিলিট করতে পারবেন; প্রকাশিত ব্লগ পাবলিক ওয়েবসাইটে প্রদর্শিত হবে।'
              : 'Super Admin can publish, edit, or delete articles. Published blogs appear directly on the hero public site.'}
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন ব্লগ পোস্ট করুন' : 'Write New Article'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'ব্লগের শিরোনাম বা বিষয় দিয়ে খুঁজুন...' : 'Search blogs by title or keyword...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categoriesMap.map((c) => (
              <option key={c.en} value={c.en}>
                {language === 'bn' ? c.bn : c.en}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
            <option value="published">{language === 'bn' ? 'প্রকাশিত (Published)' : 'Published'}</option>
            <option value="draft">{language === 'bn' ? 'খসড়া (Draft)' : 'Draft'}</option>
          </select>
        </div>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-sm">
            {language === 'bn' ? 'কোনো ব্লগ পোস্ট পাওয়া যায়নি।' : 'No blog articles found.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'bn'
              ? 'উপরের "নতুন ব্লগ পোস্ট করুন" বাটনে ক্লিক করে আর্টিকেল যুক্ত করুন।'
              : 'Click "Write New Article" above to create your first school blog post.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="relative h-44 bg-slate-100 overflow-hidden group">
                  <img
                    src={post.coverImage || '/assets/aistudio/school_hero.webp'}
                    alt={post.titleBn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-blue-900 shadow-xs border border-slate-200">
                      {language === 'bn' ? post.categoryBn : post.category}
                    </span>
                    {post.featured && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 shadow-xs">
                        ★ {language === 'bn' ? 'ফিচার্ড' : 'Featured'}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleTogglePublish(post.id)}
                      title={post.published ? 'Unpublish to Draft' : 'Publish to Website'}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs flex items-center space-x-1 ${
                        post.published
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {post.published ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{language === 'bn' ? 'ওয়েবসাইটে প্রকাশিত' : 'Live'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>{language === 'bn' ? 'ড্রাফট (অপ্রকাশিত)' : 'Draft'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.publishedAt}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{post.authorName}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {post.titleBn || post.titleEn}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.excerpt || post.content}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setPreviewPost(post)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রিভিউ দেখুন' : 'Preview'}</span>
                </button>

                {canManage && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(post)}
                      title="Edit Article"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.titleBn)}
                      title="Delete Article"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Blog Post Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingPost
                    ? language === 'bn'
                      ? 'ব্লগ আর্টিকেল সম্পাদন করুন (Edit Article)'
                      : 'Edit Blog Article'
                    : language === 'bn'
                    ? 'নতুন ব্লগ আর্টিকেল প্রকাশ করুন (New Article)'
                    : 'Publish New Blog Article'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formMsg && (
              <div className="my-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePost} className="mt-4 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'শিরোনাম (বাংলা) *' : 'Title (Bengali) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বার্ষিক বিজ্ঞান ও উদ্ভাবন মেলা ২০২৬"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'শিরোনাম (English)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Science and Innovation Fair 2026"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি (Category) *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {categoriesMap.map((c) => (
                      <option key={c.en} value={c.en}>
                        {c.bn} ({c.en})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কভার ছবির লিংক বা আপলোড</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl font-semibold flex items-center space-x-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>আপলোড</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত সারসংক্ষেপ (Short Excerpt)
                </label>
                <input
                  type="text"
                  placeholder="১-২ লাইনে পাঠকদের জন্য সংক্ষিপ্ত ধারণা..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  মূল বিবরণ ও কন্টেন্ট (Full Content) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="সম্পূর্ণ আর্টিকেলের তথ্য, অনুচ্ছেদ ও বিবরণ লিখুন..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl leading-relaxed text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>ওয়েবসাইটে সরাসরি প্রকাশ করুন (Publish to Hero Website)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span>ফিচার্ড পোস্ট (Featured)</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all"
                >
                  {editingPost ? 'সংরক্ষণ করুন (Update)' : 'প্রকাশ করুন (Publish)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {previewPost.categoryBn}
              </span>
              <button onClick={() => setPreviewPost(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewPost.coverImage && (
              <img
                src={previewPost.coverImage}
                alt={previewPost.titleBn}
                className="w-full h-56 object-cover rounded-xl mt-4 shadow-xs"
              />
            )}

            <h2 className="text-lg font-black text-slate-900 mt-4 leading-snug">
              {previewPost.titleBn}
            </h2>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2 pb-3 border-b border-slate-100">
              <span>প্রকাশনা: {previewPost.publishedAt}</span>
              <span>•</span>
              <span>লেখক: {previewPost.authorName} ({previewPost.authorRole})</span>
            </div>

            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
              {previewPost.content}
            </p>

            <div className="mt-5 text-right">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
