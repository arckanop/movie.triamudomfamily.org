import {loadSeatStatuses} from "@/components/seat/seat-map-loader";
import {AdminDashboard} from "./admin-dashboard";

export default async function AdminPage() {
	const initial = await loadSeatStatuses();
	return <AdminDashboard initialStatus={initial}/>;
}
