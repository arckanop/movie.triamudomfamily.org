import {loadSeatStatuses} from "@/components/seat/seat-map-loader";
import {AdminSeatMap} from "./admin-seat-map";

export default async function AdminSeatsPage() {
	const initial = await loadSeatStatuses();
	return <AdminSeatMap initialStatus={initial}/>;
}
