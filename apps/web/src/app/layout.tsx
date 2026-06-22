import localFont from 'next/font/local';
import './global.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

const mtn = localFont({
  src: [
    {
      path: '../../public/fonts/MTNBrighterSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/MTNBrighterSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-mtn',
});

export const metadata = {
  title: 'Think Kre8tive | Premium Print & Branding Solutions',
  description:
    'Enterprise invoice and print management system for large format printing, branding, and professional printing services.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mtn.variable}`}>
      <body className="font-sans antialiased bg-white text-slate-900">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

