import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";

export default async function Home() {
	const session = await getSession();
	if (!session) redirect("/login");
	const user = await prisma.user.findUnique({
		where: {id: session.user.id},
		select: {role: true},
	});
	if (!user) redirect("/login");
	if (user.role === "ADMIN") redirect("/admin");
	if (user.role === "STAFF") redirect("/staff");
	redirect("/register/ticket");
}
