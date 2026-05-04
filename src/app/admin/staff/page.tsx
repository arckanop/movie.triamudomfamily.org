"use client";

import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Trash2, KeyRound, UserPlus, RefreshCw, Copy, Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent} from "@/components/ui/card";
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
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";

type Staff = {
	id: string;
	name: string;
	username: string | null;
	displayUsername: string | null;
	role: "STAFF" | "ADMIN";
	createdAt: string;
};

type BulkResult = {
	name: string;
	username: string;
	password: string;
	error?: string;
};

function generatePassword() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	for (let i = 0; i < 10; i++) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return out;
}

function copyText(text: string) {
	navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
}

export default function StaffManagementPage() {
	const [staff, setStaff] = useState<Staff[]>([]);
	const [open, setOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
	const [resetResult, setResetResult] = useState<{user: string; password: string} | null>(null);
	const [createResult, setCreateResult] = useState<{user: string; password: string} | null>(null);
	const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
	const [form, setForm] = useState({
		name: "",
		username: "",
		password: "",
		role: "STAFF" as "STAFF" | "ADMIN",
	});
	const [multiInput, setMultiInput] = useState("");
	const [multiRole, setMultiRole] = useState<"STAFF" | "ADMIN">("STAFF");

	async function load() {
		const res = await fetch("/api/staff");
		if (res.ok) {
			const data = await res.json();
			setStaff((data.staff as Staff[]).sort((a, b) => {
				if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
				return a.name.localeCompare(b.name);
			}));
		}
	}

	useEffect(() => {
		load();
	}, []);

	function openDialog() {
		setForm({name: "", username: "", password: generatePassword(), role: "STAFF"});
		setMultiInput("");
		setMultiRole("STAFF");
		setOpen(true);
	}

	async function createStaff(e: React.FormEvent) {
		e.preventDefault();
		const res = await fetch("/api/staff", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(form),
		});
		if (res.ok) {
			const savedPassword = form.password;
			const savedUsername = form.username;
			setOpen(false);
			setForm({name: "", username: "", password: "", role: "STAFF"});
			setCreateResult({user: savedUsername, password: savedPassword});
			load();
		} else {
			const data = await res.json();
			toast.error(data.error ?? "Failed");
		}
	}

	async function createBulk(e: React.FormEvent) {
		e.preventDefault();
		const lines = multiInput.split("\n").map((l) => l.trim()).filter(Boolean);
		if (lines.length === 0) return;

		const results: BulkResult[] = [];
		for (const line of lines) {
			const parts = line.split(",").map((p) => p.trim());
			const name = parts[0];
			const username = (parts[1] ?? parts[0]).replace(/\s+/g, "_");
			const password = generatePassword();

			const res = await fetch("/api/staff", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({name, username, password, role: multiRole}),
			});

			if (res.ok) {
				results.push({name, username, password});
			} else {
				const data = await res.json();
				results.push({name, username, password, error: data.error ?? "Failed"});
			}
		}

		setOpen(false);
		setBulkResults(results);
		load();
	}

	async function deleteStaff() {
		if (!deleteTarget) return;
		const res = await fetch(`/api/staff/${deleteTarget.id}`, {method: "DELETE"});
		if (res.ok) {
			toast.success("Deleted");
			setDeleteTarget(null);
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
				<Button onClick={openDialog}>
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
										{new Date(s.createdAt).toLocaleString("en-GB", {timeZone: "Asia/Bangkok"})}
									</TableCell>
									<TableCell className="text-right">
										<Button variant="ghost" size="sm" onClick={() => resetPassword(s)}>
											<KeyRound className="h-4 w-4"/> Reset
										</Button>
										<Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}>
											<Trash2 className="h-4 w-4"/> Delete
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Create dialog */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New staff account</DialogTitle>
						<DialogDescription>
							The user will sign in with this username and password at /login.
						</DialogDescription>
					</DialogHeader>

					<Tabs defaultValue="single">
						<TabsList className="w-full">
							<TabsTrigger value="single" className="flex-1">
								<UserPlus className="h-4 w-4 mr-1"/> Single
							</TabsTrigger>
							<TabsTrigger value="multi" className="flex-1">
								<Users className="h-4 w-4 mr-1"/> Multi
							</TabsTrigger>
						</TabsList>

						<TabsContent value="single">
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
									<div className="flex gap-2">
										<Input
											id="staffPassword"
											required
											minLength={6}
											value={form.password}
											onChange={(e) => setForm({...form, password: e.target.value})}
											className="font-mono"
										/>
										<Button
											type="button"
											variant="outline"
											size="icon"
											title="Regenerate"
											onClick={() => setForm({...form, password: generatePassword()})}
										>
											<RefreshCw className="h-4 w-4"/>
										</Button>
									</div>
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
						</TabsContent>

						<TabsContent value="multi">
							<form onSubmit={createBulk} className="space-y-3">
								<div className="space-y-1">
									<Label htmlFor="multiInput">Staff list</Label>
									<textarea
										id="multiInput"
										required
										rows={7}
										placeholder={"Display Name, username\nDisplay Name, username\n..."}
										value={multiInput}
										onChange={(e) => setMultiInput(e.target.value)}
										className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
									/>
									<p className="text-xs text-muted-foreground">
										One per line — <code>Display Name, username</code>. Passwords are auto-generated for each.
									</p>
								</div>
								<div className="space-y-1">
									<Label>Role</Label>
									<Select
										value={multiRole}
										onValueChange={(v) => setMultiRole(v as "STAFF" | "ADMIN")}
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
									<Button type="submit">Create all</Button>
								</DialogFooter>
							</form>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>

			{/* Single create result */}
			<Dialog open={!!createResult} onOpenChange={(o) => !o && setCreateResult(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Account created</DialogTitle>
						<DialogDescription>
							Share this password with <strong>{createResult?.user}</strong> privately. It will not be shown again.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex-1 rounded-md border bg-muted p-3 font-mono text-lg tracking-widest">
							{createResult?.password}
						</div>
						<Button
							variant="outline"
							size="icon"
							onClick={() => createResult && copyText(createResult.password)}
						>
							<Copy className="h-4 w-4"/>
						</Button>
					</div>
					<DialogFooter>
						<Button onClick={() => setCreateResult(null)}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Bulk create results */}
			<Dialog open={!!bulkResults} onOpenChange={(o) => !o && setBulkResults(null)}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Bulk creation results</DialogTitle>
						<DialogDescription>
							Passwords are shown only once — copy and distribute them securely.
						</DialogDescription>
					</DialogHeader>
					<div className="max-h-96 overflow-y-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Password</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bulkResults?.map((r, i) => (
									<TableRow key={i}>
										<TableCell>{r.name}</TableCell>
										<TableCell className="font-mono text-xs">{r.username}</TableCell>
										<TableCell>
											{!r.error && (
												<div className="flex items-center gap-1">
													<span className="font-mono text-xs tracking-widest">{r.password}</span>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => copyText(r.password)}
													>
														<Copy className="h-3 w-3"/>
													</Button>
												</div>
											)}
										</TableCell>
										<TableCell>
											{r.error ? (
												<Badge variant="destructive">{r.error}</Badge>
											) : (
												<Badge className="bg-green-600 hover:bg-green-600">Created</Badge>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					<DialogFooter>
						<Button onClick={() => setBulkResults(null)}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation */}
			<Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete staff account</DialogTitle>
						<DialogDescription>
							This will permanently delete the account for{" "}
							<strong>{deleteTarget?.name}</strong>{" "}
							(@{deleteTarget?.username ?? deleteTarget?.name}). This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
						<Button variant="destructive" onClick={deleteStaff}>Delete</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reset password result */}
			<Dialog open={!!resetResult} onOpenChange={(o) => !o && setResetResult(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Temporary password generated</DialogTitle>
						<DialogDescription>
							Share this password with <strong>{resetResult?.user}</strong> privately. It will not be shown again.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex-1 rounded-md border bg-muted p-3 font-mono text-lg tracking-widest">
							{resetResult?.password}
						</div>
						<Button
							variant="outline"
							size="icon"
							onClick={() => resetResult && copyText(resetResult.password)}
						>
							<Copy className="h-4 w-4"/>
						</Button>
					</div>
					<DialogFooter>
						<Button onClick={() => setResetResult(null)}>Done</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
