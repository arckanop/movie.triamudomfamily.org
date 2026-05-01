import Link from "next/link";
import {QrCode, ScanLine, ArmchairIcon, Smartphone} from "lucide-react";

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
			<div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0"
					style={{background: "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.92 0.04 350 / 0.5) 0%, transparent 70%)"}}
				/>

				<div className="relative w-full max-w-lg space-y-4">
					<div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80 p-8">
						<div className="mb-6">
							<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-500">
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
								</svg>
							</div>
							<h1 className="text-2xl font-bold text-slate-900">ลงทะเบียนสำเร็จ!</h1>
							<p className="mt-1.5 text-sm text-slate-500">นี่คือสิ่งที่ต้องทำในวันฉายหนัง</p>
						</div>

						<div className="space-y-2.5">
							{STEPS.map((s, i) => {
								const Icon = s.icon;
								return (
									<div key={s.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
										<div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-pink-500 text-white shadow-sm shadow-pink-200">
											<Icon className="h-4 w-4"/>
										</div>
										<div>
											<div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
												ขั้นตอนที่ {i + 1}
											</div>
											<div className="text-sm font-semibold text-slate-800">{s.title}</div>
											<div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.body}</div>
										</div>
									</div>
								);
							})}
						</div>

						<Link
							href="/register/ticket"
							className="mt-6 block w-full rounded-lg bg-pink-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-pink-200 transition-colors hover:bg-pink-600"
						>
							ดูตั๋วของฉัน
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
