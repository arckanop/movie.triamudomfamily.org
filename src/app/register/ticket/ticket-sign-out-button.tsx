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
			className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-700 transition-colors"
			disabled={pending}
			onClick={() =>
				start(async () => {
					await signOut();
					router.replace("/register");
				})
			}
		>
			{pending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
		</button>
	);
}
