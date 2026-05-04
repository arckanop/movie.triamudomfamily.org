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
			className="text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-300 transition-colors"
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
