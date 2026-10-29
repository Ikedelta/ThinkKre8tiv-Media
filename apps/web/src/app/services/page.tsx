'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  Layers,
  ArrowRight,
  Truck,
  Building2,
  Package,
  Gift,
  Award,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { cn } from '@/lib/utils';

// Clean, focused service catalog
const SERVICES = [
  {
    id: 'offset-printing',
    title: 'Offset & Bulk Commercial Printing',
    category: 'Commercial Print',
    icon: Printer,
    image: '/images/1.jpg',
    description: 'High-speed automated Heidelberg printing for corporate brochures, annual reports, presentation folders, flyers, and magazines with razor-sharp Pantone color accuracy.',
    highlights: ['Pantone color calibration', '150gsm–450gsm stock', 'Spot UV & foil stamping', 'High-volume production runs']
  },
  {
    id: 'packaging-boxes',
    title: 'Custom Packaging & Luxury Rigid Boxes',
    category: 'Packaging',
    icon: Package,
    image: '/images/3.jpg',
    description: 'Bespoke rigid gift boxes, magnetic closure product packaging, retail cartons, and custom tote bags engineered to elevate your brand presentation.',
    highlights: ['Custom die-cut inserts', 'Rigid greyboard cores', 'Embossed & foil stamped', 'Bespoke corporate gifting']
  },
  {
    id: '3d-signage',
    title: '3D Channel Signs & Office Branding',
    category: 'Signage & Displays',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80',
    description: 'Backlit 3D illuminated letters, stainless steel halo channel signs, outdoor pylons, and acrylic reception wall branding built for durability.',
    highlights: ['Waterproof LED modules', 'Brushed steel & acrylic', 'Laser contour cutting', 'Professional site installation']
  },
  {
    id: 'corporate-apparel',
    title: 'Corporate Apparel & Staff Uniforms',
    category: 'Apparel',
    icon: Award,
    image: '/images/2.jpg',
    description: 'High-density embroidered pique polo shirts, corporate uniforms, event t-shirts, branded caps, and executive apparel with durable stitching.',
    highlights: ['Tajima precision embroidery', 'Durable screen & DTF print', '100% combed cotton', 'Full corporate size runs']
  },
  {
    id: 'fleet-branding',
    title: 'Vehicle & Fleet Advertising Wraps',
    category: 'Branding',
    icon: Truck,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    description: 'Full commercial vehicle branding, cast vinyl wraps, and reflective delivery fleet graphics engineered to withstand weather and road conditions.',
    highlights: ['Premium cast vinyl wraps', 'UV protective overlaminate', 'Seamless panel alignment', 'Certified installation crew']
  },
  {
    id: 'promotional-souvenirs',
    title: 'Executive Souvenirs & Corporate Gifts',
    category: 'Promotional Items',
    icon: Gift,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    description: 'Laser-engraved thermal bottles, leather notebook sets, crystal awards, pens, and customized executive gift hampers.',
    highlights: ['Precision laser etching', 'Rotary UV cylinder print', 'Curated gift packaging', 'Fast turnaround for events']
  }
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'Commercial Print', label: 'Printing' },
    { id: 'Packaging', label: 'Packaging & Boxes' },
    { id: 'Signage & Displays', label: '3D Signs' },
    { id: 'Apparel', label: 'Uniforms & Apparel' },
    { id: 'Branding', label: 'Fleet Wraps' },
    { id: 'Promotional Items', label: 'Souvenirs' },
  ];

  const filtered = selectedCategory === 'all' 
    ? SERVICES 
    : SERVICES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans overflow-x-hidden pt-14 sm:pt-16">
      <PublicNav />

      {/* Simple, Professional Page Header */}
      <section className="bg-white border-b border-slate-200 py-14 sm:py-18">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/60 text-[#D22630] text-xs font-bold uppercase tracking-wider">
            <span>Our Capabilities</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Commercial Printing &amp; Fabrication Services
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            High-output Heidelberg offset presses, rigid packaging fabrication, 3D architectural signage, and corporate branding delivered with certified quality.
          </p>

          {/* Category Filter Pills */}
          <div className="pt-6 flex flex-wrap justify-center gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  selectedCategory === cat.id
                    ? "bg-[#D22630] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid: Clean, Consistent, Professional 2-Column / 3-Column Layout */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-xs border border-slate-200">
                        {service.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D22630] flex items-center justify-center shrink-0">
                          <Icon size={17} />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {service.title}
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Bullet Highlights */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        {service.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Button */}
                  <div className="p-6 pt-0">
                    <Link href={`/submit?product=${encodeURIComponent(service.title)}`}>
                      <button className="w-full h-11 rounded-xl bg-slate-900 hover:bg-[#D22630] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]">
                        Request an Estimate <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple 3 Quality Guarantees Bar */}
      <section className="bg-white border-t border-b border-slate-200 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-[#D22630] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pantone Accurate</h4>
                <p className="text-xs text-slate-500 mt-0.5">True-to-brand color matching on every production run.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Genuine Substrate Weights</h4>
                <p className="text-xs text-slate-500 mt-0.5">Authentic paper grammages and heavy-gauge rigid cores.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Doorstep Delivery</h4>
                <p className="text-xs text-slate-500 mt-0.5">Vacuum-sealed and dispatched to your office across Ghana.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Call To Action */}
      <section className="py-14 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Have a custom print or branding project?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Send us your job specifications or contact our Accra facility directly for a prompt quote.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link href="/submit">
              <button className="bg-[#D22630] hover:bg-[#b81d26] text-white text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-lg transition-colors cursor-pointer">
                Submit Your Job
              </button>
            </Link>
            <Link href="/contact">
              <button className="border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-lg transition-colors cursor-pointer">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
