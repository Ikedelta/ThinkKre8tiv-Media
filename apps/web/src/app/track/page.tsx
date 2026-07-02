'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Shield,
  Layers,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  RotateCcw,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { cn } from '@/lib/utils';

const trackingStages = [
  { id: 'submitted', label: 'Order Received', desc: 'We have received your order details' },
  { id: 'proofing', label: 'Reviewing', desc: 'Checking artwork and files' },
  { id: 'printing', label: 'In Production', desc: 'Your order is currently being printed' },
  { id: 'finishing', label: 'Finishing', desc: 'Adding final touches and quality check' },
  { id: 'completed', label: 'Ready', desc: 'Ready for pickup or delivery' }
];

function TrackPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [code, setCode] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [job, setJob] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle URL query code prefill
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
      setSearchVal(codeParam);
      fetchJobStatus(codeParam);
    }
  }, [searchParams]);

  const fetchJobStatus = async (trackingCode: string) => {
    setLoading(true);
    setErrorMsg('');
    setJob(null);

    try {
      // First, check local storage mock fallback (perfect for offline development)
      const localJobs = JSON.parse(localStorage.getItem('mock_print_jobs') || '[]');
      const localJob = localJobs.find((j: any) => j.tracking_code.toLowerCase() === trackingCode.toLowerCase().trim());
      
      if (localJob) {
        setJob(localJob);
        setLoading(false);
        return;
      }

      // Query standard API route
      const res = await fetch(`/api/print-jobs?code=${encodeURIComponent(trackingCode.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setJob(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Tracking code not recognized. Check the spelling or submit a new job.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    
    // Update URL parameter
    router.push(`/track?code=${encodeURIComponent(searchVal.trim())}`);
  };

  // Determine stage visual index
  const getActiveIndex = () => {
    if (!job) return 0;
    return trackingStages.findIndex(s => s.id === job.status);
  };

  const activeIndex = getActiveIndex();

  const getProgressPercentage = () => {
    if (!job) return 0;
    const stagesPct = [15, 40, 65, 85, 100];
    return stagesPct[activeIndex] || 15;
  };

  const progressPct = getProgressPercentage();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pt-20">
      <PublicNav />

      {/* Header Banner */}
      <section className="py-12 bg-slate-50 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3 pt-4">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Track Your Order
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-md mx-auto">
            Enter your tracking code below to see the current status of your order.
          </p>
        </div>
      </section>

      {/* Search Input bar */}
      <section className="py-10 bg-background border-b border-border/40">
        <div className="max-w-xl mx-auto px-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                required
                type="text"
                placeholder="Enter tracking code (e.g. TK-2026-8291)..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-border/80 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#D22630]/20 focus:border-[#D22630] outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#D22630] hover:bg-[#D22630]/95 text-white font-bold px-6 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Lookup Status section */}
      <section className="py-16 bg-slate-50/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#D22630] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-semibold">Finding your order...</p>
            </div>
          )}

          {errorMsg && (
            <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 shadow-sm animate-fade-in">
              <HelpCircle className="text-red-500 mx-auto" size={32} />
              <h3 className="font-extrabold text-sm text-red-800 uppercase tracking-wider">No Record Found</h3>
              <p className="text-xs text-red-650 font-semibold leading-relaxed">{errorMsg}</p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setErrorMsg('');
                    setSearchVal('');
                    router.push('/track');
                  }}
                  className="bg-white border border-red-200 text-red-700 hover:bg-red-50 text-[10px] font-extrabold uppercase px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}

          {!loading && !errorMsg && !job && (
            /* Idle landing */
            <div className="max-w-md mx-auto border border-border border-dashed rounded-2xl p-10 text-center space-y-4 bg-background">
              <Layers className="text-muted-foreground/35 mx-auto" size={40} />
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Ready to Track</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium leading-relaxed">
                  Enter your tracking code to see the current status of your order.
                </p>
              </div>
            </div>
          )}

          {!loading && !errorMsg && job && (
            /* Visual Tracking Dashboard */
            <div className="space-y-12 animate-fade-in">
              
              {/* Stepper Timeline Box */}
              <div className="bg-background border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/60 pb-5 gap-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-white bg-[#00aeef] px-2.5 py-0.5 rounded uppercase tracking-wider">
                      Status Update
                    </span>
                    <h3 className="text-lg font-black text-foreground mt-1.5 tracking-tight">
                      Order Progress: <span className="text-[#D22630] font-mono font-black">{job.tracking_code}</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order Total</p>
                    <p className="text-xl font-black text-foreground mt-0.5">${job.total_amount || 0} USD</p>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="relative pt-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00aeef] via-[#ec008c] to-[#fff200] transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground font-semibold mt-2">
                    <span>Submitted ({progressPct}%)</span>
                    <span>Completed</span>
                  </div>
                </div>

                {/* Tracking Stepper Timeline Cards (Horizontal layout on large screens, vertical on mobile) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
                  {trackingStages.map((stage, idx) => {
                    const isDone = idx < activeIndex;
                    const isActive = idx === activeIndex;
                    const isUpcoming = idx > activeIndex;

                    return (
                      <div 
                        key={stage.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all duration-300",
                          isActive 
                            ? "bg-slate-50 border-[#D22630] shadow-md scale-[1.01]" 
                            : isDone 
                              ? "bg-emerald-50/20 border-emerald-100" 
                              : "bg-background border-border/60 opacity-60"
                        )}
                      >
                        <div className="flex items-start md:flex-col justify-between gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0",
                            isActive 
                              ? "border-[#D22630] bg-[#D22630] text-white animate-pulse" 
                              : isDone 
                                ? "border-emerald-500 bg-emerald-500 text-white" 
                                : "border-border bg-slate-50 text-muted-foreground/60"
                          )}>
                            {isDone ? "✓" : idx + 1}
                          </div>
                          
                          <div className="md:mt-3 flex-1">
                            <h4 className="font-extrabold text-[10px] sm:text-xs text-foreground leading-tight tracking-tight">{stage.label}</h4>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold leading-normal mt-1">{stage.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Specification details panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Product Specifications Card */}
                <div className="lg:col-span-2 bg-background border border-border/80 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-border/60">
                    <FileText size={18} className="text-slate-400" />
                    <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Order Details</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs font-semibold">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Print item</p>
                      <p className="text-sm font-black text-foreground">{job.product}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Quantity</p>
                      <p className="text-sm font-black text-foreground">{job.specs?.qty} units</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Material</p>
                      <p className="text-foreground">{job.specs?.paper || 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Color</p>
                      <p className="text-foreground">{job.specs?.color || 'CMYK Full Color'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Finishing</p>
                      <p className="text-foreground">{job.specs?.finish || 'No coating'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Dimensions</p>
                      <p className="text-foreground">{job.specs?.dimensions || 'Standard format'}</p>
                    </div>
                    <div className="col-span-2 pt-2 pb-1 border-t border-border/40">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Design File</p>
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-border/80 px-3 py-1.5 rounded-lg text-[10px] text-foreground font-bold">
                        <FileText size={12} className="text-slate-450" />
                        <span>{job.specs?.filename || 'no-file-attached.pdf'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact coordinates & Status Card */}
                <div className="bg-background border border-border/80 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-4 border-b border-border/60">
                      <Shield size={17} className="text-slate-450" />
                      <h3 className="font-black text-sm text-foreground uppercase tracking-wider">Contact Information</h3>
                    </div>

                    <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5">Submitted By</p>
                        <p className="text-foreground font-black text-sm">{job.customer_name}</p>
                      </div>
                      
                      {job.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} />
                          <span>{job.customer_phone}</span>
                        </div>
                      )}

                      {job.customer_email && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} />
                          <span className="truncate">{job.customer_email}</span>
                        </div>
                      )}

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5">Submitted Date</p>
                        <p className="text-foreground">{job.created_at?.split('T')[0]} @ {job.created_at?.split('T')[1]?.substring(0, 5) || '08:00'}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setJob(null);
                      setErrorMsg('');
                      setSearchVal('');
                      router.push('/track');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl border border-border text-xs transition-colors cursor-pointer mt-6"
                  >
                    <RotateCcw size={12} /> Track Another Order
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading...</div>}>
      <TrackPageContent />
    </Suspense>
  );
}
