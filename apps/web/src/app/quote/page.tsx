'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Shield,
  Zap,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ChevronLeft,
  Printer,
  Sparkles,
  Layers,
  Palette,
  Truck,
  Award,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const servicesList = [
  { name: 'Large Format Printing', icon: Printer, desc: 'Banners, billboards, route signs' },
  { name: '3D Signage & Fabrication', icon: Sparkles, desc: 'LED storefronts, custom steel profiles' },
  { name: 'Corporate Branding', icon: Palette, desc: 'Stationery, notebooks, branded packs' },
  { name: 'Digital Printing', icon: Layers, desc: 'Business cards, flyers, reports' },
  { name: 'Vehicle Graphics', icon: Truck, desc: 'Fleet wraps, vehicle decals' },
  { name: 'Event & Exhibition setups', icon: Award, desc: 'Exhibition stands, banners, setups' },
];

function QuotePageContent() {
  const searchParams = useSearchParams();

  // Wizard Steps state
  const [step, setStep] = useState(1);

  // Form fields state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    width: '',
    height: '',
    quantity: '1',
    finish: 'Standard Matte',
    deadline: '',
    description: '',
  });

  const [submitted, setSubmitted] = useState(false);

  // Pre-fill parameters if arriving from the estimator widget
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const qtyParam = searchParams.get('qty');
    const finishParam = searchParams.get('finish');

    if (serviceParam) {
      setForm((f) => ({
        ...f,
        service: serviceParam,
        quantity: qtyParam || '1',
        finish: finishParam || 'Standard Matte',
      }));
      setStep(2); // Skip category selection if already selected
    }
  }, [searchParams]);

  const handleNextStep = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBackStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const isStep1Valid = !!form.service;
  const isStep2Valid = !!form.quantity && (
    (form.service !== 'Large Format Printing' && form.service !== 'Vehicle Graphics') ||
    (!!form.width && !!form.height)
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden pt-20">
      <PublicNav />

      {/* Header */}
      <section className="relative py-16 bg-slate-50/40 border-b border-border/40 overflow-hidden">
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute inset-0 opacity-5" 
          style={{ background: 'radial-gradient(40% 50% at 75% 15%, var(--color-muted-foreground), transparent 85%)' }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FCD20F] text-black px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border border-border/80">
            <Zap size={12} /> Press Estimate &amp; Quotation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Request a Press Run Quote
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base font-medium">
            Specify paper stocks, packaging dimensions, and runs to receive a draft quotation review in 2 hours.
          </p>
        </div>
      </section>

      {/* Wizard Form Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Progress & Trust info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Progress Steps Indicators */}
              <div className="bg-slate-50 border border-border p-6 rounded-2xl space-y-6 shadow-sm">
                <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest">Quote Progress</h3>
                <div className="space-y-4">
                  {[
                    { num: 1, name: 'Select Capability' },
                    { num: 2, name: 'Format Specifications' },
                    { num: 3, name: 'Contact Details' }
                  ].map((s) => (
                    <div key={s.num} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                        step === s.num
                          ? 'border-primary bg-primary text-primary-foreground'
                          : step > s.num
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-border bg-slate-50 text-muted-foreground/60'
                      }`}>
                        {s.num}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        step === s.num ? 'text-foreground' : 'text-muted-foreground/50'
                      }`}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust block */}
              <div className="bg-slate-50 border border-border p-6 rounded-2xl space-y-4 hidden lg:block shadow-sm">
                <h4 className="font-bold text-sm text-foreground">Think Kre8tive Promise</h4>
                <ul className="space-y-3.5 text-xs text-muted-foreground leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <Clock size={13} className="text-foreground mt-0.5 flex-shrink-0" />
                    <span>Response within 2 business hours.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield size={13} className="text-foreground mt-0.5 flex-shrink-0" />
                    <span>Free graphic calibration checks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap size={13} className="text-foreground mt-0.5 flex-shrink-0" />
                    <span>Same-day express print option available.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Active Wizard Form Card */}
            <div className="lg:col-span-8">
              {submitted ? (
                <div className="bg-slate-50 border border-border p-12 rounded-2xl text-center space-y-6 shadow-sm animate-fade-in">
                  <div className="w-20 h-20 bg-emerald-50 border border-emerald-250 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground">Quotation Request Logged!</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      Thank you, {form.name || 'valued partner'}. Your specifications have been parsed.
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-semibold leading-relaxed">
                      Our customer relations lead will review dimensions, compile a draft invoice, and contact you in 2 hours.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setForm({
                          name: '',
                          email: '',
                          phone: '',
                          company: '',
                          service: '',
                          width: '',
                          height: '',
                          quantity: '1',
                          finish: 'Standard Matte',
                          deadline: '',
                          description: '',
                        });
                        setSubmitted(false);
                        setStep(1);
                      }}
                      className="border border-border bg-white hover:bg-muted text-xs font-bold text-foreground px-6 py-3 rounded-lg transition-colors shadow-sm"
                    >
                      Log Another Spec Layout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-border/80 p-6 sm:p-8 rounded-3xl min-h-[400px] flex flex-col justify-between space-y-8 shadow-lg backdrop-blur-md">
                  
                  {/* Step 1: Select Service Category */}
                  {step === 1 && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Select Branding Requirement</h3>
                        <p className="text-xs text-muted-foreground">Pick a primary print layout or structure capability below.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {servicesList.map((s) => {
                          const Icon = s.icon;
                          const isSelected = form.service === s.name;
                          return (
                            <div
                              key={s.name}
                              onClick={() => {
                                setForm({ ...form, service: s.name });
                                setStep(2); // auto advance to details
                              }}
                              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3 hover:translate-y-[-2px] hover:shadow-sm ${
                                isSelected
                                  ? 'bg-[#FCD20F]/10 border-[#FCD20F] text-foreground shadow-sm'
                                  : 'bg-background border-border hover:border-[#D22630]/35'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-[#D22630] text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                              }`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <p className="font-extrabold text-xs text-foreground leading-tight">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold mt-1">{s.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Form Specifications */}
                  {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Branding Specifications</h3>
                        <p className="text-xs text-muted-foreground">Provide dimensions, quantity guidelines, and preferred deadlines.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Size (Only for Large Format and Vehicle) */}
                        {(form.service === 'Large Format Printing' || form.service === 'Vehicle Graphics') && (
                          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 animate-fade-in">
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Width (meters) *</label>
                              <input
                                required
                                type="number"
                                min="0.1"
                                step="0.1"
                                placeholder="e.g. 3.5"
                                value={form.width}
                                onChange={(e) => setForm({ ...form, width: e.target.value })}
                                className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Height (meters) *</label>
                              <input
                                required
                                type="number"
                                min="0.1"
                                step="0.1"
                                placeholder="e.g. 2.0"
                                value={form.height}
                                onChange={(e) => setForm({ ...form, height: e.target.value })}
                                className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold text-center"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quantity guidelines *</label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. 250 units, 1 sticker roll"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Finish coating</label>
                          <select
                            value={form.finish}
                            onChange={(e) => setForm({ ...form, finish: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3 py-3 text-xs outline-none text-foreground font-bold"
                          >
                            <option value="Standard Matte">Standard Matte</option>
                            <option value="Premium Gloss">Premium Gloss</option>
                            <option value="UV Protective Shell">UV Protective Seal</option>
                          </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Target collection deadline</label>
                          <input
                            type="date"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact & Description Details */}
                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Contact & Project Narrative</h3>
                        <p className="text-xs text-muted-foreground">Provide client coordinates and design descriptions.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Full Name *</label>
                          <input
                            required
                            type="text"
                            placeholder="Your name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Email coordinate *</label>
                          <input
                            required
                            type="email"
                            placeholder="you@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Phone Coordinate *</label>
                          <input
                            required
                            type="text"
                            placeholder="+233 24 555 9000"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Company Name</label>
                          <input
                            type="text"
                            placeholder="e.g. ECG Ltd."
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Narrative & special instructions *</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Describe media textures, colors, vector file availability, install site heights..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-3 text-xs outline-none transition-colors text-foreground font-semibold resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Tool bar */}
                  <div className="flex justify-between gap-3 pt-6 border-t border-border">
                    <button
                      type="button"
                      disabled={step === 1}
                      onClick={handleBackStep}
                      className="border border-border bg-white hover:bg-muted text-foreground px-5 py-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    {step < 3 ? (
                      <button
                        type="button"
                        disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                        onClick={handleNextStep}
                        className="bg-[#D22630] hover:opacity-90 text-white font-bold px-6 py-3 rounded-lg text-xs transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        Next Step <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-[#D22630] hover:opacity-90 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all flex items-center gap-1 shadow-md cursor-pointer"
                      >
                        Submit Request <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading Page...</div>}>
      <QuotePageContent />
    </Suspense>
  );
}
