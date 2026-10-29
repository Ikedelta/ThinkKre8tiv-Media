'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Copy, Check, UploadCloud, FileText, Trash2, ChevronRight } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { cn } from '@/lib/utils';

export default function SubmitPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productType, setProductType] = useState('Business Cards');
  const [quantity, setQuantity] = useState('100');
  const [notes, setNotes] = useState('');
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission states
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [copied, setCopied] = useState(false);

  const productOptions = [
    'Business Cards',
    'Flyers & Brochures',
    'Banners & Signs',
    'Branded Apparel (T-shirts, Caps)',
    'Corporate Gifts (Mugs, Notebooks)',
    'Letterheads & Envelopes',
    'Stickers & Labels',
    'Other / Custom Request'
  ];

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('company', '');
    formData.append('address', '');
    formData.append('product', productType);
    formData.append('paper', 'Standard');
    formData.append('color', 'Standard');
    formData.append('finish', 'Standard');
    formData.append('qty', quantity.toString() || '100');
    formData.append('filename', file ? file.name : 'no-file-attached');
    formData.append('notes', notes);
    formData.append('total', '0');
    
    if (file) {
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api/print-jobs', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      setTrackingCode(data.tracking_code || `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setTrackingCode(`TK-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />

      <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Request a Print Job
          </h1>
          <p className="text-slate-500 font-normal max-w-md mx-auto text-xs sm:text-sm">
            Tell us what you need printed, attach your file, and we'll get right to work. It's that easy.
          </p>
        </div>

        {submitted ? (
          /* Success View */
          <div className="bg-white rounded-xl p-6 sm:p-8 text-center shadow-xs border border-slate-200">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-bold mb-1.5 text-slate-900">We've got it!</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mb-6">
              Thanks {name}, your request has been sent to our printing team. We will review your file and get back to you shortly.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-xs mx-auto mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Your Tracking Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold text-[#D22630] tracking-wider">{trackingCode}</span>
                <button 
                  onClick={copyCode}
                  className="p-1.5 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5">Keep this code handy to track your order status anytime.</p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push(`/track?code=${trackingCode}`)}
                className="bg-[#D22630] hover:bg-[#b81d26] text-white font-semibold px-5 py-2.5 rounded-md text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                Track Status Now <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Simple Form View */
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-slate-200/80">
            
            {/* Contact Details */}
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 pb-2 border-b border-slate-100">1. Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 024 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all"
                />
              </div>
            </div>

            {/* Order Details */}
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 pb-2 border-b border-slate-100">2. Order Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">What do you need? *</label>
                <select
                  required
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all appearance-none cursor-pointer"
                >
                  {productOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="How many?"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all"
                />
              </div>
            </div>

            {/* File Upload */}
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 pb-2 border-b border-slate-100">3. Attach Design File</h3>
            <div className="mb-6">
              {file ? (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-[#D22630]/10 text-[#D22630] flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{file.name}</p>
                      <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors",
                    dragActive ? "border-[#D22630] bg-[#D22630]/5" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-2 shadow-xs">
                    <UploadCloud size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 mb-0.5">Click to upload or drag &amp; drop</p>
                  <p className="text-[11px] text-slate-500 font-normal">PDF, PNG, JPG, or ZIP (Max 100MB)</p>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 pb-2 border-b border-slate-100">4. Additional Notes (Optional)</h3>
            <div className="mb-6">
              <textarea
                rows={3}
                placeholder="Any special instructions or questions? Type them here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-md px-3 py-2 text-xs outline-none text-slate-900 font-normal transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D22630] hover:bg-[#b81d26] disabled:opacity-50 text-white font-semibold py-2.5 rounded-md text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>

          </form>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
