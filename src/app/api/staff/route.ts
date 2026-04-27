import {NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/server/auth";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

const Body = z.object({
	name: z.string().trim().min(1).max(80),
	username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
	password: z.string().min(6).max(128),
	role: z.enum(["STAFF", "ADMIN"]).default("STAFF"),
});

export async function GET() {
	const me = await requireUser(["ADMIN"]);
	if (!me) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const staff = await prisma.user.findMany({
		where: {role: {in: ["STAFF", "ADMIN"]}},
		select: {
			id: true,
			name: true,
			username: true,
			displayUsername: true,
			role: true,
			createdAt: true,
		},
		orderBy: {createdAt: "desc"},
	});
	return NextResponse.json({staff});
}

export async function POST(req: Request) {
	const me = await requireUser(["ADMIN"]);
	if (!me) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const json = await req.json().catch(() => null);
	const parsed = Body.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({error: "Invalid input"}, {status: 400});
	}
	const {name, username, password, role} = parsed.data;

	const existing = await prisma.user.findUnique({where: {username}});
	if (existing) {
		return NextResponse.json({error: "Username already taken"}, {status: 409});
	}

	// Synthetic email — Better Auth requires email but we identify by username.
	const email = `${username}@staff.local`;

	try {
		const created = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name,
				username,
			} as unknown as { email: string; password: string; name: string },
		});
		const createdUserId = (created as { user?: { id?: string } } | null)?.user?.id;
		if (createdUserId) {
			await prisma.user.update({
				where: {id: createdUserId},
				data: {role},
			});
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Failed to create user";
		return NextResponse.json({error: msg}, {status: 400});
	}

	return NextResponse.json({ok: true});
}
