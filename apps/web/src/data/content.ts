import {
  Printer,
  Layers,
  Palette,
  Truck,
  Award,
  Sparkles,
  Gift,
} from 'lucide-react';

/**
 * ==========================================
 * THINK KRE8TIV MEDIA MASTER CONTENT CONFIGURATION
 * ==========================================
 * 
 * Replace the placeholder strings below with your actual brand messaging.
 * Once updated here, the content will automatically sync across the site.
 */

export const siteInfo = {
  name: 'Think Kre8tiv Media',
  tagline: "Ghana's Premier Print & Branding Agency",
  // Hero section on the homepage
  heroHeadline: 'Where Vision Meets Precision Printing.',
  heroSubheadline: 'Elevate your brand with high-volume commercial printing, bespoke product packaging, illuminated 3D signage, and dynamic fleet wraps crafted by industry leaders.',
  // Footer / Contact info
  contact: {
    email: 'info@thinkkre8tivmedia.com',
    phone: '+233 24 555 9000',
    address: 'OSU haramani Sport complex',
    facebook: 'https://facebook.com/thinkkre8tive',
    instagram: 'https://instagram.com/thinkkre8tive',
    twitter: 'https://twitter.com/thinkkre8tive'
  }
};

/**
 * CAROUSEL SLIDES (Homepage Hero Slider)
 */
export const CAROUSEL_SLIDES = [
  {
    image: '/images/IMG-20260617-WA0063.jpg',
    title: 'Precision Offset Printing',
    desc: 'High-volume commercial catalog presses delivering crisp ink layers and immaculate resolution.',
    tag: 'Bulk Production',
  },
  {
    image: '/images/IMG-20260617-WA0064.jpg',
    title: 'Bespoke Custom Packaging',
    desc: 'Premium rigid boxes, product sleeves, and luxury shopping bags crafted to build brand authority.',
    tag: 'Packaging Design',
  },
  {
    image: '/images/IMG-20260617-WA0059.jpg',
    title: 'Luxury Business Cards',
    desc: 'Heavy stock cotton paper with debossed corporate textures and crisp finishes.',
    tag: 'Foil Stamping',
  },
  {
    image: '/images/IMG-20260617-WA0060.jpg',
    title: 'Corporate Merchandising',
    desc: 'Embroidery and silk-screened executive wear, custom stationery, and branded corporate gifts.',
    tag: 'Brand Merch',
  },
  {
    image: '/images/IMG-20260617-WA0061.jpg',
    title: 'Large Format Signage',
    desc: 'Durable weather-resistant roll-ups, outdoor banners, and backlit storefront signage.',
    tag: 'Outdoor Media',
  },
  {
    image: '/images/IMG-20260617-WA0065.jpg',
    title: 'Custom Brand Apparel',
    desc: 'Premium yellow & black striped ties and embroidered caps with bespoke logos.',
    tag: 'Merchandise',
  },
  {
    image: '/images/IMG-20260617-WA0056.jpg',
    title: 'Bespoke Etched Mirrors',
    desc: 'Elegant framed gold mirrors featuring custom wisdom and prudence etching.',
    tag: 'Souvenirs',
  },
];

/**
 * EXPERTISE SECTION (Homepage)
 */
export const EXPERTISE = [
  {
    image: '/images/IMG-20260617-WA0062.jpg',
    icon: Printer,
    title: 'Corporate Printing & Stationery',
    desc: 'High-volume letterheads, brochures, presentation folders, and bespoke corporate cards matching your exact brand manual colors.',
  },
  {
    image: '/images/IMG-20260617-WA0058.jpg',
    icon: Layers,
    title: 'Commercial Packaging',
    desc: 'High-quality product packaging boxes, food-grade cartons, paper bags, and customized adhesive labeling for retail products.',
  },
  {
    image: '/images/IMG-20260617-WA0057.jpg',
    icon: Palette,
    title: 'Brand Activation & Signage',
    desc: 'Illuminated 3D pylons, teardrop banners, roll-up stands, and wide-format backdrops that make your brand visible from miles away.',
  },
  {
    image: '/images/IMG-20260617-WA0065.jpg',
    icon: Truck,
    title: 'Vehicle & Fleet Branding',
    desc: 'Precision vinyl wrapping for corporate delivery vans, buses, and executive fleets to turn your transport into mobile billboards.',
  },
];

/**
 * GALLERY SHOWCASE (Homepage Grid)
 */
export const GALLERY_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=400&q=80',
    category: 'Equipment',
    title: 'Offset Press Calibration',
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    category: 'Collateral',
    title: 'Premium Catalog Runs',
  },
  {
    image: 'https://images.unsplash.com/photo-1603380353725-f8a4d39cc41e?auto=format&fit=crop&w=400&q=80',
    category: 'Production',
    title: 'Wide-Format Signage',
  },
  {
    image: '/images/IMG-20260617-WA0060.jpg',
    category: 'Branding',
    title: 'Custom Branded Swag',
  },
  {
    image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=400&q=80',
    category: 'Finishing',
    title: 'Luxury Foil Business Cards',
  },
  {
    image: '/images/IMG-20260617-WA0063.jpg',
    category: 'Textile',
    title: 'Custom Embroidery',
  },
  {
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80',
    category: 'Creative',
    title: 'Bespoke Brand Layouts',
  },
  {
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    category: 'Finishing',
    title: 'Precision Die Cutting',
  },
  {
    image: '/images/IMG-20260617-WA0058.jpg',
    category: 'Apparel',
    title: 'Branded Caps',
  },
  {
    image: '/images/IMG-20260617-WA0064.jpg',
    category: 'Souvenirs',
    title: 'Engraved Keychains',
  },
];

/**
 * CORE SERVICES LIST (Services & Quote Estimator Pages)
 */
export const SERVICES_LIST = [
  {
    title: 'Large Format Printing',
    icon: Printer,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    tag: 'Most Popular',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'High-resolution outdoor flex billboards, roll-ups, canvas wall frames, and durable stickers that capture visual interest. Ideal for retail fronts and campaigns.',
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
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    tag: 'Premium Accent',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Architectural LED illuminated channel signs, brushed metal letter structures, and storefront displays custom engineered to represent luxury identity.',
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
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    tag: 'Essential Kit',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Brand style layout kits including premium corporate stationery, customized diaries, presentation folders, gift packaging, and employee badges.',
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
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    tag: 'Fast Run',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Quick-run brochures, pamphlets, flyer campaigns, business cards, and direct-to-garment prints compiled with crisp tone reproduction.',
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
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80',
    tag: 'Mobile Board',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Full vehicle graphics, vinyl lettering overlays, and delivery truck wraps converting company fleets into high-reach dynamic advertising platforms.',
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
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    tag: 'Exhibition',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Custom pop-up backdrop walls, modular booth components, product presentation counters, and hanging textile branding arrays for trade fairs.',
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
    image: '/images/IMG-20260617-WA0065.jpg',
    tag: 'Custom Souvenirs',
    tagColor: 'bg-secondary text-foreground border-border',
    description: 'Premium custom-branded merchandise, including branded ties, caps, keychains, and framed mirrors to elevate your brand identity.',
    features: [
      'High-quality custom apparel',
      'Precision engraved keychains',
      'Elegant framed mirrors',
      'Custom packaging & boxing',
      'Flexible minimum order quantities',
    ],
  },
];

/**
 * RECENT PROJECTS / CASE STUDIES (Services Page)
 */
export const PROJECTS_LIST = [
  {
    title: 'GCB Bank Campaign',
    category: 'Large Format Printing',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    desc: 'City-wide flex billboard and route branch banners across Accra and Kumasi.',
    specs: { size: '12m x 4m Billboard', media: 'Heavy Flex Canvas', speed: '48 Hours delivery' },
    review: 'Think Kre8tiv Media delivered our route campaigns on exact schedule. Quality is flawless.',
    client: 'GCB Marketing Dept.'
  },
  {
    title: 'MTN Ghana Rebrand',
    category: 'Corporate Branding',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    specs: { size: 'Various Kits', media: 'Standard Linen & Matte', speed: '7 Business days' },
    desc: 'Corporate stationery systems, custom diaries, promotional badges, and retail graphics.',
    review: 'Exceptional attention to spot UV details. They are our absolute print partner.',
    client: 'MTN Brand Custodian'
  },
  {
    title: 'Accra Mall Front Sign',
    category: '3D Signage & Fabrication',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    specs: { size: '6.5m Width letters', media: 'Acrylic & Steel LED', speed: '12 Days install' },
    desc: 'Fabricated 3D LED backlit lettering for retail entrance and anchor tenants.',
    review: 'The illuminated signage looks stunning at night. Precision fabrication work.',
    client: 'Accra Mall Operations'
  },
  {
    title: 'Ashfoam Fleet Branding',
    category: 'Vehicle Graphics',
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80',
    specs: { size: '42 delivery trucks', media: 'Cast Wrap Gloss Film', speed: '5-year warranty' },
    desc: 'Complete high-gloss cast fleet vinyl wrap for delivery trucks across all regions.',
    review: 'Our mobile advertising has never looked this crisp. Highly recommend their fleet wraps.',
    client: 'Ashfoam Logistics'
  },
  {
    title: 'Vodafone Summit Backdrops',
    category: 'Large Format Printing',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    specs: { size: '3m x 6m Booth', media: 'Stretch Fabric Textile', speed: '24 Hours setup' },
    desc: 'Wrinkle-free textile backdrops and exhibition pop-up booths for the tech summit.',
    review: 'Booths were set up and calibrated within hours. Brilliant service.',
    client: 'Vodafone Event Lead'
  },
  {
    title: 'ECG Corporate Reports',
    category: 'Digital Printing',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80',
    specs: { size: '1,500 reports', media: 'Linen covers, Gloss pages', speed: '3 Days dispatch' },
    desc: 'Annual stakeholder reports, corporate folders, and employee card layouts.',
    review: 'Perfect bind layout with clear tone distribution. Excellent color management.',
    client: 'ECG Communications'
  },
  {
    title: 'MMARIMA MMA Custom Ties',
    category: 'Promotional Merchandise',
    image: '/images/IMG-20260617-WA0065.jpg',
    specs: { size: 'Standard Tie', media: 'Silk Blend', speed: '14 Days delivery' },
    desc: 'Custom yellow and black striped ties with embroidered school logo, packed in premium black boxes.',
    review: 'The ties are of exceptional quality, perfectly capturing our brand colors and logo.',
    client: 'MMARIMA MMA'
  },
  {
    title: '88 MATE MASIE Framed Mirror',
    category: 'Promotional Merchandise',
    image: '/images/IMG-20260617-WA0056.jpg',
    specs: { size: 'Custom Dimensions', media: 'Gold Frame, Glass', speed: '7 Days fabrication' },
    desc: 'Elegant framed mirror with etched logo and text "A symbol of wisdom, knowledge and prudence".',
    review: 'A beautiful and meaningful piece. The etching is flawless.',
    client: 'Mate Masie Corp'
  },
  {
    title: 'MMARIMA MMA Branded Cap',
    category: 'Promotional Merchandise',
    image: '/images/IMG-20260617-WA0058.jpg',
    specs: { size: 'Adjustable', media: 'Cotton & Mesh', speed: '10 Days delivery' },
    desc: 'Stylish black and yellow caps featuring high-quality embroidery of the MMARIMA MMA logo.',
    review: 'Comfortable and vibrant. The embroidery really stands out.',
    client: 'MMARIMA MMA'
  },
  {
    title: 'Mirch Hotel Keychains',
    category: 'Promotional Merchandise',
    image: '/images/IMG-20260617-WA0064.jpg',
    specs: { size: 'Standard', media: 'Acrylic & Wood', speed: '5 Days dispatch' },
    desc: 'Premium engraved keychains for hotel rooms, available in wood and frosted acrylic finishes.',
    review: 'These keychains add a luxurious touch to our guest experience.',
    client: 'Mirch Hotel Greece'
  }
];
