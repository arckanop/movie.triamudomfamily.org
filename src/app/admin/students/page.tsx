"use client";

import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Seat = {
	id: string;
	row: string;
	number: number;
	section: string;
	type: string;
	status: string;
};

type Student = {
	id: string;
	studentId: string;
	name: string;
	surname: string;
	class: string;
	rollNumber: number;
	email: string;
	seatId: string | null;
	createdAt: string;
	seat: Seat | null;
};

export default function StudentsPage() {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({q: "", class: "", seat: ""});
	const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
	const isMount = useRef(true);

	async function load() {
		setLoading(true);
		const params = new URLSearchParams();
		if (filters.q) params.set("q", filters.q);
		if (filters.class) params.set("class", filters.class);
		if (filters.seat) params.set("seat", filters.seat);
		const res = await fetch(`/api/students?${params.toString()}`);
		if (res.ok) setStudents((await res.json()).students);
		setLoading(false);
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isMount.current) { isMount.current = false; return; }
		const t = setTimeout(() => load(), 400);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.q, filters.class]);

	async function deleteStudent() {
		if (!deleteTarget) return;
		const res = await fetch(`/api/students/${deleteTarget.id}`, {method: "DELETE"});
		if (res.ok) {
			toast.success("Student deleted");
			setDeleteTarget(null);
			load();
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	function exportCsv() {
		const header = [
			"student_id",
			"name",
			"surname",
			"class",
			"roll_number",
			"email",
			"seat",
			"seat_type",
			"seat_status",
			"registered_at",
		].join(",");
		const rows = students.map((s) => {
			const cells = [
				s.studentId,
				s.name,
				s.surname,
				s.class,
				s.rollNumber,
				s.email,
				s.seat ? `${s.seat.row}-${s.seat.number}` : "",
				s.seat?.type ?? "",
				s.seat?.status ?? "",
				new Date(s.createdAt).toLocaleString("sv-SE", {timeZone: "Asia/Bangkok"}) + "+07:00",
			];
			return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
		});
		const csv = [header, ...rows].join("\n");
		const blob = new Blob([csv], {type: "text/csv"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `students-${new Date().toLocaleDateString("sv-SE", {timeZone: "Asia/Bangkok"})}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const booked = students.filter((s) => s.seat).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Student data</h1>
					<p className="text-sm text-muted-foreground">
						All registered students and their seat assignments.
					</p>
				</div>
				<Button onClick={exportCsv} disabled={students.length === 0}>
					Export CSV
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filters</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-3">
					<div className="space-y-1">
						<Label>Search</Label>
						<Input
							placeholder="Name, surname, or student ID"
							value={filters.q}
							onChange={(e) => setFilters({...filters, q: e.target.value})}
						/>
					</div>
					<div className="space-y-1">
						<Label>Class</Label>
						<Input
							placeholder="e.g. 601"
							maxLength={3}
							value={filters.class}
							onChange={(e) => setFilters({...filters, class: e.target.value})}
						/>
					</div>
					<div className="space-y-1">
						<Label>Seat</Label>
						<Select
							value={filters.seat || "all"}
							onValueChange={(v) =>
								setFilters({...filters, seat: v === "all" ? "" : v})
							}
						>
							<SelectTrigger>
								<SelectValue/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="booked">Seat booked</SelectItem>
								<SelectItem value="unbooked">No seat</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button onClick={load} className="sm:col-span-3" disabled={loading}>
						{loading ? "Loading…" : "Apply filters"}
					</Button>
				</CardContent>
			</Card>

			<div className="flex items-center gap-4 text-sm text-muted-foreground">
				<span>{students.length} student{students.length !== 1 ? "s" : ""}</span>
				<span>{booked} with seat · {students.length - booked} without</span>
			</div>

			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student ID</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Class</TableHead>
								<TableHead>Number</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Seat</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Registered</TableHead>
								<TableHead/>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.length === 0 && (
								<TableRow>
									<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
										{loading ? "Loading…" : "No students found."}
									</TableCell>
								</TableRow>
							)}
							{students.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="font-mono text-xs">{s.studentId}</TableCell>
									<TableCell>{s.name} {s.surname}</TableCell>
									<TableCell>{s.class}</TableCell>
									<TableCell className="text-xs text-muted-foreground">{s.rollNumber}</TableCell>
									<TableCell className="text-xs text-muted-foreground">{s.email}</TableCell>
									<TableCell>
										{s.seat ? (
											<span className="font-mono text-xs">
												{s.seat.row}-{s.seat.number}
											</span>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										{s.seat ? (
											<Badge variant="outline" className="text-xs capitalize">
												{s.seat.type}
											</Badge>
										) : null}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(s.createdAt).toLocaleDateString(undefined, {timeZone: "Asia/Bangkok"})}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setDeleteTarget(s)}
										>
											<Trash2 className="h-4 w-4"/>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		<Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete student data</DialogTitle>
						<DialogDescription>
							This will permanently delete all data for{" "}
							<strong>{deleteTarget?.name} {deleteTarget?.surname}</strong>{" "}
							({deleteTarget?.studentId}) and free their seat if booked. This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={deleteStudent}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
