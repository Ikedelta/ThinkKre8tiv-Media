'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, ChevronRight, CheckCircle2, User, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

interface TargetUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    let isMounted = true;
    fetch(`/api/reset-password/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.valid && data.user) {
          setTargetUser(data.user);
        } else {
          setError(data.error || 'This reset link has expired or is invalid.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error verifying reset token');
      })
      .finally(() => {
        if (isMounted) setVerifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

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

  if (verifying) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-xs border border-slate-200 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D22630] mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Verifying security token...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-slate-200">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">Password Updated!</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mb-6">
          Password has been changed successfully for <strong>{targetUser?.name || 'your account'}</strong>. You can now sign in with your new credentials.
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

  if (!token || (!targetUser && error)) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-10 text-center shadow-xs border border-slate-200 space-y-3">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Invalid or Expired Link</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          {error || 'This password reset link is invalid or missing the security token. Please ask your administrator to generate a new reset link.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push('/account/signin')}
            className="text-xs font-bold text-[#D22630] hover:underline cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
      <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center mb-5">
        <Key size={22} />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Set New Password</h3>
      <p className="text-xs text-slate-500 font-normal mb-5">
        Create a secure new password for this user account.
      </p>

      {/* Prominent User Identity Banner */}
      {targetUser && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#D22630]/10 text-[#D22630] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#D22630]/20">
            {targetUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 truncate">{targetUser.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                {targetUser.role || 'User'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail size={12} className="shrink-0 text-slate-400" /> {targetUser.email}
            </p>
          </div>
        </div>
      )}

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
