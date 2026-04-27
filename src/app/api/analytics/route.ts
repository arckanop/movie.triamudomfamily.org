import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET() {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const [counts, bookingLogs, staffUsers] = await Promise.all([
		prisma.seat.groupBy({
			by: ["status"],
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
	]);

	const total = counts.reduce((acc, c) => acc + c._count._all, 0);
	const summary = {
		total,
		available: counts.find((c) => c.status === "AVAILABLE")?._count._all ?? 0,
		booked: counts.find((c) => c.status === "BOOKED")?._count._all ?? 0,
		blocked: counts.find((c) => c.status === "BLOCKED")?._count._all ?? 0,
	};

	const userById = new Map(staffUsers.map((u) => [u.id, u]));

	// Bookings per hour (UTC truncated)
	const perHour = new Map<string, number>();
	for (const l of bookingLogs) {
		const d = new Date(l.performedAt);
		const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")} ${d.getUTCHours().toString().padStart(2, "0")}:00`;
		perHour.set(key, (perHour.get(key) ?? 0) + 1);
	}
	const bookingsPerHour = Array.from(perHour.entries())
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.map(([hour, count]) => ({hour, count}));

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

	return NextResponse.json({summary, bookingsPerHour, bookingsPerStaff});
}
