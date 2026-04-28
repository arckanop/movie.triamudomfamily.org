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
			<nav className="flex items-center px-6 py-3 bg-white border-b border-slate-200">
				<Link
					href="/register"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					Student register
				</Link>
			</nav>
			<div className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-md p-8">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-slate-900">Staff & Admin Login</h1>
						<p className="mt-1.5 text-sm text-slate-500">
							Students should use{" "}
							<Link href="/register" className="underline underline-offset-4 hover:text-slate-700 transition-colors">
								/register
							</Link>{" "}
							with their school Google account.
						</p>
					</div>
					<LoginForm/>
				</div>
			</div>
		</div>
	);
}
