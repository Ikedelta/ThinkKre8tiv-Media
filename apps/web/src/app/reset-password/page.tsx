'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Key, ChevronRight, CheckCircle2 } from 'lucide-react';
import PublicNav from '@/components/PublicNav';

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
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-200">
        <div className="w-20 h-20 bg-green-50 border border-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2 text-slate-900">Password Reset!</h2>
        <p className="text-slate-500 font-medium mb-8">
          Your password has been updated successfully. You can now log in with your new password.
        </p>
        <button
          onClick={() => router.push('/sign-in')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto mx-auto"
        >
          Go to Sign In <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black mb-2 text-rose-600">Invalid Link</h2>
        <p className="text-slate-500 font-medium">
          The password reset link is invalid or missing the security token. Please request a new link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
      <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-6">
        <Key size={28} />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2">Set New Password</h3>
      <p className="text-slate-500 font-medium mb-8">
        Please enter your new secure password below.
      </p>

      {error && (
        <div className="p-4 mb-6 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password *</label>
          <input
            required
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password *</label>
          <input
            required
            type="password"
            placeholder="Type it again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-900 font-medium transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? 'Updating...' : 'Update Password'} <ChevronRight size={16} />
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-24 pb-12">
      <PublicNav />
      <div className="max-w-md mx-auto px-4 mt-8">
        <Suspense fallback={<div className="text-center p-8 text-slate-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
