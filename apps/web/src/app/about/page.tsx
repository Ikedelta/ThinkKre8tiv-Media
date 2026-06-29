'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Award, CheckCircle2 } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const IMG_FACILITY = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
const IMG_DIGITAL = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80';
const IMG_BRANDING = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';



export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden pt-20">
      <PublicNav />

      {/* Page Header */}
      <section className="relative py-16 bg-slate-50/40 border-b border-border/40 overflow-hidden">
        <div className="absolute top-4 left-4 text-muted-foreground/30 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <div className="registration-mark text-muted-foreground/30" />
          <span>Fiducial Align A</span>
        </div>

        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute inset-0 opacity-5" 
          style={{ background: 'radial-gradient(40% 50% at 75% 15%, var(--color-muted-foreground), transparent 85%)' }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 print-guide-crop py-2">
          <div className="inline-flex items-center gap-2 bg-[#FCD20F] text-black px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border border-border/80">
            <Award size={12} /> Established Press House
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            About Our Printing Press
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base font-medium">
            Ghana’s premium high-volume commercial printing press, rigid box fabricator, and fleet graphics agency.
          </p>
        </div>
      </section>

      {/* Story & Collage Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Story */}
            <div className="lg:col-span-6 space-y-6 print-guide-crop p-4">
              <div className="inline-flex items-center gap-2 bg-secondary text-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-border">
                Our Story
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                From a Small Studio to Ghana’s Premier Print Partner
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Established in 2012, Think Kre8tive set out with a simple promise: make high-resolution branding stickers and premium signs accessible to growing Ghanaian businesses.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Today, we run integrated workshops across Accra, Kumasi, and Takoradi. From digital linen cards to towering steel billboards, our fabrication engineers and layout artists build to the highest quality standards.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                We combine heavy industrial equipment with detailed client portals to ensure your print estimates, approvals, and SMS alerts are processed seamlessly.
              </p>
              <div className="pt-2">
                <Link href="/quote">
                  <button className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-bold px-6 py-3 rounded-lg text-xs shadow-sm transition-transform duration-300 hover:translate-y-[-1px]">
                    Partner With Us <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

            {/* Visual Grid Collage */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-2xl overflow-hidden h-60 border border-border shadow-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:border-foreground/30 transition-all duration-300 animate-fade-in">
                <img
                  src={IMG_FACILITY}
                  alt="Think Kre8tive workshop"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-44 border border-border shadow-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:border-foreground/30 transition-all duration-300">
                <img
                  src={IMG_DIGITAL}
                  alt="Industrial printing"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-44 border border-border shadow-sm hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:border-foreground/30 transition-all duration-300">
                <img
                  src={IMG_BRANDING}
                  alt="Corporate branding"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      <PublicFooter />
    </div>
  );
}
