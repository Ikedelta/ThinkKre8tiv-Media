'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Globe, Edit2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CmsItem {
  id: string;
  section: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
}

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  about: 'About Us',
  contact: 'Contact Info',
  services: 'Services',
  testimonials: 'Testimonials',
};

export default function CmsPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });
  const [saved, setSaved] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<CmsItem[]>({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string }) => {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('Content saved!');
      setEditingId(null);
      setSaved(vars.id);
      setTimeout(() => setSaved(null), 2000);
    },
    onError: () => toast.error('Failed to save content'),
  });

  const sectionItems = items.filter((i) => i.section === activeSection);

  const startEdit = (item: CmsItem) => {
    setEditingId(item.id);
    setEditValues({ title: item.title || '', content: item.content || '' });
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, ...editValues });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-montserrat font-black text-[#001F3F]">
            Website CMS
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your website content</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
          <Globe size={14} className="text-blue-600" />
          <span className="text-xs font-bold text-blue-700">Changes reflect on the website</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-montserrat font-bold text-[#001F3F]">
                Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {['hero', 'about', 'contact', 'services', 'testimonials'].map((section) => {
                const count = items.filter((i) => i.section === section).length;
                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all',
                      activeSection === section
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <span>{sectionLabels[section] || section}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                          activeSection === section
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-500'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-montserrat font-bold text-[#001F3F]">
                {sectionLabels[activeSection] || activeSection}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-20 bg-slate-100 rounded-xl" />
                    ))}
                </div>
              ) : sectionItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Globe size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-sm">No content in this section yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sectionItems.map((item) => {
                    const isEditing = editingId === item.id;
                    const isSaved = saved === item.id;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'border rounded-xl p-4 transition-all',
                          isEditing
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">
                              {item.title || item.id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSaved && (
                              <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                <CheckCircle2 size={12} /> Saved
                              </span>
                            )}
                            {!isEditing ? (
                              <button
                                onClick={() => startEdit(item)}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEdit(item.id)}
                                  disabled={updateMutation.isPending}
                                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                                Label
                              </label>
                              <input
                                value={editValues.title}
                                onChange={(e) =>
                                  setEditValues({ ...editValues, title: e.target.value })
                                }
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1">
                                Content
                              </label>
                              <textarea
                                value={editValues.content}
                                onChange={(e) =>
                                  setEditValues({ ...editValues, content: e.target.value })
                                }
                                rows={4}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {item.content || (
                                <span className="text-slate-400 italic">No content yet</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick add contact info or other items */}
          {activeSection === 'contact' && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-slate-500 mb-2">
                  💡 Tip: Update your contact details above, then they will appear on your website
                  automatically.
                </p>
                <p className="text-xs text-slate-400">
                  You can also update phone, email and address in <strong>Settings</strong>.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
