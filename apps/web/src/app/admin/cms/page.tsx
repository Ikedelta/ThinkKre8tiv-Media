'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Globe, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CmsItem {
  id: string;
  section: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
}

const sectionLabels: Record<string, { title: string; desc: string }> = {
  hero: { title: 'Welcome Banner', desc: 'The main introductory section at the very top of your homepage.' },
  carousel: { title: 'Homepage Slideshow', desc: 'The sliding images and messages on your homepage.' },
  expertise: { title: 'What We Do', desc: 'Highlight your core skills and areas of expertise.' },
  about: { title: 'About Us', desc: 'Your company background and mission statement.' },
  contact: { title: 'Contact Info', desc: 'Your public phone numbers, emails, and physical location.' },
  services: { title: 'Services', desc: 'The detailed list of services you offer to clients.' },
  testimonials: { title: 'Testimonials', desc: 'Customer reviews and feedback displayed on the site.' },
};

export default function CmsPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [formData, setFormData] = useState<CmsItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<CmsItem[]>({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  // Keep local form data synced with the selected section items
  useEffect(() => {
    const sectionItems = items.filter((i) => i.section === activeSection);
    setFormData(sectionItems);
  }, [items, activeSection]);

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string; image_url: string }) => {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        formData.map(item => 
          updateMutation.mutateAsync({
            id: item.id,
            title: item.title,
            content: item.content,
            image_url: item.image_url || ''
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('Website content updated successfully!');
    } catch (err) {
      toast.error('Failed to save some changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (id: string, field: keyof CmsItem, value: string) => {
    setFormData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const activeInfo = sectionLabels[activeSection] || { title: activeSection, desc: 'Manage this section.' };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Website Content
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Easily update the text and images on your public website.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
          <Globe size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Changes are instantly live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-2">Page Sections</h3>
          {Object.entries(sectionLabels).map(([key, info]) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl transition-all font-bold text-sm border',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-white dark:bg-[#0B0F19] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                {info.title}
              </button>
            );
          })}
        </div>

        {/* Content Editor Form */}
        <div className="md:col-span-8 lg:col-span-9">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#0B0F19] p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{activeInfo.title}</h2>
              <p className="text-slate-500 text-sm">{activeInfo.desc}</p>
            </div>
            
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3"></div>
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
                </div>
              ) : formData.length === 0 ? (
                <div className="text-center py-12">
                  <Globe size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                  <p className="text-slate-500 font-medium">No customizable content found for this section.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {formData.map((item, index) => (
                    <div key={item.id} className="space-y-5 pb-8 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                      {formData.length > 1 && (
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-lg">
                          Item {index + 1}
                        </h4>
                      )}
                      
                      <div className="space-y-4">
                        {/* Heading */}
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Heading
                          </label>
                          <input
                            value={item.title}
                            onChange={(e) => updateField(item.id, 'title', e.target.value)}
                            className="w-full bg-white dark:bg-[#06080D] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            placeholder="e.g. Welcome to our website"
                          />
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Message
                          </label>
                          <textarea
                            value={item.content}
                            onChange={(e) => updateField(item.id, 'content', e.target.value)}
                            rows={4}
                            className="w-full bg-white dark:bg-[#06080D] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow"
                            placeholder="Enter the descriptive text..."
                          />
                        </div>

                        {/* Image URL (Only show if relevant to section) */}
                        {(activeSection === 'carousel' || activeSection === 'expertise' || item.image_url !== null) && (
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Photo Link
                            </label>
                            <div className="flex gap-4 items-start">
                              <div className="flex-1">
                                <input
                                  value={item.image_url || ''}
                                  onChange={(e) => updateField(item.id, 'image_url', e.target.value)}
                                  placeholder="e.g. https://example.com/image.jpg"
                                  className="w-full bg-white dark:bg-[#06080D] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Paste a link to an image. You can upload an image elsewhere and paste the link here.</p>
                              </div>
                              {item.image_url && (
                                <div className="shrink-0 w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                  <img src={item.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl shadow-xl shadow-blue-600/20 text-base w-full sm:w-auto"
                    >
                      {isSaving ? 'Saving Changes...' : 'Save Changes'}
                      {!isSaving && <CheckCircle2 size={18} className="ml-2" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
