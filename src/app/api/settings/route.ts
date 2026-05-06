import {NextResponse} from "next/server";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

const ALLOWED_KEYS = ["eventAt", "eventEndTime", "venue"];

export async function GET() {
	const rows = await prisma.siteSetting.findMany();
	const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	return NextResponse.json({settings});
}

export async function PATCH(request: Request) {
	const auth = await requireUser(["ADMIN"]);
	if (!auth) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const body: Record<string, unknown> = await request.json();

	await Promise.all(
		ALLOWED_KEYS.map((key) => {
			const value = body[key];
			if (typeof value === "string" && value.trim()) {
				return prisma.siteSetting.upsert({
					where: {key},
					update: {value: value.trim()},
					create: {key, value: value.trim()},
				});
			}
			return prisma.siteSetting.deleteMany({where: {key}});
		}),
	);

	return NextResponse.json({ok: true});
}
