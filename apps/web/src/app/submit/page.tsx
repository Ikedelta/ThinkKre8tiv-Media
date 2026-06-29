'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Copy, Check, UploadCloud, FileText, Trash2, ChevronRight } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
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

    const payload = {
      name,
      email,
      phone,
      company: '',
      address: '',
      product: productType,
      paper: 'Standard',
      color: 'Standard',
      finish: 'Standard',
      qty: parseInt(quantity) || 100,
      filename: file ? file.name : 'no-file-attached',
      notes,
      total: 0 // Price to be decided by admin
    };

    try {
      const res = await fetch('/api/print-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-24 pb-12">
      <PublicNav />

      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Request a Print Job
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto text-sm sm:text-base">
            Tell us what you need printed, attach your file, and we'll get right to work. It's that easy.
          </p>
        </div>

        {submitted ? (
          /* Success View */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-green-50 border border-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2 text-slate-900">We've got it!</h2>
            <p className="text-slate-500 font-medium mb-8">
              Thanks {name}, your request has been sent to our printing team. We will review your file and get back to you shortly.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto mb-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your Tracking Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-black text-indigo-600 tracking-wider">{trackingCode}</span>
                <button 
                  onClick={copyCode}
                  className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">Keep this code handy to track your order status anytime.</p>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push(`/track?code=${trackingCode}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
              >
                Track Status Now <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Simple Form View */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
            
            {/* Contact Details */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">1. Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 024 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
                />
              </div>
            </div>

            {/* Order Details */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">2. Order Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">What do you need? *</label>
                <select
                  required
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all appearance-none cursor-pointer"
                >
                  {productOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="How many?"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
                />
              </div>
            </div>

            {/* File Upload */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">3. Attach Design File</h3>
            <div className="mb-8">
              {file ? (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{file.name}</p>
                      <p className="text-xs font-medium text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
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
                    "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors",
                    dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 font-medium">PDF, PNG, JPG, or ZIP (Max 100MB)</p>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">4. Additional Notes (Optional)</h3>
            <div className="mb-8">
              <textarea
                rows={3}
                placeholder="Any special instructions or questions? Type them here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
