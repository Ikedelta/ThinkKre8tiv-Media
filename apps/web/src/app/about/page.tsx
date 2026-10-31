'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Award, CheckCircle2, Factory, Printer, Users, Target, Clock, Sparkles } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

import { useQuery } from '@tanstack/react-query';

const IMG_FACILITY = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
const IMG_DIGITAL = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80';
const IMG_BRANDING = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';



export default function AboutPage() {
  const { data: cmsContent } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms', { cache: 'no-store' });
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const aboutTitle = cmsContent?.find((c: any) => c.section === 'about' && c.id === 'about_title')?.content || "From a Small Studio to Ghana’s Premier Print Partner";
  const aboutP1 = cmsContent?.find((c: any) => c.section === 'about' && c.id === 'about_p1')?.content || "Established in 2012, Think Kre8tiv Media set out with a simple promise: make high-resolution branding stickers and premium signs accessible to growing Ghanaian businesses.";
  const aboutP2 = cmsContent?.find((c: any) => c.section === 'about' && c.id === 'about_p2')?.content || "Today, we run our integrated fabrication and print facilities in Accra. From digital linen cards to towering steel billboards, our fabrication engineers and layout artists build to the highest quality standards.";
  const aboutP3 = cmsContent?.find((c: any) => c.section === 'about' && c.id === 'about_p3')?.content || "We combine heavy industrial equipment with detailed client portals to ensure your print estimates, approvals, and SMS alerts are processed seamlessly.";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />

      {/* Page Header */}
      <section className="relative py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary text-white px-3.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider shadow-sm">
            <Award size={13} /> Corporate Profile
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            About Think Kre8tiv Media
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-normal leading-relaxed">
            Leading industrial commercial printing press, rigid packaging fabrication facility, and fleet branding partner in West Africa.
          </p>
        </div>
      </section>

      {/* Story & Collage Grid */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-center">
            {/* Story */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                Corporate Heritage
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {aboutTitle}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {aboutP1}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {aboutP2}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {aboutP3}
              </p>
              <div className="pt-2">
                <Link href="/contact">
                  <button className="inline-flex items-center gap-2 bg-[#D22630] hover:bg-[#b81d26] text-white font-semibold px-6 py-2.5 rounded-md text-xs uppercase tracking-wider shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer">
                    Partner With Us <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>

            {/* Visual Grid Collage with Real Workshop Photos */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 rounded-2xl overflow-hidden h-64 border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img
                  src="/images/1.jpg"
                  alt="Think Kre8tiv Media workshop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-48 border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img
                  src="/images/2.jpg"
                  alt="Corporate apparel & uniforms"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-48 border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img
                  src="/images/3.jpg"
                  alt="Packaging & corporate gifting"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values & Pillars Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} /> Our Core Foundation
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Crafted with Precision. Delivered with Integrity.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Every print run and fabricated installation embodies the highest standards of industrial precision, color accuracy, and business reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-primary flex items-center justify-center font-bold">
                <Factory size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Heidelberg Offset Presses</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                High-capacity industrial machinery ensuring laser-sharp registration, pantone matching, and rapid turnarounds for corporate volumes.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strict Quality Assurance</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Multi-stage pre-press checks, material density inspection, and precision finishing protect your brand reputation on every batch.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Real-Time Client Portals</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Transparent billing, instant SMS updates, live receipt verification, and automated workflows from estimate approval to dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Statistics Banner */}
      <section className="py-16 bg-[#001F3F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-amber-300">12+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">Years in Operation</p>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-white">5,000+</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">Projects Completed</p>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-amber-300">99.8%</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">On-Time Turnaround</p>
            </div>
            <div className="space-y-1 pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-white">100%</p>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">Accra Factory Output</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
