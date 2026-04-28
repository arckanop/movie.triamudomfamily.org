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
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="relative overflow-hidden rounded-2xl bg-zinc-100 text-zinc-900 shadow-2xl">
					<div className="bg-linear-to-br from-pink-300 to-pink-600 p-5">
						{/*<div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/90">*/}
						{/*	เตรียมอุดม · ค่ำคืนหนัง*/}
						{/*</div>*/}
						<div className="mt-2 text-3xl font-black text-white">ตั๋วหนัง</div>
					</div>
					<div className="p-5">
						<div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wider text-zinc-500">
							<div>
								<div>ชื่อ-นามสกุล</div>
								<div
									className="mt-0.5 text-base font-semibold normal-case tracking-normal text-zinc-900">
									{student.name} {student.surname}
								</div>
							</div>
							<div>
								<div>ห้องเรียน</div>
								<div
									className="mt-0.5 text-base font-semibold normal-case tracking-normal text-zinc-900">
									{student.class} · #{student.rollNumber}
								</div>
							</div>
							<div className="col-span-2">
								<div>รหัสนักเรียน</div>
								<div className="mt-0.5 font-mono text-base text-zinc-900 normal-case tracking-normal">
									{student.studentId}
								</div>
							</div>
						</div>

						<div className="my-5 flex items-center gap-3">
							<div className="h-px flex-1 bg-zinc-300"/>
							<div className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
								แสดง QR นี้ที่ประตูทางเข้า
							</div>
							<div className="h-px flex-1 bg-zinc-300"/>
						</div>

						<div className="flex justify-center">
							<img
								src={qrDataUrl}
								alt="Your ticket QR code"
								className="rounded-lg border border-zinc-200"
								width={240}
								height={240}
							/>
						</div>

						<div className="mt-5 rounded-lg bg-zinc-900 p-3 text-center text-white">
							{student.seat ? (
								<>
									<div className="text-xs uppercase tracking-[0.3em] text-zinc-400">
										ที่นั่งของคุณ
									</div>
									<div className="text-3xl font-black">{student.seat.id}</div>
								</>
							) : (
								<div className="text-sm">
									ยังไม่ได้กำหนดที่นั่ง — นำ QR นี้มาในวันฉาย
								</div>
							)}
						</div>
					</div>
					<div
						className="border-t-2 border-dashed border-zinc-300 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
						Triamudom Family
					</div>
				</div>
				<div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
					<span>รหัส: <span className="font-mono">{student.qrToken.slice(0, 12)}…</span></span>
					<TicketSignOutButton/>
				</div>
			</div>
		</div>
	);
}
