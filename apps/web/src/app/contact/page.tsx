'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

import { useQuery } from '@tanstack/react-query';

const officesList = [
  {
    city: 'Accra, Ghana (HQ)',
    address: 'OSU, Haramani Sport Complex, Accra',
    phone: '+233 24 555 9000',
    email: 'accra@thinkkre8tivmedia.com',
    hours: 'Mon–Fri: 8am–6pm, Sat: 9am–3pm',
  },
];

export default function ContactPage() {
  const { data: cmsContent } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      return res.json();
    }
  });

  const contactSection = cmsContent?.filter((c: any) => c.section === 'contact' && c.is_active) || [];
  
  // Extract contact details from CMS, fallback to defaults
  const directPhone = contactSection.find((c: any) => c.id === 'contact_phone')?.content || '+233 24 555 9000';
  const directEmail = contactSection.find((c: any) => c.id === 'contact_email')?.content || 'hello@thinkkre8tivmedia.com';

  const [msgForm, setMsgForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setMsgForm({ name: '', email: '', message: '' });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />

      {/* Page Header */}
      <section className="relative py-12 sm:py-14 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary text-white px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shadow-xs">
            <Phone size={11} /> Corporate Inquiries
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contact Commercial Press Division
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm font-normal leading-relaxed">
            Have questions regarding contract pricing, substrates, or turnkey project execution? Connect directly with our enterprise team.
          </p>
        </div>
      </section>

      {/* Split Columns Section */}
      <section className="py-14 sm:py-16 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
            
            {/* Left Column: Form & Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                  <Sparkles size={10} /> Direct Inquiry
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Request an Executive Consultation</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Submit your brief or technical query below. Our account executives respond within 2 business hours.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-lg text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Inquiry Received</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
                    Thank you. Your message has been routed to our corporate sales desk. An executive will contact you shortly.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 rounded-xl space-y-4 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={msgForm.name}
                        onChange={(e) => setMsgForm({ ...msgForm, name: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary rounded-md px-3 py-2 text-xs outline-none transition-colors text-slate-900 dark:text-white font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Corporate Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="you@company.com"
                        value={msgForm.email}
                        onChange={(e) => setMsgForm({ ...msgForm, email: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#D22630] rounded-md px-3 py-2 text-xs outline-none transition-colors text-slate-900 dark:text-white font-normal"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Message *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Your questions or custom print inquiry details..."
                      value={msgForm.message}
                      onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#D22630] rounded-md px-3 py-2 text-xs outline-none transition-colors text-slate-900 dark:text-white font-normal resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#D22630] hover:bg-[#b81d26] text-white font-semibold py-2.5 px-5 rounded-md text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={12} />
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-bold text-lg text-foreground">Direct Contacts</h3>
                <div className="space-y-3.5">
                  <a href={`tel:${directPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-foreground border border-border">
                      <Phone size={14} />
                    </div>
                    <span>{directPhone}</span>
                  </a>
                  <a href={`mailto:${directEmail}`} className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-foreground border border-border">
                      <Mail size={14} />
                    </div>
                    <span>{directEmail}</span>
                  </a>
                </div>
              </div>

              {/* Office Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground px-2">Our Branches</h3>
                <div className="space-y-3">
                  {officesList.map((office) => (
                    <div key={office.city} className="bg-background border border-border hover:border-foreground/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] p-5 rounded-2xl space-y-3 shadow-sm transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-foreground">{office.city}</h4>
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase">{office.hours.split(',')[0]}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2.5 text-muted-foreground">
                          <MapPin size={13} className="text-foreground flex-shrink-0 mt-0.5" />
                          <span>{office.address}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Phone size={13} className="text-foreground flex-shrink-0" />
                          <a href={`tel:${office.phone.replace(/\s/g, '')}`} className="hover:text-foreground font-semibold transition-colors">{office.phone}</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
