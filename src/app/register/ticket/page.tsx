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
		width: 320,
		color: {dark: "#0a0a0a", light: "#ffffff"},
	});

	return (
		<div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
			<div
				className="pointer-events-none absolute inset-0"
				style={{background: "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.92 0.04 350 / 0.5) 0%, transparent 70%)"}}
			/>

			<div className="relative w-full max-w-md">
				{/* Ticket card */}
				<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
					{/* Header stripe */}
					<div className="bg-linear-to-br from-pink-400 to-rose-600 px-6 py-5">
						<div className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-100/80">
							Triamudom Family · Movie Night
						</div>
						<div className="mt-1.5 text-3xl font-black text-white tracking-tight">ตั๋วหนัง</div>
					</div>

					{/* Info grid */}
					<div className="px-6 pt-5 pb-3">
						<div className="grid grid-cols-2 gap-x-4 gap-y-4">
							<div>
								<div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">ชื่อ-นามสกุล</div>
								<div className="mt-0.5 text-base font-semibold text-slate-900">
									{student.name} {student.surname}
								</div>
							</div>
							<div>
								<div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">ห้องเรียน</div>
								<div className="mt-0.5 text-base font-semibold text-slate-900">
									{student.class} · #{student.rollNumber}
								</div>
							</div>
							<div className="col-span-2">
								<div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">รหัสนักเรียน</div>
								<div className="mt-0.5 font-mono text-base text-slate-900">
									{student.studentId}
								</div>
							</div>
						</div>
					</div>

					{/* Perforated divider */}
					<div className="relative my-2 flex items-center px-3">
						<div className="-ml-6 h-5 w-5 shrink-0 rounded-full bg-slate-50 border-r border-slate-200"/>
						<div className="flex-1 border-t-2 border-dashed border-slate-200 mx-1"/>
						<div className="-mr-6 h-5 w-5 shrink-0 rounded-full bg-slate-50 border-l border-slate-200"/>
					</div>

					{/* QR section */}
					<div className="px-6 pb-5">
						<div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
							แสดง QR นี้ที่ประตูทางเข้า
						</div>
						<div className="flex justify-center">
							<div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
								<img
									src={qrDataUrl}
									alt="Your ticket QR code"
									className="block rounded-lg"
									width={220}
									height={220}
								/>
							</div>
						</div>

						{/* Seat display */}
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 p-4 text-center">
							{student.seat ? (
								<>
									<div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">ที่นั่งของคุณ</div>
									<div className="mt-1 text-4xl font-black text-white">{student.seat.id}</div>
								</>
							) : (
								<div className="text-sm text-slate-400">
									ยังไม่ได้กำหนดที่นั่ง — นำ QR นี้มาในวันฉาย
								</div>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className="border-t-2 border-dashed border-slate-200 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-slate-400">
						Triamudom Family
					</div>
				</div>

				{/* Below-card actions */}
				<div className="mt-5 flex items-center justify-between text-xs text-slate-400">
					<span>รหัส: <span className="font-mono">{student.qrToken.slice(0, 12)}…</span></span>
					<TicketSignOutButton/>
				</div>
			</div>
		</div>
	);
}
