import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET() {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const [counts, countsByType, bookingLogs, staffUsers, studentsTotal, studentsSeated, studentsByClass] = await Promise.all([
		prisma.seat.groupBy({
			by: ["status"],
			_count: {_all: true},
		}),
		prisma.seat.groupBy({
			by: ["type", "status"],
			_count: {_all: true},
		}),
		prisma.bookingLog.findMany({
			where: {action: "BOOKED"},
			select: {performedAt: true, performedBy: true},
			orderBy: {performedAt: "asc"},
		}),
		prisma.user.findMany({
			where: {role: {in: ["STAFF", "ADMIN"]}},
			select: {id: true, username: true, name: true},
		}),
		prisma.student.count(),
		prisma.student.count({where: {seatId: {not: null}}}),
		prisma.student.groupBy({
			by: ["class"],
			_count: {_all: true},
		}),
	]);

	const total = counts.reduce((acc, c) => acc + c._count._all, 0);
	const summary = {
		total,
		available: counts.find((c) => c.status === "AVAILABLE")?._count._all ?? 0,
		booked: counts.find((c) => c.status === "BOOKED")?._count._all ?? 0,
		blocked: counts.find((c) => c.status === "BLOCKED")?._count._all ?? 0,
	};

	const userById = new Map(staffUsers.map((u) => [u.id, u]));

	// Bookings per hour (GMT+07:00)
	const perHour = new Map<string, number>();
	for (const l of bookingLogs) {
		// Shift UTC to GMT+7 then read as UTC to get local hour buckets
		const d = new Date(new Date(l.performedAt).getTime() + 7 * 60 * 60 * 1000);
		const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")} ${d.getUTCHours().toString().padStart(2, "0")}:00`;
		perHour.set(key, (perHour.get(key) ?? 0) + 1);
	}
	const bookingsPerHour = Array.from(perHour.entries())
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.map(([hour, count]) => ({hour, count}));

	// Bookings by seat type
	const typeMap = new Map<string, {booked: number; available: number; blocked: number}>();
	for (const c of countsByType) {
		const entry = typeMap.get(c.type) ?? {booked: 0, available: 0, blocked: 0};
		if (c.status === "BOOKED") entry.booked = c._count._all;
		else if (c.status === "AVAILABLE") entry.available = c._count._all;
		else if (c.status === "BLOCKED") entry.blocked = c._count._all;
		typeMap.set(c.type, entry);
	}
	const bookingsByType = Array.from(typeMap.entries()).map(([type, counts]) => ({type, ...counts}));

	// Bookings per staff
	const perStaff = new Map<string, number>();
	for (const l of bookingLogs) {
		perStaff.set(l.performedBy, (perStaff.get(l.performedBy) ?? 0) + 1);
	}
	const bookingsPerStaff = Array.from(perStaff.entries())
		.map(([userId, count]) => ({
			userId,
			username: userById.get(userId)?.username ?? userById.get(userId)?.name ?? "unknown",
			count,
		}))
		.sort((a, b) => b.count - a.count);

	const [seatedByClass, bookedNoStudent, studentSeatMismatch] = await Promise.all([
		prisma.student.groupBy({
			by: ["class"],
			where: {seatId: {not: null}},
			_count: {_all: true},
		}),
		// Seats marked BOOKED but no student linked
		prisma.seat.findMany({
			where: {status: "BOOKED", student: null},
			select: {id: true},
		}),
		// Students with a seatId but the seat is not BOOKED
		prisma.student.findMany({
			where: {seatId: {not: null}, seat: {status: {not: "BOOKED"}}},
			select: {studentId: true, name: true, surname: true, seatId: true, seat: {select: {status: true}}},
		}),
	]);

	const seatedByClassMap = new Map(seatedByClass.map((r) => [r.class, r._count._all]));
	const checkinByClass = studentsByClass
		.map((r) => ({
			class: r.class,
			total: r._count._all,
			seated: seatedByClassMap.get(r.class) ?? 0,
		}))
		.sort((a, b) => a.class.localeCompare(b.class));

	const conflicts = {
		bookedNoStudent: bookedNoStudent.map((s) => s.id),
		studentSeatMismatch: studentSeatMismatch.map((s) => ({
			studentId: s.studentId,
			name: `${s.name} ${s.surname}`,
			seatId: s.seatId!,
			seatStatus: s.seat!.status,
		})),
	};

	return NextResponse.json({
		summary, bookingsByType, bookingsPerHour, bookingsPerStaff,
		studentsTotal, studentsSeated, studentsWaiting: studentsTotal - studentsSeated,
		checkinByClass, conflicts,
	});
}
