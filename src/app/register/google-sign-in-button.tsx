"use client";

import {useTransition} from "react";
import {toast} from "sonner";
import {signIn, signOut} from "@/lib/auth-client";

export function GoogleSignInButton({
	                                   label = "เข้าสู่ระบบด้วย Google",
	                                   signOutFirst = false,
	                                   }: {
	label?: string;
	signOutFirst?: boolean;
}) {
	const [pending, start] = useTransition();
	return (
		<button
			type="button"
			disabled={pending}
			className="w-full px-4 py-2.5 rounded-lg bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 disabled:opacity-60 transition-colors"
			onClick={() =>
				start(async () => {
					if (signOutFirst) {
						await signOut();
					}
					const res = await signIn.social({
						provider: "google",
						callbackURL: "/register",
					});
					if (res.error) {
						toast.error(res.error.message ?? "เข้าสู่ระบบล้มเหลว");
					}
				})
			}
		>
			{pending ? "กำลังเปลี่ยนหน้า…" : label}
		</button>
	);
}
