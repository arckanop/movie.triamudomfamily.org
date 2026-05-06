"use client";

import {useEffect, useState} from "react";

function pad(n: number) {
	return String(n).padStart(2, "0");
}

export function CountdownTimer({targetIso}: {targetIso: string}) {
	const [diff, setDiff] = useState<number | null>(null);

	useEffect(() => {
		const target = new Date(targetIso).getTime();
		function tick() { setDiff(Math.max(0, target - Date.now())); }
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [targetIso]);

	if (diff === null) return null;

	if (diff === 0) {
		return (
			<span className="text-sm font-semibold tracking-[0.3em] text-rose-400 uppercase">
				เริ่มแล้ว!
			</span>
		);
	}

	const days  = Math.floor(diff / 86_400_000);
	const hours = Math.floor((diff % 86_400_000) / 3_600_000);
	const mins  = Math.floor((diff % 3_600_000) / 60_000);
	const secs  = Math.floor((diff % 60_000) / 1_000);

	return (
		<div className="flex items-end gap-2.5">
			<Unit value={days}  label="วัน"/>
			<Sep/>
			<Unit value={hours} label="ชม."/>
			<Sep/>
			<Unit value={mins}  label="นาที"/>
			<Sep/>
			<Unit value={secs}  label="วิ"/>
		</div>
	);
}

function Unit({value, label}: {value: number; label: string}) {
	return (
		<div className="flex flex-col items-center gap-0.5">
			<span className="font-mono text-2xl font-bold leading-none tabular-nums text-white">
				{pad(value)}
			</span>
			<span className="text-[9px] tracking-[0.35em] text-zinc-500 uppercase">{label}</span>
		</div>
	);
}

function Sep() {
	return (
		<span className="mb-4 font-mono text-base font-bold leading-none text-zinc-600">:</span>
	);
}
