'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Layers,
  Palette,
  ArrowRight,
  CheckCircle2,
  Truck,
  Award,
  Sparkles,
  ChevronRight,
  Zap,
  Calculator,
  Info,
  Gift,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { SERVICES_LIST as servicesList, PROJECTS_LIST as projectsList } from '@/data/content';

export default function ServicesPage() {

  // Expanded portfolio items per service drawer state
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const toggleProjects = (title: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };


  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden pt-20">
      <PublicNav />

      {/* Header */}
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
            <Sparkles size={12} /> Printing Press &amp; Production Workshop
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Printing Services &amp; Capabilities
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base font-medium">
            Professional high-speed offset runs, rigid product packaging, illuminated 3D signage, and fleet branding wrap services.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicesList.map((service, i) => {
              const isDrawerOpen = !!expandedServices[service.title];
              const associatedProjects = projectsList.filter((p) => p.category === service.title);
              
              return (
                <div
                  key={i}
                  className="group bg-background border border-border hover:border-foreground/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    {service.tag && (
                      <span
                        className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${service.tagColor}`}
                      >
                        {service.tag}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl flex items-center justify-center border border-border shadow-sm">
                      <service.icon size={18} className="text-foreground" />
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <h3 className="font-bold text-xl text-foreground tracking-tight">{service.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 font-medium">
                      {service.description}
                    </p>
                    <ul className="space-y-2 pt-2">
                      {service.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold"
                        >
                          <CheckCircle2 size={13} className="text-foreground flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>

                    {/* Integrated Case Studies Drawer */}
                    {associatedProjects.length > 0 && (
                      <div className="mt-2 pt-4 border-t border-border">
                        <button
                          onClick={() => toggleProjects(service.title)}
                          className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                        >
                          <span>{isDrawerOpen ? 'Hide Case Studies' : `View Recent Work (${associatedProjects.length})`}</span>
                          <ChevronRight size={13} className={`transform transition-transform duration-300 ${isDrawerOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {isDrawerOpen && (
                          <div className="mt-3 space-y-3.5 animate-fade-in">
                            {associatedProjects.map((proj) => (
                              <div key={proj.title} className="bg-slate-50/50 dark:bg-slate-900/10 p-3.5 rounded-xl border border-border space-y-2.5">
                                <div className="relative h-28 w-full rounded-lg overflow-hidden border border-border">
                                    <img src={proj.image} alt={proj.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-foreground leading-tight">{proj.title}</h4>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{proj.desc}</p>
                                </div>
                                <div className="text-[9px] bg-background border border-border rounded-lg p-2.5 text-muted-foreground leading-relaxed space-y-1 font-medium shadow-sm">
                                  <div><span className="font-bold text-foreground">Dimensions:</span> {proj.specs.size}</div>
                                  <div><span className="font-bold text-foreground">Media Stock:</span> {proj.specs.media}</div>
                                  <div><span className="font-bold text-foreground">Speed:</span> {proj.specs.speed}</div>
                                </div>
                                <div className="border-t border-border pt-2 italic text-[10px] text-muted-foreground leading-relaxed font-medium">
                                  "{proj.review}"
                                  <span className="font-bold not-italic block mt-1 text-foreground text-[9px] uppercase tracking-wider">— {proj.client}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <Link
                        href={`/quote?service=${encodeURIComponent(service.title)}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-muted-foreground transition-colors uppercase tracking-wider"
                      >
                        Book Order <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* CTA Banner */}
      <section className="py-20 bg-background text-center border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 bg-secondary text-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-border">
            <Zap size={12} /> Quick Turnaround
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-foreground">
            Have custom design templates ready?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base font-medium">
            Submit your graphics and layout variables to request a prompt project layout draft.
          </p>
          <div className="pt-4">
            <Link href="/quote">
              <button className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-bold px-8 py-3.5 rounded-lg text-sm shadow-sm transition-all hover:translate-y-[-1px]">
                Start Project Request <ChevronRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
