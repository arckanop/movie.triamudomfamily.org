"use client";

import Link from "next/link";
import {useState} from "react";
import {CountdownTimer} from "@/components/countdown-timer";
import type {EventSettings} from "@/server/settings";

/* ─────────────────────────────────────────────────────────────────────────────
   Film-grain texture (SVG fractal-noise as a data-URI)
───────────────────────────────────────────────────────────────────────────── */
const GRAIN =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* ─────────────────────────────────────────────────────────────────────────────
   ImageSlot — shows a styled placeholder until the given src loads.
   ─ Poster:  drop /public/poster.jpg
   ─ Gallery: drop /public/gallery/1.jpg … 6.jpg  (or more)
───────────────────────────────────────────────────────────────────────────── */
function ImageSlot({src, alt, hint}: {src: string; alt: string; hint: string}) {
	const [failed, setFailed] = useState(false);

	return (
		<div className="relative h-full w-full overflow-hidden">
			{/* Placeholder — always rendered as the base layer */}
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0c0c14]">
				<div
					className="absolute inset-0 opacity-[0.025]"
					style={{
						backgroundImage:
							"repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
						backgroundSize: "8px 8px",
					}}
				/>
				{/* Icon */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="relative text-zinc-700"
				>
					<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
					<circle cx="12" cy="13" r="3"/>
				</svg>
				<span className="relative text-[8px] text-zinc-800">{hint}</span>
			</div>

			{/* Actual image */}
			{!failed && (
				<img
					src={src}
					alt={alt}
					className="absolute inset-0 h-full w-full object-cover"
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Gallery items — add more objects to extend the grid.
   Drop the files in /public/gallery/ and they appear automatically.
───────────────────────────────────────────────────────────────────────────── */
const GALLERY = [
	{src: "/gallery/1.jpg",  alt: "Photo 1"},
	{src: "/gallery/2.jpg",  alt: "Photo 2"},
	{src: "/gallery/3.jpg",  alt: "Photo 3"},
	{src: "/gallery/4.jpg",  alt: "Photo 4"},
	{src: "/gallery/5.jpg",  alt: "Photo 5"},
	{src: "/gallery/6.jpg",  alt: "Photo 6"},
	{src: "/gallery/7.jpg",  alt: "Photo 7"},
	{src: "/gallery/8.jpg",  alt: "Photo 8"},
	{src: "/gallery/9.jpg",  alt: "Photo 9"},
];

/* ─────────────────────────────────────────────────────────────────────────────
   LandingPage
───────────────────────────────────────────────────────────────────────────── */
export function LandingPage({eventSettings}: {eventSettings: EventSettings}) {
	const {eventAt, eventEndTime, venue} = eventSettings;

	// Derive display values from eventAt, falling back to hardcoded defaults
	let dateDisplay = "พฤษภาคม 2568";
	let timeDisplay = "18:00 – 21:00";
	if (eventAt) {
		const d = new Date(eventAt);
		dateDisplay = d.toLocaleDateString("th-TH", {
			timeZone: "Asia/Bangkok",
			month: "long",
			year: "numeric",
		});
		const start = d.toLocaleTimeString("th-TH", {
			timeZone: "Asia/Bangkok",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		timeDisplay = eventEndTime ? `${start} – ${eventEndTime}` : start;
	}

	const details = [
		{label: "DATE",  value: dateDisplay},
		{label: "TIME",  value: timeDisplay},
		{label: "VENUE", value: venue ?? "Paragon Cineplex"},
	];

	const showCountdown = !!eventAt && new Date(eventAt).getTime() > Date.now();
	return (
		<div className="bg-[#050509] text-white">

			{/* ── Fixed atmospheric overlays (cover entire page) ──────────── */}
			<div
				className="pointer-events-none fixed inset-0 z-10"
				style={{
					background: [
						"radial-gradient(ellipse 80% 50% at 20% 0%, rgba(120,40,80,0.18) 0%, transparent 60%)",
						"radial-gradient(ellipse 60% 40% at 80% 100%, rgba(40,20,80,0.12) 0%, transparent 60%)",
					].join(", "),
				}}
				aria-hidden
			/>
			<div
				className="pointer-events-none fixed inset-0 z-10 opacity-[0.032] mix-blend-overlay"
				style={{backgroundImage: GRAIN, backgroundRepeat: "repeat"}}
				aria-hidden
			/>
			<div
				className="pointer-events-none fixed inset-0 z-10"
				style={{
					background:
						"radial-gradient(ellipse 110% 110% at 50% 50%, transparent 45%, rgba(0,0,0,0.65) 100%)",
				}}
				aria-hidden
			/>

			{/* ════════════════════════════════════════════════════════════════
			    HERO SECTION
			════════════════════════════════════════════════════════════════ */}
			<section className="relative z-20 flex min-h-svh flex-col">

				{/* Header */}
				<header className="flex items-center justify-between px-6 py-4">
					<span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-zinc-600 uppercase select-none">
						TU89
					</span>
					<Link
						href="/register"
						className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
					>
						ลงทะเบียน
					</Link>
				</header>

				{/* Hero content */}
				<main className="mx-auto flex flex-1 w-full max-w-5xl flex-col items-center gap-10 px-6 pb-20 pt-6 md:flex-row md:items-start md:gap-16 md:pb-24 md:pt-12">

					{/* Poster */}
					<div
						className="w-full max-w-[240px] shrink-0 sm:max-w-[280px] md:max-w-[320px]"
						style={{aspectRatio: "2 / 3"}}
					>
						<div
							className="h-full w-full rounded-[2px] overflow-hidden"
							style={{
								boxShadow: [
									"0 0 0 1px rgba(255,255,255,0.05)",
									"0 0 60px rgba(244,63,94,0.20)",
									"0 0 120px rgba(244,63,94,0.08)",
									"0 30px 80px rgba(0,0,0,0.95)",
								].join(", "),
							}}
						>
							<ImageSlot
								src="/poster.jpg"
								alt="Movie poster"
								hint="Add /public/poster.jpg"
							/>
						</div>
					</div>

					{/* Info */}
					<div className="flex w-full flex-col items-center gap-5 text-center md:items-start md:pt-2 md:text-left">

						{/* Now showing */}
						<div className="flex items-center gap-2">
							<span
								className="h-1.5 w-1.5 rounded-full bg-rose-500"
								style={{boxShadow: "0 0 6px 2px rgba(244,63,94,0.7)"}}
							/>
							<span className="text-[10px] font-semibold tracking-[0.45em] text-zinc-400 uppercase">
								Now Showing
							</span>
						</div>

						{/* School credit */}
						<div className="-mt-2 flex flex-col gap-0.5">
							<span className="text-[9px] tracking-[0.35em] text-zinc-600 uppercase">
								Triamudom Suksa School
							</span>
							<span className="text-[9px] tracking-[0.25em] text-zinc-700 uppercase">
								Class of &#39;89 Presents
							</span>
						</div>

						{/* Title */}
						<div className="-mt-1 flex flex-col gap-1">
							<h1
								className="text-[clamp(5rem,18vw,8rem)] font-black leading-none tracking-tighter text-white"
								style={{
									textShadow: [
										"0 0 60px rgba(244,63,94,0.5)",
										"0 0 120px rgba(244,63,94,0.2)",
									].join(", "),
								}}
							>
								TU89
							</h1>
							<p className="text-xl font-semibold tracking-[0.18em] text-zinc-300 uppercase sm:text-2xl">
								First Movie
							</p>
							<p className="mt-0.5 text-sm tracking-widest text-zinc-500 uppercase">
								: Where It All Begins
							</p>
						</div>

						{/* Description */}
						<p className="max-w-sm text-sm leading-relaxed text-zinc-400">
							เริ่มต้นชีวิตในเตรียมอุดมในโรงหนังที่ใหญ่ที่สุดในประเทศ{" "}
							<span className="text-zinc-300">@ Paragon Cineplex</span>{" "}
							แล้วมาดูหนัง &ldquo;....&rdquo; ทำความรู้จักเพื่อนใหม่กัน !
						</p>

						{/* Divider */}
						<div className="w-full max-w-xs">
							<div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent md:from-zinc-700/80 md:to-transparent" />
						</div>

						{/* Details */}
						<dl className="grid grid-cols-2 gap-x-10 gap-y-4">
							{details.map(({label, value}) => (
								<div key={label} className="flex flex-col gap-0.5">
									<dt className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase">{label}</dt>
									<dd className="text-sm font-medium text-zinc-200">{value}</dd>
								</div>
							))}
						</dl>

						{/* Countdown */}
						{showCountdown && (
							<div className="flex flex-col gap-1.5">
								<span className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase">
									เริ่มใน
								</span>
								<CountdownTimer targetIso={eventAt!}/>
							</div>
						)}

						{/* CTA */}
						<Link
							href="/register"
							className="mt-1 rounded-full bg-rose-500 px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-all hover:bg-rose-400 active:scale-[0.97]"
							style={{
								boxShadow: "0 0 28px rgba(244,63,94,0.45), 0 4px 16px rgba(0,0,0,0.5)",
							}}
						>
							จองที่นั่งเลย →
						</Link>

						<p className="text-[10px] tracking-widest text-zinc-600">
							First Meet, First Memory &nbsp;·&nbsp; #TU89
						</p>
					</div>
				</main>

				{/* Scroll indicator */}
				<div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-zinc-700">
					<span className="text-[8px] tracking-[0.4em] uppercase">Scroll</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="animate-bounce"
					>
						<polyline points="6 9 12 15 18 9"/>
					</svg>
				</div>
			</section>

			{/* ════════════════════════════════════════════════════════════════
			    GALLERY SECTION
			════════════════════════════════════════════════════════════════ */}
			<section className="relative z-20 mx-auto max-w-5xl px-6 pb-24 pt-16">

				{/* Section heading */}
				<div className="mb-10 flex flex-col items-center gap-3 text-center">
					<div className="flex w-full items-center gap-4">
						<div className="h-px flex-1 bg-zinc-800"/>
						<div className="flex flex-col items-center gap-1">
							<span className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase">
								From Last Year
							</span>
							<h2 className="text-lg font-bold tracking-wide text-zinc-300">
								ความทรงจำ · 2567
							</h2>
						</div>
						<div className="h-px flex-1 bg-zinc-800"/>
					</div>
				</div>

				{/* Photo grid */}
				{/* To add photos: drop files into /public/gallery/ named 1.jpg, 2.jpg … */}
				{/* To add more photos: duplicate an object in the GALLERY array above  */}
				<div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
					{GALLERY.map(({src, alt}, i) => (
						<div
							key={src}
							className="overflow-hidden rounded-[2px]"
							style={{
								aspectRatio: "3 / 2",
								boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
							}}
						>
							<ImageSlot
								src={src}
								alt={alt}
								hint={`/gallery/${i + 1}.jpg`}
							/>
						</div>
					))}
				</div>
			</section>

			{/* ── Footer ────────────────────────────────────────────────────── */}
			<footer className="relative z-20 px-6 py-6 text-center font-mono text-[9px] tracking-[0.3em] text-zinc-800 uppercase">
				Movie Register · Triamudom Suksa School
			</footer>
		</div>
	);
}
