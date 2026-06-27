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

const IMG_BRANDING = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const IMG_BILLBOARD = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
const IMG_VEHICLE = 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80';
const IMG_SIGNAGE = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80';
const IMG_EVENT = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80';
const IMG_DIGITAL = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80';
const IMG_MERCH_TIE = '/images/custom-tie.jpg';
const IMG_MERCH_MIRROR = '/images/custom-mirror.jpg';
const IMG_MERCH_CAP = '/images/custom-cap.jpg';
const IMG_MERCH_KEYCHAINS = '/images/custom-keychains.jpg';

const servicesList = [
  {
    title: 'Large Format Printing',
    icon: Printer,
    image: IMG_BILLBOARD,
    tag: 'Most Popular',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'High-resolution outdoor flex billboards, roll-ups, canvas wall frames, and durable stickers that capture visual interest. Ideal for retail fronts and campaigns.',
    features: [
      'Up to 5m seamless width',
      'Indoor & outdoor grade canvas',
      '1440 DPI photo-quality prints',
      'UV & water-resistant latex inks',
      '24-48h dispatch standard',
    ],
  },
  {
    title: '3D Signage & Fabrication',
    icon: Sparkles,
    image: IMG_SIGNAGE,
    tag: 'Premium Accent',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Architectural LED illuminated channel signs, brushed metal letter structures, and storefront displays custom engineered to represent luxury identity.',
    features: [
      'Stainless steel & acrylic wraps',
      'Energy-efficient LED backlight modules',
      'Precision laser contour profile cuts',
      'Rigorous structural safety ratings',
      'Site inspection & installation team',
    ],
  },
  {
    title: 'Corporate Branding',
    icon: Palette,
    image: IMG_BRANDING,
    tag: 'Essential Kit',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Brand style layout kits including premium corporate stationery, customized diaries, presentation folders, gift packaging, and employee badges.',
    features: [
      'Custom paper stocks & weights',
      'Gold foil & high-gloss spot UV overlays',
      'Complete typography & logo manuals',
      'Specialized promotional assets',
      'Flexible minimum order counts',
    ],
  },
  {
    title: 'Digital Printing',
    icon: Layers,
    image: IMG_DIGITAL,
    tag: 'Fast Run',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Quick-run brochures, pamphlets, flyer campaigns, business cards, and direct-to-garment prints compiled with crisp tone reproduction.',
    features: [
      'Same-day express dispatch options',
      'Heavyweight linen & matte cardboards',
      'Double-sided color calibration',
      'Intelligent digital dye printing',
      'Dynamic variable data capability',
    ],
  },
  {
    title: 'Vehicle Graphics',
    icon: Truck,
    image: IMG_VEHICLE,
    tag: 'Mobile Board',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Full vehicle graphics, vinyl lettering overlays, and delivery truck wraps converting company fleets into high-reach dynamic advertising platforms.',
    features: [
      'Cast vehicle wrap vinyl film',
      'Specialist contour paint protective glaze',
      'Clean bubble-free application system',
      'Easily removable wrap panels',
      'Up to 5-year color fade warranty',
    ],
  },
  {
    title: 'Event & Exhibition setups',
    icon: Award,
    image: IMG_EVENT,
    tag: 'Exhibition',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Custom pop-up backdrop walls, modular booth components, product presentation counters, and hanging textile branding arrays for trade fairs.',
    features: [
      'Compact lightweight aluminum systems',
      'Wrinkle-free stretch fabric graphics',
      'Modular expandable setups',
      'Transport cases included',
      'Express site teardown crews',
    ],
  },
  {
    title: 'Promotional Merchandise',
    icon: Gift,
    image: IMG_MERCH_TIE,
    tag: 'Custom Souvenirs',
    tagColor: 'bg-secondary text-foreground border-border',
    description:
      'Premium custom-branded merchandise, including branded ties, caps, keychains, and framed mirrors to elevate your brand identity.',
    features: [
      'High-quality custom apparel',
      'Precision engraved keychains',
      'Elegant framed mirrors',
      'Custom packaging & boxing',
      'Flexible minimum order quantities',
    ],
  },
];

// Portfolio list to infuse directly
const projectsList = [
  {
    title: 'GCB Bank Campaign',
    category: 'Large Format Printing',
    image: IMG_BILLBOARD,
    desc: 'City-wide flex billboard and route branch banners across Accra and Kumasi.',
    specs: { size: '12m x 4m Billboard', media: 'Heavy Flex Canvas', speed: '48 Hours delivery' },
    review: 'Think Kre8tive delivered our route campaigns on exact schedule. Quality is flawless.',
    client: 'GCB Marketing Dept.'
  },
  {
    title: 'MTN Ghana Rebrand',
    category: 'Corporate Branding',
    image: IMG_BRANDING,
    specs: { size: 'Various Kits', media: 'Standard Linen & Matte', speed: '7 Business days' },
    desc: 'Corporate stationery systems, custom diaries, promotional badges, and retail graphics.',
    review: 'Exceptional attention to spot UV details. They are our absolute print partner.',
    client: 'MTN Brand Custodian'
  },
  {
    title: 'Accra Mall Front Sign',
    category: '3D Signage & Fabrication',
    image: IMG_SIGNAGE,
    specs: { size: '6.5m Width letters', media: 'Acrylic & Steel LED', speed: '12 Days install' },
    desc: 'Fabricated 3D LED backlit lettering for retail entrance and anchor tenants.',
    review: 'The illuminated signage looks stunning at night. Precision fabrication work.',
    client: 'Accra Mall Operations'
  },
  {
    title: 'Ashfoam Fleet Branding',
    category: 'Vehicle Graphics',
    image: IMG_VEHICLE,
    specs: { size: '42 delivery trucks', media: 'Cast Wrap Gloss Film', speed: '5-year warranty' },
    desc: 'Complete high-gloss cast fleet vinyl wrap for delivery trucks across all regions.',
    review: 'Our mobile advertising has never looked this crisp. Highly recommend their fleet wraps.',
    client: 'Ashfoam Logistics'
  },
  {
    title: 'Vodafone Summit Backdrops',
    category: 'Large Format Printing',
    image: IMG_EVENT,
    specs: { size: '3m x 6m Booth', media: 'Stretch Fabric Textile', speed: '24 Hours setup' },
    desc: 'Wrinkle-free textile backdrops and exhibition pop-up booths for the tech summit.',
    review: 'Booths were set up and calibrated within hours. Brilliant service.',
    client: 'Vodafone Event Lead'
  },
  {
    title: 'ECG Corporate Reports',
    category: 'Digital Printing',
    image: IMG_DIGITAL,
    specs: { size: '1,500 reports', media: 'Linen covers, Gloss pages', speed: '3 Days dispatch' },
    desc: 'Annual stakeholder reports, corporate folders, and employee card layouts.',
    review: 'Perfect bind layout with clear tone distribution. Excellent color management.',
    client: 'ECG Communications'
  },
  {
    title: 'MMARIMA MMA Custom Ties',
    category: 'Promotional Merchandise',
    image: IMG_MERCH_TIE,
    specs: { size: 'Standard Tie', media: 'Silk Blend', speed: '14 Days delivery' },
    desc: 'Custom yellow and black striped ties with embroidered school logo, packed in premium black boxes.',
    review: 'The ties are of exceptional quality, perfectly capturing our brand colors and logo.',
    client: 'MMARIMA MMA'
  },
  {
    title: '88 MATE MASIE Framed Mirror',
    category: 'Promotional Merchandise',
    image: IMG_MERCH_MIRROR,
    specs: { size: 'Custom Dimensions', media: 'Gold Frame, Glass', speed: '7 Days fabrication' },
    desc: 'Elegant framed mirror with etched logo and text "A symbol of wisdom, knowledge and prudence".',
    review: 'A beautiful and meaningful piece. The etching is flawless.',
    client: 'Mate Masie Corp'
  },
  {
    title: 'MMARIMA MMA Branded Cap',
    category: 'Promotional Merchandise',
    image: IMG_MERCH_CAP,
    specs: { size: 'Adjustable', media: 'Cotton & Mesh', speed: '10 Days delivery' },
    desc: 'Stylish black and yellow caps featuring high-quality embroidery of the MMARIMA MMA logo.',
    review: 'Comfortable and vibrant. The embroidery really stands out.',
    client: 'MMARIMA MMA'
  },
  {
    title: 'Mirch Hotel Keychains',
    category: 'Promotional Merchandise',
    image: IMG_MERCH_KEYCHAINS,
    specs: { size: 'Standard', media: 'Acrylic & Wood', speed: '5 Days dispatch' },
    desc: 'Premium engraved keychains for hotel rooms, available in wood and frosted acrylic finishes.',
    review: 'These keychains add a luxurious touch to our guest experience.',
    client: 'Mirch Hotel Greece'
  }
];

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
