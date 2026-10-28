'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Printer,
  ChevronRight,
  ChevronLeft,
  Layers,
  Sparkles,
  FileText,
  Package,
  Building2,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Quote,
  Target,
  Compass,
  Briefcase
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { cn } from '@/lib/utils';
import { EXPERTISE as DEFAULT_EXPERTISE, GALLERY_ITEMS, siteInfo as DEFAULT_SITEINFO } from '@/data/content';
import { useQuery } from '@tanstack/react-query';

// Corporate Partner Logos with Real World Representation
const PARTNERS = [
  { name: 'Stanbic Bank', category: 'Financial Services', logo: 'STANBIC BANK' },
  { name: 'MTN Ghana', category: 'Telecommunications', logo: 'MTN MEDIA' },
  { name: 'TotalEnergies', category: 'Energy & Petroleum', logo: 'TOTAL ENERGIES' },
  { name: 'Vodafone / Telecel', category: 'Telecom & Tech', logo: 'TELECEL' },
  { name: 'Unilever Ghana', category: 'FMCG & Packaging', logo: 'UNILEVER' },
  { name: 'GCB Bank PLC', category: 'Banking & Finance', logo: 'GCB BANK' },
  { name: 'Nestlé West Africa', category: 'Nutrition & FMCG', logo: 'NESTLÉ' },
  { name: 'FanMilk Ghana', category: 'Retail & Packaging', logo: 'FANMILK' },
  { name: 'Fidelity Bank', category: 'Commercial Banking', logo: 'FIDELITY' },
  { name: 'PwC Ghana', category: 'Professional Services', logo: 'PwC' },
];

// Hero Section Image Carousel Slides
const HERO_SLIDES = [
  {
    src: '/images/1.jpg',
    tag: 'Factory & Offset Plant',
    title: 'Precision Lithography & Packaging',
    desc: 'Operating industrial Heidelberg offset lines across Ghana.'
  },
  {
    src: '/images/2.jpg',
    tag: 'Large Format & Fabrication',
    title: 'Signage & Brand Fabrication',
    desc: 'State-of-the-art wide format printing, 3D acrylic & billboards.'
  },
  {
    src: '/images/3.jpg',
    tag: 'Finishing & Production',
    title: 'Bespoke Packaging & Die-Cutting',
    desc: 'Automated folding, embossing, and luxury presentation boxes.'
  }
];

export default function HomePage() {
  const { data: cmsContent } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      return res.json();
    }
  });

  const heroHeadline = cmsContent?.find((c: any) => c.id === 'hero_headline')?.content || DEFAULT_SITEINFO.heroHeadline;
  const heroSubheadline = cmsContent?.find((c: any) => c.id === 'hero_subheadline')?.content || DEFAULT_SITEINFO.heroSubheadline;
  const ceoName = cmsContent?.find((c: any) => c.id === 'ceo_name')?.content || 'Isaac Asante Darko';
  const ceoTitle = cmsContent?.find((c: any) => c.id === 'ceo_title')?.content || 'Chief Executive Officer & Managing Director';
  const ceoQuote = cmsContent?.find((c: any) => c.id === 'ceo_quote')?.content || 'Every print run is an ambassador of your company’s credibility.';
  const ceoBio = cmsContent?.find((c: any) => c.id === 'ceo_bio')?.content || 'At Think Kre8tiv Media, we founded this enterprise with one non-negotiable principle: zero compromise on substrate weight, Pantone precision, and delivery deadlines. We have invested heavily in high-output presses, ERP inventory management, and computerized die-cutting so Ghanaian corporations never have to import printed collateral from abroad.';
  const ceoImage = cmsContent?.find((c: any) => c.id === 'ceo_image')?.content || '/images/CEO.jpg';
  const partnersText = cmsContent?.find((c: any) => c.id === 'partners_text')?.content || 'Trusted by Industry Leaders Across West Africa';

  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  let expertise = DEFAULT_EXPERTISE;
  const dbExpertise = cmsContent?.filter((c: any) => c.section === 'expertise' && c.is_active);
  if (dbExpertise && dbExpertise.length > 0) {
    expertise = dbExpertise.sort((a:any,b:any) => a.sort_order - b.sort_order).map((c:any, i:number) => ({
      title: c.title,
      desc: c.content,
      image: c.image_url,
      icon: DEFAULT_EXPERTISE[i % DEFAULT_EXPERTISE.length].icon
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden pt-14 sm:pt-16 font-sans">
      <PublicNav />

      {/* =========================================================================
          SECTION 1: HERO SECTION (CLEAN, BESPOKE CORPORATE PALETTE)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 py-10 sm:py-14 lg:py-16">
        
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Mission & Strategic Action */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D22630]" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 tracking-wider text-[10px] uppercase">
                  Commercial Printing &amp; Brand Fabrication
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.2]">
                {heroHeadline}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl">
                {heroSubheadline}
              </p>

              {/* Call to Actions with Brand Vibrant Colors */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/submit">
                  <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#D22630] hover:bg-[#b81d26] text-white h-9 px-4.5 rounded-md shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    Submit Print Job <ArrowRight size={13} />
                  </button>
                </Link>
                <Link href="/services">
                  <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 h-9 px-4 rounded-md transition-all shadow-xs cursor-pointer">
                    Explore Capabilities
                  </button>
                </Link>
              </div>

              {/* Business Highlights Strip with Clean Monochromatic Figures */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">14+</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Years Established</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">1,200+</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Corporate Clients</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">&lt; 24h</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Fast Pre-Press Proofs</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">100%</div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Quality Assurance</div>
                </div>
              </div>
            </div>

            {/* Right Column: Sliding Hero Carousel */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[4/3] group select-none">
                {/* Slides with Crossfade Animation */}
                {HERO_SLIDES.map((slide, idx) => (
                  <div
                    key={slide.src}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-700 ease-in-out',
                      idx === heroSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    )}
                  >
                    <img
                      src={slide.src}
                      alt={slide.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5 z-20">
                      <span className="inline-block px-2.5 py-1 rounded bg-[#D22630] text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        {slide.tag}
                      </span>
                      <h3 className="text-lg font-bold text-white leading-tight">{slide.title}</h3>
                      <p className="text-xs text-slate-200 font-normal leading-relaxed">{slide.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Left / Right Carousel Navigation Buttons */}
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => setHeroSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer border border-white/10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer border border-white/10"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Interactive Carousel Pagination Indicators */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-xs px-2.5 py-1.5 rounded-full border border-white/10">
                  {HERO_SLIDES.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      aria-label={`Go to slide ${dotIdx + 1}`}
                      onClick={() => setHeroSlideIndex(dotIdx)}
                      className={cn(
                        'transition-all duration-300 rounded-full cursor-pointer',
                        dotIdx === heroSlideIndex
                          ? 'w-5 h-1.5 bg-[#D22630]'
                          : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Quality Badge with Clean Slate Border */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xl items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold shadow-sm">
                  <Printer size={20} className="text-[#D22630]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">ISO Standard Output</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Strict CMYK Density Calibrations</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: TRUSTED PARTNERS & CLIENTS (INFINITE SLIDING MARQUEE)
          ========================================================================= */}
      <section className="py-12 bg-white dark:bg-slate-950 border-b border-slate-200/70 dark:border-slate-800/80 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Trusted by Industry Leaders Across West Africa
              </p>
            </div>
            <p className="text-xs text-slate-400 font-medium">Over 1,200+ Corporate Brands &amp; Multinationals</p>
          </div>
        </div>

        {/* Continuous Logo Marquee Track */}
        <div className="relative w-full overflow-hidden py-3">
          {/* Gradient fade edge masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-8 sm:gap-14">
            {/* Duplicated list to create infinite seamless loop */}
            {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm shrink-0 group cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors">
                  {partner.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-wider text-slate-800 dark:text-slate-200 uppercase group-hover:text-primary transition-colors">
                    {partner.logo}
                  </h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{partner.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WHO WE ARE (EXECUTIVE CORPORATE FOUNDATION)
          ========================================================================= */}
      <section className="py-14 lg:py-18 bg-slate-50/60 dark:bg-slate-900/30 border-b border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider mb-2.5">
              <Compass size={12} className="text-primary" /> Corporate Identity &amp; Infrastructure
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Who We Are: Ghana’s Standard in Commercial Printing.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed font-normal">
              Think Kre8tiv Media is an industrial print manufacturing and corporate branding powerhouse. From high-speed Heidelberg offset printing to architectural signage and structural packaging boxes, we combine German print engineering with African ingenuity.
            </p>
          </div>

          {/* 3 Core Pillars Grid with High-Resolution Visual Imagery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            
            {/* Pillar 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"
                  alt="Industrial Offset Lithography Press"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D22630]">
                    Offset Press
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">15,000 sph</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Printer size={16} className="text-[#D22630]" />
                    Industrial Lithography
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Equipped with Heidelberg offset multi-color lines delivering spectrophotometric color precision and sharp registration.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Annual Reports &amp; Hardcover Books</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Rigid Boxes &amp; FMCG Cartons</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80"
                  alt="3D Channel Signage Fabrication"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900">
                    Signage &amp; Build
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">Architectural</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    Signage &amp; Fabrication
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    In-house CNC routing, laser welding, and LED illumination labs for towering 3D architectural signage and retail environments.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Illuminated Stainless Channel Letters</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Nationwide Corporate Fleet Wraps</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
                  alt="Quality Assurance and Calibration Lab"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-700">
                    QA Certified
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200">ISO Accuracy</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    Certified Pre-Press &amp; QA
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Integrated digital proofing, spectrophotometer calibration, computerized tracking, and automated dispatch alerts.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>24-Hour Proof Turnaround Guarantee</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Itemized Invoicing &amp; VAT Receipts</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Infrastructure Collage Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="md:col-span-8 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Strategic Advantage</span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                Turnkey Print Production Under One Single Roof.
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-normal">
                Eliminate middle-man markups and scheduling delays. We control your job from initial prepress file inspection, direct plate imaging (CTP), automated printing, die-cutting, to white-glove corporate delivery.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <Link href="/about">
                <button className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 h-11 px-6 rounded-md shadow-sm transition-all">
                  Read Corporate Story <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: LEADERSHIP & CEO STATEMENT
          ========================================================================= */}
      <section className="py-14 lg:py-18 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* CEO Portrait Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-[4/5] max-w-sm mx-auto lg:max-w-none group">
                <img
                  src={ceoImage}
                  alt={ceoName}
                  className="w-full h-full object-cover contrast-105 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-0.5">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#D22630] text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                    Leadership &amp; Governance
                  </span>
                  <h3 className="text-base font-extrabold text-white">{ceoName}</h3>
                  <p className="text-[11px] text-slate-300 font-medium">{ceoTitle}</p>
                </div>
              </div>

              {/* Floating Leadership Badge with Slate / Corporate Accent */}
              <div className="hidden sm:flex absolute -bottom-4 -right-4 bg-slate-900 text-white border border-slate-800 rounded-lg p-3.5 shadow-lg items-center gap-2.5 max-w-[240px]">
                <div className="w-8 h-8 rounded-md bg-slate-800 text-[#D22630] border border-slate-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Award size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">14+ Years at the Helm</p>
                  <p className="text-[10px] text-slate-400">Pioneering Commercial Print Tech</p>
                </div>
              </div>
            </div>

            {/* CEO Statement & Philosophy */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800">
                <Quote size={11} className="text-[#D22630]" /> Executive Message
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
                &ldquo;{ceoQuote}&rdquo;
              </h2>

              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                <p>
                  {ceoBio}
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D22630]" />
                  Our promise to every enterprise partner is simple: meticulous quality, transparent accounting, and unwavering execution.
                </p>
              </div>

              {/* CEO Signature Block */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ceoName}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{ceoTitle}</p>
                </div>
                <Link href="/contact">
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-9 px-4 rounded-md shadow-xs transition-all cursor-pointer">
                    Schedule Executive Consultation <ArrowRight size={12} />
                  </button>
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: CORE EXPERTISE & CAPABILITIES
          ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Core Capabilities</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {heroHeadline}
            </h2>
          </div>
          <Link href="/services" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5">
            View all capabilities <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid gap-7 md:grid-cols-3">
          {expertise.map((item) => {
            const Icon = item.icon;
            return (
              <Link href="/services" key={item.title} className="group block relative flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    loading="lazy" 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white border border-white/10 shadow-sm">
                    <Icon size={12} className="text-primary" />
                    <span>Commercial Division</span>
                  </div>
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-normal">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                    Explore Solution <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: HOW IT WORKS (STRUCTURED OPERATING PROCEDURE)
          ========================================================================= */}
      <section className="py-14 sm:py-16 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Standard Operating Procedure</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Structured Production Pipeline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Strict quality assurance milestones from project initiation to delivery.</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 relative">
            {[
              { num: '01', title: 'Brief Submission', icon: FileText, desc: 'Submit technical specs, substrates, pantone references, and artwork files.' },
              { num: '02', title: 'Pre-Press Proof', icon: Layers, desc: 'Digital soft-proofing and color density review for zero discrepancy.' },
              { num: '03', title: 'Industrial Run', icon: Zap, desc: 'High-speed automated offset lithography with active quality control.' },
              { num: '04', title: 'Inspected Dispatch', icon: Package, desc: 'Packaged in humidity-sealed containers and dispatched to your corporate hub.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                    <step.icon size={15} />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">{step.num}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: GALLERY SHOWCASE (INSIDE THE PRESS)
          ========================================================================= */}
      <section className="bg-slate-950 py-16 text-slate-50 border-t border-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="mb-8 flex flex-col md:flex-row items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Inside the Press</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Crafted by Hand.<br/>Powered by Precision.
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
              Our printing press plant coordinates multiple Heidelberg offset lines and automated die cutters to ensure maximum speed and razor-sharp clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 auto-rows-[160px]">
            {/* Feature Image */}
            <div className="md:col-span-8 md:row-span-2 relative rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1616400619175-5ebd3009007a?auto=format&fit=crop&w=1200&q=80" 
                alt="Industrial Printing" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                  Factory Floor
                </span>
                <h3 className="text-lg font-bold text-white">High-Volume Lithography</h3>
              </div>
            </div>

            {/* Gallery Items */}
            {GALLERY_ITEMS.slice(0, 4).map((item, idx) => (
              <div key={idx} className={`relative rounded-xl overflow-hidden group ${idx === 0 || idx === 3 ? 'md:col-span-4 md:row-span-2' : 'md:col-span-4 md:row-span-1'}`}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-primary mb-0.5 block">{item.category}</span>
                  <h3 className="text-xs font-bold text-white">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: CALL TO ACTION
          ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20 text-white">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ background: 'radial-gradient(circle at 70% 30%, var(--color-primary), transparent 60%)' }}
        />
        
        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20 backdrop-blur-sm">
            <Zap size={11} className="text-[#FCD20F]" /> Quick Turnaround
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            Ready to bring your corporate branding to life?
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-white/70 font-normal">
            Receive a detailed estimate sheet within 24 hours. Start your offset press runs, bespoke rigid boxes, or backlit signage projects with Ghana's premier printers.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/submit">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider bg-[#FCD20F] hover:bg-[#FCD20F]/90 text-black h-10 px-6 rounded-md shadow-xs transition-all hover:translate-y-[-1px] cursor-pointer">
                Start Your Project <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/services">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/10 text-white h-10 px-5 rounded-md transition-all backdrop-blur-sm hover:border-white/40">
                View Estimates
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
