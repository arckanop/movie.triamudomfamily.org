"use client";

import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Trash2, KeyRound, UserPlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
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

type Staff = {
	id: string;
	name: string;
	username: string | null;
	displayUsername: string | null;
	role: "STAFF" | "ADMIN";
	createdAt: string;
};

export default function StaffManagementPage() {
	const [staff, setStaff] = useState<Staff[]>([]);
	const [open, setOpen] = useState(false);
	const [resetResult, setResetResult] = useState<{
		user: string;
		password: string;
	} | null>(null);
	const [form, setForm] = useState({
		name: "",
		username: "",
		password: "",
		role: "STAFF" as "STAFF" | "ADMIN",
	});

	async function load() {
		const res = await fetch("/api/staff");
		if (res.ok) setStaff((await res.json()).staff);
	}

	useEffect(() => {
		load();
	}, []);

	async function createStaff(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch("/api/staff", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(form),
		});
		if (res.ok) {
			toast.success("Account created");
			setOpen(false);
			setForm({name: "", username: "", password: "", role: "STAFF"});
			load();
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	async function deleteStaff(id: string) {
		if (!confirm("Delete this staff account? This cannot be undone.")) return;
		const res = await fetch(`/api/staff/${id}`, {method: "DELETE"});
		if (res.ok) {
			toast.success("Deleted");
			load();
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	async function resetPassword(s: Staff) {
		const res = await fetch(`/api/staff/${s.id}/password`, {method: "PATCH"});
		if (res.ok) {
			const data = await res.json();
			setResetResult({user: s.username ?? s.name, password: data.password});
		} else {
			toast.error("Failed");
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Staff accounts</h1>
					<p className="text-sm text-muted-foreground">
						Create and manage staff/admin accounts.
					</p>
				</div>
				<Button onClick={() => setOpen(true)}>
					<UserPlus className="h-4 w-4"/> New account
				</Button>
			</div>
			<Card>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Username</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{staff.map((s) => (
								<TableRow key={s.id}>
									<TableCell>{s.name}</TableCell>
									<TableCell className="font-mono text-xs">
										{s.displayUsername ?? s.username}
									</TableCell>
									<TableCell>
										<Badge variant={s.role === "ADMIN" ? "default" : "secondary"}>
											{s.role}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(s.createdAt).toLocaleString()}
									</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="sm" onClick={() => resetPassword(s)}>
											<KeyRound className="h-4 w-4"/> Reset
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => deleteStaff(s.id)}
										>
											<Trash2 className="h-4 w-4"/> Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New staff account</DialogTitle>
						<DialogDescription>
							The user will sign in with this username and password at /login.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={createStaff} className="space-y-3">
						<div className="space-y-1">
							<Label htmlFor="staffName">Display name</Label>
							<Input
								id="staffName"
								required
								value={form.name}
								onChange={(e) => setForm({...form, name: e.target.value})}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="staffUsername">Username</Label>
							<Input
								id="staffUsername"
								required
								value={form.username}
								onChange={(e) => setForm({...form, username: e.target.value})}
								pattern="[A-Za-z0-9_]+"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="staffPassword">Password</Label>
							<Input
								id="staffPassword"
								required
								minLength={6}
								value={form.password}
								onChange={(e) => setForm({...form, password: e.target.value})}
							/>
						</div>
						<div className="space-y-1">
							<Label>Role</Label>
							<Select
								value={form.role}
								onValueChange={(v) => setForm({...form, role: v as "STAFF" | "ADMIN"})}
							>
								<SelectTrigger>
									<SelectValue/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="STAFF">Staff</SelectItem>
									<SelectItem value="ADMIN">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Create</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={!!resetResult} onOpenChange={(o) => !o && setResetResult(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Temporary password generated</DialogTitle>
						<DialogDescription>
							Share this password with {resetResult?.user} privately. It will not
							be shown again.
						</DialogDescription>
					</DialogHeader>
					<div className="rounded-md border bg-muted p-3 font-mono text-lg">
						{resetResult?.password}
					</div>
					<DialogFooter>
						<Button onClick={() => setResetResult(null)}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
