'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { CAROUSEL_SLIDES, EXPERTISE, GALLERY_ITEMS, siteInfo } from '@/data/content';



export default function HomePage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setSlideIndex((prev) => {
          const nextIdx = (prev + 1) % CAROUSEL_SLIDES.length;
          setVisibleIndex(nextIdx);
          return nextIdx;
        });
        setIsTransitioning(false);
      }, 300);
    }, 6000);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSlideIndex((prev) => {
        const nextIdx = (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length;
        setVisibleIndex(nextIdx);
        return nextIdx;
      });
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSlideIndex((prev) => {
        const nextIdx = (prev + 1) % CAROUSEL_SLIDES.length;
        setVisibleIndex(nextIdx);
        return nextIdx;
      });
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleDotClick = useCallback((idx: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSlideIndex(idx);
      setVisibleIndex(idx);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      handleNext();
      resetTimer();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
      resetTimer();
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pt-20 sm:pt-24">
      <PublicNav />

      {/* Hero Section with Full-Width Background Slider */}
      <section 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative overflow-hidden min-h-[580px] h-[calc(100vh-100px)] max-h-[750px] md:h-[680px] flex items-center w-full select-none"
      >
        {/* CSS styles for progress animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progressBarRun {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-progress-bar {
            animation: progressBarRun 6000ms linear forwards;
          }
        `}} />

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
              className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${
                idx === slideIndex ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/30 md:from-black/95 md:via-black/75 md:to-transparent" />
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
          <div className="max-w-2xl backdrop-blur-md bg-black/45 border border-white/10 rounded-3xl p-6 md:p-10 text-white shadow-2xl flex flex-col space-y-4 sm:space-y-6 print-guide-crop">
            
            {/* Transition Container for Dynamic Content */}
            <div className={cn(
              "flex flex-col space-y-4 sm:space-y-6 transition-all duration-300 transform",
              isTransitioning ? "opacity-0 translate-y-2 scale-[0.99]" : "opacity-100 translate-y-0 scale-100"
            )}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-[#FCD20F] text-black font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                  {CAROUSEL_SLIDES[visibleIndex].tag}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#D22630] animate-ping"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCD20F]/90">
                  Print with distinction
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.2] tracking-tight text-white">
                {CAROUSEL_SLIDES[visibleIndex].title}
              </h1>
              
              <p className="max-w-xl text-xs sm:text-base leading-relaxed text-white/85 font-medium">
                {CAROUSEL_SLIDES[visibleIndex].desc}
              </p>

              {/* Progress bar showing duration until next transition */}
              <div className="w-full bg-white/10 h-[3px] overflow-hidden rounded-full mt-1 relative">
                <div 
                  key={slideIndex}
                  className="h-full bg-gradient-to-r from-[#FCD20F] to-[#ffeb85] animate-progress-bar absolute left-0 top-0"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/submit">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold bg-primary hover:bg-primary/90 text-white h-11 px-8 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 cursor-pointer">
                  Submit Print Job <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/services">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold border border-white/20 bg-white/10 hover:bg-white/20 text-white h-11 px-8 rounded-lg transition-colors backdrop-blur-sm cursor-pointer">
                  Explore Services
                </button>
              </Link>
            </div>

            {/* Metric Stats */}
            <div className="mt-6 hidden sm:grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-x-6 pt-6 border-t border-white/10">
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
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Avg. Response Time</div>
              </div>
              <div className="border-l border-white/20 pl-4 transition-transform duration-300 hover:translate-y-[-2px]">
                <div className="text-2xl font-extrabold text-white tracking-tight">100%</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide navigation controls */}
        <button
          onClick={() => {
            handlePrev();
            resetTimer();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn active:scale-95 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronRight size={24} className="rotate-180 group-hover/btn:-translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => {
            handleNext();
            resetTimer();
          }}
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
              onClick={() => {
                handleDotClick(i);
                resetTimer();
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                slideIndex === i ? 'bg-[#FCD20F] w-7' : 'bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>



      {/* Expertise / Services Section (MOVED UP) */}
      <section className="mx-auto max-w-6xl px-4 py-20 relative">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="print-guide-crop p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Our Expertise</p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl text-foreground">
              {siteInfo.heroHeadline}
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
              <Link href="/services" key={item.title} className="group block relative flex flex-col hover:translate-y-[-8px] transition-transform duration-500">
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-border/40 bg-muted/20 shadow-sm group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] group-hover:border-primary/30 transition-all duration-500">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    loading="lazy" 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-white border border-white/10 shadow-lg">
                    <Icon size={11} className="text-[#FCD20F] group-hover:rotate-12 transition-transform" />
                    <span>Printing Press</span>
                  </div>
                </div>
                <div className="mt-5 space-y-2 bg-background p-4 rounded-xl border border-transparent group-hover:border-border/50 transition-colors duration-300">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
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



      {/* How it Works Section (Interactive Restyle) */}
      <section className="py-24 bg-background relative">
        <div className="absolute top-4 left-4 text-muted-foreground/30 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <div className="registration-mark text-muted-foreground/30" />
          <span>Process Flow</span>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Our Process</p>
            <h2 className="text-3xl font-black md:text-4xl text-foreground">From Brief to Brand.</h2>
            <p className="text-sm text-muted-foreground font-medium">Seamless execution from your initial idea to the final installed product.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-border via-primary/20 to-border -translate-y-1/2 z-0" />
            
            {[
              { num: '01', title: 'Share Brief', icon: FileText, desc: 'Upload layouts, print specs, dimensions, and preferred paper stocks via our client portal.' },
              { num: '02', title: 'Design & Proof', icon: Layers, desc: 'Review digital high-res mockups, adjust margins, and run virtual color proofing before press.' },
              { num: '03', title: 'Precision Press', icon: Zap, desc: 'We deploy heavy offset and digital print cylinders with active color density calibrations.' },
              { num: '04', title: 'Secure Dispatch', icon: Package, desc: 'Track delivery from dispatch directly to your Accra, Kumasi, or Takoradi office centers.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border hover:border-primary/50 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 group hover:-translate-y-2 text-center">
                <div className="w-14 h-14 mx-auto bg-slate-50 border border-border rounded-full flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/5">
                  <span className="absolute -top-2 -right-2 font-mono text-[10px] font-black text-foreground bg-secondary px-2 py-0.5 rounded shadow-sm border border-border">{step.num}</span>
                  <step.icon size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consolidated Gallery & Banner (Masonry Grid) */}
      <section className="bg-slate-950 py-24 text-slate-50 border-t border-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Inside the Press</p>
              <h2 className="text-3xl font-black md:text-5xl text-white">
                Crafted by Hand.<br/>Powered by Precision.
              </h2>
            </div>
            <p className="max-w-md text-sm text-slate-400 font-medium leading-relaxed">
              Our printing press plant coordinates multiple Heidelberg offset lines and automated die cutters to ensure maximum speed and razor-sharp clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[200px]">
            {/* Feature Image (Banner Replacement) */}
            <div className="md:col-span-8 md:row-span-2 relative rounded-2xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1616400619175-5ebd3009007a?auto=format&fit=crop&w=1200&q=80" 
                alt="Industrial Printing" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                  Factory Floor
                </span>
                <h3 className="text-2xl font-bold text-white">High-Volume Lithography</h3>
              </div>
            </div>

            {/* Gallery Items */}
            {GALLERY_ITEMS.slice(0, 4).map((item, idx) => (
              <div key={idx} className={`relative rounded-2xl overflow-hidden group ${idx === 0 || idx === 3 ? 'md:col-span-4 md:row-span-2' : 'md:col-span-4 md:row-span-1'}`}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1 block">{item.category}</span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section (Darker, Bolder) */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ background: 'radial-gradient(circle at 70% 30%, var(--color-primary), transparent 60%)' }}
        />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center space-y-8">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 backdrop-blur-sm">
            <Zap size={12} className="text-[#FCD20F]" /> Quick Turnaround
          </span>
          <h2 className="text-4xl font-black leading-tight sm:text-6xl tracking-tight">
            Ready to bring your corporate branding to life?
          </h2>
          <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-white/70 font-medium">
            Receive a detailed estimate sheet within 24 hours. Start your offset press runs, bespoke rigid boxes, or backlit signage projects with Ghana's premier printers.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/submit">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold bg-[#FCD20F] hover:bg-[#FCD20F]/90 text-black h-14 px-10 rounded-xl shadow-[0_0_40px_rgba(252,210,15,0.3)] transition-all hover:translate-y-[-2px] hover:shadow-[0_0_60px_rgba(252,210,15,0.5)] cursor-pointer">
                Start Your Project <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/services">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white h-14 px-10 rounded-xl transition-all backdrop-blur-sm hover:border-white/40">
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
