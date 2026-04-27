import { prisma } from "@/server/prisma";
import type { SeatStatusMap } from "./seat-map";

export async function loadSeatStatuses(): Promise<SeatStatusMap> {
  const seats = await prisma.seat.findMany({
    select: { id: true, status: true },
  });
  const map: SeatStatusMap = {};
  for (const s of seats) map[s.id] = s.status;
  return map;
}
