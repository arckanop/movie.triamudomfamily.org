import {NextResponse} from "next/server";
import {z} from "zod";
import {requireUser} from "@/server/session";
import {bookSeat} from "@/server/booking";

const Body = z.object({
	seatId: z.string().min(1),
	studentId: z.string().min(1),
	note: z.string().optional(),
});

export async function POST(req: Request) {
	const auth = await requireUser(["STAFF", "ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const json = await req.json().catch(() => null);
	const parsed = Body.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({error: "Invalid input"}, {status: 400});
	}
	const result = await bookSeat({
		seatId: parsed.data.seatId,
		studentId: parsed.data.studentId,
		performedBy: auth.user.id,
		isAdmin: auth.user.role === "ADMIN",
		note: parsed.data.note,
	});
	if (!result.ok) {
		return NextResponse.json({error: result.error}, {status: result.status});
	}
	return NextResponse.json({ok: true, overrode: result.overrode});
}
