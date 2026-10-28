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

import { useQuery } from '@tanstack/react-query';

export default function ServicesPage() {

  // Expanded portfolio items per service drawer state
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const toggleProjects = (title: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const { data: cmsContent } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await fetch('/api/cms');
      return res.json();
    }
  });

  let displayServices = servicesList;
  const dbServices = cmsContent?.filter((c: any) => c.section === 'services' && c.is_active);
  if (dbServices && dbServices.length > 0) {
    displayServices = dbServices.sort((a:any, b:any) => a.sort_order - b.sort_order).map((c:any, i:number) => ({
      title: c.title,
      description: c.content,
      image: c.image_url || servicesList[i % servicesList.length].image,
      icon: servicesList[i % servicesList.length].icon,
      tag: servicesList[i % servicesList.length].tag,
      tagColor: servicesList[i % servicesList.length].tagColor,
      features: servicesList[i % servicesList.length].features,
    }));
  }


  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />

      {/* Header */}
      <section className="relative py-16 sm:py-20 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary text-white px-3.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider shadow-sm">
            <Sparkles size={13} /> Industrial Print Infrastructure
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Commercial Printing Capabilities
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-normal leading-relaxed">
            High-speed Heidelberg offset lithography, rigid corporate packaging, illuminated architectural signage, and nationwide fleet branding solutions.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map((service, i) => {
              const isDrawerOpen = !!expandedServices[service.title];
              const associatedProjects = projectsList.filter((p) => p.category === service.title);
              
              return (
                <div
                  key={i}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg rounded-xl overflow-hidden flex flex-col transition-all duration-300"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    {service.tag && (
                      <span
                        className="absolute top-3.5 right-3.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-950/80 text-white border border-white/20 backdrop-blur-md"
                      >
                        {service.tag}
                      </span>
                    )}
                    <div className="absolute bottom-3.5 left-3.5 w-9 h-9 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-primary">
                      <service.icon size={18} />
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">{service.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1 font-normal">
                      {service.description}
                    </p>
                    <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {service.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium"
                        >
                          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" /> {f}
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
