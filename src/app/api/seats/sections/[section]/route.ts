import {NextResponse} from "next/server";
import {requireUser} from "@/server/session";
import {setSectionBlocked} from "@/server/booking";

const VALID_SECTIONS = new Set(["left", "right", "center"]);

export async function POST(
	req: Request,
	ctx: {params: Promise<{section: string}>},
) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const {section} = await ctx.params;
	if (!VALID_SECTIONS.has(section)) {
		return NextResponse.json({error: "Invalid section"}, {status: 400});
	}

	const {action} = await req.json().catch(() => ({})) as {action?: string};
	if (action !== "block" && action !== "unblock") {
		return NextResponse.json({error: "Invalid action"}, {status: 400});
	}

	const {count} = await setSectionBlocked(section, auth.user.id, action === "block");
	return NextResponse.json({ok: true, count});
}
