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

	const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition shadow-sm";
	const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";

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
				className="w-full px-4 py-2.5 rounded-lg bg-pink-500 text-white font-semibold text-sm hover:bg-pink-400 disabled:opacity-60 transition-colors shadow-md shadow-pink-900/50"
			>
				{pending ? "Signing in…" : "Sign in"}
			</button>
		</form>
	);
}
