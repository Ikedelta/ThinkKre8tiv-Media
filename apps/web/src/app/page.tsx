'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  Printer,
  ChevronRight,
  Layers,
  Sparkles,
  FileText,
  Package,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const CAROUSEL_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    title: 'Precision Offset Printing',
    desc: 'High-volume commercial catalog presses delivering crisp ink layers and immaculate resolution.',
    tag: 'Bulk Production',
  },
  {
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    title: 'Bespoke Custom Packaging',
    desc: 'Premium rigid boxes, product sleeves, and luxury shopping bags crafted to build brand authority.',
    tag: 'Packaging Design',
  },
  {
    image: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&w=800&q=80',
    title: 'Luxury Business Cards',
    desc: 'Heavy stock cotton paper with debossed corporate textures and crisp finishes.',
    tag: 'Foil Stamping',
  },
  {
    image: 'https://images.unsplash.com/photo-1524295988897-55de7edd2674?auto=format&fit=crop&w=800&q=80',
    title: 'Corporate Merchandising',
    desc: 'Embroidery and silk-screened executive wear, custom stationery, and branded corporate gifts.',
    tag: 'Brand Merch',
  },
  {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    title: 'Large Format Signage',
    desc: 'Durable weather-resistant roll-ups, outdoor banners, and backlit storefront signage.',
    tag: 'Outdoor Media',
  },
];

const EXPERTISE = [
  {
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    icon: Printer,
    title: 'Corporate Printing & Stationery',
    desc: 'High-volume letterheads, brochures, presentation folders, and bespoke corporate cards matching your exact brand manual colors.',
  },
  {
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    icon: Layers,
    title: 'Commercial Packaging',
    desc: 'High-quality product packaging boxes, food-grade cartons, paper bags, and customized adhesive labeling for retail products.',
  },
  {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    icon: Sparkles,
    title: 'Large Format & Signage',
    desc: 'Illuminated 3D acrylic signs, vinyl vehicle branding wraps, promotional roll-up banners, and building storefront signage.',
  },
];

const GALLERY_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80',
    category: 'Equipment',
    title: 'Offset Press Calibration',
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    category: 'Collateral',
    title: 'Premium Catalog Runs',
  },
  {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    category: 'Production',
    title: 'Wide-Format Signage',
  },
  {
    image: 'https://images.unsplash.com/photo-1524295988897-55de7edd2674?auto=format&fit=crop&w=400&q=80',
    category: 'Branding',
    title: 'Custom Branded Swag',
  },
  {
    image: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&w=400&q=80',
    category: 'Finishing',
    title: 'Luxury Foil Business Cards',
  },
  {
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    category: 'Textile',
    title: 'Silk-Screen Printing',
  },
  {
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
    category: 'Creative',
    title: 'Bespoke Brand Layouts',
  },
  {
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    category: 'Finishing',
    title: 'Precision Die Cutting',
  },
];

export default function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pt-20">
      <PublicNav />

      {/* Hero Section with Full-Width Background Slider */}
      <section className="relative overflow-hidden border-b border-border/40 min-h-[600px] md:h-[680px] flex items-center w-full">
        {/* Carousel Background Images with Ken Burns Crossfade */}
        {CAROUSEL_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === slideIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-full h-full object-cover transition-transform duration-[4500ms] ease-out ${
                idx === slideIndex ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/80 md:bg-black/45" />
          </div>
        ))}

        {/* Background print target elements */}
        <div className="absolute top-4 left-4 z-10 text-white/40 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <div className="registration-mark border-white/40 text-white/40" />
          <span>Fiducial Align A</span>
        </div>
        <div className="absolute top-4 right-4 z-10 text-white/40 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <span>Fiducial Align B</span>
          <div className="registration-mark border-white/40 text-white/40" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 flex items-center">
          <div className="max-w-2xl backdrop-blur-md bg-black/45 border border-white/10 rounded-3xl p-6 md:p-10 text-white shadow-2xl flex flex-col space-y-6 print-guide-crop">
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-[#FCD20F] text-black font-extrabold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                COMMERCIAL PRINTING PRESS
              </span>
              <span className="h-2 w-2 rounded-full bg-[#D22630] animate-ping"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                Active Production
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight text-white">
              Corporate &amp; Commercial Print with <span className="bg-gradient-to-r from-[#FCD20F] via-white to-[#FCD20F] bg-clip-text text-transparent font-black">distinction.</span>
            </h1>
            
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-white/85 font-medium">
              Ghana's premier commercial printing press. We deliver premium business stationery, custom packaging carton boxes, large format signs, and luxury brand merchandise with Heidelberg-level clarity.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/quote">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold bg-primary hover:bg-primary/90 text-white h-11 px-8 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 cursor-pointer">
                  Request a Quote <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/services">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold border border-white/20 bg-white/10 hover:bg-white/20 text-white h-11 px-8 rounded-lg transition-colors backdrop-blur-sm cursor-pointer">
                  Explore Services
                </button>
              </Link>
            </div>

            {/* Metric Stats */}
            <div className="mt-8 grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-x-6 pt-6 border-t border-white/10">
              <div className="border-l border-white/20 pl-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="text-2xl font-extrabold text-white tracking-tight">14+</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Years crafting</div>
              </div>
              <div className="border-l border-white/20 pl-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="text-2xl font-extrabold text-white tracking-tight">1,200+</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Brands served</div>
              </div>
              <div className="border-l border-white/20 pl-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="text-2xl font-extrabold text-white tracking-tight">24h</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Avg. quote time</div>
              </div>
              <div className="border-l border-white/20 pl-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="text-2xl font-extrabold text-white tracking-tight">100%</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Slide Info Floating Card */}
        <div className="absolute bottom-6 right-6 z-20 hidden md:block max-w-xs bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white transition-all duration-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCD20F] px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider text-black">
            {CAROUSEL_SLIDES[slideIndex].tag}
          </span>
          <h3 className="mt-2 text-sm font-bold text-white">
            {CAROUSEL_SLIDES[slideIndex].title}
          </h3>
          <p className="mt-1 text-[10px] text-white/80 leading-snug line-clamp-2">
            {CAROUSEL_SLIDES[slideIndex].desc}
          </p>
        </div>

        {/* Slide navigation controls */}
        <button
          onClick={() => setSlideIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn active:scale-95 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronRight size={24} className="rotate-180 group-hover/btn:-translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => setSlideIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn active:scale-95 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight size={24} className="group-hover/btn:translate-x-0.5 transition-transform" />
        </button>

        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                slideIndex === i ? 'bg-[#FCD20F] w-6' : 'bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Expertise / Services Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 relative">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="print-guide-crop p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Our Expertise</p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl text-foreground">
              Premium Corporate &amp; Commercial Printing.
            </h2>
          </div>
          <Link href="/services" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:opacity-85 transition-opacity flex items-center gap-1">
            View all services <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {EXPERTISE.map((item) => {
            const Icon = item.icon;
            return (
              <Link href="/services" key={item.title} className="group block relative flex flex-col hover:translate-y-[-4px] transition-transform duration-300">
                <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-border/40 bg-muted/20 shadow-sm group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.08)] group-hover:border-foreground/30 transition-all duration-300">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    loading="lazy" 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white border border-white/10">
                    <Icon size={11} className="text-[#FCD20F] group-hover:rotate-12 transition-transform" />
                    <span>Printing Press</span>
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-muted-foreground transition-colors flex items-center gap-1.5">
                    {item.title}
                    <ArrowRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-foreground" />
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mid-Page Industrial lithography Banner */}
      <section className="relative h-72 md:h-96 w-full overflow-hidden border-y border-border/45">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" 
          alt="Heavy printing press machinery and ink rollers"
          className="w-full h-full object-cover select-none pointer-events-none opacity-85"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-lg space-y-4 backdrop-blur-md bg-black/45 border border-white/10 p-6 md:p-8 rounded-2xl text-white shadow-2xl print-guide-crop">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D22630] px-3 py-1 text-[9px] uppercase font-extrabold tracking-wider text-white">
                FACTORY FLOOR & PRINT SHOP
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                High-Volume Lithography &amp; Precision Binding
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                Our printing press plant coordinates multiple Heidelberg offset lines and automated die cutters to ensure maximum speed and razor-sharp clarity for commercial catalogs, bulk booklets, and folding cartons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="border-b border-border/40 bg-slate-50/40 py-20 relative">
        {/* Background print guides details */}
        <div className="absolute bottom-4 left-4 text-muted-foreground/30 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <div className="registration-mark text-muted-foreground/30" />
          <span>Fiducial Align C</span>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Our Process</p>
          <h2 className="mt-2 text-3xl font-black md:text-4xl text-foreground">From Brief to Brand.</h2>
          
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border/20 md:grid-cols-4 shadow-sm">
            
            <div className="bg-background p-8 flex flex-col justify-between min-h-[220px] group hover:bg-slate-50/25 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded">01</span>
                <FileText size={16} className="text-muted-foreground/40 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-8">
                <h3 className="text-base font-bold text-foreground">Share Brief</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Upload layouts, print specs, dimensions, and preferred paper stocks via our client portal.
                </p>
              </div>
            </div>

            <div className="bg-background p-8 flex flex-col justify-between min-h-[220px] group hover:bg-slate-50/25 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded">02</span>
                <Layers size={16} className="text-muted-foreground/40 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-8">
                <h3 className="text-base font-bold text-foreground">Design &amp; Proof</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Review digital high-res mockups, adjust margins, and run virtual color proofing before press.
                </p>
              </div>
            </div>

            <div className="bg-background p-8 flex flex-col justify-between min-h-[220px] group hover:bg-slate-50/25 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded">03</span>
                <Zap size={16} className="text-muted-foreground/40 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-8">
                <h3 className="text-base font-bold text-foreground">Precision Press</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  We deploy heavy offset and digital print cylinders with active color density calibrations.
                </p>
              </div>
            </div>

            <div className="bg-background p-8 flex flex-col justify-between min-h-[220px] group hover:bg-slate-50/25 transition-all duration-300">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded">04</span>
                <Package size={16} className="text-muted-foreground/40 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <div className="mt-8">
                <h3 className="text-base font-bold text-foreground">Secure Dispatch</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Track delivery from dispatch directly to your Accra, Kumasi, or Takoradi office centers.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Equipment & Finishing Showcase Gallery */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div className="print-guide-crop p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Inside the Press</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl text-foreground">
                Crafted by Hand. Powered by Precision.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {GALLERY_ITEMS.map((item, idx) => (
              <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border/40 bg-muted/20 shadow-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:border-foreground/30 transition-all duration-300 cursor-pointer">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  loading="lazy" 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/50">{item.category}</span>
                  <span className="text-xs font-bold text-white mt-1 leading-snug">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative overflow-hidden border-t border-border bg-slate-50 py-20">
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute inset-0 opacity-5" 
          style={{ background: 'radial-gradient(ellipse at 80% 20%, var(--color-muted-foreground), transparent 60%)' }}
        />
        
        <div className="relative mx-auto max-w-6xl px-4 flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Get Started</span>
            <h2 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">
              Ready to bring your corporate branding to life?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground font-medium">
              Receive a detailed estimate sheet within 24 hours. Start your offset press runs, bespoke rigid boxes, or backlit signage projects with Ghana's premier printers.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/quote">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-lg">
                Start a Request <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/services">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold border border-border bg-white hover:bg-muted dark:bg-transparent dark:hover:bg-white/5 h-11 px-8 rounded-lg transition-colors">
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
