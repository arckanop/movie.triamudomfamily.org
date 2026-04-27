import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {PortalShell} from "@/components/portal-shell";

export default async function StaffLayout({
	                                          children,
                                          }: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	if (!session) redirect("/login");
	const user = await prisma.user.findUnique({
		where: {id: session.user.id},
		select: {role: true, username: true, name: true},
	});
	if (!user) redirect("/login");
	if (user.role !== "STAFF" && user.role !== "ADMIN") {
		redirect("/login");
	}
	return (
		<PortalShell
			role={user.role === "ADMIN" ? "ADMIN" : "STAFF"}
			username={user.username ?? user.name}
		>
			{children}
		</PortalShell>
	);
}
