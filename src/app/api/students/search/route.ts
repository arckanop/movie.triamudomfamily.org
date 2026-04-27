import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET(req: Request) {
	const auth = await requireUser(["STAFF", "ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {searchParams} = new URL(req.url);
	const q = searchParams.get("q")?.trim() ?? "";
	if (q.length < 2) {
		return NextResponse.json({students: []});
	}
	const students = await prisma.student.findMany({
		where: {
			OR: [
				{studentId: {contains: q, mode: "insensitive"}},
				{name: {contains: q, mode: "insensitive"}},
				{surname: {contains: q, mode: "insensitive"}},
				{class: {contains: q, mode: "insensitive"}},
			],
		},
		select: {
			id: true,
			name: true,
			surname: true,
			class: true,
			rollNumber: true,
			studentId: true,
			seatId: true,
			qrToken: true,
		},
		take: 20,
	});
	return NextResponse.json({students});
}
