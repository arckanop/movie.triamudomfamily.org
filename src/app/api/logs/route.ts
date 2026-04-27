import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

export async function GET(req: Request) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {searchParams} = new URL(req.url);
	const action = searchParams.get("action") ?? undefined;
	const performedBy = searchParams.get("performedBy") ?? undefined;
	const row = searchParams.get("row") ?? undefined;
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	const logs = await prisma.bookingLog.findMany({
		where: {
			action: action ? action : undefined,
			performedBy: performedBy ? performedBy : undefined,
			seatId: row ? {startsWith: `${row}-`} : undefined,
			performedAt: {
				gte: from ? new Date(from) : undefined,
				lte: to ? new Date(to) : undefined,
			},
		},
		orderBy: {performedAt: "desc"},
		take: 1000,
	});

	const studentIds = Array.from(
		new Set(logs.map((l) => l.studentId).filter((v): v is string => !!v)),
	);
	const performedByIds = Array.from(new Set(logs.map((l) => l.performedBy)));

	const [students, users] = await Promise.all([
		prisma.student.findMany({
			where: {id: {in: studentIds}},
			select: {id: true, name: true, surname: true, class: true, studentId: true},
		}),
		prisma.user.findMany({
			where: {id: {in: performedByIds}},
			select: {id: true, name: true, username: true},
		}),
	]);
	const studentById = new Map(students.map((s) => [s.id, s]));
	const userById = new Map(users.map((u) => [u.id, u]));

	return NextResponse.json({
		logs: logs.map((l) => ({
			...l,
			student: l.studentId ? studentById.get(l.studentId) ?? null : null,
			performedByUser: userById.get(l.performedBy) ?? null,
		})),
	});
}
