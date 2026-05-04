import {redirect} from "next/navigation";
import QRCode from "qrcode";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {TicketSignOutButton} from "./ticket-sign-out-button";

export default async function TicketPage() {
	const session = await getSession();
	if (!session) redirect("/register");
	const student = await prisma.student.findUnique({
		where: {userId: session.user.id},
		include: {seat: true},
	});
	if (!student) redirect("/register");

	const qrDataUrl = await QRCode.toDataURL(student.qrToken, {
		margin: 1,
		width: 280,
		color: {dark: "#ffffff", light: "#18181b"},
	});

	return (
		<div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0"
				style={{background: "radial-gradient(ellipse 80% 55% at 50% 0%, oklch(0.38 0.14 350 / 0.45) 0%, transparent 68%)"}}
			/>

			<div className="relative w-full max-w-sm">
				{/* Ticket card */}
				<div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d0d14] shadow-2xl shadow-black/70">

					{/* Header */}
					<div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-600 to-purple-800 px-6 py-6">
						<div
							className="absolute inset-0 opacity-20 mix-blend-soft-light"
							style={{
								backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
							}}
						/>
						<div className="relative">
							<div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-pink-200/70">
								Triamudom Family · Movie Night
							</div>
							<div className="mt-1 text-4xl font-black tracking-tight text-white drop-shadow-md">
								ตั๋วหนัง
							</div>
						</div>
					</div>

					{/* Info grid */}
					<div className="px-6 pt-5 pb-3">
						<div className="grid grid-cols-2 gap-x-4 gap-y-4">
							<div>
								<div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">ชื่อ-นามสกุล</div>
								<div className="mt-0.5 text-base font-semibold text-zinc-100">
									{student.name} {student.surname}
								</div>
							</div>
							<div>
								<div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">ห้องเรียน</div>
								<div className="mt-0.5 text-base font-semibold text-zinc-100">
									{student.class} · #{student.rollNumber}
								</div>
							</div>
							<div className="col-span-2">
								<div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">รหัสนักเรียน</div>
								<div className="mt-0.5 font-mono text-base text-zinc-100">
									{student.studentId}
								</div>
							</div>
						</div>
					</div>

					{/* Perforated tear line */}
					<div className="relative my-2 flex items-center px-3">
						<div className="-ml-6 h-5 w-5 shrink-0 rounded-full border-r border-zinc-700 bg-[#08080e]"/>
						<div className="mx-1 flex-1 border-t-2 border-dashed border-zinc-700"/>
						<div className="-mr-6 h-5 w-5 shrink-0 rounded-full border-l border-zinc-700 bg-[#08080e]"/>
					</div>

					{/* QR section */}
					<div className="px-6 pb-5">
						<div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
							แสดง QR นี้ที่ประตูทางเข้า
						</div>
						<div className="flex justify-center">
							<div className="rounded-xl border border-zinc-700 bg-[#18181b] p-2.5 shadow-inner">
								<img
									src={qrDataUrl}
									alt="Your ticket QR code"
									className="block rounded-lg"
									width={200}
									height={200}
								/>
							</div>
						</div>

						{/* Seat badge */}
						<div className="relative mt-4 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-4 text-center">
							<div
								className="pointer-events-none absolute inset-0"
								style={{background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(244,63,94,0.12) 0%, transparent 70%)"}}
							/>
							{student.seat ? (
								<>
									<div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">ที่นั่งของคุณ</div>
									<div
										className="mt-1 text-5xl font-black text-white"
										style={{textShadow: "0 0 24px rgba(244,63,94,0.55), 0 0 48px rgba(244,63,94,0.25)"}}
									>
										{student.seat.id}
									</div>
								</>
							) : (
								<div className="text-sm text-zinc-500">
									ยังไม่ได้กำหนดที่นั่ง — นำ QR นี้มาในวันฉาย
								</div>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className="border-t border-dashed border-zinc-800 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-zinc-600">
						Triamudom Family
					</div>
				</div>

				{/* Below-card actions */}
				<div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
					<span>รหัส: <span className="font-mono">{student.qrToken.slice(0, 12)}…</span></span>
					<TicketSignOutButton/>
				</div>
			</div>
		</div>
	);
}
