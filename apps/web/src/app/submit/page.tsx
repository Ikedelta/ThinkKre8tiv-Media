'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Shield,
  Zap,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ChevronLeft,
  Printer,
  Sparkles,
  Layers,
  Palette,
  Truck,
  Award,
  UploadCloud,
  FileText,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { cn } from '@/lib/utils';

const servicesList = [
  { name: 'Digital Printing', icon: Layers, desc: 'Business cards, flyers, catalogs, reports' },
  { name: 'Corporate Branding', icon: Palette, desc: 'Notebooks, letterheads, branded apparel packs' },
  { name: 'Large Format Printing', icon: Printer, desc: 'Outdoor PVC banners, billboard prints, wraps' },
  { name: '3D Signage & Fabrication', icon: Sparkles, desc: 'LED storefront letters, custom lightboxes' },
];

const tabProducts: Record<string, string[]> = {
  'Digital Printing': ['Brochures', 'Booklets', 'Catalogs', 'Flyers', 'Business Cards', 'Envelopes'],
  'Corporate Branding': ['Notebooks', 'Letterheads', 'Branded Tees', 'Corporate Gift Bags', 'ID Cards'],
  'Large Format Printing': ['Roll-up Banner', 'Vinyl Stickers', 'PVC Banner', 'Storefront Backlit'],
  '3D Signage & Fabrication': ['Acrylic 3D Letters', 'Steel Channel Sign', 'Lightbox Profile', 'Pylon Sign']
};

const paperStocks: Record<string, string[]> = {
  'Digital Printing': ['150gsm Matte Art Paper', '300gsm Premium Art Card', '350gsm Premium Linen stock', '80gsm Bond Paper'],
  'Corporate Branding': ['Premium Executive Bond', 'Recycled Kraft Stock', 'Linen Texture Board'],
  'Large Format Printing': ['500gsm Heavy PVC Banner', 'Self-Adhesive Gloss Vinyl', 'Frosted Window Film'],
  '3D Signage & Fabrication': ['10mm Solid Acrylic Sheet', 'Alucobond Composite Panel', 'Galvanized Sheet Profile']
};

const colorModes = ['CMYK Full Color', 'Spot Pantone Color', 'Grayscale Black & White'];
const finishCoatings = ['Gloss Lamination', 'Matte Lamination', 'Spot UV Varnish', 'Gold Foil Stamping', 'No Coating'];

function SubmitPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Step states
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Form spec states
  const [service, setService] = useState('Digital Printing');
  const [product, setProduct] = useState('Brochures');
  const [paper, setPaper] = useState('150gsm Matte Art Paper');
  const [color, setColor] = useState('CMYK Full Color');
  const [finish, setFinish] = useState('Matte Lamination');
  const [qty, setQty] = useState(250);
  const [width, setWidth] = useState('1.0');
  const [height, setHeight] = useState('1.0');
  
  // File Uploader state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Submission results
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill parameters if arriving from the estimator widget
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const qtyParam = searchParams.get('qty');
    const finishParam = searchParams.get('finish');

    if (serviceParam) {
      // Find matching service in our list
      const matched = servicesList.find(s => s.name.toLowerCase() === serviceParam.toLowerCase());
      if (matched) {
        setService(matched.name);
        setProduct(tabProducts[matched.name][0]);
        setPaper(paperStocks[matched.name][0]);
      }
    }
    if (qtyParam) {
      setQty(parseInt(qtyParam, 10) || 250);
    }
    if (finishParam) {
      const matchedFinish = finishCoatings.find(f => f.toLowerCase() === finishParam.toLowerCase());
      if (matchedFinish) {
        setFinish(matchedFinish);
      }
    }
  }, [searchParams]);

  // Adjust product and stock defaults when service category changes
  const handleServiceChange = (newService: string) => {
    setService(newService);
    setProduct(tabProducts[newService][0]);
    setPaper(paperStocks[newService][0]);
  };

  // Drag and drop uploader handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Pricing draft estimator calculation
  const getEstimationTotal = () => {
    let base = 35;
    let unit = 0.40;

    if (service === 'Digital Printing') {
      if (product === 'Catalogs') unit = 1.15;
      else if (product === 'Booklets') unit = 0.75;
      else unit = 0.20;
    } else if (service === 'Corporate Branding') {
      base = 50;
      if (product === 'Notebooks') unit = 1.60;
      else unit = 0.85;
    } else if (service === 'Large Format Printing') {
      base = 45;
      const area = parseFloat(width) * parseFloat(height) || 1.0;
      unit = 35 * area;
    } else {
      base = 80;
      const area = parseFloat(width) * parseFloat(height) || 1.0;
      unit = 95 * area;
    }

    if (finish === 'Gold Foil Stamping') unit += 0.35;
    else if (finish === 'Spot UV Varnish') unit += 0.15;

    const sub = base + (unit * qty);
    let disc = 0;
    if (qty >= 1000) disc = 20;
    else if (qty >= 500) disc = 10;

    return Math.max(15, parseFloat((sub * (1 - disc / 100)).toFixed(2)));
  };

  const orderValue = getEstimationTotal();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      email,
      phone,
      company,
      address,
      product,
      paper,
      color,
      finish,
      qty,
      width: (service === 'Large Format Printing' || service === '3D Signage & Fabrication') ? parseFloat(width) : null,
      height: (service === 'Large Format Printing' || service === '3D Signage & Fabrication') ? parseFloat(height) : null,
      filename: file ? file.name : 'no-file-attached',
      notes,
      total: orderValue
    };

    try {
      const res = await fetch('/api/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      const returnedCode = data.tracking_code || `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setTrackingCode(returnedCode);

      // Save submission copy locally to simulate lookup persistence for local developers
      const localJobs = JSON.parse(localStorage.getItem('mock_print_jobs') || '[]');
      localJobs.push({
        id: data.id || 'mock-' + Date.now(),
        tracking_code: returnedCode,
        status: 'submitted',
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        product: product,
        specs: {
          paper,
          color,
          finish,
          qty,
          dimensions: (service === 'Large Format Printing' || service === '3D Signage & Fabrication') ? `${width}m x ${height}m` : 'Standard',
          filename: file ? file.name : 'no-file-attached'
        },
        total_amount: orderValue,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mock_print_jobs', JSON.stringify(localJobs));

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // Fallback code generation in case of local offline errors
      const fallbackCode = `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setTrackingCode(fallbackCode);
      
      const localJobs = JSON.parse(localStorage.getItem('mock_print_jobs') || '[]');
      localJobs.push({
        id: 'mock-' + Date.now(),
        tracking_code: fallbackCode,
        status: 'submitted',
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        product: product,
        specs: {
          paper,
          color,
          finish,
          qty,
          dimensions: (service === 'Large Format Printing' || service === '3D Signage & Fabrication') ? `${width}m x ${height}m` : 'Standard',
          filename: file ? file.name : 'no-file-attached'
        },
        total_amount: orderValue,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('mock_print_jobs', JSON.stringify(localJobs));

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStep2Valid = qty > 0 && (!file || uploadProgress === 100);
  const isStep3Valid = !!name && !!email && !!phone;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pt-20">
      <PublicNav />

      {/* Hero Banner Header */}
      <section className="relative py-14 bg-slate-50/40 border-b border-border/40 overflow-hidden">
        {/* CMYK Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00aeef] via-[#ec008c] via-[#fff200] to-[#000000]" />
        
        <div className="absolute top-4 left-4 text-muted-foreground/30 flex items-center gap-1 font-mono text-[8px] uppercase tracking-widest select-none pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-muted-foreground/20 relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
          <span>CMYK Alignment Plate A</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center space-y-4 pt-4">
          <span className="inline-flex items-center gap-1.5 bg-[#FCD20F] text-black font-extrabold text-[9px] uppercase tracking-widest px-3.5 py-1 rounded-full border border-black/5 shadow-sm">
            <UploadCloud size={11} /> File Submission Center
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
            Submit Print Work
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-xs sm:text-sm font-medium leading-relaxed">
            Send your print specifications and layout files directly to our press operators. No login or account signup required.
          </p>
        </div>
      </section>

      {/* Main Submission Wizard */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {submitted ? (
            /* Success Response Card */
            <div className="max-w-xl mx-auto bg-slate-50 border border-border/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#D22630]" />
              
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-250 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner select-none pointer-events-none">
                <CheckCircle2 size={40} />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Print Job Registered!</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                  Hi {name}, we have logged your layout request. Your files and specifications have been transferred to our press desk.
                </p>
              </div>

              {/* Tracking Code Presentation */}
              <div className="bg-white border border-border/80 rounded-2xl p-5 space-y-3 max-w-sm mx-auto shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your Tracking Code</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black text-[#D22630] tracking-wider">{trackingCode}</span>
                  <button 
                    onClick={copyTrackingCode}
                    className="p-2 hover:bg-slate-50 rounded-lg border border-border/40 text-slate-450 hover:text-foreground transition-colors cursor-pointer"
                    title="Copy tracking code"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/80 font-medium">Use this code at any time to monitor your print production status.</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push(`/track?code=${trackingCode}`)}
                  className="bg-[#D22630] hover:bg-[#D22630]/95 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Track Status Now <ChevronRight size={13} />
                </button>
                <button
                  onClick={() => {
                    removeFile();
                    setName('');
                    setEmail('');
                    setPhone('');
                    setCompany('');
                    setAddress('');
                    setNotes('');
                    setSubmitted(false);
                    setStep(1);
                  }}
                  className="bg-white hover:bg-muted text-foreground border border-border/85 font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Submit Another Job
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form Wizard Card */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left sidebar info columns */}
              <div className="lg:col-span-4 space-y-6">
                {/* Stepper Wizard Progress */}
                <div className="bg-slate-50/50 border border-border p-6 rounded-2xl space-y-6 shadow-sm">
                  <h3 className="font-extrabold text-muted-foreground text-[10px] uppercase tracking-widest">Submission Progress</h3>
                  <div className="space-y-4">
                    {[
                      { num: 1, name: 'Job Category' },
                      { num: 2, name: 'Specifications & Layout' },
                      { num: 3, name: 'Contact & Delivery' }
                    ].map((s) => (
                      <div key={s.num} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                          step === s.num
                            ? 'border-[#D22630] bg-[#D22630] text-white shadow-sm'
                            : step > s.num
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                              : 'border-border bg-slate-50 text-muted-foreground/60'
                        }`}>
                          {s.num}
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                          step === s.num ? 'text-foreground font-black' : 'text-muted-foreground/50'
                        }`}>{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimate Box card (Only visible on step 2 & 3) */}
                {step > 1 && (
                  <div className="bg-slate-50 border border-[#D22630]/20 p-6 rounded-2xl space-y-4 shadow-sm relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#D22630]/5 rounded-full -mr-8 -mt-8 filter blur-lg" />
                    <h4 className="font-bold text-xs uppercase tracking-widest text-[#D22630]">Press Estimate</h4>
                    <div className="space-y-2">
                      <div className="text-3xl font-black text-foreground tracking-tight">
                        ${orderValue} <span className="text-xs font-medium text-muted-foreground">USD</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground font-semibold leading-relaxed">
                        Pre-tax base estimation. Includes chosen GSM stocks and finishing coatings. Final setup review occurs at the proofing phase.
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Quality Promise */}
                <div className="bg-slate-50/50 border border-border p-6 rounded-2xl space-y-4 hidden lg:block shadow-sm">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-widest">Lithography Promise</h4>
                  <ul className="space-y-3.5 text-xs text-muted-foreground leading-relaxed font-semibold">
                    <li className="flex items-start gap-2.5">
                      <Clock size={13} className="text-[#D22630] mt-0.5 flex-shrink-0" />
                      <span>Pre-flight digital proof review in 2 hours.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Shield size={13} className="text-[#D22630] mt-0.5 flex-shrink-0" />
                      <span>Margins, bleed, and color registration checks.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Zap size={13} className="text-[#D22630] mt-0.5 flex-shrink-0" />
                      <span>SMS tracking alerts sent to your phone.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Panel Wizard form */}
              <div className="lg:col-span-8">
                <form onSubmit={handleFormSubmit} className="bg-background border border-border/80 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between min-h-[450px] space-y-8 relative overflow-hidden">
                  
                  {/* Step 1: Select Category */}
                  {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Choose Job Category</h3>
                        <p className="text-xs text-muted-foreground">Select the primary style of print asset you are submitting.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {servicesList.map((s) => {
                          const Icon = s.icon;
                          const isSelected = service === s.name;
                          return (
                            <div
                              key={s.name}
                              onClick={() => {
                                handleServiceChange(s.name);
                                setStep(2); // Auto advance to specifications
                              }}
                              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 hover:translate-y-[-2px] hover:shadow-md ${
                                isSelected
                                  ? 'bg-[#D22630]/5 border-[#D22630] text-foreground'
                                  : 'bg-background border-border hover:border-[#D22630]/40'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-[#D22630] text-white' : 'bg-slate-100 text-muted-foreground'
                              }`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <p className="font-extrabold text-xs text-foreground leading-tight">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 leading-normal">{s.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Specifications & File Upload */}
                  {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Print Specifications</h3>
                        <p className="text-xs text-muted-foreground">Set paper stock options and attach your graphics layouts.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Dynamic Product Item Selector */}
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Item Type</label>
                          <select
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3 py-3 text-xs outline-none text-foreground font-bold"
                          >
                            {tabProducts[service].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        {/* Paper stock selector */}
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Paper / Material Stock</label>
                          <select
                            value={paper}
                            onChange={(e) => setPaper(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3 py-3 text-xs outline-none text-foreground font-bold"
                          >
                            {paperStocks[service].map((stock) => (
                              <option key={stock} value={stock}>{stock}</option>
                            ))}
                          </select>
                        </div>

                        {/* Color space setup select */}
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Color Space</label>
                          <select
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3 py-3 text-xs outline-none text-foreground font-bold"
                          >
                            {colorModes.map((cm) => (
                              <option key={cm} value={cm}>{cm}</option>
                            ))}
                          </select>
                        </div>

                        {/* Finish Coating Select */}
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Finish Coating</label>
                          <select
                            value={finish}
                            onChange={(e) => setFinish(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3 py-3 text-xs outline-none text-foreground font-bold"
                          >
                            {finishCoatings.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dimensions (Only for Large Format & 3D Signage) */}
                        {(service === 'Large Format Printing' || service === '3D Signage & Fabrication') && (
                          <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4 animate-fade-in">
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Width (meters)</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-2.5 text-xs outline-none text-foreground font-bold text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Height (meters)</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-4 py-2.5 text-xs outline-none text-foreground font-bold text-center"
                              />
                            </div>
                          </div>
                        )}

                        {/* Quantity Runs */}
                        <div className="col-span-1 sm:col-span-2">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quantity Runs</label>
                            <span className="text-xs font-extrabold text-[#D22630] bg-[#D22630]/5 px-2.5 py-0.5 rounded">{qty} Units</span>
                          </div>
                          <input
                            type="range"
                            min={service === '3D Signage & Fabrication' || service === 'Large Format Printing' ? 1 : 100}
                            max={service === '3D Signage & Fabrication' || service === 'Large Format Printing' ? 100 : 5000}
                            step={service === '3D Signage & Fabrication' || service === 'Large Format Printing' ? 1 : 100}
                            value={qty}
                            onChange={(e) => setQty(parseInt(e.target.value) || 100)}
                            className="w-full accent-[#D22630] cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Drag & Drop File Uploader */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Design Layout File (PDF, AI, PSD, ZIP, PNG)</label>
                        
                        {file ? (
                          /* Selected file status container */
                          <div className="border border-border/80 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4 animate-fade-in">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-foreground truncate leading-tight">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            
                            {uploading ? (
                              /* Upload progress visual check */
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-[#D22630]">{uploadProgress}%</p>
                                  <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-[#D22630] transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Upload success & remove actions */
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                                  Ready
                                </span>
                                <button
                                  type="button"
                                  onClick={removeFile}
                                  className="p-2 hover:bg-red-50 text-slate-350 hover:text-red-500 rounded-lg border border-border/40 transition-colors cursor-pointer"
                                  title="Remove file"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Drag area uploader */
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-3",
                              dragActive 
                                ? "border-[#D22630] bg-[#D22630]/5 scale-[0.99]" 
                                : "border-border hover:border-[#D22630]/35 hover:bg-slate-50/40"
                            )}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.ai,.psd,.zip,.png,.jpg,.jpeg"
                              className="hidden"
                            />
                            <div className="w-12 h-12 bg-slate-50 border border-border rounded-full flex items-center justify-center text-slate-400">
                              <UploadCloud size={20} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-foreground">Drag and drop file here, or browse</p>
                              <p className="text-[10px] text-muted-foreground font-semibold">Maximum upload size: 100MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact details & instructions */}
                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Contact & Dispatch</h3>
                        <p className="text-xs text-muted-foreground">Provide delivery targets and communication channels.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Full Name *</label>
                          <input
                            required
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email Coordinate *</label>
                          <input
                            required
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Phone Coordinate *</label>
                          <input
                            required
                            type="text"
                            placeholder="+233 24 000 0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Company Name</label>
                          <input
                            type="text"
                            placeholder="e.g. ECG Ltd."
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Delivery Address</label>
                          <input
                            type="text"
                            placeholder="Osu Oxford Street, Accra (leave blank for self-collection)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Production Notes & Instructions</label>
                          <textarea
                            rows={3}
                            placeholder="Specify layout margins, vector requirements, custom packaging structures..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-background border border-border focus:border-[#D22630] rounded-xl px-3.5 py-2.5 text-xs outline-none text-foreground font-semibold resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form wizard buttons footer */}
                  <div className="flex justify-between gap-3 pt-6 border-t border-border mt-4">
                    <button
                      type="button"
                      disabled={step === 1}
                      onClick={handleBack}
                      className="border border-border bg-white hover:bg-muted text-foreground px-5 py-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    
                    {step < 3 ? (
                      <button
                        type="button"
                        disabled={step === 2 && !isStep2Valid}
                        onClick={handleNext}
                        className="bg-[#D22630] hover:bg-[#D22630]/95 text-white font-bold px-6 py-3 rounded-lg text-xs transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        Next Step <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading || !isStep3Valid}
                        className="bg-[#D22630] hover:bg-[#D22630]/95 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all flex items-center gap-1 shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Registering Job...' : 'Submit Print Job'} <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>

                </form>
              </div>

            </div>
          )}

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">Loading Submission Desk...</div>}>
      <SubmitPageContent />
    </Suspense>
  );
}
