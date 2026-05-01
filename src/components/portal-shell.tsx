"use client";

import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {ArmchairIcon, ScanLine, Users, ClipboardList, LogOut, GraduationCap, LayoutDashboard} from "lucide-react";
import {signOut} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof ArmchairIcon; exact?: boolean };

const STAFF_NAV: NavItem[] = [
	{href: "/staff", label: "Seat map", icon: ArmchairIcon, exact: true},
	{href: "/staff/scan", label: "Scan QR", icon: ScanLine},
];

const ADMIN_NAV: NavItem[] = [
	{href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true},
	{href: "/admin/seats", label: "Seat map", icon: ArmchairIcon},
	{href: "/admin/scan", label: "Scan QR", icon: ScanLine},
	{href: "/admin/staff", label: "Staff", icon: Users},
	{href: "/admin/students", label: "Students", icon: GraduationCap},
	{href: "/admin/logs", label: "Logs", icon: ClipboardList},
];

export function PortalShell({
	                            role,
	                            username,
	                            children,
                            }: {
	role: "STAFF" | "ADMIN";
	username: string;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const items = role === "ADMIN" ? ADMIN_NAV : STAFF_NAV;

	return (
		<div className="flex min-h-screen flex-col">
			<header className="flex items-center gap-3 border-b bg-card/40 px-4 py-2">
				<div className="rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground shrink-0">
					{role}
				</div>
				<nav className="flex flex-1 items-center gap-1 overflow-x-auto">
					{items.map((item) => {
						const Icon = item.icon;
						const active = item.exact
							? pathname === item.href
							: pathname === item.href || pathname.startsWith(item.href + "/");
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
									active
										? "bg-secondary text-secondary-foreground"
										: "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4"/>
								{item.label}
							</Link>
						);
					})}
				</nav>
				<div className="flex shrink-0 items-center gap-3 text-sm">
					<span className="text-muted-foreground hidden sm:inline">@{username}</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={async () => {
							await signOut();
							router.replace("/login");
						}}
					>
						<LogOut className="h-4 w-4"/> Sign out
					</Button>
				</div>
			</header>
			<main className="flex-1 p-4">{children}</main>
		</div>
	);
}
