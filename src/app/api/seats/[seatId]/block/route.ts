import {NextResponse} from "next/server";
import {requireUser} from "@/server/session";
import {setSeatBlocked} from "@/server/booking";

export async function POST(
	req: Request,
	ctx: { params: Promise<{ seatId: string }> },
) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});
	const {seatId} = await ctx.params;
	const body = await req.json().catch(() => ({}));
	try {
		await setSeatBlocked(seatId, auth.user.id, true, body?.note);
		return NextResponse.json({ok: true});
	} catch (e) {
		const msg = e instanceof Error ? e.message : "ERROR";
		const status = msg === "SEAT_BOOKED" ? 409 : 400;
		return NextResponse.json({error: msg}, {status});
	}
}
