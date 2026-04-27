import {NextResponse} from "next/server";
import {hashPassword} from "better-auth/crypto";
import {prisma} from "@/server/prisma";
import {requireUser} from "@/server/session";

function generateTempPassword() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	for (let i = 0; i < 10; i++) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return out;
}

export async function PATCH(
	_req: Request,
	ctx: { params: Promise<{ id: string }> },
) {
	const me = await requireUser(["ADMIN"]);
	if (!me) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}
	const {id} = await ctx.params;
	const target = await prisma.user.findUnique({where: {id}});
	if (!target) {
		return NextResponse.json({error: "Not found"}, {status: 404});
	}
	const tempPassword = generateTempPassword();
	const hashed = await hashPassword(tempPassword);

	await prisma.account.updateMany({
		where: {userId: id, providerId: "credential"},
		data: {password: hashed},
	});

	return NextResponse.json({password: tempPassword});
}
