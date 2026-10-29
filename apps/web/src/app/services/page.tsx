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
  Gift,
  Building2,
  ShieldCheck,
  Check,
  FileText,
  Clock,
  Compass,
  Package
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { SERVICES_LIST as defaultServices, PROJECTS_LIST as projectsList } from '@/data/content';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Verified local and commercial photography for services
const ENHANCED_SERVICES = [
  {
    title: 'Commercial Offset & Bulk Printing',
    category: 'print',
    icon: Printer,
    image: '/images/1.jpg',
    tag: 'Enterprise Favorite',
    description: 'High-speed automated Heidelberg offset lithography for corporate annual reports, presentation folders, marketing brochures, flyers, and bespoke calendars with razor-sharp Pantone color accuracy.',
    features: [
      'Multi-color automated Heidelberg press lines',
      'Heavyweight 150gsm–450gsm art paper & cardboards',
      'Matte, soft-touch velvet & high-gloss UV laminations',
      'Gold & silver metallic hot-stamp foil stamping',
      'High-volume runs with guaranteed deadlines',
    ],
    specs: { turnaround: '24–48 Hours', capacity: '100,000+ units/day', finish: 'Spot UV & Foil' }
  },
  {
    title: 'Custom Packaging & Rigid Product Boxes',
    category: 'packaging',
    icon: Package,
    image: '/images/3.jpg',
    tag: 'Custom Finishing',
    description: 'Bespoke rigid gift boxes, luxury cardboard packaging, magnetic closure boxes, retail product cartons, and custom printed boutique tote bags engineered for retail and corporate gift presentations.',
    features: [
      'Custom die-cut profiles for perfume, cosmetics & drinks',
      'Heavy-gauge 1200gsm–1800gsm greyboard cores',
      'Food-grade safe board & moisture barrier coatings',
      'Custom velvet, foam & satin interior partitions',
      'Branded thermal tumblers, diary sets & executive gifts',
    ],
    specs: { turnaround: '3–5 Working Days', capacity: '50,000 boxes/week', finish: 'Rigid & Magnetic' }
  },
  {
    title: '3D Channel Signs & Architectural Displays',
    category: 'signage',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
    tag: 'Architectural',
    description: 'Custom-engineered 3D acrylic light letters, stainless steel halo-lit channel signs, outdoor pylons, aluminum lightboxes, and modern office reception backdrop branding that commands prestige day and night.',
    features: [
      'High-efficiency waterproof Samsung LED lighting modules',
      'Brushed stainless steel, bronze & acrylic faceplates',
      'Precision laser contour profile & CNC routing',
      'Weather-resistant powder coatings for tropical climate',
      'Professional structural site inspection & mounting crew',
    ],
    specs: { turnaround: '5–7 Days', capacity: 'Bespoke Engineering', finish: 'Halo & Front Lit' }
  },
  {
    title: 'Corporate Apparel, Polos & Embroidery',
    category: 'apparel',
    icon: Award,
    image: '/images/2.jpg',
    tag: 'Merchandise',
    description: 'Corporate staff uniforms, high-density embroidered pique polos, screen-printed event tees, bespoke hoodies, executive ties, and branded headwear reflecting superior craftsmanship and durability.',
    features: [
      '100% premium combed cotton & moisture-wicking poly fabrics',
      'Computerized multi-head Tajima embroidery technology',
      'Durable non-cracking screen print & direct-to-film (DTF)',
      'Custom branded neck woven labels & sleeve tags',
      'Size ranges from XS to 5XL with zero color bleeding',
    ],
    specs: { turnaround: '3–5 Days', capacity: '10,000 garments/week', finish: 'Tajima Embroidery' }
  },
  {
    title: 'Vehicle & Fleet Advertising Wraps',
    category: 'fleet',
    icon: Truck,
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
    tag: 'Mobile Billboard',
    description: 'Turn your delivery vans, trucks, and executive buses into moving billboards with cast vinyl wrapping, perforated one-way window vision, and high-impact reflective brand graphics.',
    features: [
      'Premium automotive cast wrapping vinyl film',
      'UV protective laminate shield against sun and road debris',
      'Clean micro-channel bubble-free professional application',
      'Full wraps, half wraps & precision die-cut decal lettering',
      'Up to 5-year outdoor color fade warranty in Accra weather',
    ],
    specs: { turnaround: '24–48 Hours/Unit', capacity: 'Fleet Scale', finish: 'Cast Automotive' }
  },
  {
    title: 'Laser Engraving, Keyrings & Executive Souvenirs',
    category: 'souvenirs',
    icon: Gift,
    image: '/images/IMG-20260617-WA0064.jpg',
    tag: 'High Precision',
    description: 'Bespoke etched acrylic and frosted keyrings, crystal glass awards, executive metal ballpoint pens, wooden plaques, leather portfolios, and customized employee appreciation souvenirs.',
    features: [
      'Micron-accurate CO2 & fiber laser engraving machinery',
      'Permanent etching on acrylic, crystal, wood, leather & metal',
      'Frosted, translucent & iridescent color-shifting finishes',
      'Packaged in bespoke branded velvet pouches & gift cartons',
      'Low minimum order quantities with express turnaround',
    ],
    specs: { turnaround: '24 Hours', capacity: '20,000 units/week', finish: 'Laser Etched' }
  }
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    },
    staleTime: 60 * 1000,
  });

  const filteredServices = selectedCategory === 'all'
    ? ENHANCED_SERVICES
    : ENHANCED_SERVICES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden pt-14 sm:pt-16">
      <PublicNav />

      {/* =========================================================================
          SECTION 1: HERO SECTION (MATCHING CLEAN HOMEPAGE WHITE ABSTRACT CANVAS)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/70 to-slate-100/60 text-slate-900 border-b border-slate-200/80 py-12 sm:py-16 lg:py-20">
        
        {/* Modern Abstract Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-100/60 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-amber-100/50 rounded-full blur-[130px] pointer-events-none translate-y-1/3" />
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-indigo-50/70 rounded-full blur-[120px] pointer-events-none" />

        {/* Abstract Architectural Mesh & Vector Geometry */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_40%,#000_65%,transparent_100%)] pointer-events-none" />
        
        {/* Dynamic Rings */}
        <div className="absolute -top-24 -left-24 w-96 h-96 border border-slate-200/60 rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] border border-slate-200/50 rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/90 text-slate-700 text-[11px] font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#D22630] animate-pulse" />
            <span className="font-semibold tracking-wider text-[10px] uppercase text-slate-800">
              Commercial Printing &amp; Fabrication Infrastructure
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
            Precision Printing. Industrial Speed.<br className="hidden sm:inline" /> Exceptional Finish.
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            From multi-color Heidelberg offset presses to custom rigid product packaging and backlit 3D channel signs — we engineer high-impact commercial print collateral for Ghana’s leading institutions and visionary brands.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link href="/submit">
              <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-[#D22630] hover:bg-[#b81d26] text-white h-11 px-6 rounded-lg shadow-md hover:shadow-red-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                Submit Your Print Job <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/track">
              <button className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 h-11 px-6 rounded-lg transition-all shadow-xs cursor-pointer">
                Track Existing Order
              </button>
            </Link>
          </div>

          {/* Infrastructure Metrics Strip */}
          <div className="pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">Heidelberg</div>
              <div className="text-[10px] font-medium text-slate-500">Automated Offset Lines</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">&lt; 24h</div>
              <div className="text-[10px] font-medium text-slate-500">Digital Sample Proofing</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">350–1800 gsm</div>
              <div className="text-[10px] font-medium text-slate-500">Certified Substrate Range</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-xl font-extrabold text-slate-900 tracking-tight">100% In-House</div>
              <div className="text-[10px] font-medium text-slate-500">Factory Press in Accra</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CATEGORY FILTER TABS
          ========================================================================= */}
      <section className="border-b border-slate-200 bg-slate-50/60 sticky top-10 sm:top-11 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All Capabilities' },
              { id: 'print', label: 'Offset & Bulk Printing' },
              { id: 'packaging', label: 'Boxes & Packaging' },
              { id: 'signage', label: '3D Signs & Billboards' },
              { id: 'apparel', label: 'Uniforms & Apparel' },
              { id: 'fleet', label: 'Vehicle Wraps' },
              { id: 'souvenirs', label: 'Laser & Souvenirs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  selectedCategory === tab.id
                    ? "bg-[#D22630] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-950 border border-slate-200 hover:border-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SERVICES GRID & CAPABILITY CARDS
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D22630] block mb-1">
                Commercial Division
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Industrial Output Specifications
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Showing {filteredServices.length} production categories calibrated to enterprise corporate standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredServices.map((service, i) => {
              const isDrawerOpen = !!expandedServices[service.title];
              const associatedProjects = projectsList.filter((p) => p.category.toLowerCase().includes(service.category));
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Photo Header */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 shadow-xs">
                          <Icon size={12} className="text-[#D22630]" />
                          <span>{service.specs.turnaround}</span>
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D22630] text-white shadow-xs">
                          {service.tag}
                        </span>
                      </div>

                      <div className="absolute bottom-3.5 left-3.5 right-3.5">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-sm">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content & Features */}
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {service.description}
                      </p>

                      {/* Technical Specs Pill Strip */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Standard Capacity</span>
                          <span className="font-bold text-slate-800">{service.specs.capacity}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Finishing Spec</span>
                          <span className="font-bold text-slate-800">{service.specs.finish}</span>
                        </div>
                      </div>

                      {/* Feature Bullet Points */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Guaranteed Output Quality</p>
                        {service.features.map((feat) => (
                          <div key={feat} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Case Studies Accordion */}
                      {associatedProjects.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleProjects(service.title)}
                            className="flex items-center justify-between w-full text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider py-1 cursor-pointer"
                          >
                            <span>Recent Production Proofs ({associatedProjects.length})</span>
                            <ChevronRight size={13} className={cn("transition-transform duration-300", isDrawerOpen && "rotate-90 text-[#D22630]")} />
                          </button>

                          {isDrawerOpen && (
                            <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-200">
                              {associatedProjects.map((proj) => (
                                <div key={proj.title} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                                  <div className="relative h-24 w-full rounded-lg overflow-hidden border border-slate-200">
                                    <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{proj.title}</h4>
                                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{proj.desc}</p>
                                  </div>
                                  <div className="text-[10px] italic text-slate-600 bg-white p-2 rounded border border-slate-100">
                                    &quot;{proj.review}&quot; &bull; <span className="font-bold not-italic text-slate-800">{proj.client}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footers */}
                  <div className="p-5 pt-0">
                    <Link href={`/submit?product=${encodeURIComponent(service.title)}`}>
                      <button className="w-full h-10 rounded-xl bg-slate-900 hover:bg-[#D22630] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        Request Estimate for This <ArrowRight size={13} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THE 3 NON-NEGOTIABLE PRODUCTION STANDARDS
          ========================================================================= */}
      <section className="py-16 bg-slate-50 border-y border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[#D22630] text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={12} /> The Think Kre8tiv Benchmark
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Three Non-Negotiable Factory Standards
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Every print run and rigid box that leaves our workshop is certified against international graphic reproduction benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D22630] flex items-center justify-center font-bold">
                <Palette size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Certified Pantone Precision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computerized ink density spectrophotometers verify your corporate Pantone color values across 100 or 100,000 units. No faded hues or color drift.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Substrate Weight Guarantee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you specify 350gsm art board, you receive genuine 350gsm. We never downgrade paper stock weights or dilute protective UV gloss laminates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Protective Doorstep Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Finished collateral is vacuum-shrink wrapped, packed in moisture-resistant cartons, and dispatched straight to your corporate offices in Accra or across Ghana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SIMPLE 4-STEP PROCESS (CONSISTENT WITH HOMEPAGE)
          ========================================================================= */}
      <section className="py-14 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#D22630]">How We Work</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Our Simple 4-Step Process</h2>
            <p className="text-xs text-slate-500">From project estimate to final doorstep delivery, here is how we work with you.</p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { num: '01', title: 'Submit Print Request', icon: FileText, desc: 'Choose your desired service, specify preferred quantities, and upload design artwork.' },
              { num: '02', title: 'Digital Proof & Approval', icon: Layers, desc: 'We review your files, generate a digital pre-press proof, and send an itemized invoice.' },
              { num: '03', title: 'Press Printing & Finishing', icon: Zap, desc: 'Heidelberg offset printing, die-cutting, foil stamping, and rigorous hand quality inspection.' },
              { num: '04', title: 'Protected Delivery', icon: Package, desc: 'Securely packaged in protective corrugated cartons and delivered directly to your doorstep.' }
            ].map((step, i) => (
              <div key={i} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-800 shadow-2xs border border-slate-200">
                    <step.icon size={15} className="text-[#D22630]" />
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-400">{step.num}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="text-[11px] leading-relaxed text-slate-600 font-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CALL TO ACTION BANNER (MATCHING HOMEPAGE TEMPLATE)
          ========================================================================= */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-20 text-white">
        <div 
          aria-hidden="true" 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ background: 'radial-gradient(circle at 70% 30%, #D22630, transparent 60%)' }}
        />
        
        <div className="relative mx-auto max-w-3xl px-4 text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20 backdrop-blur-sm">
            <Zap size={11} className="text-[#FCD20F]" /> Rapid Estimate Service
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            Ready to bring your corporate branding to life?
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-white/70 font-normal">
            Receive a detailed estimate sheet within 24 hours. Start your offset press runs, bespoke rigid boxes, or backlit signage projects with Ghana's premier commercial printers.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/submit">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider bg-[#FCD20F] hover:bg-[#FCD20F]/90 text-black h-11 px-7 rounded-lg shadow-xs transition-all hover:translate-y-[-1px] cursor-pointer">
                Submit Your Print Job <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/contact">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/10 text-white h-11 px-6 rounded-lg transition-all backdrop-blur-sm hover:border-white/40">
                Contact Facility
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
