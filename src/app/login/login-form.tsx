"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {signIn} from "@/lib/auth-client";

export function LoginForm() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		start(async () => {
			const res = await signIn.username({username, password});
			if (res.error) {
				toast.error(res.error.message ?? "Invalid username or password");
				return;
			}
			toast.success("Signed in");
			router.replace("/");
			router.refresh();
		});
	}

	const inputClass = "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 focus:bg-white transition";
	const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="username" className={labelClass}>Username</label>
				<input
					id="username"
					className={inputClass}
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>
			<div>
				<label htmlFor="password" className={labelClass}>Password</label>
				<input
					id="password"
					type="password"
					className={inputClass}
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<button
				type="submit"
				disabled={pending}
				className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 disabled:opacity-60 transition-colors"
			>
				{pending ? "Signing in…" : "Sign in"}
			</button>
		</form>
	);
}
