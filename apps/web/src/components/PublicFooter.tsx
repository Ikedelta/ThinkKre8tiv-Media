import Link from 'next/link';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { siteInfo } from '@/data/content';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Clean Row: Brand + Direct Links + Contact */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-slate-900">
          
          {/* Brand */}
          <div className="space-y-2 max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-white uppercase">
                <span>THINK</span> <span className="text-[#D22630]">KRE8TIV</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Commercial offset printing, custom rigid packaging, and large-format architectural signage in Accra, Ghana.
            </p>
          </div>

          {/* Clean Horizontal Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </nav>

          {/* Quick Contact & WhatsApp */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start gap-2 text-xs sm:text-sm">
            <a href="https://wa.me/233245559000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              <MessageCircle size={15} />
              <span>WhatsApp Us</span>
            </a>
            <a href={`tel:${siteInfo.contact.phone}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <Phone size={14} className="text-[#D22630]" />
              <span>{siteInfo.contact.phone}</span>
            </a>
            <a href={`mailto:${siteInfo.contact.email}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
              <Mail size={14} className="text-[#D22630]" />
              <span>{siteInfo.contact.email}</span>
            </a>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 pt-6">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 Think Kre8tiv Media Ltd.</span>
            <span className="hidden sm:inline text-slate-800">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <MapPin size={12} className="text-[#D22630]" /> Accra OSU, Haramani Sport
            </span>
            <span className="hidden sm:inline text-slate-800">•</span>
            <span className="text-slate-400">
              Developed by <span className="text-slate-300 font-medium">Tech 34 Systems</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            Mon – Fri: 08:00 – 17:00 GMT
          </div>
        </div>

      </div>
    </footer>
  );
}
