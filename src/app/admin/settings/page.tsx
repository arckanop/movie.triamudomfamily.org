"use client";

import {useEffect, useState} from "react";
import {toast} from "sonner";
import {CalendarDays, Clock, MapPin} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

function toBangkokLocal(iso: string): string {
	return new Date(iso)
		.toLocaleString("sv-SE", {timeZone: "Asia/Bangkok"})
		.slice(0, 16)
		.replace(" ", "T");
}

function fromBangkokLocal(local: string): string {
	return new Date(local + ":00+07:00").toISOString();
}

function previewDate(bangkokLocal: string): string {
	try {
		return new Date(bangkokLocal + ":00+07:00").toLocaleDateString("th-TH", {
			timeZone: "Asia/Bangkok",
			month: "long",
			year: "numeric",
		});
	} catch { return "—"; }
}

function previewTime(bangkokLocal: string, endTime: string): string {
	try {
		const start = new Date(bangkokLocal + ":00+07:00").toLocaleTimeString("th-TH", {
			timeZone: "Asia/Bangkok",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return endTime.trim() ? `${start} – ${endTime.trim()}` : start;
	} catch { return "—"; }
}

function previewCountdown(bangkokLocal: string): string {
	try {
		const diff = Math.max(0, new Date(bangkokLocal + ":00+07:00").getTime() - Date.now());
		if (diff === 0) return "เริ่มแล้ว!";
		const d = Math.floor(diff / 86_400_000);
		const h = Math.floor((diff % 86_400_000) / 3_600_000);
		const m = Math.floor((diff % 3_600_000) / 60_000);
		const pad = (n: number) => String(n).padStart(2, "0");
		return `${pad(d)} : ${pad(h)} : ${pad(m)} : --`;
	} catch { return ""; }
}

export default function SettingsPage() {
	const [eventAt, setEventAt] = useState("");
	const [eventEndTime, setEventEndTime] = useState("");
	const [venue, setVenue] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch("/api/settings")
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (!data) return;
				const {settings} = data;
				if (settings.eventAt) setEventAt(toBangkokLocal(settings.eventAt));
				if (settings.eventEndTime) setEventEndTime(settings.eventEndTime);
				if (settings.venue) setVenue(settings.venue);
			})
			.catch(() => {});
	}, []);

	async function save() {
		setSaving(true);
		const body: Record<string, string> = {venue, eventEndTime};
		if (eventAt) body.eventAt = fromBangkokLocal(eventAt);
		const res = await fetch("/api/settings", {
			method: "PATCH",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(body),
		});
		setSaving(false);
		if (res.ok) toast.success("Settings saved");
		else toast.error("Failed to save");
	}

	const hasDate = !!eventAt;
	const dateStr  = hasDate ? previewDate(eventAt) : null;
	const timeStr  = hasDate ? previewTime(eventAt, eventEndTime) : null;
	const countdown = hasDate ? previewCountdown(eventAt) : null;

	return (
		<div className="flex gap-8 h-full">

			{/* ── Left: form ─────────────────────────────────────────────── */}
			<div className="w-full max-w-sm shrink-0 space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Event settings</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Controls the landing page and countdown timer.
					</p>
				</div>

				<div className="space-y-5">
					<Field icon={<CalendarDays className="h-4 w-4"/>} label="Start date & time" hint="Enter in Bangkok time (UTC+7)">
						<Input
							type="datetime-local"
							value={eventAt}
							onChange={(e) => setEventAt(e.target.value)}
						/>
					</Field>

					<Field icon={<Clock className="h-4 w-4"/>} label="End time" hint='e.g. "21:00" — shows as "18:00 – 21:00". Leave blank for start time only.'>
						<Input
							placeholder="21:00"
							value={eventEndTime}
							onChange={(e) => setEventEndTime(e.target.value)}
							className="max-w-[9rem]"
						/>
					</Field>

					<Field icon={<MapPin className="h-4 w-4"/>} label="Venue" hint="Displayed in the landing page details grid.">
						<Input
							placeholder="Paragon Cineplex"
							value={venue}
							onChange={(e) => setVenue(e.target.value)}
						/>
					</Field>
				</div>

				<Button onClick={save} disabled={saving} className="w-full">
					{saving ? "Saving…" : "Save settings"}
				</Button>
			</div>

			{/* ── Right: preview ─────────────────────────────────────────── */}
			<div className="flex-1 min-w-0">
				<div className="sticky top-4 rounded-2xl overflow-hidden border border-zinc-800 bg-[#050509]" style={{minHeight: 380}}>
					{/* Atmospheric overlays */}
					<div
						className="pointer-events-none absolute inset-0"
						style={{background: [
							"radial-gradient(ellipse 80% 50% at 20% 0%, rgba(120,40,80,0.22) 0%, transparent 60%)",
							"radial-gradient(ellipse 60% 40% at 80% 100%, rgba(40,20,80,0.14) 0%, transparent 60%)",
						].join(", ")}}
					/>
					<div
						className="pointer-events-none absolute inset-0"
						style={{background: "radial-gradient(ellipse 110% 110% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)"}}
					/>

					<div className="relative flex flex-col justify-between h-full p-8 gap-6" style={{minHeight: 380}}>
						{/* Top label */}
						<div className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-rose-500" style={{boxShadow: "0 0 6px 2px rgba(244,63,94,0.7)"}}/>
							<span className="text-[9px] font-semibold tracking-[0.45em] text-zinc-400 uppercase">Landing page preview</span>
						</div>

						{/* Title block */}
						<div className="space-y-1">
							<p className="text-[9px] tracking-[0.35em] text-zinc-600 uppercase">Triamudom Family · Class of &#39;89 Presents</p>
							<h2
								className="text-6xl font-black leading-none tracking-tighter text-white"
								style={{textShadow: "0 0 40px rgba(244,63,94,0.45)"}}
							>
								TU89
							</h2>
							<p className="text-base font-semibold tracking-[0.18em] text-zinc-300 uppercase">First Movie</p>
						</div>

						{/* Details grid */}
						<dl className="grid grid-cols-3 gap-x-6 gap-y-3">
							{[
								{label: "DATE",  value: dateStr  ?? <Em>ยังไม่ได้ตั้ง</Em>},
								{label: "TIME",  value: timeStr  ?? <Em>ยังไม่ได้ตั้ง</Em>},
								{label: "VENUE", value: venue    || <Em>ยังไม่ได้ตั้ง</Em>},
							].map(({label, value}) => (
								<div key={label}>
									<dt className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase">{label}</dt>
									<dd className="mt-0.5 text-sm font-medium text-zinc-200 leading-snug">{value}</dd>
								</div>
							))}
						</dl>

						{/* Countdown */}
						{countdown && (
							<div className="space-y-1.5">
								<p className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase">เริ่มใน</p>
								<p className="font-mono text-xl font-bold tracking-widest text-white">{countdown}</p>
							</div>
						)}

						{/* CTA ghost */}
						<div className="self-start rounded-full bg-rose-500/20 border border-rose-500/30 px-6 py-2.5 text-sm font-semibold text-rose-300">
							จองที่นั่งเลย →
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function Field({icon, label, hint, children}: {
	icon: React.ReactNode;
	label: string;
	hint: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<span className="text-zinc-500">{icon}</span>
				<Label className="text-sm font-semibold">{label}</Label>
			</div>
			{children}
			<p className="text-xs text-muted-foreground">{hint}</p>
		</div>
	);
}

function Em({children}: {children: React.ReactNode}) {
	return <span className="italic text-zinc-700">{children}</span>;
}
