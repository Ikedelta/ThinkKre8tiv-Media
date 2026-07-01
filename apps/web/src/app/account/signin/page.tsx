/**
 * ⚠ ANYTHING PLATFORM — DO NOT REWRITE THIS FILE ⚠
 *
 * Shipped v2 auth scaffolding. Same contract as signup/page.tsx: <form
 * onSubmit>, e.preventDefault(), and window.location.href redirect are all
 * load-bearing for the mobile WebView. DO NOT replace <form onSubmit> with
 * <button onClick> — that broke signin platform-wide in a prior AI rewrite.
 *
 *   Safe:   restyle, rewrite copy, add form fields.
 *   Unsafe: replacing <form>, removing preventDefault, bypassing
 *           authClient.signIn.email, changing the callbackUrl redirect.
 */
"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

function SignInForm() {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const { error: signInError } = await authClient.signIn.email({
			email,
			password,
		});

		if (signInError) {
			setError(signInError.message ?? "Sign in failed");
			setLoading(false);
			return;
		}

		if (typeof window !== "undefined") {
			window.location.href = callbackUrl;
		} else {
			console.warn(
				"signin: window is undefined; cannot redirect to callbackUrl",
			);
		}
	};

	return (
		<main className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans p-4">
			<div className="w-full max-w-[400px]">
				{/* Header */}
				<div className="flex flex-col items-center justify-center mb-8 text-center">
					<img src="/logo.png" alt="Think Kre8tiv Media" className="w-16 h-16 object-contain mb-6" />
					<h1 className="text-2xl font-bold text-slate-900 mb-1.5">
						Welcome back
					</h1>
					<p className="text-sm text-slate-500">
						Please sign in to your account
					</p>
				</div>

				{/* Simple Form Card */}
				<form
					onSubmit={(e) => {
						void onSubmit(e);
					}}
					className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5"
				>
					<div className="space-y-4">
						{/* Email Input */}
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">
								Email
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
									<Mail size={16} />
								</div>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@thinkkre8tivmedia.com"
									className="w-full rounded-lg border border-slate-300 bg-white p-2.5 pl-10 text-sm text-slate-900 outline-none transition-all focus:border-[#E04D1B] focus:ring-1 focus:ring-[#E04D1B]"
								/>
							</div>
						</div>

						{/* Password Input */}
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
									<Lock size={16} />
								</div>
								<input
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full rounded-lg border border-slate-300 bg-white p-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-[#E04D1B] focus:ring-1 focus:ring-[#E04D1B]"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>
					</div>

					{error && (
						<div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full flex justify-center items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 p-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Signing in...
							</>
						) : (
							<>
								Sign in
								<ArrowRight size={16} />
							</>
						)}
					</button>
				</form>

				{/* Footer */}
				<div className="mt-8 text-center">
					<p className="text-xs text-slate-400">
						Developed by Tech34 Systems
					</p>
				</div>
			</div>
		</main>
	);
}

export default function SignInPage() {
	return (
		<Suspense>
			<SignInForm />
		</Suspense>
	);
}
