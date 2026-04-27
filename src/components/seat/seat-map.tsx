"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {SEAT_LAYOUT, ROW_LABELS, type SeatType} from "@/lib/seat-layout";
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

const TYPE_FILL: Record<SeatType, string> = {
	premium: "var(--seat-premium)",
	standard: "var(--seat-standard)",
	gold: "var(--seat-gold)",
	vip: "var(--seat-vip)",
	front: "var(--seat-front)",
};

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

	useEffect(() => {
		const client = getSupabaseClient();
		if (!client) return;
		const channel = client.channel(SEAT_CHANNEL);
		channel.on(
			"broadcast",
			{event: SEAT_EVENT},
			(payload: { payload: { seat?: string; status?: SeatStatusValue } }) => {
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

	const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
	const ownedSet = useMemo(() => new Set(ownedByCurrentScan), [ownedByCurrentScan]);

	return (
		<div className={cn("flex flex-col items-stretch gap-3", className)}>
			<div
				ref={containerRef}
				className="seat-map-scroll relative w-full overflow-auto rounded-lg border bg-black/60 p-4"
			>
				<div className="text-center text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-2">
					── Screen ──
				</div>
				<div
					className="relative mx-auto"
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${SEAT_LAYOUT.cols}, minmax(14px, 1fr))`,
						gridAutoRows: "minmax(14px, 18px)",
						gap: "3px",
						minWidth: `${SEAT_LAYOUT.cols * 14}px`,
					}}
				>
					{SEAT_LAYOUT.seats.map((s) => {
						const seatStatus = status[s.id] ?? "AVAILABLE";
						const isSelected = selectedSet.has(s.id);
						const isOwned = ownedSet.has(s.id);
						const clickable =
							!!onSeatClick &&
							(isAdmin ||
								seatStatus === "AVAILABLE" ||
								isOwned);
						const baseColor =
							seatStatus === "AVAILABLE"
								? "var(--seat-available)"
								: seatStatus === "BOOKED"
									? isOwned
										? "#f59e0b"
										: "var(--seat-booked)"
									: "var(--seat-blocked)";
						const ring = isSelected
							? "0 0 0 2px #fff, 0 0 0 4px " + TYPE_FILL[s.type]
							: "0 0 0 1px rgba(255,255,255,0.05)";
						return (
							<button
								key={s.id}
								type="button"
								disabled={!clickable}
								title={`${s.id} · ${s.type} · ${seatStatus}${isOwned ? " · scanned student" : ""}`}
								onClick={() =>
									onSeatClick?.(s.id, seatStatus, s.type)
								}
								style={{
									gridRow: s.gridRow,
									gridColumn: s.col,
									background: baseColor,
									borderTop: `2px solid ${TYPE_FILL[s.type]}`,
									boxShadow: ring,
									opacity: clickable ? 1 : 0.7,
								}}
								className={cn(
									"rounded-[3px] transition-transform aspect-square w-full",
									clickable
										? "cursor-pointer hover:scale-[1.25]"
										: "cursor-not-allowed",
								)}
							/>
						);
					})}
					{ROW_LABELS.map((r) => (
						<div
							key={`label-${r.row}`}
							className="text-[9px] text-zinc-500 font-mono pr-1 text-right"
							style={{gridRow: r.gridRow, gridColumn: 1}}
						>
							{r.row}
						</div>
					))}
				</div>
			</div>
			{legend && <SeatLegend/>}
		</div>
	);
}

export function SeatLegend() {
	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
			<LegendDot color="var(--seat-available)" label="Available"/>
			<LegendDot color="var(--seat-booked)" label="Booked"/>
			<LegendDot color="#f59e0b" label="Scanned student"/>
			<LegendDot color="var(--seat-blocked)" label="Blocked"/>
			<span className="mx-1 h-3 w-px bg-border"/>
			<LegendDot color="var(--seat-premium)" label="Premium"/>
			<LegendDot color="var(--seat-standard)" label="Standard"/>
			<LegendDot color="var(--seat-gold)" label="Gold"/>
			<LegendDot color="var(--seat-vip)" label="VIP"/>
			<LegendDot color="var(--seat-front)" label="Front"/>
		</div>
	);
}

function LegendDot({color, label}: { color: string; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5">
      <span
	      className="inline-block h-3 w-3 rounded"
	      style={{background: color}}
	      aria-hidden
      />
			{label}
    </span>
	);
}
