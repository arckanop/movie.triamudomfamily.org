import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center bg-[#050509] text-white [color-scheme:dark] relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: [
						"radial-gradient(ellipse 70% 40% at 20% 0%, rgba(120,40,80,0.15) 0%, transparent 60%)",
						"radial-gradient(ellipse 50% 30% at 80% 100%, rgba(40,20,80,0.10) 0%, transparent 60%)",
					].join(", "),
				}}
			/>

			<div className="relative flex flex-col items-center gap-6 px-6 text-center">
				<div className="flex items-center gap-3 text-zinc-700">
					<div className="h-px w-12 bg-zinc-800"/>
					<span className="font-mono text-[10px] tracking-[0.4em] uppercase">Error</span>
					<div className="h-px w-12 bg-zinc-800"/>
				</div>

				<h1
					className="font-black leading-none tracking-tighter text-white"
					style={{
						fontSize: "clamp(6rem,22vw,12rem)",
						textShadow: "0 0 60px rgba(244,63,94,0.35), 0 0 120px rgba(244,63,94,0.15)",
					}}
				>
					404
				</h1>

				<div className="flex flex-col gap-1">
					<p className="text-lg font-semibold text-zinc-300">ไม่พบหน้านี้</p>
					<p className="text-sm text-zinc-500">
						หน้าที่คุณกำลังมองหาไม่มีอยู่หรือถูกย้ายแล้ว
					</p>
				</div>

				<Link
					href="/"
					className="mt-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
				>
					← กลับหน้าหลัก
				</Link>
			</div>

			<span className="absolute bottom-6 font-mono text-[9px] tracking-[0.3em] text-zinc-800 uppercase select-none">
				Triamudom Family · Movie Register
			</span>
		</div>
	);
}
