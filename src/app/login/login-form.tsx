"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {signIn} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

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

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="username">Username</Label>
				<Input
					id="username"
					autoComplete="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			<Button type="submit" disabled={pending} className="w-full">
				{pending ? "Signing in…" : "Sign in"}
			</Button>
		</form>
	);
}
