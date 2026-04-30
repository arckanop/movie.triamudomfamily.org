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
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {ROW_LABELS, SEAT_LAYOUT} from "@/lib/seat-layout";

type Analytics = {
	summary: { total: number; available: number; booked: number; blocked: number };
	bookingsPerHour: { hour: string; count: number }[];
	bookingsPerStaff: { userId: string; username: string; count: number }[];
};

type RowStatus = {
	row: string;
	available: number;
	blocked: number;
	booked: number;
};

type BlockedSeat = {
	id: string;
	row: string;
	number: number;
};

const ROW_ORDER = ROW_LABELS.map((r) => r.row);

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

	useEffect(() => {
		fetch("/api/analytics").then((r) => { if (r.ok) r.json().then(setAnalytics); });
		fetchRowStatuses();
		fetchBlockedSeats();
	}, [fetchRowStatuses, fetchBlockedSeats]);

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

	return (
		<div className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-4">
				<Stat label="Total seats" value={analytics?.summary.total ?? "—"}/>
				<Stat label="Available" value={analytics?.summary.available ?? "—"} accent="green"/>
				<Stat label="Booked" value={analytics?.summary.booked ?? "—"} accent="red"/>
				<Stat label="Blocked" value={analytics?.summary.blocked ?? "—"} accent="zinc"/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Bookings per hour</CardTitle>
					</CardHeader>
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
				<Card>
					<CardHeader>
						<CardTitle>Bookings per staff</CardTitle>
					</CardHeader>
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
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Row blocks</CardTitle>
						{blockedRows.length > 0 && (
							<Badge variant="destructive">{blockedRows.length} row{blockedRows.length !== 1 ? "s" : ""} blocked</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2">
						<Select value={selectedRow} onValueChange={setSelectedRow}>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Select row…"/>
							</SelectTrigger>
							<SelectContent>
								{blockableRows.map((r) => (
									<SelectItem key={r} value={r}>Row {r}</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="destructive"
							size="sm"
							disabled={!selectedRow || busy !== null}
							onClick={() => { rowAction(selectedRow, "block"); setSelectedRow(""); }}
						>
							Block row
						</Button>
					</div>

					{blockedRows.length === 0 ? (
						<p className="text-sm text-muted-foreground">No rows currently blocked.</p>
					) : (
						<div className="space-y-2">
							{blockedRows.map((r) => (
								<div
									key={r.row}
									className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2"
								>
									<div className="flex items-center gap-3">
										<span className="w-8 text-sm font-bold text-rose-400">Row {r.row}</span>
										<div className="flex gap-3 text-xs text-muted-foreground">
											<span className="text-rose-400">{r.blocked} blocked</span>
											{r.booked > 0 && <span className="text-amber-400">{r.booked} booked</span>}
											{r.available > 0 && <span className="text-emerald-400">{r.available} available</span>}
										</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										disabled={busy === r.row + "unblock"}
										onClick={() => rowAction(r.row, "unblock")}
									>
										Unblock
									</Button>
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
						{individualBlockedSeats.length > 0 && (
							<Badge variant="destructive">{individualBlockedSeats.length} seat{individualBlockedSeats.length !== 1 ? "s" : ""} blocked</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-end gap-2">
						<div className="flex flex-col gap-1">
							<label className="text-xs text-muted-foreground">Row</label>
							<Select value={blockRow} onValueChange={(v) => { setBlockRow(v); setBlockSeatNum(""); }}>
								<SelectTrigger className="w-28">
									<SelectValue placeholder="Row"/>
								</SelectTrigger>
								<SelectContent>
									{ROW_ORDER.map((r) => (
										<SelectItem key={r} value={r}>{r}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1">
							<label className="text-xs text-muted-foreground">Seat</label>
							<Select value={blockSeatNum} onValueChange={setBlockSeatNum} disabled={!blockRow}>
								<SelectTrigger className="w-28">
									<SelectValue placeholder="Seat"/>
								</SelectTrigger>
								<SelectContent>
									{(rowSeatsMap[blockRow] ?? []).map((n) => (
										<SelectItem key={n} value={String(n)}>{n}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							variant="destructive"
							size="sm"
							disabled={!blockRow || !blockSeatNum || seatBusy !== null}
							onClick={blockSeat}
						>
							Block seat
						</Button>
					</div>

					{individualBlockedSeats.length === 0 ? (
						<p className="text-sm text-muted-foreground">No individual seats currently blocked.</p>
					) : (
						<div className="space-y-2">
							{individualBlockedSeats.map((s) => (
								<div
									key={s.id}
									className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2"
								>
									<span className="text-sm font-bold text-rose-400">{s.id}</span>
									<Button
										variant="outline"
										size="sm"
										disabled={seatBusy === s.id}
										onClick={() => unblockSeat(s.id)}
									>
										Unblock
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Stat({label, value, accent}: {
	label: string;
	value: React.ReactNode;
	accent?: "green" | "red" | "zinc";
}) {
	const tint =
		accent === "green"
			? "text-emerald-400"
			: accent === "red"
				? "text-rose-400"
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
