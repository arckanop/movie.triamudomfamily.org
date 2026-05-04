"use client";

import {useCallback, useEffect, useState} from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	LineChart,
	Line,
} from "recharts";
import {toast} from "sonner";
import {ChevronDown, ChevronUp, Lock, LockOpen} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {ROW_LABELS, SEAT_LAYOUT, SEAT_TYPE_COLORS, SEAT_TYPE_LABELS, SeatType} from "@/lib/seat-layout";
import {useDashboardSettings} from "./dashboard-settings";

type Analytics = {
	summary: { total: number; available: number; booked: number; blocked: number };
	bookingsByType: { type: string; booked: number; available: number; blocked: number }[];
	bookingsPerHour: { hour: string; count: number }[];
	bookingsPerStaff: { userId: string; username: string; count: number }[];
	studentsTotal: number;
	studentsSeated: number;
	studentsWaiting: number;
	checkinByClass: { class: string; total: number; seated: number }[];
	conflicts: {
		bookedNoStudent: string[];
		studentSeatMismatch: { studentId: string; name: string; seatId: string; seatStatus: string }[];
	};
};

type RowStatus = {
	row: string;
	available: number;
	blocked: number;
	booked: number;
};

type SectionStatus = {
	section: string;
	available: number;
	blocked: number;
	booked: number;
};

const SECTION_LABELS: Record<string, string> = {left: "Left", center: "Center", right: "Right"};
const SECTION_ORDER = ["left", "center", "right"];

type BlockedSeat = {
	id: string;
	row: string;
	number: number;
};

type ActivityEntry = {
	id: string;
	seatId: string;
	performedAt: string;
	student: { name: string; surname: string; class: string } | null;
	performedByUser: { name: string; username: string } | null;
};

const ROW_ORDER = ROW_LABELS.map((r) => r.row);
const TYPE_ORDER: SeatType[] = ["normal", "honeymoon", "privilege_plus", "privilege_normal", "vip", "premium", "balcony"];

function sortRows(rows: RowStatus[]): RowStatus[] {
	return [...rows].sort(
		(a, b) => ROW_ORDER.indexOf(a.row) - ROW_ORDER.indexOf(b.row),
	);
}

export function AdminDashboard() {
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [rowStatuses, setRowStatuses] = useState<RowStatus[]>([]);
	const [selectedRow, setSelectedRow] = useState<string>("");
	const [busy, setBusy] = useState<string | null>(null);
	const [blockedSeats, setBlockedSeats] = useState<BlockedSeat[]>([]);
	const [blockRow, setBlockRow] = useState("");
	const [blockSeatNum, setBlockSeatNum] = useState("");
	const [seatBusy, setSeatBusy] = useState<string | null>(null);
	const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
	const [sectionStatuses, setSectionStatuses] = useState<SectionStatus[]>([]);
	const [selectedSection, setSelectedSection] = useState<string>("");
	const [sectionBusy, setSectionBusy] = useState<string | null>(null);
	const [zoneBusy, setZoneBusy] = useState<string | null>(null);
	const [zoneConfirm, setZoneConfirm] = useState<{type: SeatType; action: "block" | "unblock"; count: number} | null>(null);
	const [rowOverviewExpanded, setRowOverviewExpanded] = useState(true);
	const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
	const [relativeTime, setRelativeTime] = useState("");
	const {show} = useDashboardSettings();

	const rowSeatsMap: Record<string, number[]> = {};
	for (const s of SEAT_LAYOUT.seats) {
		if (!rowSeatsMap[s.row]) rowSeatsMap[s.row] = [];
		rowSeatsMap[s.row].push(s.number);
	}

	const fetchRowStatuses = useCallback(async () => {
		const r = await fetch("/api/seats/rows");
		if (r.ok) {
			const data = await r.json();
			setRowStatuses(sortRows(data.rows));
		}
	}, []);

	const fetchSectionStatuses = useCallback(async () => {
		const r = await fetch("/api/seats/sections");
		if (r.ok) {
			const data = await r.json();
			setSectionStatuses(
				(data.sections as SectionStatus[]).sort(
					(a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section),
				),
			);
		}
	}, []);

	const fetchBlockedSeats = useCallback(async () => {
		const r = await fetch("/api/seats");
		if (r.ok) {
			const data = await r.json();
			const blocked: BlockedSeat[] = (data.seats as {id: string; row: string; number: number; status: string}[])
				.filter((s) => s.status === "BLOCKED")
				.sort((a, b) => a.id.localeCompare(b.id));
			setBlockedSeats(blocked);
		}
	}, []);

	const fetchRecentActivity = useCallback(async () => {
		const r = await fetch("/api/logs?action=BOOKED");
		if (r.ok) {
			const data = await r.json();
			setRecentActivity((data.logs as ActivityEntry[]).slice(0, 10));
		}
	}, []);

	const refreshAll = useCallback(() => {
		fetch("/api/analytics").then((r) => { if (r.ok) r.json().then(setAnalytics); });
		fetchRowStatuses();
		fetchSectionStatuses();
		fetchBlockedSeats();
		fetchRecentActivity();
		setLastRefreshed(new Date());
	}, [fetchRowStatuses, fetchSectionStatuses, fetchBlockedSeats, fetchRecentActivity]);

	useEffect(() => {
		refreshAll();
		const id = setInterval(refreshAll, 30_000);
		return () => clearInterval(id);
	}, [refreshAll]);

	useEffect(() => {
		if (!lastRefreshed) return;
		function tick() {
			const secs = Math.floor((Date.now() - lastRefreshed!.getTime()) / 1000);
			if (secs < 10) setRelativeTime("just now");
			else if (secs < 60) setRelativeTime(`${secs}s ago`);
			else setRelativeTime(`${Math.floor(secs / 60)}m ago`);
		}
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [lastRefreshed]);

	async function rowAction(row: string, action: "block" | "unblock") {
		setBusy(row + action);
		const r = await fetch(`/api/seats/rows/${encodeURIComponent(row)}`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({action}),
		});
		setBusy(null);
		if (r.ok) {
			const data = await r.json();
			toast.success(`Row ${row}: ${data.count} seat${data.count !== 1 ? "s" : ""} ${action === "block" ? "blocked" : "unblocked"}`);
			fetchRowStatuses();
			fetchBlockedSeats();
		} else {
			toast.error(`Failed to ${action} row ${row}`);
		}
	}

	async function sectionAction(section: string, action: "block" | "unblock") {
		setSectionBusy(section + action);
		const r = await fetch(`/api/seats/sections/${encodeURIComponent(section)}`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({action}),
		});
		setSectionBusy(null);
		if (r.ok) {
			const data = await r.json();
			const label = SECTION_LABELS[section] ?? section;
			toast.success(`${label} section: ${data.count} seat${data.count !== 1 ? "s" : ""} ${action === "block" ? "blocked" : "unblocked"}`);
			fetchSectionStatuses();
			fetchRowStatuses();
			fetchBlockedSeats();
		} else {
			toast.error(`Failed to ${action} ${section} section`);
		}
	}

	async function zoneAction(type: SeatType, action: "block" | "unblock") {
		setZoneBusy(type + action);
		const r = await fetch(`/api/seats/types/${encodeURIComponent(type)}`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({action}),
		});
		setZoneBusy(null);
		if (r.ok) {
			const data = await r.json();
			const label = SEAT_TYPE_LABELS[type];
			toast.success(`${label}: ${data.count} seat${data.count !== 1 ? "s" : ""} ${action === "block" ? "blocked" : "unblocked"}`);
			fetchRowStatuses();
			fetchSectionStatuses();
			fetchBlockedSeats();
		} else {
			toast.error(`Failed to ${action} ${SEAT_TYPE_LABELS[type]} zone`);
		}
	}

	async function blockSeat() {
		if (!blockRow || !blockSeatNum) return;
		const id = `${blockRow}-${blockSeatNum}`;
		setSeatBusy(id);
		const r = await fetch(`/api/seats/${encodeURIComponent(id)}/block`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: "{}",
		});
		setSeatBusy(null);
		if (r.ok) {
			toast.success(`${id} blocked`);
			setBlockRow("");
			setBlockSeatNum("");
			fetchBlockedSeats();
			fetchRowStatuses();
		} else {
			const data = await r.json();
			toast.error(data.error ?? `Failed to block ${id}`);
		}
	}

	async function unblockSeat(seatId: string) {
		setSeatBusy(seatId);
		const r = await fetch(`/api/seats/${encodeURIComponent(seatId)}/unblock`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: "{}",
		});
		setSeatBusy(null);
		if (r.ok) {
			toast.success(`${seatId} unblocked`);
			fetchBlockedSeats();
			fetchRowStatuses();
		} else {
			toast.error(`Failed to unblock ${seatId}`);
		}
	}

	const blockableRows = ROW_ORDER.filter((r) => {
		const s = rowStatuses.find((x) => x.row === r);
		return s && s.available > 0;
	});

	const blockedRows = sortRows(rowStatuses.filter((r) => r.blocked > 0 && r.available === 0));
	const fullyBlockedRowSet = new Set(blockedRows.map((r) => r.row));
	const individualBlockedSeats = blockedSeats.filter((s) => !fullyBlockedRowSet.has(s.row));

	if (blockRow && fullyBlockedRowSet.has(blockRow)) {
		setBlockRow("");
		setBlockSeatNum("");
	}

	const pctBooked = analytics
		? analytics.summary.total - analytics.summary.blocked > 0
			? Math.round((analytics.summary.booked / (analytics.summary.total - analytics.summary.blocked)) * 100)
			: 0
		: null;

	const typeChartData = TYPE_ORDER.map((type) => {
		const entry = analytics?.bookingsByType.find((b) => b.type === type);
		return {
			name: SEAT_TYPE_LABELS[type],
			Booked: entry?.booked ?? 0,
			Available: entry?.available ?? 0,
		};
	}).filter((d) => d.Booked + d.Available > 0);

	return (
		<>
		<div className="space-y-4">
			<div className="space-y-2">
				{relativeTime && (
					<div className="flex justify-end">
						<span className="text-[10px] tabular-nums text-muted-foreground/50">
							Updated {relativeTime}
						</span>
					</div>
				)}
				<div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
					<Stat label="Total seats" value={analytics?.summary.total ?? "—"}/>
					<Stat label="Booked" value={analytics?.summary.booked ?? "—"} accent="red"/>
					<Stat label="Available" value={analytics?.summary.available ?? "—"} accent="green"/>
					<Stat
						label="Fill rate"
						value={pctBooked !== null ? `${pctBooked}%` : "—"}
						accent={pctBooked !== null && pctBooked >= 80 ? "red" : pctBooked !== null && pctBooked >= 50 ? "amber" : "green"}
					/>
				</div>
				<div className="grid gap-2 grid-cols-3">
					<Stat label="Students registered" value={analytics?.studentsTotal ?? "—"}/>
					<Stat label="Checked in" value={analytics?.studentsSeated ?? "—"} accent="green"/>
					<Stat
						label="Not checked in"
						value={analytics?.studentsWaiting ?? "—"}
						accent={analytics && analytics.studentsWaiting > 0 ? "amber" : "green"}
					/>
				</div>
			</div>

			{analytics && show.doubleBookingConflicts && (analytics.conflicts.bookedNoStudent.length > 0 || analytics.conflicts.studentSeatMismatch.length > 0) && (
				<Card className="border-amber-600/50">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-amber-400">Booking conflicts</CardTitle>
							<Badge variant="destructive">{analytics.conflicts.bookedNoStudent.length + analytics.conflicts.studentSeatMismatch.length} issue{analytics.conflicts.bookedNoStudent.length + analytics.conflicts.studentSeatMismatch.length !== 1 ? "s" : ""}</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						{analytics.conflicts.bookedNoStudent.length > 0 && (
							<div>
								<p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seats marked booked — no student linked</p>
								<div className="divide-y divide-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
									{analytics.conflicts.bookedNoStudent.map((id) => (
										<div key={id} className="flex items-center bg-zinc-800/50 px-3 py-1.5">
											<span className="text-xs font-mono text-amber-400">{id}</span>
										</div>
									))}
								</div>
							</div>
						)}
						{analytics.conflicts.studentSeatMismatch.length > 0 && (
							<div>
								<p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students linked to seat — seat not marked booked</p>
								<div className="divide-y divide-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
									{analytics.conflicts.studentSeatMismatch.map((s) => (
										<div key={s.studentId} className="flex items-center justify-between bg-zinc-800/50 px-3 py-1.5">
											<span className="text-xs text-zinc-200">{s.name} <span className="text-muted-foreground">({s.studentId})</span></span>
											<span className="text-xs font-mono text-amber-400">{s.seatId} · {s.seatStatus}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{(show.bookingsPerHour || show.bookingsPerStaff) && (
				<div className="grid gap-4 lg:grid-cols-2">
					{show.bookingsPerHour && (
						<Card>
							<CardHeader><CardTitle>Bookings per hour</CardTitle></CardHeader>
							<CardContent style={{height: 220}}>
								{analytics && (
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={analytics.bookingsPerHour}>
											<CartesianGrid strokeDasharray="3 3" stroke="#333"/>
											<XAxis dataKey="hour" stroke="#999" fontSize={10}/>
											<YAxis stroke="#999" fontSize={10} allowDecimals={false}/>
											<Tooltip contentStyle={{background: "#0a0a0a", border: "1px solid #333"}}/>
											<Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2}/>
										</LineChart>
									</ResponsiveContainer>
								)}
							</CardContent>
						</Card>
					)}
					{show.bookingsPerStaff && <Card>
						<CardHeader><CardTitle>Bookings per staff</CardTitle></CardHeader>
						<CardContent style={{height: 220}}>
							{analytics && (
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={analytics.bookingsPerStaff}>
										<CartesianGrid strokeDasharray="3 3" stroke="#333"/>
										<XAxis dataKey="username" stroke="#999" fontSize={10}/>
										<YAxis stroke="#999" fontSize={10} allowDecimals={false}/>
										<Tooltip contentStyle={{background: "#0a0a0a", border: "1px solid #333"}}/>
										<Bar dataKey="count" fill="#7c3aed"/>
									</BarChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>}
				</div>
			)}

			{show.seatTypeBreakdown && (
				<Card>
					<CardHeader><CardTitle>Seat type breakdown</CardTitle></CardHeader>
					<CardContent style={{height: 220}}>
						{analytics && (
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={typeChartData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#333"/>
									<XAxis dataKey="name" stroke="#999" fontSize={10}/>
									<YAxis stroke="#999" fontSize={10} allowDecimals={false}/>
									<Tooltip contentStyle={{background: "#0a0a0a", border: "1px solid #333"}}/>
									<Bar dataKey="Booked" stackId="a" fill="#f43f5e"/>
									<Bar dataKey="Available" stackId="a" fill="#334155" radius={[3, 3, 0, 0]}/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>
			)}

			{analytics && (
				<Card>
					<CardHeader><CardTitle>Seat type availability</CardTitle></CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
							{[
								...TYPE_ORDER.map((t) => analytics.bookingsByType.find((b) => b.type === t) ?? {type: t, booked: 0, available: 0, blocked: 0}),
								...analytics.bookingsByType.filter((b) => !(TYPE_ORDER as string[]).includes(b.type)),
							].map((entry) => {
								const type = entry.type;
								const isKnownType = (TYPE_ORDER as string[]).includes(type);
								const total = entry.booked + entry.available + entry.blocked;
								const layoutCount = isKnownType ? SEAT_LAYOUT.seats.filter((s) => s.type === type).length : 0;
								if (total === 0 && layoutCount === 0) return null;
								const unseeded = total === 0 && layoutCount > 0;
								const noAvailable = entry.available === 0 && total > 0;
								const isFullyBlocked = noAvailable && entry.booked === 0;
								const isFullyBooked = noAvailable && entry.booked > 0;
								const nonBlocked = entry.booked + entry.available;
								const pct = nonBlocked > 0 ? Math.round((entry.booked / nonBlocked) * 100) : noAvailable ? 100 : 0;
								const fillBarColor = pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#22c55e";
								const color = SEAT_TYPE_COLORS[type as SeatType] ?? "#a1a1aa";
								const label = SEAT_TYPE_LABELS[type as SeatType] ?? type;
								const canBlock = isKnownType && !unseeded && entry.available > 0;
								const isBusy = zoneBusy === type + "block" || zoneBusy === type + "unblock";
								return (
									<div key={type} className={`rounded-md border p-3 text-xs flex flex-col gap-2 ${unseeded ? "border-zinc-700 bg-zinc-900 opacity-50" : isFullyBlocked ? "border-orange-800 bg-orange-950/30" : isFullyBooked ? "border-rose-800 bg-rose-950/30" : "border-zinc-700 bg-zinc-900"}`}>
										<div className="flex items-center gap-1.5">
											<span className="font-semibold text-sm flex-1 min-w-0 truncate" style={{color}}>{label}</span>
											{unseeded
												? <span className="rounded bg-zinc-700 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">NOT SEEDED</span>
												: isFullyBlocked
													? <span className="rounded bg-orange-900 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300 shrink-0">BLOCKED</span>
													: isFullyBooked
														? <span className="rounded bg-rose-900 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-300 shrink-0">FULL</span>
														: <span className="text-[10px] text-zinc-400 shrink-0">{pct}%</span>
											}
											{!unseeded && isKnownType && (
												isFullyBlocked ? (
													<button
														type="button"
														title="Unblock zone"
														disabled={isBusy}
														onClick={() => setZoneConfirm({type: type as SeatType, action: "unblock", count: entry.blocked})}
														className="shrink-0 rounded p-0.5 text-orange-400 hover:bg-orange-950/60 hover:text-orange-300 disabled:opacity-40 transition-colors"
													>
														<LockOpen className="h-3.5 w-3.5"/>
													</button>
												) : canBlock ? (
													<button
														type="button"
														title="Block zone"
														disabled={isBusy || zoneBusy !== null}
														onClick={() => setZoneConfirm({type: type as SeatType, action: "block", count: entry.available})}
														className="shrink-0 rounded p-0.5 text-zinc-500 hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-40 transition-colors"
													>
														<Lock className="h-3.5 w-3.5"/>
													</button>
												) : null
											)}
										</div>
										<div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
											<div className="h-full rounded-full transition-all" style={{
												width: unseeded ? "0%" : `${pct}%`,
												backgroundColor: isFullyBlocked ? "#f97316" : isFullyBooked ? "#ef4444" : fillBarColor,
											}}/>
										</div>
										<div className="flex justify-between text-zinc-400">
											{unseeded
												? <span>{layoutCount} seats in layout</span>
												: <>
													<span><span className="text-foreground font-medium">{entry.booked}</span> booked</span>
													{isFullyBlocked
														? <span style={{color}}>{entry.blocked} blocked</span>
														: isFullyBooked
															? <span className="text-rose-400">0 left</span>
															: <span className="text-emerald-400">{entry.available} left</span>
													}
												</>
											}
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{recentActivity.length > 0 && show.recentBookings && (
				<Card>
					<CardHeader><CardTitle>Recent bookings</CardTitle></CardHeader>
					<CardContent>
						<div className="space-y-1">
							{recentActivity.map((a) => (
								<div key={a.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm odd:bg-zinc-900">
									<div className="flex items-center gap-3">
										<span className="font-mono font-bold text-emerald-400 w-14">{a.seatId}</span>
										<span className="text-foreground">
											{a.student ? `${a.student.name} ${a.student.surname} (${a.student.class})` : "—"}
										</span>
									</div>
									<div className="flex items-center gap-3 text-muted-foreground text-xs">
										<span>{a.performedByUser?.username ?? "—"}</span>
										<span>{new Date(a.performedAt).toLocaleString("en-GB", {hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Bangkok"})}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* ── Section blocks (left / center / right) ── */}
			{show.sectionBlocks && <Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Section blocks</CardTitle>
						{sectionStatuses.some((s) => s.available === 0 && s.blocked > 0) && (
							<Badge variant="destructive">
								{sectionStatuses.filter((s) => s.available === 0 && s.blocked > 0).length} section{sectionStatuses.filter((s) => s.available === 0 && s.blocked > 0).length !== 1 ? "s" : ""} blocked
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2">
						<Select value={selectedSection} onValueChange={setSelectedSection}>
							<SelectTrigger className="w-40"><SelectValue placeholder="Select section…"/></SelectTrigger>
							<SelectContent>
								{SECTION_ORDER.filter((sec) => {
									const s = sectionStatuses.find((x) => x.section === sec);
									return s && s.available > 0;
								}).map((sec) => (
									<SelectItem key={sec} value={sec}>{SECTION_LABELS[sec]} section</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="destructive"
							size="sm"
							disabled={!selectedSection || sectionBusy !== null}
							onClick={() => { sectionAction(selectedSection, "block"); setSelectedSection(""); }}
						>
							Block section
						</Button>
					</div>

					{/* Section status overview */}
					<div className="grid grid-cols-3 gap-2">
						{sectionStatuses.map((s) => {
							const total = s.available + s.booked + s.blocked;
							const isFullyBlocked = s.available === 0 && s.blocked > 0 && s.booked === 0;
							const hasBlocked = s.blocked > 0;
							return (
								<div key={s.section} className={`rounded-md border p-3 text-xs ${isFullyBlocked ? "border-orange-700 bg-orange-950/40" : hasBlocked ? "border-amber-800 bg-amber-950/20" : "border-zinc-700 bg-zinc-900"}`}>
									<div className="flex items-center justify-between mb-2">
										<span className={`font-semibold text-sm ${isFullyBlocked ? "text-orange-400" : ""}`}>{SECTION_LABELS[s.section] ?? s.section}</span>
										{isFullyBlocked
											? <span className="rounded bg-orange-900 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">BLOCKED</span>
											: <span className="text-[10px] text-zinc-500">{total} seats</span>
										}
									</div>
									<div className="flex gap-3 text-zinc-400">
										<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"/>{s.booked}</span>
										<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"/>{s.available}</span>
										{s.blocked > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0"/>{s.blocked}</span>}
									</div>
									{isFullyBlocked && (
										<Button
											variant="outline"
											size="sm"
											className="mt-2 w-full h-7 text-xs"
											disabled={sectionBusy === s.section + "unblock"}
											onClick={() => sectionAction(s.section, "unblock")}
										>
											Unblock
										</Button>
									)}
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>}

			{/* ── Row blocks & Individual seat blocks ── */}
			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Row blocks</CardTitle>
							{blockedRows.length > 0 && <Badge variant="destructive">{blockedRows.length} row{blockedRows.length !== 1 ? "s" : ""} blocked</Badge>}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-2">
							<Select value={selectedRow} onValueChange={setSelectedRow}>
								<SelectTrigger className="w-40"><SelectValue placeholder="Select row…"/></SelectTrigger>
								<SelectContent>
									{blockableRows.map((r) => <SelectItem key={r} value={r}>Row {r}</SelectItem>)}
								</SelectContent>
							</Select>
							<Button variant="destructive" size="sm" disabled={!selectedRow || busy !== null} onClick={() => { rowAction(selectedRow, "block"); setSelectedRow(""); }}>
								Block row
							</Button>
						</div>
						{blockedRows.length === 0 ? (
							<p className="text-sm text-muted-foreground">No rows currently blocked.</p>
						) : (
							<div className="divide-y divide-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
								{blockedRows.map((r) => (
									<div key={r.row} className="flex items-center justify-between bg-zinc-800/50 px-4 py-2.5">
										<div className="flex items-center gap-4">
											<span className="w-12 text-sm font-bold text-rose-400">Row {r.row}</span>
											<div className="flex gap-3 text-xs text-muted-foreground">
												<span className="text-rose-400">{r.blocked} blocked</span>
												{r.booked > 0 && <span className="text-amber-400">{r.booked} booked</span>}
												{r.available > 0 && <span className="text-emerald-400">{r.available} available</span>}
											</div>
										</div>
										<Button variant="outline" size="sm" disabled={busy === r.row + "unblock"} onClick={() => rowAction(r.row, "unblock")}>Unblock</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Individual seat blocks</CardTitle>
							{individualBlockedSeats.length > 0 && <Badge variant="destructive">{individualBlockedSeats.length} seat{individualBlockedSeats.length !== 1 ? "s" : ""} blocked</Badge>}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-end gap-2">
							<div className="flex flex-col gap-1">
								<label className="text-xs text-muted-foreground">Row</label>
								<Select value={blockRow} onValueChange={(v) => { setBlockRow(v); setBlockSeatNum(""); }}>
									<SelectTrigger className="w-28"><SelectValue placeholder="Row"/></SelectTrigger>
									<SelectContent>{ROW_ORDER.filter((r) => !fullyBlockedRowSet.has(r)).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-xs text-muted-foreground">Seat</label>
								<Select value={blockSeatNum} onValueChange={setBlockSeatNum} disabled={!blockRow}>
									<SelectTrigger className="w-28"><SelectValue placeholder="Seat"/></SelectTrigger>
									<SelectContent>{(rowSeatsMap[blockRow] ?? []).map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
								</Select>
							</div>
							<Button variant="destructive" size="sm" disabled={!blockRow || !blockSeatNum || seatBusy !== null} onClick={blockSeat}>Block seat</Button>
						</div>
						{individualBlockedSeats.length === 0 ? (
							<p className="text-sm text-muted-foreground">No individual seats currently blocked.</p>
						) : (
							<div className="divide-y divide-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
								{individualBlockedSeats.map((s) => (
									<div key={s.id} className="flex items-center justify-between bg-zinc-800/50 px-4 py-2.5">
										<span className="text-sm font-bold text-rose-400">{s.id}</span>
										<Button variant="outline" size="sm" disabled={seatBusy === s.id} onClick={() => unblockSeat(s.id)}>Unblock</Button>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{rowStatuses.length > 0 && show.rowOverview && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Row overview</CardTitle>
							<button
								type="button"
								onClick={() => setRowOverviewExpanded((v) => !v)}
								className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
								title={rowOverviewExpanded ? "Collapse" : "Expand"}
							>
								{rowOverviewExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
							</button>
						</div>
					</CardHeader>
					{rowOverviewExpanded && <CardContent>
						<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
							{[...rowStatuses].sort((a, b) => {
								const totalA = a.available + a.booked + a.blocked;
								const totalB = b.available + b.booked + b.blocked;
								const pctA = totalA > 0 ? (a.booked + a.blocked) / totalA : 0;
								const pctB = totalB > 0 ? (b.booked + b.blocked) / totalB : 0;
								return pctB - pctA;
							}).map((r) => {
								const total = r.available + r.booked + r.blocked;
								const fillPct = total > 0 ? Math.round((r.booked / total) * 100) : 0;
								const isFull = r.available === 0 && r.booked > 0 && r.blocked === 0;
								const isFullyBlocked = r.available === 0 && r.blocked > 0 && r.booked === 0;
								const noAvailable = r.available === 0;
								const barColor = fillPct >= 80 ? "bg-rose-500" : fillPct >= 50 ? "bg-amber-400" : "bg-emerald-500";
								return (
									<div key={r.row} className={`rounded-md border p-2 text-xs ${isFullyBlocked ? "border-orange-700 bg-orange-950/50" : isFull ? "border-rose-800 bg-rose-950/50" : "border-zinc-700 bg-zinc-900"}`}>
										<div className="flex items-center justify-between">
											<span className={`font-bold text-sm ${isFullyBlocked ? "text-orange-400" : isFull ? "text-rose-400" : ""}`}>Row {r.row}</span>
											{isFull
												? <span className="rounded bg-rose-900 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-300">FULL</span>
												: isFullyBlocked
													? <span className="rounded bg-orange-900 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">BLOCKED</span>
													: <span className="text-[10px] text-zinc-500">{total}</span>
											}
										</div>
										<div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
											<div className={`h-full rounded-full transition-all ${isFullyBlocked ? "bg-orange-600 w-full" : isFull ? "bg-rose-600 w-full" : barColor}`} style={noAvailable ? undefined : {width: `${fillPct}%`}}/>
										</div>
										<div className="mt-1 flex gap-2.5">
											<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"/>{r.booked}</span>
											<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"/>{r.available}</span>
											{r.blocked > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0"/>{r.blocked}</span>}
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>}
				</Card>
			)}

			{analytics && analytics.checkinByClass.length > 0 && show.checkinByRoom && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Check-in by room</CardTitle>
							<span className="text-xs text-muted-foreground">
								{analytics.studentsSeated}/{analytics.studentsTotal} checked in
								{analytics.studentsTotal > 0 && ` · ${Math.round(analytics.studentsSeated / analytics.studentsTotal * 100)}%`}
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<div className="divide-y divide-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
							{analytics.checkinByClass.map((c) => {
								const pct = c.total > 0 ? Math.round(c.seated / c.total * 100) : 0;
								return (
									<div key={c.class} className="flex items-center gap-3 bg-zinc-800/50 px-3 py-1.5">
										<span className="w-16 text-xs font-semibold text-zinc-200">{c.class}</span>
										<div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
											<div className="h-full rounded-full bg-emerald-500 transition-all" style={{width: `${pct}%`}}/>
										</div>
										<span className="text-xs text-muted-foreground w-20 text-right">{c.seated}/{c.total} · {pct}%</span>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>

		{/* Zone block confirmation dialog */}

		<Dialog open={!!zoneConfirm} onOpenChange={(o) => { if (!o) setZoneConfirm(null); }}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{zoneConfirm?.action === "block" ? "Block zone" : "Unblock zone"}
					</DialogTitle>
					<DialogDescription>
						{zoneConfirm && (
							zoneConfirm.action === "block" ? (
								<>
									This will block all <strong className="text-foreground">{zoneConfirm.count} available</strong> seat{zoneConfirm.count !== 1 ? "s" : ""} in the <strong className="text-foreground">{SEAT_TYPE_LABELS[zoneConfirm.type]}</strong> zone. Booked seats are not affected.
								</>
							) : (
								<>
									This will unblock all <strong className="text-foreground">{zoneConfirm.count} blocked</strong> seat{zoneConfirm.count !== 1 ? "s" : ""} in the <strong className="text-foreground">{SEAT_TYPE_LABELS[zoneConfirm.type]}</strong> zone, making them available again.
								</>
							)
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setZoneConfirm(null)}>
						Cancel
					</Button>
					<Button
						variant={zoneConfirm?.action === "block" ? "destructive" : "default"}
						disabled={zoneBusy !== null}
						onClick={() => {
							if (!zoneConfirm) return;
							zoneAction(zoneConfirm.type, zoneConfirm.action);
							setZoneConfirm(null);
						}}
					>
						{zoneConfirm?.action === "block" ? "Block" : "Unblock"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
		</>
	);
}

function Stat({label, value, accent}: {
	label: string;
	value: React.ReactNode;
	accent?: "green" | "red" | "amber" | "zinc";
}) {
	const tint =
		accent === "green"
			? "text-emerald-400"
			: accent === "red"
				? "text-rose-400"
				: accent === "amber"
					? "text-amber-400"
					: accent === "zinc"
						? "text-zinc-400"
						: "text-foreground";
	return (
		<Card>
			<CardContent className="p-4">
				<div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
				<div className={`mt-1 text-2xl font-bold ${tint}`}>{value}</div>
			</CardContent>
		</Card>
	);
}
