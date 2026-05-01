import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import Link from "next/link";

/* ── Reusable glass style ────────────────────────────────────────────────── */
const glass: React.CSSProperties = {
	background: "rgba(255,255,255,0.52)",
	backdropFilter: "blur(18px)",
	WebkitBackdropFilter: "blur(18px)",
	border: "1px solid rgba(255,255,255,0.78)",
	boxShadow: "0 8px 32px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
};

/* ── Landing page ────────────────────────────────────────────────────────── */
function LandingPage() {
	return (
		<div className="flex min-h-svh flex-col bg-white text-slate-900">

			{/* Header */}
			<header className="flex items-center justify-between px-6 py-4">
				<span className="font-mono text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase select-none">
					TU89
				</span>
				<Link
					href="/register"
					style={glass}
					className="rounded-full px-5 py-1.5 text-sm font-semibold text-pink-600 transition-all hover:brightness-95"
				>
					ลงทะเบียน
				</Link>
			</header>

			{/* Hero */}
			<main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12 text-center">

				{/* Title block */}
				<div className="flex flex-col items-center gap-2">
					<span className="font-mono text-[10px] tracking-[0.35em] text-pink-400 uppercase">
						Triamudom Suksa School · Class of &#39;89
					</span>
					<h1 className="text-[clamp(4rem,18vw,8rem)] font-black leading-none tracking-tighter text-slate-900">
						TU89
					</h1>
					<p className="text-xl font-semibold tracking-tight text-slate-700 sm:text-2xl">
						First Movie
					</p>
					<p className="text-sm font-medium text-slate-400 tracking-wide">
						Where It All Begins
					</p>
					<p className="mt-1 text-xs italic text-slate-400 tracking-widest">
						First Meet, First Memory &nbsp;·&nbsp; #TU89
					</p>
				</div>

				{/* Details card */}
				<div style={glass} className="w-full max-w-xs rounded-2xl px-6 py-4">
					<ul className="divide-y divide-slate-100/80 text-sm">
						{[
							{label: "วันที่",    value: "พฤษภาคม 2568"},
							{label: "เวลา",     value: "18:00 – 21:00 น."},
							{label: "สถานที่",   value: "โรงภาพยนตร์ SF"},
							{label: "การแต่งกาย", value: "Smart Casual"},
						].map(({label, value}) => (
							<li key={label} className="flex items-center justify-between gap-4 py-2.5">
								<span className="text-slate-400">{label}</span>
								<span className="font-medium text-slate-700">{value}</span>
							</li>
						))}
					</ul>
				</div>

				{/* CTA */}
				<Link
					href="/register"
					className="rounded-full bg-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-pink-200/60 transition-all hover:bg-pink-600 hover:shadow-pink-300/60 active:scale-[0.97]"
				>
					จองที่นั่งเลย →
				</Link>
			</main>

			{/* Footer */}
			<footer className="px-8 py-4 text-center font-mono text-[10px] tracking-widest text-slate-300 uppercase">
				Movie Register · Triamudom Suksa School
			</footer>
		</div>
	);
}

/* ── Route handler ───────────────────────────────────────────────────────── */
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
