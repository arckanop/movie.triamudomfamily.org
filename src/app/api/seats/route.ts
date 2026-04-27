import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireUser } from "@/server/session";

export async function GET() {
  const auth = await requireUser(["STAFF", "ADMIN"]);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const seats = await prisma.seat.findMany({
    select: {
      id: true,
      row: true,
      number: true,
      section: true,
      type: true,
      status: true,
    },
  });
  return NextResponse.json({ seats });
}
