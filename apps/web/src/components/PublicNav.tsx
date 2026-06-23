'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Printer, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Track Order', href: '/track' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed w-full top-0 left-0 z-50 transition-all duration-300 border-b",
      isScrolled 
        ? "bg-background/90 backdrop-blur-xl shadow-sm border-border/80 py-1.5 md:py-2" 
        : "bg-background/30 backdrop-blur-sm border-transparent py-3 md:py-4"
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "flex justify-between items-center transition-all duration-300",
          isScrolled ? "h-14 sm:h-16" : "h-18 sm:h-22"
        )}>
          <Link href="/" className="flex items-center group py-1">
            <img 
              src="/logo.png" 
              alt="Think Kre8tiv Printing Press Logo" 
              className={cn(
                "w-auto object-contain transition-all duration-300 group-hover:scale-105",
                isScrolled ? "h-12 sm:h-14" : "h-16 sm:h-20"
              )} 
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-xs lg:text-sm font-semibold transition-all duration-300 relative py-1.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-foreground after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center after:duration-300',
                  pathname === href 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            ))}
            
            <span className="w-px h-5 bg-border/60" />

            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-4.5 py-2.5 rounded-lg shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              Submit Print Job
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border px-4 py-6 space-y-1 shadow-xl">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 text-sm font-semibold py-2.5 px-3 rounded-lg transition-all duration-200',
                pathname === href ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <ChevronRight size={14} className="text-foreground" />
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex flex-col gap-3 mt-2">
            <Link href="/submit" onClick={() => setIsMenuOpen(false)}>
              <button className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity text-xs cursor-pointer">
                Submit Print Job
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
