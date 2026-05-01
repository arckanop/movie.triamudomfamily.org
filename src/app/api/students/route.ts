import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET(req: Request) {
	const me = await requireUser(["ADMIN"]);
	if (!me) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const {searchParams} = new URL(req.url);
	const q = searchParams.get("q")?.trim() ?? "";
	const cls = searchParams.get("class")?.trim() ?? "";
	const seat = searchParams.get("seat") ?? ""; // "booked" | "unbooked" | ""

	const students = await prisma.student.findMany({
		where: {
			...(q
				? {
						OR: [
							{studentId: {contains: q, mode: "insensitive"}},
							{name: {contains: q, mode: "insensitive"}},
							{surname: {contains: q, mode: "insensitive"}},
						],
					}
				: {}),
			...(cls ? {class: {equals: cls, mode: "insensitive"}} : {}),
			...(seat === "booked"
				? {seatId: {not: null}}
				: seat === "unbooked"
					? {seatId: null}
					: {}),
		},
		select: {
			id: true,
			studentId: true,
			name: true,
			surname: true,
			class: true,
			rollNumber: true,
			email: true,
			seatId: true,
			createdAt: true,
			seat: {
				select: {
					id: true,
					row: true,
					number: true,
					section: true,
					type: true,
					status: true,
				},
			},
		},
		orderBy: [{class: "asc"}, {rollNumber: "asc"}],
	});

	return NextResponse.json({students});
}
