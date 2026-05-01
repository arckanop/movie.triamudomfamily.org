"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {Armchair} from "lucide-react";
import {ROW_LABELS, SEAT_LAYOUT, type SeatType} from "@/lib/seat-layout";
import {getSupabaseClient, SEAT_CHANNEL, SEAT_EVENT} from "@/lib/supabase-client";
import {cn} from "@/lib/utils";

export type SeatStatusValue = "AVAILABLE" | "BOOKED" | "BLOCKED";
export type SeatStatusMap = Record<string, SeatStatusValue>;

export type SeatMapProps = {
	initialStatus: SeatStatusMap;
	selectedSeats?: string[];
	ownedByCurrentScan?: string[];
	onSeatClick?: (seatId: string, status: SeatStatusValue, type: SeatType) => void;
	isAdmin?: boolean;
	legend?: boolean;
	className?: string;
};

const TYPE_COLOR: Record<SeatType, string> = {
	normal: "var(--seat-normal)",
	honeymoon: "var(--seat-honeymoon)",
	privilege_plus: "var(--seat-privilege-plus)",
	privilege_normal: "var(--seat-privilege-normal)",
	vip: "var(--seat-vip)",
	premium: "var(--seat-premium)",
	balcony: "var(--seat-balcony)",
};

const NEUTRAL_STROKE = "rgba(255,255,255,0.22)";

export function SeatMap({
	initialStatus,
	selectedSeats = [],
	ownedByCurrentScan = [],
	onSeatClick,
	isAdmin,
	legend = true,
	className,
}: SeatMapProps) {
	const [status, setStatus] = useState<SeatStatusMap>(initialStatus);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setStatus((prev) => ({...prev, ...initialStatus}));
	}, [initialStatus]);

	// Supabase Realtime — instant updates when the broadcast reaches the client
	useEffect(() => {
		const client = getSupabaseClient();
		if (!client) return;
		const channel = client.channel(SEAT_CHANNEL);
		channel.on(
			"broadcast",
			{event: SEAT_EVENT},
			(payload: {payload: {seat?: string; status?: SeatStatusValue}}) => {
				const seat = payload.payload?.seat;
				const next = payload.payload?.status;
				if (!seat || !next) return;
				setStatus((prev) => ({...prev, [seat]: next}));
			},
		);
		channel.subscribe();
		return () => {
			client.removeChannel(channel);
		};
	}, []);

	// Polling fallback — catches anything realtime misses
	useEffect(() => {
		const tick = async () => {
			try {
				const res = await fetch("/api/seats");
				if (!res.ok) return;
				const {seats} = await res.json() as {seats: {id: string; status: SeatStatusValue}[]};
				setStatus((prev) => {
					const changed = seats.some((s) => prev[s.id] !== s.status);
					if (!changed) return prev;
					const map: SeatStatusMap = {};
					for (const s of seats) map[s.id] = s.status;
					return map;
				});
			} catch { /* ignore */ }
		};
		const id = setInterval(tick, 3000);
		return () => clearInterval(id);
	}, []);

	const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
	const ownedSet = useMemo(() => new Set(ownedByCurrentScan), [ownedByCurrentScan]);

	return (
		<div className={cn("flex flex-col items-stretch gap-3", className)}>
			<div
				ref={containerRef}
				className="seat-map-scroll relative w-full overflow-auto rounded-lg border bg-black/60 p-4"
			>
				<div className="mb-2 text-[10px] uppercase tracking-[0.4em] text-zinc-500 text-center">
					── Screen ──
				</div>
				<div
					className="relative mx-auto"
					style={{
						display: "grid",
						width: "max-content",
						gridTemplateColumns: `repeat(${SEAT_LAYOUT.cols}, 16px)`,
						gridAutoRows: "16px",
						gap: "3px",
					}}
				>
					{SEAT_LAYOUT.separators.map((sep) => (
						<div key={`sep-${sep.gridRow}`} aria-hidden style={{gridRow: sep.gridRow}}/>
					))}
					{ROW_LABELS.map((r) => (
						<div
							key={`lbl-l-${r.row}`}
							aria-hidden
							style={{gridRow: r.gridRow, gridColumn: 1}}
							className="flex items-center justify-center text-[9px] font-bold text-zinc-400 select-none"
						>
							{r.row}
						</div>
					))}
					{ROW_LABELS.map((r) => (
						<div
							key={`lbl-r-${r.row}`}
							aria-hidden
							style={{gridRow: r.gridRow, gridColumn: SEAT_LAYOUT.cols}}
							className="flex items-center justify-center text-[9px] font-bold text-zinc-400 select-none"
						>
							{r.row}
						</div>
					))}
					{SEAT_LAYOUT.seats.map((s) => {
						const seatStatus = status[s.id] ?? "AVAILABLE";
						const isSelected = selectedSet.has(s.id);
						const isOwned = ownedSet.has(s.id);
						const clickable =
							!!onSeatClick &&
							(isAdmin || seatStatus === "AVAILABLE" || isOwned);
						const fillColor =
							seatStatus === "AVAILABLE"
								? TYPE_COLOR[s.type]
								: seatStatus === "BOOKED"
									? isOwned
										? "#f59e0b"
										: "var(--seat-booked)"
									: "var(--seat-blocked)";
						const strokeColor = isSelected ? "#ffffff" : NEUTRAL_STROKE;
						return (
							<button
								key={s.id}
								type="button"
								disabled={!clickable}
								title={`${s.id} · ${s.type} · ${seatStatus}${isOwned ? " · scanned student" : ""}`}
								onClick={() => onSeatClick?.(s.id, seatStatus, s.type)}
								style={{
									gridRow: s.gridRow,
									gridColumn: s.col,
									opacity: clickable ? 1 : 0.65,
								}}
								className={cn(
									"relative w-full aspect-square transition-transform",
									clickable
										? "cursor-pointer hover:scale-[1.3]"
										: "cursor-not-allowed",
								)}
							>
								<Armchair
									className="w-full h-full"
									style={{
										stroke: strokeColor,
										fill: fillColor,
										strokeWidth: isSelected ? 1.5 : 1,
									}}
								/>
								<span className="absolute inset-x-0 bottom-[2px] text-center text-[7px] leading-none font-bold text-white/90 select-none pointer-events-none">
									{s.number}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			{legend && <SeatLegend/>}
		</div>
	);
}

export function SeatLegend() {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
			<LegendSeat fill="var(--seat-normal)" stroke={NEUTRAL_STROKE} label="Normal"/>
			<LegendSeat fill="var(--seat-honeymoon)" stroke={NEUTRAL_STROKE} label="Honeymoon"/>
			<LegendSeat fill="var(--seat-privilege-plus)" stroke={NEUTRAL_STROKE} label="Privilege+"/>
			<LegendSeat fill="var(--seat-privilege-normal)" stroke={NEUTRAL_STROKE} label="Privilege"/>
			<LegendSeat fill="var(--seat-vip)" stroke={NEUTRAL_STROKE} label="VIP"/>
			<LegendSeat fill="var(--seat-premium)" stroke={NEUTRAL_STROKE} label="Premium"/>
			<LegendSeat fill="var(--seat-balcony)" stroke={NEUTRAL_STROKE} label="Balcony"/>
			<span className="mx-1 h-3 w-px bg-border"/>
			<LegendSeat fill="var(--seat-booked)" stroke={NEUTRAL_STROKE} label="Booked"/>
			<LegendSeat fill="#f59e0b" stroke={NEUTRAL_STROKE} label="Scanned"/>
			<LegendSeat fill="var(--seat-blocked)" stroke={NEUTRAL_STROKE} label="Blocked"/>
		</div>
	);
}

function LegendSeat({fill, stroke, label}: {fill: string; stroke: string; label: string}) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<Armchair
				aria-hidden
				className="h-4 w-4 shrink-0"
				style={{fill, stroke, strokeWidth: 1.5}}
			/>
			{label}
		</span>
	);
}
