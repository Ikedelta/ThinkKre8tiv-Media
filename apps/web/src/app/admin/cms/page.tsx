'use client';

import { useState, useEffect } from 'react';
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
  Loader2
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

const sectionConfig: Record<string, { label: string; desc: string; icon: any; color: string; badge: string }> = {
  hero: {
    label: 'Hero & Mission',
    desc: 'The executive main headline and corporate value proposition at the top of your homepage.',
    icon: Sparkles,
    color: 'text-amber-500',
    badge: 'Homepage Top'
  },
  hero_slides: {
    label: 'Hero Image Slider',
    desc: 'Interactive sliding photo carousel displayed on the right side of the homepage hero banner.',
    icon: ImageIcon,
    color: 'text-red-500',
    badge: 'Hero Slider'
  },
  ceo: {
    label: 'CEO & Leadership',
    desc: 'Executive statement, CEO full name, official title, quote, statement, and executive portrait photo.',
    icon: User,
    color: 'text-rose-500',
    badge: 'Executive Statement'
  },
  about: {
    label: 'Who We Are & Heritage',
    desc: 'Company origin story, industrial lithography capacity, and structural fabrication pillars.',
    icon: Award,
    color: 'text-indigo-500',
    badge: 'About Page & Section'
  },
  expertise: {
    label: 'Core Capabilities',
    desc: 'The commercial printing categories (Offset, Commercial Packaging, 3D Signage, Fleet Branding).',
    icon: Layers,
    color: 'text-emerald-500',
    badge: 'Print Services'
  },
  carousel: {
    label: 'Production Showcase',
    desc: 'Factory floor highlights, high-volume presses, custom boxes, and bespoke brand merchandise.',
    icon: ImageIcon,
    color: 'text-blue-500',
    badge: 'Media Assets'
  },
  contact: {
    label: 'Contact & Press Facility',
    desc: 'Official direct phone numbers (as in logo: 0244681391 / 0244766457), email, and factory address.',
    icon: Phone,
    color: 'text-purple-500',
    badge: 'Contact Details'
  },
  announcement: {
    label: 'Alerts & Banner',
    desc: 'Top notification strip and announcement messages across website headers.',
    icon: BellRing,
    color: 'text-amber-600',
    badge: 'Header Banner'
  },
  partners: {
    label: 'Partners & Clients',
    desc: 'Partner logo marquee section titles and corporate client descriptions.',
    icon: Building2,
    color: 'text-teal-500',
    badge: 'Sliding Logos'
  }
};

export default function ComprehensiveCmsPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [formData, setFormData] = useState<CmsItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, refetch } = useQuery<CmsItem[]>({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      if (!res.ok) throw new Error('Failed to load CMS content');
      return res.json();
    },
  });

  useEffect(() => {
    const sectionItems = items.filter((i) => i.section === activeSection);
    setFormData(sectionItems);
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
      toast.success('Slide removed successfully');
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
        ? 'New Client / Partner'
        : 'New Item Title',
      content: activeSection === 'partners' ? 'Industry / Sector' : 'Description or details for this item...',
      image_url: activeSection === 'partners' ? '' : '/images/1.jpg',
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
      toast.success('New slide added! You can now customize and save it.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    }
  };
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string; image_url: string; section?: string }) => {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update content');
      return res.json();
    },
  });

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        formData.map(item =>
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

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file) return;
    try {
      setUploadingId(itemId);
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) {
        throw new Error('Image upload failed');
      }
      const data = await res.json();
      if (data.url) {
        updateField(itemId, 'image_url', data.url);
        toast.success('Image uploaded successfully! Click Save to publish.');
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
    <div className="max-w-[1400px] mx-auto space-y-8 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 text-slate-800 dark:text-slate-200 border border-amber-500/20 uppercase tracking-wider">
              Think Kre8tiv Brand Master CMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Website Content &amp; Media CMS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage every section of the public website with live synchronization across all devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="text-xs h-9 font-semibold gap-1.5 border-slate-300 dark:border-slate-700">
              <ExternalLink className="w-3.5 h-3.5" /> View Live Site
            </Button>
          </Link>
          <Button
            onClick={handleSaveAll}
            disabled={isSaving || formData.length === 0}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs h-9 font-semibold gap-2 shadow-sm"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Publishing...' : 'Save & Publish Changes'}
          </Button>
        </div>
      </div>

      {/* Main CMS Layout (Sidebar Navigation + Form Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Website Sections ({Object.keys(sectionConfig).length})
            </div>

            {Object.entries(sectionConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = activeSection === key;
              const count = items.filter(i => i.section === key).length;

              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all group",
                    isActive
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800",
                      !isActive && config.color
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate leading-tight">{config.label}</p>
                      <p className={cn(
                        "text-[10px] truncate mt-0.5",
                        isActive ? "text-slate-300" : "text-slate-400"
                      )}>
                        {config.badge}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}>
                    {count} item{count === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Help Card */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Real-Time Brand Sync</span>
            </div>
            <p className="text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
              Updates saved here automatically synchronize across all visitor devices, quotes, and header banners with zero downtime.
            </p>
          </div>
        </div>

        {/* Content Editor Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CurrentIcon className={cn("w-5 h-5", currentSection.color)} />
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    {currentSection.label}
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-1">{currentSection.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                {['hero_slides', 'carousel', 'expertise', 'partners'].includes(activeSection) && (
                  <Button
                    size="sm"
                    onClick={handleAddNewSlide}
                    className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
                  >
                    <Plus size={14} /> {activeSection === 'partners' ? 'Add Client Logo' : 'Add Slide'}
                  </Button>
                )}
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {currentSection.badge}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading section content...
                </div>
              ) : formData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Globe className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No active content records in this section</p>
                  <p className="text-xs max-w-sm mx-auto">Click &quot;Add Slide&quot; or &quot;Add Client Logo&quot; above to initialize custom items.</p>
                  {['hero_slides', 'carousel', 'expertise', 'partners'].includes(activeSection) && (
                    <Button
                      size="sm"
                      onClick={handleAddNewSlide}
                      className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 h-8 mt-2"
                    >
                      <Plus size={14} /> {activeSection === 'partners' ? 'Add First Client Logo' : 'Add First Slide'}
                    </Button>
                  )}
                </div>
              ) : (
                formData.map((item, index) => {
                  const isLongText = (item.content && item.content.length > 90) || item.id.includes('bio') || item.id.includes('quote') || item.id.includes('p1') || item.id.includes('p2') || item.id.includes('subheadline');
                  const hasImage = item.image_url !== null || item.id.includes('image') || item.section === 'carousel' || item.section === 'expertise' || item.section === 'hero_slides' || item.section === 'partners';

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            {item.title || item.id}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            ID: {item.id}
                          </span>
                          {['hero_slides', 'carousel', 'expertise', 'partners'].includes(item.section) && (
                            <button
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                              title="Delete this item"
                            >
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title / Label Field */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          {item.section === 'hero_slides' ? 'Slide Tag & Title (Format: Tag ::: Title)' : 'Display Title / Heading'}
                        </label>
                        <Input
                          value={item.title || ''}
                          onChange={(e) => updateField(item.id, 'title', e.target.value)}
                          placeholder={item.section === 'hero_slides' ? 'e.g. Printing & Packaging ::: High-Quality Printing & Boxes' : 'e.g. Section headline'}
                          className="h-9 text-xs bg-white dark:bg-slate-900"
                        />
                      </div>

                      {/* Content Field (Single line or multi-line textarea) */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                          Body Content / Value
                        </label>
                        {isLongText ? (
                          <Textarea
                            rows={3}
                            value={item.content || ''}
                            onChange={(e) => updateField(item.id, 'content', e.target.value)}
                            placeholder="Write compelling brand text..."
                            className="text-xs bg-white dark:bg-slate-900 leading-relaxed"
                          />
                        ) : (
                          <Input
                            value={item.content || ''}
                            onChange={(e) => updateField(item.id, 'content', e.target.value)}
                            placeholder="Content string or phone number..."
                            className="h-9 text-xs bg-white dark:bg-slate-900"
                          />
                        )}
                      </div>

                      {/* Image Field if applicable */}
                      {hasImage && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              Image Asset &bull; URL or Direct Upload
                            </label>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#D22630] hover:text-[#b81d26] bg-[#D22630]/10 px-2.5 py-1 rounded-md transition-colors">
                              {uploadingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{uploadingId === item.id ? 'Uploading...' : 'Upload Image File'}</span>
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
                          <div className="flex gap-3 items-center">
                            <Input
                              value={item.image_url || ''}
                              onChange={(e) => updateField(item.id, 'image_url', e.target.value)}
                              placeholder="https://... or upload a local file"
                              className="h-9 text-xs bg-white dark:bg-slate-900 flex-1"
                            />
                            {item.image_url && (
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0">
                                <img
                                  src={item.image_url}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
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
                    className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs h-10 px-6 font-semibold gap-2 shadow-sm"
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
