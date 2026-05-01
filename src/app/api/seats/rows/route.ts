import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET() {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const seats = await prisma.seat.findMany({select: {row: true, status: true}});

	const map = new Map<string, { available: number; blocked: number; booked: number }>();
	for (const s of seats) {
		if (!map.has(s.row)) map.set(s.row, {available: 0, blocked: 0, booked: 0});
		const entry = map.get(s.row)!;
		if (s.status === "AVAILABLE") entry.available++;
		else if (s.status === "BLOCKED") entry.blocked++;
		else entry.booked++;
	}

	const rows = Array.from(map.entries()).map(([row, counts]) => ({row, ...counts}));
	return NextResponse.json({rows});
}
