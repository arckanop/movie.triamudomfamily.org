import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import Link from "next/link";

const LandingPage = () => {
	return (
		<div className="flex flex-1 flex-col bg-white text-slate-900">
			<header className="px-6 py-4 flex items-center justify-end">
				<div className="flex gap-3 text-sm">
					<Link href="/register" className="px-4 py-1.5 rounded-md bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors">
						ลงทะเบียน
					</Link>
					{/*<Link href="/login" className="px-4 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">*/}
					{/*	Staff Login*/}
					{/*</Link>*/}
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center text-center px-6 gap-6">
				<div className="flex flex-col items-center gap-4 max-w-xl">
					<span className="text-xs font-mono tracking-widest text-pink-400 uppercase">Triamudom Suksa School</span>
					<h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900">
						ปิดโรงหนังใหญ่สุดในย่านสยาม
					</h1>
					<p className="text-slate-500 text-lg leading-relaxed">
						Book your seats for the annual Triamudom family screening event. Sign in with your school Google account to get started.
					</p>
					<div className="flex gap-3 mt-2">
						<Link href="/register" className="px-6 py-2.5 rounded-md bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors">
							ลงทะเบียนเลย
						</Link>
					</div>
				</div>
			</main>

			<footer className="border-t border-slate-100 px-8 py-3 text-center text-xs">
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
					<a
						href=""
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 font-medium text-slate-400 transition-colors hover:text-slate-700"
					>
						<img src="https://cdn.simpleicons.org/github/94a3b8" alt="GitHub" className="h-3.5 w-3.5"/>
						Github
					</a>
					<span className="text-slate-200">·</span>
					<a
						href=""
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-400 transition-colors hover:text-slate-700"
					>
						AGPL-3.0
					</a>
					<span className="text-slate-200">·</span>
					<span className="text-slate-400">Movie Register 0.2.0</span>
				</div>
			</footer>
		</div>
	);
}

export default async function Home() {
	const session = await getSession();
	if (!session) return <LandingPage />;
	const user = await prisma.user.findUnique({
		where: {id: session.user.id},
		select: {role: true},
	});
	if (!user) redirect("/login");
	if (user.role === "ADMIN") redirect("/admin");
	if (user.role === "STAFF") redirect("/staff");
	return <LandingPage />;
}
