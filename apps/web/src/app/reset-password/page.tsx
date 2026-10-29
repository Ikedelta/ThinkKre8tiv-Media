'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, ChevronRight, CheckCircle2 } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-slate-200">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">Password Updated!</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mb-6">
          Your password has been changed successfully. You can now sign in with your new credentials.
        </p>
        <button
          onClick={() => router.push('/account/signin')}
          className="bg-[#001F3F] hover:bg-[#002a52] text-white font-semibold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs w-full sm:w-auto mx-auto cursor-pointer"
        >
          Sign In Now <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-slate-200">
        <h2 className="text-xl font-bold mb-2 text-rose-600">Invalid or Expired Link</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          This password reset link is invalid or missing the security token. Please ask your administrator to generate a new reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
      <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center mb-5">
        <Key size={22} />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">Set New Password</h3>
      <p className="text-xs sm:text-sm text-slate-500 font-normal mb-6">
        Please enter your new password below. Minimum 8 characters.
      </p>

      {error && (
        <div className="p-3 mb-5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">New Password *</label>
          <input
            required
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-lg px-3.5 py-2.5 text-xs outline-none text-slate-900 font-normal transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
          <input
            required
            type="password"
            placeholder="Type it again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#D22630] focus:ring-1 focus:ring-[#D22630] rounded-lg px-3.5 py-2.5 text-xs outline-none text-slate-900 font-normal transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#D22630] hover:bg-[#b81d26] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? 'Updating Password...' : 'Save New Password'} <ChevronRight size={14} />
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between overflow-x-hidden pt-16 sm:pt-20">
      <PublicNav />
      <div className="w-full max-w-md mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <Suspense fallback={<div className="text-center p-8 text-slate-500 text-xs">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <PublicFooter />
    </div>
  );
}
