import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {LoginForm} from "./login-form";

export default async function LoginPage() {
	const session = await getSession();
	if (session) {
		const user = await prisma.user.findUnique({
			where: {id: session.user.id},
			select: {role: true},
		});
		if (user?.role === "ADMIN") redirect("/admin");
		if (user?.role === "STAFF") redirect("/staff");
	}
	return (
		<div className="flex flex-1 flex-col">
			<nav className="flex items-center px-6 py-3 border-b border-zinc-800/60 bg-[#050509]/80 backdrop-blur-sm">
				<Link
					href="/register"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					Student register
				</Link>
			</nav>
			<div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0"
					style={{background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(244,63,94,0.12) 0%, transparent 70%)"}}
				/>
				<div className="relative w-full max-w-md">
					<div className="rounded-2xl border border-zinc-800 bg-[#0d0d14] shadow-2xl shadow-black/80 p-8">
						<div className="mb-6">
							<h1 className="text-2xl font-bold text-white">Staff &amp; Admin Login</h1>
							<p className="mt-1.5 text-sm text-zinc-400">
								Students should use{" "}
								<Link href="/register" className="text-zinc-300 underline underline-offset-4 hover:text-white transition-colors">
									/register
								</Link>{" "}
								with their school Google account.
							</p>
						</div>
						<LoginForm/>
					</div>
				</div>
			</div>
		</div>
	);
}
