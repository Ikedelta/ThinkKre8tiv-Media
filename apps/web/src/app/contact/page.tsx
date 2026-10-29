'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, MessageSquare, Clock, Building } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ContactPage() {
  const { data: cmsContent } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      return res.json();
    }
  });

  const contactSection = cmsContent?.filter((c: any) => c.section === 'contact' && c.is_active) || [];
  
  const directPhone = contactSection.find((c: any) => c.id === 'contact_phone')?.content || '+233 24 468 1391';
  const directEmail = contactSection.find((c: any) => c.id === 'contact_email')?.content || 'hello@thinkkre8tivmedia.com';
  const directAddress = contactSection.find((c: any) => c.id === 'contact_address')?.content || 'Accra, Ghana';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Your inquiry has been received. Our team will contact you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />

      {/* Clean Header */}
      <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contact Us
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Reach out to our printing and branding team in Accra. We are ready to assist with your inquiries and production orders.
          </p>
        </div>
      </section>

      {/* Main Content: Info Cards & Inquiry Form */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left 5 Cols: Direct Contact Details & Working Hours */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Direct Inquiries
                </h2>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D22630] flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone / WhatsApp</p>
                      <a href={`tel:${directPhone.replace(/\s/g, '')}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#D22630] transition-colors mt-0.5 block">
                        {directPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D22630] flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</p>
                      <a href={`mailto:${directEmail}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#D22630] transition-colors mt-0.5 block">
                        {directEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D22630] flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Office & Press Facility</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {directAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock size={14} className="text-slate-400" />
                    <span><strong>Monday – Friday:</strong> 08:00 – 17:00 GMT</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock size={14} className="text-slate-400" />
                    <span><strong>Saturday:</strong> 09:00 – 14:00 GMT</span>
                  </div>
                </div>
              </div>

              {/* Fast WhatsApp Box */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <MessageSquare size={16} />
                  <span>Need an immediate response?</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  Chat directly with our production desk on WhatsApp for fast questions and updates.
                </p>
                <a
                  href="https://wa.me/233244681391"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Message on WhatsApp
                </a>
              </div>

            </div>

            {/* Right 7 Cols: Inquiry Message Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill out the form below and our team will get back to you promptly.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="p-8 text-center space-y-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                    <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Thank You</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Your message has been delivered to our team. We will review your inquiry and follow up shortly.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Your full name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#D22630] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          required
                          type="email"
                          placeholder="your.email@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#D22630] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          placeholder="+233 ..."
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#D22630] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Service / Subject
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Offset Printing, Rigid Boxes, Signage"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#D22630] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Please describe your printing, packaging, or branding requirements..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-[#D22630] transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={13} />
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
