"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {signOut} from "@/lib/auth-client";

export function TicketSignOutButton() {
	const router = useRouter();
	const [pending, start] = useTransition();
	return (
		<button
			type="button"
			className="text-xs underline underline-offset-4 hover:text-foreground"
			disabled={pending}
			onClick={() =>
				start(async () => {
					await signOut();
					router.replace("/register");
				})
			}
		>
			{pending ? "Signing out…" : "Sign out"}
		</button>
	);
}
