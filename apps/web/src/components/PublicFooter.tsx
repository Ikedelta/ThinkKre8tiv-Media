import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle, Clock, ChevronRight, ShieldCheck, Printer, Zap } from 'lucide-react';
import { siteInfo } from '@/data/content';

const exploreLinks = [
  { label: 'Home', href: '/' },
  { label: 'Commercial Services', href: '/services' },
  { label: 'Request a Print Job', href: '/submit' },
  { label: 'Track Order Status', href: '/track' },
  { label: 'About Think Kre8tiv', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

const serviceHighlights = [
  'Heidelberg Offset Printing',
  'Custom Rigid & Packaging Boxes',
  '3D Channel Signs & Lightboxes',
  'Corporate Apparel & Embroidery',
  'Vehicle & Fleet Branding',
  'Bespoke Notebooks & Stationery'
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900 relative overflow-hidden font-sans">
      {/* Top subtle brand hairline */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#D22630] to-transparent" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D22630]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-900 mb-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-1 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#D22630]/40 transition-colors">
                <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white uppercase flex items-center gap-1">
                  <span>THINK</span>
                  <span className="text-[#D22630]">KRE8TIV</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium -mt-0.5">
                  Media &bull; Commercial Printing
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-sm font-normal">
              Industrial commercial printing press, luxury rigid box fabrication, illuminated 3D architectural signage, and nationwide enterprise branding solutions in Accra, Ghana.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                <ShieldCheck size={13} className="text-[#D22630]" /> Quality Guaranteed
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                <Zap size={13} className="text-amber-400" /> Fast Turnarounds
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">Navigation</h4>
            <ul className="space-y-2">
              {exploreLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                    <ChevronRight size={12} className="text-slate-600 group-hover:text-[#D22630] transition-colors" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Core Specialties */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">Our Capabilities</h4>
            <ul className="space-y-2">
              {serviceHighlights.map((service) => (
                <li key={service} className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D22630]/70 shrink-0" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Corporate Office */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">Contact & Support</h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 text-[#D22630] shrink-0" />
                <span className="leading-snug">{siteInfo.contact.address}</span>
              </li>
              <li>
                <a href={`tel:${siteInfo.contact.phone}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone size={15} className="text-[#D22630] shrink-0" />
                  <span>{siteInfo.contact.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteInfo.contact.email}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail size={15} className="text-[#D22630] shrink-0" />
                  <span>{siteInfo.contact.email}</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/233245559000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                  <MessageCircle size={15} className="shrink-0" />
                  <span className="font-semibold">Chat on WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 Think Kre8tiv Media Ltd. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin size={11} className="text-[#D22630]" />
              <span>Accra, Ghana</span>
            </div>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span className="text-slate-400">Developed by <span className="text-slate-300 font-medium">Tech 34 Systems</span></span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock size={12} className="text-[#D22630]" />
              <span>Monday – Friday: 08:00 – 17:00 GMT</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
