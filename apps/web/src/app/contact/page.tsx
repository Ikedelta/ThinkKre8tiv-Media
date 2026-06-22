'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const officesList = [
  {
    city: 'Accra (HQ)',
    address: '14 Commerce Avenue, Osu, Accra',
    phone: '+233 24 555 9000',
    email: 'accra@thinkkre8tive.com',
    hours: 'Mon–Fri: 8am–6pm, Sat: 9am–3pm',
  },
  {
    city: 'Kumasi',
    address: '7 Prempeh II Street, Kumasi',
    phone: '+233 32 200 0000',
    email: 'kumasi@thinkkre8tive.com',
    hours: 'Mon–Fri: 8am–5pm, Sat: 9am–2pm',
  },
  {
    city: 'Takoradi',
    address: '3 Market Circle, Takoradi',
    phone: '+233 31 200 0000',
    email: 'takoradi@thinkkre8tive.com',
    hours: 'Mon–Fri: 8am–5pm',
  },
];

export default function ContactPage() {
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
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden pt-20">
      <PublicNav />

      {/* Page Header */}
      <section className="relative py-16 bg-slate-50/40 border-b border-border/40 overflow-hidden">
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute inset-0 opacity-5" 
          style={{ background: 'radial-gradient(40% 50% at 75% 15%, var(--color-muted-foreground), transparent 85%)' }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FCD20F] text-black px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border border-border/80">
            <Phone size={12} /> Contact Printing Press Desk
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Connect With Our Press House
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base font-medium">
            Have questions about catalog papers, rigid packaging formats, or ready to place bulk press runs? Get in touch.
          </p>
        </div>
      </section>

      {/* Split Columns Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Form & Info */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-secondary text-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-border">
                  <Sparkles size={11} /> Send Message
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Drop us a line</h2>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Fill out our direct contact form below, and our support team will reply within 2 business hours.
                </p>
              </div>

              {isSubmitted ? (
                <div className="bg-slate-50 border border-border p-10 rounded-2xl text-center space-y-4 animate-fade-in shadow-sm">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-250 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Message Dispatched!</h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Thank you. Your message has been successfully logged. We will contact you shortly.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="border border-border bg-background hover:bg-muted text-xs font-bold text-foreground px-5 py-2.5 rounded-lg transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="bg-slate-50/60 dark:bg-slate-900/40 border border-border/80 p-6 sm:p-8 rounded-3xl space-y-5 shadow-lg backdrop-blur-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Your full name"
                        value={msgForm.name}
                        onChange={(e) => setMsgForm({ ...msgForm, name: e.target.value })}
                        className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="you@company.com"
                        value={msgForm.email}
                        onChange={(e) => setMsgForm({ ...msgForm, email: e.target.value })}
                        className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Your questions or custom print inquiry details..."
                      value={msgForm.message}
                      onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                      className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#D22630] hover:bg-[#D22630]/95 text-white font-extrabold py-3.5 px-6 rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'} <Send size={13} />
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-bold text-lg text-foreground">Direct Contacts</h3>
                <div className="space-y-3.5">
                  <a href="tel:+233245559000" className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-foreground border border-border">
                      <Phone size={14} />
                    </div>
                    <span>+233 24 555 9000</span>
                  </a>
                  <a href="mailto:hello@thinkkre8tive.com" className="flex items-center gap-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-foreground border border-border">
                      <Mail size={14} />
                    </div>
                    <span>hello@thinkkre8tive.com</span>
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
