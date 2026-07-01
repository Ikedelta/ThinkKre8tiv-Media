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
    <footer className="bg-background text-foreground/80 pt-20 pb-10 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-16 border-b border-border mb-10">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Think Kre8tiv Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-extrabold tracking-tight text-foreground">
                THINK <span className="text-primary font-bold">KRE8TIV</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
              Premium Printing, Commercial Packaging, and Large Format Signage. Trusted by visionary brands across West Africa for high-impact print branding since 2012.
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-5">Explore</h4>
            <ul className="space-y-3">
              {exploreLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-foreground transition-colors flex items-center gap-1 group text-muted-foreground">
                    <ChevronRight size={12} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-foreground" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-5">Contact</h4>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 text-foreground shrink-0" />
                <span>{siteInfo.contact.address}</span>
              </li>
              <li>
                <a href={`tel:${siteInfo.contact.phone}`} className="flex items-center gap-2.5 hover:text-foreground transition-colors">
                  <Phone size={15} className="text-foreground shrink-0" />
                  <span>{siteInfo.contact.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteInfo.contact.email}`} className="flex items-center gap-2.5 hover:text-foreground transition-colors">
                  <Mail size={15} className="text-foreground shrink-0" />
                  <span>{siteInfo.contact.email}</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/233245559000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-foreground transition-colors">
                  <MessageCircle size={15} className="text-foreground shrink-0" />
                  <span>WhatsApp Chat</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground/60">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span>© 2026 Think Kre8tiv Media Ltd. All Rights Reserved.</span>
            <span className="hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <MapPin size={10} />
              <span>Accra · Kumasi · Takoradi</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Mon – Fri, 8:00 – 17:00</span>
            </span>
            <Link
              href="/admin"
              className="px-3.5 py-1.5 bg-secondary hover:bg-muted text-foreground border border-border rounded-full text-[10px] font-semibold transition-all"
            >
              Dev Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
