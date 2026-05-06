import {NextResponse} from "next/server";
import {requireUser} from "@/server/session";
import {setSeatTypeBlocked} from "@/server/booking";

const VALID_TYPES = new Set(["normal", "honeymoon", "privilege_plus", "privilege_normal", "vip", "premium", "balcony"]);

export async function POST(
	req: Request,
	ctx: {params: Promise<{type: string}>},
) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const {type} = await ctx.params;
	if (!VALID_TYPES.has(type)) {
		return NextResponse.json({error: "Invalid type"}, {status: 400});
	}

	const {action} = await req.json().catch(() => ({})) as {action?: string};
	if (action !== "block" && action !== "unblock") {
		return NextResponse.json({error: "Invalid action"}, {status: 400});
	}

	const {count} = await setSeatTypeBlocked(type, auth.user.id, action === "block");
	return NextResponse.json({ok: true, count});
}
