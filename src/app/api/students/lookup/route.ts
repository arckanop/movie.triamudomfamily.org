import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET(req: Request) {
	const auth = await requireUser(["STAFF", "ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {searchParams} = new URL(req.url);
	const token = searchParams.get("token");
	if (!token || !token.startsWith("STU-")) {
		return NextResponse.json({error: "Invalid token"}, {status: 400});
	}
	const student = await prisma.student.findUnique({
		where: {qrToken: token},
		select: {
			id: true,
			name: true,
			surname: true,
			class: true,
			rollNumber: true,
			studentId: true,
			seatId: true,
		},
	});
	if (!student) {
		return NextResponse.json({error: "Student not found"}, {status: 404});
	}
	return NextResponse.json({student});
}
