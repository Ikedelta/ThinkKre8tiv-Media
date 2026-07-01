/**
 * ⚠ ANYTHING PLATFORM — DO NOT REWRITE THIS FILE ⚠
 *
 * Shipped v2 auth scaffolding. The <form onSubmit>, e.preventDefault(), and
 * window.location.href redirect are load-bearing for the mobile WebView auth
 * flow (AuthWebView intercepts the navigation to capture the session). A
 * prior AI rewrite replaced <form onSubmit> with <button onClick> and broke
 * signup platform-wide — "credentials cleared" / "button does nothing" for
 * every user until a human reverted it. DO NOT repeat that mistake.
 *
 *   Safe:   restyle, rewrite copy, add form fields (pass `name` explicitly).
 *   Unsafe: replacing <form>, removing preventDefault, bypassing
 *           authClient.signUp.email, changing the callbackUrl redirect.
 */
"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { SocialSignInButtons } from "@/components/SocialSignInButtons";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff } from "lucide-react";

function SignUpForm() {
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

		// The server backfills `name` from the email local-part when it's missing,
		// so email + password is enough.
		const { error: signUpError } = await authClient.signUp.email({
			email,
			password,
			name: "",
		});

		if (signUpError) {
			setError(signUpError.message ?? "Sign up failed");
			setLoading(false);
			return;
		}

		if (typeof window !== "undefined") {
			window.location.href = callbackUrl;
		} else {
			console.warn(
				"signup: window is undefined; cannot redirect to callbackUrl",
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
						Create account
					</h1>
					<p className="text-sm text-slate-500">
						Register to access the admin portal
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
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									className="w-full rounded-lg border border-slate-300 bg-white p-2.5 px-4 text-sm text-slate-900 outline-none transition-all focus:border-[#E04D1B] focus:ring-1 focus:ring-[#E04D1B]"
								/>
							</div>
						</div>

						{/* Password Input */}
						<div className="space-y-1.5">
							<label className="text-sm font-semibold text-slate-700">
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									required
									minLength={8}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full rounded-lg border border-slate-300 bg-white p-2.5 px-4 pr-10 text-sm text-slate-900 outline-none transition-all focus:border-[#E04D1B] focus:ring-1 focus:ring-[#E04D1B]"
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
						{loading ? "Creating account…" : "Sign Up"}
					</button>

					<div className="pt-2">
						<SocialSignInButtons callbackUrl={callbackUrl} />
					</div>

					<div className="pt-4 text-center border-t border-slate-100">
						<a
							href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
							className="text-center text-sm text-slate-600 hover:text-slate-900 font-medium"
						>
							Already have an account? Sign in
						</a>
					</div>
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

export default function SignUpPage() {
	return (
		<Suspense>
			<SignUpForm />
		</Suspense>
	);
}
