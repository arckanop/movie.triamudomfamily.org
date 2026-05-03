"use client";

import {createContext, useContext, useEffect, useRef, useState} from "react";
import {Settings2} from "lucide-react";

type ShowSettings = {bookingsPerHour: boolean; bookingsPerStaff: boolean; seatTypeBreakdown: boolean; recentBookings: boolean};

const Ctx = createContext<{show: ShowSettings; toggleShow: (k: keyof ShowSettings) => void}>({
	show: {bookingsPerHour: true, bookingsPerStaff: true, seatTypeBreakdown: true, recentBookings: true},
	toggleShow: () => {},
});

export function DashboardSettingsProvider({children}: {children: React.ReactNode}) {
	const [show, setShow] = useState<ShowSettings>(() => {
		try {
			const parsed = JSON.parse(localStorage.getItem("dashboard-show") ?? "{}");
			return {bookingsPerHour: parsed.bookingsPerHour ?? true, bookingsPerStaff: parsed.bookingsPerStaff ?? true, seatTypeBreakdown: parsed.seatTypeBreakdown ?? true, recentBookings: parsed.recentBookings ?? true};
		} catch {
			return {bookingsPerHour: true, bookingsPerStaff: true, seatTypeBreakdown: true, recentBookings: true};
		}
	});

	function toggleShow(key: keyof ShowSettings) {
		setShow((prev) => {
			const next = {...prev, [key]: !prev[key]};
			try { localStorage.setItem("dashboard-show", JSON.stringify(next)); } catch { /* ignore */ }
			return next;
		});
	}

	return <Ctx.Provider value={{show, toggleShow}}>{children}</Ctx.Provider>;
}

export function useDashboardSettings() {
	return useContext(Ctx);
}

export function DashboardSettingsButton() {
	const {show, toggleShow} = useDashboardSettings();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
				title="Dashboard settings"
			>
				<Settings2 className="h-4 w-4"/>
			</button>
			{open && (
				<div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border bg-card p-3 shadow-lg">
					<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Charts</p>
					<div className="space-y-2">
						<ToggleRow label="Bookings per hour" on={show.bookingsPerHour} onToggle={() => toggleShow("bookingsPerHour")}/>
						<ToggleRow label="Bookings per staff" on={show.bookingsPerStaff} onToggle={() => toggleShow("bookingsPerStaff")}/>
						<ToggleRow label="Seat type breakdown" on={show.seatTypeBreakdown} onToggle={() => toggleShow("seatTypeBreakdown")}/>
						<ToggleRow label="Recent bookings" on={show.recentBookings} onToggle={() => toggleShow("recentBookings")}/>
					</div>
				</div>
			)}
		</div>
	);
}

function ToggleRow({label, on, onToggle}: {label: string; on: boolean; onToggle: () => void}) {
	return (
		<button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-sm select-none">
			<span className={on ? "text-foreground" : "text-muted-foreground"}>{label}</span>
			<span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${on ? "bg-primary" : "bg-zinc-600"}`}>
				<span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}/>
			</span>
		</button>
	);
}
