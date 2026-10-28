import Link from 'next/link';
import { Printer, MapPin, Phone, Mail, MessageCircle, Clock, ChevronRight } from 'lucide-react';
import { siteInfo } from '@/data/content';

const exploreLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Submit Print Job', href: '/submit' },
  { label: 'Track Order Status', href: '/track' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900 mb-10">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-9 h-9 object-contain" />
              <span className="text-lg font-bold tracking-tight text-white uppercase">
                Think <span className="text-primary">Kre8tiv</span> Media
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-md font-normal">
              Enterprise Commercial Printing, Large-Format Signage Fabrication, and Packaging Solutions. Delivering high-precision industrial output for institutions and visionary brands across West Africa.
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5">
              {exploreLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight size={13} className="text-slate-600 group-hover:text-primary transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Corporate Office</h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 text-primary shrink-0" />
                <span>{siteInfo.contact.address}</span>
              </li>
              <li>
                <a href={`tel:${siteInfo.contact.phone}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone size={15} className="text-primary shrink-0" />
                  <span>{siteInfo.contact.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteInfo.contact.email}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail size={15} className="text-primary shrink-0" />
                  <span>{siteInfo.contact.email}</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/233245559000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <MessageCircle size={15} className="text-primary shrink-0" />
                  <span>Corporate WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>© 2026 Think Kre8tiv Media Ltd. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin size={11} className="text-primary" />
              <span>Accra Osu Operations</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock size={12} className="text-primary" />
              <span>Operating Hours: 08:00 – 17:00 GMT</span>
            </span>
            <Link
              href="/admin"
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] font-medium transition-colors"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
