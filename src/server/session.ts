import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

export type AppRole = "STAFF" | "ADMIN" | "STUDENT";

export async function requireUser(roles?: AppRole[]) {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) return null;
  if (roles && !roles.includes(user.role as AppRole)) return null;
  return { session, user };
}
