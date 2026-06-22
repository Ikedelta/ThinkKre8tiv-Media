'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Award, CheckCircle2 } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const IMG_FACILITY = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
const IMG_DIGITAL = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80';
const IMG_BRANDING = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

const values = [
  {
    icon: Zap,
    title: 'Fast Turnaround',
    desc: 'Express offset setups and quick large-format print runs. We match your corporate timeline constraints.',
  },
  {
    icon: Shield,
    title: 'Guaranteed Quality',
    desc: 'Strict quality control checkpoints from initial digital proof to final ink density calibration.',
  },
  {
    icon: Award,
    title: 'Award-Winning Build',
    desc: 'Recognized for high-precision print production and structural signage wraps in Ghana.',
  },
  {
    icon: CheckCircle2,
    title: '100% Reliable',
    desc: 'Trusted by top banking sectors, retail malls, and delivery fleets across West Africa.',
  },
];

const timelineSteps = [
  {
    year: '2012',
    title: 'Humble Roots in Accra',
    desc: 'Founded with a single 1.6m wide-format latex printer and a commitment to quality print layouts.'
  },
  {
    year: '2017',
    title: 'Expanding to Kumasi',
    desc: 'Opened our second production hub in Kumasi and introduced full fleet cast wrap graphic services.'
  },
  {
    year: '2022',
    title: '3D Signage Metal Fabrication',
    desc: 'Opened a dedicated fabrication workshop in Takoradi, producing heavy LED-illuminated storefront signs.'
  },
  {
    year: '2026',
    title: 'Enterprise Billing & SMS Automation',
    desc: 'Digitized workflow with automated draft requests, SMS order triggers, and high-reach client portals.'
  }
];

const teamList = [
  {
    name: 'Emmanuel Kye',
    role: 'Founder & CEO',
    desc: '20+ years of media expertise, dedicated to high-precision print production.',
    initial: 'E'
  },
  {
    name: 'Abena Fordjour',
    role: 'Creative Director',
    desc: 'Leads branding setups, structural 3D sign designs, and color calibrations.',
    initial: 'A'
  },
  {
    name: 'Kwame Asare',
    role: 'Head of Fabrication',
    desc: 'Manages CNC milling, metal wrap structures, and LED module wiring.',
    initial: 'K'
  },
  {
    name: 'Akosua Mensa',
    role: 'Client Partnerships',
    desc: 'Oversees enterprise orders, payment drafts, and dispatch tracking.',
    initial: 'A'
  }
];

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

      {/* Growth Timeline */}
      <section className="py-24 bg-slate-50/40 border-y border-border/40 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3 print-guide-crop p-3">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Growth Milestones</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Our Journey</h2>
          </div>
          
          <div className="relative border-l border-border/80 ml-4 md:ml-32 space-y-12">
            {timelineSteps.map((step, i) => (
              <div key={i} className="relative pl-8 md:pl-12 group">
                <div className="absolute left-[-16px] md:left-[-124px] top-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-black z-10 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <span className="hidden md:inline md:absolute md:right-10 text-muted-foreground text-sm font-black">{step.year}</span>
                </div>
                <div className="bg-background border border-border group-hover:border-primary/30 group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.06)] p-6 rounded-2xl transition-all shadow-sm">
                  <span className="inline-block md:hidden text-xs font-black text-muted-foreground mb-1">{step.year}</span>
                  <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3 print-guide-crop p-3">
            <h2 className="text-3xl font-black text-foreground">Our Core Commitments</h2>
            <p className="text-muted-foreground text-sm font-medium max-w-xl mx-auto">
              The operational rules we follow for every layout proof and installation task.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-slate-50/20 border border-border hover:border-foreground/30 p-6 rounded-2xl hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center mb-4 group-hover:-translate-y-0.5 transition-transform duration-300">
                  <Icon size={20} className="text-foreground" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20 bg-slate-50/20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3 print-guide-crop p-3">
            <h2 className="text-3xl font-black text-foreground">Our Leaders</h2>
            <p className="text-muted-foreground text-sm font-medium">The experts behind every project delivery.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamList.map(({ name, role, desc, initial }) => (
              <div
                key={name}
                className="bg-background border border-border p-6 rounded-2xl hover:border-foreground/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:translate-y-[-2px] transition-all duration-300 text-center space-y-3 shadow-sm group"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-primary-foreground text-xl font-black shadow-sm group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{name}</h3>
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {role}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
