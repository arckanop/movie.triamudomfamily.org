"use client";

import {useEffect} from "react";
import Link from "next/link";

export default function ErrorPage({
	error,
	unstable_retry,
}: {
	error: Error & {digest?: string};
	unstable_retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center bg-[#050509] text-white [color-scheme:dark] relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0"
				style={{background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(239,68,68,0.10) 0%, transparent 65%)"}}
			/>

			<div className="relative flex flex-col items-center gap-6 px-6 text-center max-w-md">
				<div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-900/50 bg-red-950/40 text-red-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="8" x2="12" y2="12"/>
						<line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</div>

				<div className="flex flex-col gap-1.5">
					<h1 className="text-2xl font-bold text-white">เกิดข้อผิดพลาด</h1>
					<p className="text-sm text-zinc-400">
						มีบางอย่างผิดพลาด กรุณาลองใหม่หรือกลับหน้าหลัก
					</p>
					{error.digest && (
						<p className="mt-1 font-mono text-[10px] text-zinc-700">
							ref: {error.digest}
						</p>
					)}
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={unstable_retry}
						className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-400 active:scale-[0.97]"
						style={{boxShadow: "0 0 20px rgba(244,63,94,0.35)"}}
					>
						ลองอีกครั้ง
					</button>
					<Link
						href="/"
						className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
					>
						หน้าหลัก
					</Link>
				</div>
			</div>
		</div>
	);
}
