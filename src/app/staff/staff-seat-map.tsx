"use client";

import {SeatMap, type SeatStatusMap} from "@/components/seat/seat-map";

export function StaffSeatMap({initialStatus}: { initialStatus: SeatStatusMap }) {
	return <SeatMap initialStatus={initialStatus}/>;
}
