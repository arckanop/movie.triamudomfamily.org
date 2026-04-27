import {NextResponse} from "next/server";
import {requireUser} from "@/server/session";
import {cancelBooking} from "@/server/booking";

export async function DELETE(
	_req: Request,
	ctx: { params: Promise<{ seatId: string }> },
) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {seatId} = await ctx.params;
	try {
		await cancelBooking(seatId, auth.user.id, "Cancelled by admin");
		return NextResponse.json({ok: true});
	} catch (e) {
		const msg = e instanceof Error ? e.message : "ERROR";
		return NextResponse.json({error: msg}, {status: 400});
	}
}
