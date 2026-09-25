import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  MapPin,
  Tag,
  DollarSign,
  AlertCircle,
  Home,
  ShoppingBag,
  Wrench,
  Store,
  Briefcase,
  Code,
  HelpCircle,
  Calendar,
  MessageSquare,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ListingType } from '../types';
import { MAIN_CATEGORIES, LOCATIONS_DATA } from '../config/categories';
import { dbService } from '../services/dbService';
import { geminiService } from '../services/geminiService';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultType?: ListingType | 'request' | 'post' | 'event';
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultType = 'property',
}) => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<ListingType | 'request' | 'post' | 'event'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Property');
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [priceUnit, setPriceUnit] = useState('/month');
  const [currency, setCurrency] = useState('৳');
  const [location, setLocation] = useState('Dhanmondi, Dhaka');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  // Subtype fields
  // Property
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [areaSqFt, setAreaSqFt] = useState<number>(1200);
  const [transactionType, setTransactionType] = useState<'for_rent' | 'for_sale' | 'for_lease'>('for_rent');
  const [propertyType, setPropertyType] = useState<'apartment' | 'house' | 'room' | 'mess' | 'shop' | 'office'>('apartment');

  // Product
  const [condition, setCondition] = useState<'new' | 'like_new' | 'used_good' | 'used_fair'>('used_good');

  // Job
  const [companyName, setCompanyName] = useState('');
  const [jobType, setJobType] = useState<'full_time' | 'part_time' | 'remote' | 'contract' | 'internship'>('full_time');
  const [deadline, setDeadline] = useState('');

  // Project (Freelance)
  const [projectBudget, setProjectBudget] = useState<number | ''>('');
  const [skillsRequired, setSkillsRequired] = useState('');

  // AI states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [aiEnhancedNotice, setAiEnhancedNotice] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // AI Polish with Gemini
  const handleAIEnhance = async () => {
    if (!title.trim()) {
      setError('Please enter a title before using AI Enhance.');
      return;
    }
    setError(null);
    setIsEnhancing(true);
    try {
      const res = await geminiService.enhanceListing({
        title,
        category,
        description,
        type: activeTab,
        speed: 'general',
      });

      if (res.enhancedTitle) setTitle(res.enhancedTitle);
      if (res.enhancedDescription) setDescription(res.enhancedDescription);
      setAiEnhancedNotice('✨ AI optimized your title & description for high discoverability!');
    } catch (err: any) {
      setError('AI enhance failed: ' + (err?.message || 'Try again'));
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Generate Image with Gemini
  const handleAIGenerateImage = async () => {
    if (!imagePrompt.trim() && !title.trim()) {
      setError('Please type an image prompt or title to generate an image.');
      return;
    }
    setError(null);
    setIsGeneratingImg(true);
    try {
      const promptToUse = imagePrompt.trim() || `Professional high quality realistic marketplace photo of: ${title}, ${category}`;
      const res = await geminiService.generateOrEditImage(promptToUse);
      if (res.imageUrl) {
        setImageUrl(res.imageUrl);
        setAiEnhancedNotice('🎨 Visual created with Gemini Image Intelligence!');
      }
    } catch (err: any) {
      setError('Image generation error: ' + (err?.message || 'Try again'));
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImageUrl(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError('You must be signed in to add a listing.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // 1. Social Post
      if (activeTab === 'post') {
        await dbService.createPost({
          userId: user.uid,
          userFullName: profile.fullName,
          userUsername: profile.username,
          userPhoto: profile.photoURL,
          content: description || title,
          imageUrl: imageUrl || undefined,
          category,
        });
      }
      // 2. "I Need" Request
      else if (activeTab === 'request') {
        await dbService.createRequest({
          userId: user.uid,
          userFullName: profile.fullName,
          userUsername: profile.username,
          userPhoto: profile.photoURL,
          title,
          description,
          category,
          budget: Number(price) || undefined,
          location,
        });
      }
      // 3. Regular Discovery Listing
      else {
        await dbService.createListing({
          type: activeTab as ListingType,
          title,
          description,
          category,
          subcategory: subcategory || undefined,
          price: Number(price) || 0,
          currency,
          priceUnit: activeTab === 'property' ? priceUnit : activeTab === 'service' ? '/hr' : '',
          location,
          images: imageUrl ? [imageUrl] : [],
          userId: user.uid,
          userFullName: profile.fullName,
          userUsername: profile.username,
          userPhoto: profile.photoURL,
          userVerified: Boolean(profile.verifications?.identityVerified || profile.verifications?.businessVerified),
          userPhone: profile.phone,
          userEmail: profile.email,
          status: 'active',
          propertyDetails:
            activeTab === 'property'
              ? {
                  transactionType,
                  propertyType,
                  bedrooms,
                  bathrooms,
                  areaSqFt,
                  amenities: ['24/7 Security', 'Elevator', 'Backup Generator', 'Parking'],
                }
              : undefined,
          productDetails:
            activeTab === 'product'
              ? {
                  condition,
                }
              : undefined,
          jobDetails:
            activeTab === 'job'
              ? {
                  companyName: companyName || profile.fullName,
                  jobType,
                  deadline,
                }
              : undefined,
          projectDetails:
            activeTab === 'project'
              ? {
                  projectBudget: Number(projectBudget) || Number(price) || 0,
                  skillsRequired: skillsRequired ? skillsRequired.split(',').map((s) => s.trim()) : [],
                  proposalsCount: 0,
                }
              : undefined,
        });
      }

      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Universal Publishing
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Publish to FindX Discovery Network</h2>
          <p className="text-xs text-slate-500">
            Publish properties, products, services, jobs, or requests visible on the interactive map & universal search.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 mb-5 scrollbar-none">
          {[
            { id: 'property', label: 'Property', icon: Home },
            { id: 'product', label: 'Product', icon: ShoppingBag },
            { id: 'service', label: 'Service', icon: Wrench },
            { id: 'business', label: 'Business', icon: Store },
            { id: 'job', label: 'Job', icon: Briefcase },
            { id: 'project', label: 'Freelance Project', icon: Code },
            { id: 'request', label: 'I Need (Request)', icon: HelpCircle },
            { id: 'post', label: 'Feed Post', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  const found = MAIN_CATEGORIES.find((c) => c.id === tab.id);
                  if (found) setCategory(found.name);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {aiEnhancedNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{aiEnhancedNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title with AI polish */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {activeTab === 'post' ? 'Post Headline / Summary' : 'Listing Title'} *
              </label>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={isEnhancing}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                {isEnhancing ? 'Gemini Thinking...' : '✨ Polish with Gemini'}
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'property'
                  ? 'e.g. Modern 3-Bed Luxury Apartment in Dhanmondi'
                  : activeTab === 'product'
                  ? 'e.g. MacBook Pro M2 16GB / 512GB (Like New)'
                  : activeTab === 'service'
                  ? 'e.g. Certified Master Electrician & AC Servicing'
                  : activeTab === 'job'
                  ? 'e.g. Senior Frontend React Engineer'
                  : activeTab === 'request'
                  ? 'e.g. Need experienced plumber for bathroom fixture today'
                  : 'What are you discovering or sharing?'
              }
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          {/* Category & Location selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                {MAIN_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.bnName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Area</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka or Boyra, Khulna"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Price & Currency (unless Social Post) */}
          {activeTab !== 'post' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'job'
                    ? 'Salary / Compensation'
                    : activeTab === 'request'
                    ? 'Target Budget'
                    : 'Price'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-500 text-sm">৳</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {activeTab === 'property' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Interval</label>
                  <select
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  >
                    <option value="/month">/ month</option>
                    <option value="total">total price</option>
                    <option value="/year">/ year</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Subtype-Specific Fields */}
          {activeTab === 'property' && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="text-xs font-bold text-blue-900">Property Details</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 block">Type</label>
                  <select
                    value={transactionType}
                    onChange={(e: any) => setTransactionType(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="for_rent">For Rent</option>
                    <option value="for_sale">For Sale</option>
                    <option value="for_lease">For Lease</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Bathrooms</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Area (Sq Ft)</label>
                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(Number(e.target.value))}
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'job' && (
            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl space-y-3">
              <div className="text-xs font-bold text-rose-900">Job Specifications</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-600 block">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. TechCorp Bangladesh"
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block">Job Schedule</label>
                  <select
                    value={jobType}
                    onChange={(e: any) => setJobType(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="remote">Remote</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key details, condition, terms, and specifications..."
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Image & Gemini Visual Creator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image / Visual Asset</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste Image URL or upload below..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
              />
              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors">
                <Camera className="w-3.5 h-3.5" />
                Upload File
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* AI Image Generation Prompt */}
            <div className="mt-2 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Or prompt Gemini: e.g. 'Cozy living room with balcony and morning sunlight'"
                className="flex-1 w-full bg-white px-3 py-1.5 text-xs border border-purple-200 rounded-lg outline-hidden"
              />
              <button
                type="button"
                onClick={handleAIGenerateImage}
                disabled={isGeneratingImg}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingImg ? 'animate-spin' : ''}`} />
                {isGeneratingImg ? 'Creating...' : '🎨 AI Create Image'}
              </button>
            </div>

            {imageUrl && (
              <div className="mt-2 relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish to FindX'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
