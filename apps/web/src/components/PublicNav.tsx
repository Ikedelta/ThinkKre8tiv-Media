'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Printer, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed w-full top-0 left-0 z-50 transition-all duration-200",
      isScrolled 
        ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200 dark:border-slate-800 py-2 sm:py-2.5" 
        : "bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 py-2.5 sm:py-3"
    )}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-13">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group py-0.5">
            <div className="relative p-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-transform group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Think Kre8tiv Logo" 
                className={cn(
                  "w-auto object-contain transition-all duration-200",
                  isScrolled ? "h-8 sm:h-9" : "h-9 sm:h-10"
                )} 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-950 dark:text-white uppercase flex items-center gap-1 leading-tight">
                <span>THINK</span>
                <span className="text-[#D22630]">
                  KRE8TIV
                </span>
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Media &bull; Commercial Printing
              </span>
            </div>
          </Link>

          {/* Systematic Center/Right Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              {navLinks.map(({ label, href }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-200',
                      isActive 
                        ? 'bg-white dark:bg-slate-800 text-[#D22630] font-bold shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-[#D22630] hover:bg-[#b81d26] text-white px-4 py-2 rounded-lg shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu backdrop & drawer */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="relative md:hidden bg-white border-t border-slate-200 px-5 py-6 space-y-1 shadow-2xl z-50 animate-in slide-in-from-top-3 duration-200">
            {navLinks.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center justify-between text-sm font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.99]',
                    isActive 
                      ? 'text-[#D22630] bg-[#D22630]/8 font-bold' 
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-base">{label}</span>
                  <ChevronRight size={18} className={isActive ? 'text-[#D22630]' : 'text-slate-400'} />
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3 mt-4">
              <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full h-11 bg-[#D22630] hover:bg-[#b81d26] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all active:scale-[0.99]">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
