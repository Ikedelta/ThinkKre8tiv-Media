'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  Building2,
  User,
  Quote,
  Sparkles,
  Layers,
  Award,
  BellRing,
  HelpCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Upload,
  Loader2,
  Trash2,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface CmsItem {
  id: string;
  section: string;
  title: string;
  content: string;
  image_url: string | null;
  sort_order?: number;
  is_active: boolean;
}

const sectionConfig: Record<string, { label: string; desc: string; icon: any; color: string; badge: string; pageGroup: string }> = {
  hero: {
    label: 'Main Headline & Pitch',
    desc: 'The large introductory headline and short mission pitch at the top of your homepage.',
    icon: Sparkles,
    color: 'text-amber-500',
    badge: 'Homepage',
    pageGroup: 'Home Page'
  },
  hero_slides: {
    label: 'Hero Photo Slider',
    desc: 'The sliding photo banners on the home page with titles, tags, and background imagery.',
    icon: Layers,
    color: 'text-[#D22630]',
    badge: 'Homepage',
    pageGroup: 'Home Page'
  },
  partners: {
    label: 'Client & Partner Logos',
    desc: 'Upload customer and corporate partner logos to slide across your website marquee.',
    icon: Building2,
    color: 'text-teal-500',
    badge: 'Homepage',
    pageGroup: 'Home Page'
  },
  services: {
    label: 'Our Services & Signage',
    desc: 'Customize service offerings, 3D signs, print catalog cards, and illustrative photos.',
    icon: Layers,
    color: 'text-rose-500',
    badge: 'Services Page',
    pageGroup: 'Services Page'
  },
  expertise: {
    label: 'Featured Client Projects',
    desc: 'Showcase completed printouts, custom apparel, and real packaging delivered to clients.',
    icon: CheckCircle2,
    color: 'text-violet-500',
    badge: 'Portfolio',
    pageGroup: 'Home Page'
  },
  about: {
    label: 'About Company Story',
    desc: 'The founding narrative, factory establishment backstory, and mission statement.',
    icon: Award,
    color: 'text-emerald-500',
    badge: 'About Page',
    pageGroup: 'About Page'
  },
  ceo: {
    label: 'CEO & Leadership Message',
    desc: 'The Managing Director’s photo, executive quote, and corporate philosophy message.',
    icon: User,
    color: 'text-indigo-500',
    badge: 'About / Home',
    pageGroup: 'About Page'
  },
  carousel: {
    label: 'Workshop & Factory Showcase',
    desc: 'Photos of your Heidelberg offset presses, laser machines, and factory floor.',
    icon: ImageIcon,
    color: 'text-blue-500',
    badge: 'Media Gallery',
    pageGroup: 'Home Page'
  },
  contact: {
    label: 'Contact Information',
    desc: 'Official phone numbers, email addresses, and Osu Accra factory complex location.',
    icon: Phone,
    color: 'text-purple-500',
    badge: 'Contact Page',
    pageGroup: 'Contact Page'
  },
  announcement: {
    label: 'Top Announcement Banner',
    desc: 'The announcement strip shown across website headers (promotions, holiday hours, etc.).',
    icon: BellRing,
    color: 'text-amber-600',
    badge: 'All Pages',
    pageGroup: 'Global Site'
  }
};

export default function ComprehensiveCmsPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [formData, setFormData] = useState<CmsItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rawItems, isLoading, refetch } = useQuery<CmsItem[]>({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      if (!res.ok) throw new Error('Failed to load CMS content');
      return res.json();
    },
  });

  const items = useMemo(() => rawItems || [], [rawItems]);

  useEffect(() => {
    if (items.length > 0) {
      const sectionItems = items.filter((i) => i.section === activeSection);
      setFormData(sectionItems);
    }
  }, [items, activeSection]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cms?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete content');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('Item removed successfully');
    },
  });

  const handleAddNewSlide = async () => {
    const newId = `${activeSection}_${Date.now()}`;
    const newItem: CmsItem = {
      id: newId,
      section: activeSection,
      title: activeSection === 'hero_slides' 
        ? 'Featured ::: New Slide Heading' 
        : activeSection === 'partners'
        ? 'Client Logo'
        : 'New Item Title',
      content: activeSection === 'partners' ? '' : 'Description or details for this item...',
      image_url: '',
      sort_order: formData.length,
      is_active: true
    };
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) throw new Error('Failed to create new item');
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('New item created! You can now customize and save it.');
    } catch (err: any) {
      toast.error(err.message || 'Error creating item');
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<CmsItem>) => {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update content');
      }
      return res.json();
    },
  });

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await Promise.all(
        formData.map((item) =>
          updateMutation.mutateAsync({
            id: item.id,
            title: item.title,
            content: item.content,
            image_url: item.image_url || '',
            section: item.section
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success(`${sectionConfig[activeSection]?.label || 'Section'} updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (id: string, field: keyof CmsItem, value: string) => {
    setFormData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file) return;
    try {
      setUploadingId(itemId);
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Upload failed with status ${res.status}`);
      }
      const data = await res.json();
      const newUrl = data.url || data.public_url;
      if (newUrl) {
        updateField(itemId, 'image_url', newUrl);
        // Also auto-save immediately to database so users never lose uploaded images if they don't click Save
        await updateMutation.mutateAsync({
          id: itemId,
          image_url: newUrl,
          section: activeSection
        });
        queryClient.invalidateQueries({ queryKey: ['cms'] });
        toast.success('Image uploaded and saved to live website!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error uploading image');
    } finally {
      setUploadingId(null);
    }
  };

  const currentSection = sectionConfig[activeSection] || {
    label: activeSection,
    desc: 'Manage content for this section.',
    icon: Globe,
    color: 'text-slate-600',
    badge: 'CMS'
  };

  const CurrentIcon = currentSection.icon;

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-16 font-sans">
      
      {/* Top Banner Header: Matching Dashboard Typography Exactly */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 uppercase tracking-wider">
              Live Website Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Website Content &amp; Media Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time control over homepage banners, sliding client logos, executive bios, and photography.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <ExternalLink className="w-3.5 h-3.5" /> View Public Site
            </Button>
          </Link>
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || formData.length === 0}
            className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs h-9 px-5 font-bold gap-2 shadow-xs cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Ultra-Modern Clean Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Navigation Sidebar - Organized By Page Groups */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Choose Page to Edit
              </p>
              <p className="text-[11px] text-slate-400">Select any section below to edit its text and photos</p>
            </div>

            <div className="space-y-4">
              {['Home Page', 'Services Page', 'About Page', 'Contact Page', 'Global Site'].map((group) => {
                const groupSections = Object.entries(sectionConfig).filter(([_, cfg]) => cfg.pageGroup === group);
                if (groupSections.length === 0) return null;

                return (
                  <div key={group} className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block">
                      {group}
                    </span>
                    {groupSections.map(([key, config]) => {
                      const Icon = config.icon;
                      const isActive = activeSection === key;
                      const count = items.filter(i => i.section === key).length;

                      return (
                        <button
                          key={key}
                          onClick={() => setActiveSection(key)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group",
                            isActive
                              ? "bg-[#0F172A] text-white shadow-xs"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-colors shrink-0",
                              isActive ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800",
                              !isActive && config.color
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs sm:text-sm font-bold truncate leading-tight">{config.label}</p>
                            </div>
                          </div>

                          <span className={cn(
                            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ml-2 shrink-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">✨ Simple 2-Step Process</p>
            <p className="leading-relaxed text-[11px] text-slate-500">
              1. Type your changes or click &quot;Upload Photo&quot;.<br/>
              2. Click <strong>Save Changes</strong> to update the live site instantly.
            </p>
          </div>
        </div>

        {/* Right Content Editor Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CurrentIcon className={cn("w-5 h-5", currentSection.color)} />
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentSection.label}
                  </CardTitle>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{currentSection.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                {['hero_slides', 'carousel', 'expertise', 'partners'].includes(activeSection) && (
                  <Button
                    size="sm"
                    onClick={handleAddNewSlide}
                    className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold gap-1.5 h-9 px-4 shadow-xs cursor-pointer"
                  >
                    <Plus size={14} /> {activeSection === 'partners' ? 'Add Client Logo' : 'Add Item'}
                  </Button>
                )}
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {currentSection.badge}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D22630] mx-auto" />
                  <p className="text-sm font-medium text-slate-500">Loading section content...</p>
                </div>
              ) : formData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Globe className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No active content records in this section</p>
                  <p className="text-xs max-w-sm mx-auto">Click &quot;Add Client Logo&quot; or &quot;Add Item&quot; above to initialize custom items.</p>
                  {['hero_slides', 'carousel', 'expertise', 'partners'].includes(activeSection) && (
                    <Button
                      size="sm"
                      onClick={handleAddNewSlide}
                      className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 h-9 mt-2"
                    >
                      <Plus size={14} /> {activeSection === 'partners' ? 'Add First Client Logo' : 'Add First Slide'}
                    </Button>
                  )}
                </div>
              ) : (
                formData.map((item, index) => {
                  const isPartners = item.section === 'partners';
                  const isLongText = (item.content && item.content.length > 90) || item.id.includes('bio') || item.id.includes('quote') || item.id.includes('p1') || item.id.includes('p2') || item.id.includes('subheadline');
                  const hasImage = item.image_url !== null && (item.id === 'ceo_name' || item.id.includes('image') || item.section === 'carousel' || item.section === 'expertise' || item.section === 'hero_slides' || item.section === 'partners' || item.section === 'services');

                  // Streamlined pure logo card for Partners / Clients
                  if (isPartners) {
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                            <Input
                              value={item.title || ''}
                              onChange={(e) => updateField(item.id, 'title', e.target.value)}
                              placeholder="Partner Brand Name (Optional)"
                              className="h-8 text-xs font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 max-w-xs"
                            />
                          </div>
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer shrink-0"
                            title="Delete this logo"
                          >
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600">Remove</span>
                          </button>
                        </div>

                        {/* Minimalist Logo Upload Box */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Client / Partner Logo
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-[#D22630] hover:text-[#b81d26] bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-lg transition-colors border border-red-200">
                              {uploadingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{uploadingId === item.id ? 'Uploading...' : (item.image_url ? 'Replace Logo' : 'Upload Logo')}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingId === item.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(item.id, file);
                                }}
                              />
                            </label>
                          </div>

                          <div className="flex gap-4 items-center">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shrink-0 flex items-center justify-center shadow-xs">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.title || 'Client Logo'}
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold text-center">No logo selected</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              {item.image_url ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                                    <Check className="w-3 h-3" /> Logo attached
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateField(item.id, 'image_url', '')}
                                    className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  >
                                    Clear logo
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">
                                  Click <strong>Upload Logo</strong> to select an image from your device.
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400">
                                Transparent PNG or SVG logos work best for the brand slider.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.title || item.id}
                          </h4>
                        </div>
                        {['hero_slides', 'carousel', 'expertise', 'partners'].includes(item.section) && (
                          <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                            title="Delete this item"
                          >
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600">Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Title / Label Field */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          {item.section === 'hero_slides' ? 'Slide Tag & Title (Format: Tag ::: Title)' : item.section === 'partners' ? 'Client / Company Name' : 'Display Title / Heading'}
                        </label>
                        <Input
                          value={item.title || ''}
                          onChange={(e) => updateField(item.id, 'title', e.target.value)}
                          placeholder={item.section === 'hero_slides' ? 'e.g. Printing & Packaging ::: High-Quality Printing & Boxes' : item.section === 'partners' ? 'e.g. MTN Ghana' : 'e.g. Section headline'}
                          className="h-10 text-sm bg-slate-50/50 dark:bg-slate-900"
                        />
                      </div>

                      {/* Content Field */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          {item.section === 'partners' ? 'Industry / Sector Category' : 'Body Content / Value'}
                        </label>
                        {isLongText ? (
                          <Textarea
                            rows={3}
                            value={item.content || ''}
                            onChange={(e) => updateField(item.id, 'content', e.target.value)}
                            placeholder="Write compelling brand text..."
                            className="text-sm bg-slate-50/50 dark:bg-slate-900 leading-relaxed"
                          />
                        ) : (
                          <Input
                            value={item.content || ''}
                            onChange={(e) => updateField(item.id, 'content', e.target.value)}
                            placeholder={item.section === 'partners' ? 'e.g. Telecom & Corporate' : 'Content string or phone number...'}
                            className="h-10 text-sm bg-slate-50/50 dark:bg-slate-900"
                          />
                        )}
                      </div>

                      {/* Image Upload & Preview Field */}
                      {hasImage && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              {item.id === 'ceo_name' ? 'CEO Portrait Photograph' : item.section === 'partners' ? 'Client Logo Image' : 'Section Image'}
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-[#D22630] hover:text-[#b81d26] bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-lg transition-colors border border-red-200">
                              {uploadingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{uploadingId === item.id ? 'Uploading...' : (item.image_url ? 'Replace Image' : 'Upload Image')}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingId === item.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(item.id, file);
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shrink-0 flex items-center justify-center shadow-xs">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt="Preview"
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold text-center">No image</span>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              {item.image_url ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                                    <Check className="w-3 h-3" /> Image attached
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateField(item.id, 'image_url', '')}
                                    className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                  >
                                    Remove image
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">
                                  Click <strong>Upload Image</strong> to select a photo from your computer.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Bottom Save Action */}
              {formData.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs h-10 px-6 font-bold gap-2 shadow-xs cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaving ? 'Saving Changes...' : `Save ${currentSection.label}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
