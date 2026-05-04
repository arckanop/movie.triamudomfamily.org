import Link from "next/link";
import {QrCode, ScanLine, ArmchairIcon, Smartphone, ChevronLeft} from "lucide-react";

const STEPS = [
	{
		icon: Smartphone,
		title: "พกโทรศัพท์มาด้วย",
		body: "ในวันฉายหนัง เปิดเว็บไซต์นี้บนโทรศัพท์ของคุณ ตั๋ว QR อยู่ที่หน้า /register/ticket",
	},
	{
		icon: QrCode,
		title: "แสดง QR ของคุณ",
		body: "ที่ทางเข้า ยกหน้าจอขึ้นให้เจ้าหน้าที่เห็น QR ของคุณอย่างชัดเจน",
	},
	{
		icon: ScanLine,
		title: "เจ้าหน้าที่จะสแกน",
		body: "เจ้าหน้าที่จะสแกน QR และกำหนดที่นั่งให้คุณ หน้าจอจะแสดงหมายเลขที่นั่งของคุณ",
	},
	{
		icon: ArmchairIcon,
		title: "หาที่นั่งของคุณ",
		body: "เดินเข้าไปในห้องและหาที่นั่งตามหมายเลขที่ได้รับ สนุกกับการชมหนัง!",
	},
];

export default function HowToPage() {
	return (
		<div className="flex flex-1 flex-col">
			<nav className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/60 bg-[#050509]/80 backdrop-blur-sm">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
				>
					<ChevronLeft className="h-3.5 w-3.5"/>
					กลับหน้าหลัก
				</Link>
				<Link
					href="/register/ticket"
					className="px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700 hover:text-white transition-colors"
				>
					ดูตั๋ว
				</Link>
			</nav>
			<div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0"
					style={{background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(244,63,94,0.12) 0%, transparent 70%)"}}
				/>

				<div className="relative w-full max-w-lg space-y-4">
					<div className="rounded-2xl border border-zinc-800 bg-[#0d0d14] shadow-2xl shadow-black/80 p-8">
						<div className="mb-6">
							<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-900/50 bg-green-950/40 text-green-400">
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
								</svg>
							</div>
							<h1 className="text-2xl font-bold text-white">ลงทะเบียนสำเร็จ!</h1>
							<p className="mt-1.5 text-sm text-zinc-400">นี่คือสิ่งที่ต้องทำในวันฉายหนัง</p>
						</div>

						<div className="space-y-2.5">
							{STEPS.map((s, i) => {
								const Icon = s.icon;
								return (
									<div key={s.title} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
										<div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-pink-500 text-white shadow-sm shadow-pink-900/50">
											<Icon className="h-4 w-4"/>
										</div>
										<div>
											<div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-0.5">
												ขั้นตอนที่ {i + 1}
											</div>
											<div className="text-sm font-semibold text-zinc-200">{s.title}</div>
											<div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{s.body}</div>
										</div>
									</div>
								);
							})}
						</div>

						<Link
							href="/register/ticket"
							className="mt-6 block w-full rounded-lg bg-pink-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-pink-900/50 transition-colors hover:bg-pink-400"
						>
							ดูตั๋วของฉัน
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
