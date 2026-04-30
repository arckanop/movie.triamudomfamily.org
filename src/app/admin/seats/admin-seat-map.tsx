"use client";

import {useState} from "react";
import {toast} from "sonner";
import {SeatMap, type SeatStatusMap} from "@/components/seat/seat-map";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {type SeatType} from "@/lib/seat-layout";

type SeatInfo = {
	seat: {
		id: string;
		status: "AVAILABLE" | "BOOKED" | "BLOCKED";
		bookedBy: string | null;
		bookedAt: string | null;
		student: {
			id: string;
			name: string;
			surname: string;
			class: string;
			rollNumber: number;
			studentId: string;
		} | null;
	};
	performer: { id: string; name: string; username: string | null } | null;
};

type SearchedStudent = {
	id: string;
	name: string;
	surname: string;
	class: string;
	rollNumber: number;
	studentId: string;
	seatId: string | null;
};

export function AdminSeatMap({initialStatus}: { initialStatus: SeatStatusMap }) {
	const [info, setInfo] = useState<SeatInfo | null>(null);
	const [openSeat, setOpenSeat] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<
		| { kind: "cancel"; seatId: string }
		| { kind: "block"; seatId: string }
		| { kind: "unblock"; seatId: string }
		| null
	>(null);
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState<SearchedStudent[]>([]);
	const [assignTarget, setAssignTarget] = useState<string | null>(null);
	const [blockingAssign, setBlockingAssign] = useState(false);
	const [assignBlocked, setAssignBlocked] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [confirmSuccess, setConfirmSuccess] = useState(false);

	async function loadInfo(seatId: string) {
		setOpenSeat(seatId);
		setInfo(null);
		const res = await fetch(`/api/seats/${seatId}/info`);
		if (res.ok) setInfo(await res.json());
	}

	function handleSeatClick(
		seatId: string,
		status: "AVAILABLE" | "BOOKED" | "BLOCKED",
		_type: SeatType,
	) {
		if (status === "AVAILABLE") {
			setAssignTarget(seatId);
			setSearch("");
			setSearchResults([]);
			setAssignBlocked(false);
			return;
		}
		loadInfo(seatId);
	}

	async function blockAssignTarget() {
		if (!assignTarget) return;
		setBlockingAssign(true);
		const res = await fetch(`/api/seats/${assignTarget}/block`, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: "{}",
		});
		setBlockingAssign(false);
		if (res.ok) {
			toast.success(`${assignTarget} blocked`);
			setAssignTarget(null);
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	async function searchStudents(q: string) {
		setSearch(q);
		if (q.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`);
		if (res.ok) {
			const data = await res.json();
			setSearchResults(data.students);
		}
	}

	async function assignSeat(seatId: string, studentId: string) {
		const res = await fetch("/api/bookings", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({seatId, studentId}),
		});
		if (res.ok) {
			toast.success(`${seatId} assigned`);
			setAssignTarget(null);
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Booking failed");
		}
	}

	async function applyConfirm() {
		if (!confirmAction || confirmLoading) return;
		const action = confirmAction;
		setConfirmLoading(true);

		let ok = false;
		let errorMsg = "Failed";

		if (action.kind === "cancel") {
			const res = await fetch(`/api/bookings/${action.seatId}`, {method: "DELETE"});
			ok = res.ok;
		} else if (action.kind === "block") {
			const res = await fetch(`/api/seats/${action.seatId}/block`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: "{}",
			});
			ok = res.ok;
			if (!ok) errorMsg = (await res.json().catch(() => ({}))).error ?? "Failed";
		} else if (action.kind === "unblock") {
			const res = await fetch(`/api/seats/${action.seatId}/unblock`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: "{}",
			});
			ok = res.ok;
		}

		setConfirmLoading(false);
		if (ok) {
			setConfirmSuccess(true);
			setTimeout(() => {
				setConfirmSuccess(false);
				setConfirmAction(null);
				setOpenSeat(null);
			}, 1000);
		} else {
			toast.error(errorMsg);
		}
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Seat map</CardTitle>
				</CardHeader>
				<CardContent>
					<SeatMap
						initialStatus={initialStatus}
						isAdmin
						onSeatClick={handleSeatClick}
					/>
				</CardContent>
			</Card>

			<Dialog open={!!openSeat} onOpenChange={(o) => !o && setOpenSeat(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Seat {openSeat}{" "}
							{info && (
								<Badge variant="secondary" className="ml-2">
									{info.seat.status}
								</Badge>
							)}
						</DialogTitle>
					</DialogHeader>
					{info ? (
						<div className="space-y-3 text-sm">
							{info.seat.student && (
								<div className="rounded-md border p-3">
									<div className="font-medium">
										{info.seat.student.name} {info.seat.student.surname}
									</div>
									<div className="text-xs text-muted-foreground">
										Class {info.seat.student.class} · #{info.seat.student.rollNumber} ·{" "}
										{info.seat.student.studentId}
									</div>
								</div>
							)}
							{info.seat.bookedAt && (
								<div className="text-xs text-muted-foreground">
									Booked by{" "}
									<span className="font-medium text-foreground">
										{info.performer?.username ?? info.performer?.name ?? "unknown"}
									</span>{" "}
									on {new Date(info.seat.bookedAt).toLocaleString(undefined, {timeZone: "Asia/Bangkok"})}
								</div>
							)}
							<div className="flex flex-wrap gap-2 w-full">
								{info.seat.status === "BOOKED" && (
									<Button
										variant="destructive"
										onClick={() => setConfirmAction({kind: "cancel", seatId: info.seat.id})}
									>
										Cancel booking
									</Button>
								)}
								{info.seat.status === "AVAILABLE" && (
									<Button
										variant="secondary"
										onClick={() => setConfirmAction({kind: "block", seatId: info.seat.id})}
									>
										Block seat
									</Button>
								)}
								{info.seat.status === "BLOCKED" && (
									<Button
										variant="secondary"
										className="w-full"
										onClick={() => setConfirmAction({kind: "unblock", seatId: info.seat.id})}
									>
										Unblock seat
									</Button>
								)}
								{info.seat.status === "BOOKED" && (
									<Button
										variant="secondary"
										onClick={() => setConfirmAction({kind: "block", seatId: info.seat.id})}
									>
										Block (after cancelling)
									</Button>
								)}
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">Loading…</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Assign seat {assignTarget}</DialogTitle>
						<DialogDescription>
							Search for a student by name, surname, class, or student ID.
						</DialogDescription>
					</DialogHeader>
					<Button
						variant="destructive"
						className="w-full"
						disabled={blockingAssign || assignBlocked}
						onClick={blockAssignTarget}
					>
						{blockingAssign ? "Blocking…" : assignBlocked ? "Blocked" : "Block seat"}
					</Button>
					<Input
						autoFocus
						placeholder="Type to search…"
						value={search}
						onChange={(e) => searchStudents(e.target.value)}
					/>
					<div className="max-h-72 space-y-1 overflow-y-auto">
						{searchResults.map((s) => (
							<button
								key={s.id}
								onClick={() => assignTarget && assignSeat(assignTarget, s.id)}
								className="flex w-full items-center justify-between rounded-md border p-2 text-left text-sm hover:bg-accent"
							>
								<div>
									<div className="font-medium">{s.name} {s.surname}</div>
									<div className="text-xs text-muted-foreground">
										Class {s.class} · #{s.rollNumber} · {s.studentId}
									</div>
								</div>
								{s.seatId && (
									<span className="text-xs text-amber-400">has seat {s.seatId}</span>
								)}
							</button>
						))}
						{search.length >= 2 && searchResults.length === 0 && (
							<div className="text-xs text-muted-foreground">No matches.</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={!!confirmAction} onOpenChange={(o) => !o && !confirmLoading && !confirmSuccess && setConfirmAction(null)}>
				<DialogContent>
					{confirmLoading ? (
						<div className="flex flex-col items-center gap-3 py-6">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"/>
							<p className="text-sm text-muted-foreground">
								{confirmAction?.kind === "block" ? "Blocking…" : confirmAction?.kind === "unblock" ? "Unblocking…" : "Processing…"}
							</p>
						</div>
					) : confirmSuccess ? (
						<div className="flex flex-col items-center gap-3 py-6">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
							</svg>
							<p className="text-sm font-medium">
								{confirmAction?.kind === "block" ? "Blocked successfully" : confirmAction?.kind === "unblock" ? "Unblocked successfully" : "Done"}
							</p>
						</div>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Are you sure?</DialogTitle>
								<DialogDescription>
									{confirmAction?.kind === "cancel" &&
										`This will cancel the booking for ${confirmAction.seatId} and free the seat.`}
									{confirmAction?.kind === "block" &&
										`This will block ${confirmAction.seatId}. Staff will not be able to assign it.`}
									{confirmAction?.kind === "unblock" &&
										`This will unblock ${confirmAction.seatId} and make it available.`}
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
								<Button variant="destructive" onClick={applyConfirm}>Confirm</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
