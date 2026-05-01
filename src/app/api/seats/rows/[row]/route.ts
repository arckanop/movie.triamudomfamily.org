import {NextResponse} from "next/server";
import {requireUser} from "@/server/session";
import {setRowBlocked} from "@/server/booking";

export async function POST(
	req: Request,
	ctx: {params: Promise<{row: string}>},
) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const {row} = await ctx.params;
	const {action} = await req.json().catch(() => ({})) as {action?: string};
	if (action !== "block" && action !== "unblock") {
		return NextResponse.json({error: "Invalid action"}, {status: 400});
	}

	const {count} = await setRowBlocked(row, auth.user.id, action === "block");
	return NextResponse.json({ok: true, count});
}
