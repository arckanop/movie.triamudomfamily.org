import {loadSeatStatuses} from "@/components/seat/seat-map-loader";
import {ScanWorkflow} from "@/components/scanner/scan-workflow";

export default async function StaffScanPage() {
	const initial = await loadSeatStatuses();
	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold">Scan QR</h1>
				<p className="text-sm text-muted-foreground">
					Use Single Mode to assign one student at a time, or Multi Mode to scan a
					group and assign seats together.
				</p>
			</div>
			<ScanWorkflow initialStatus={initial} isAdmin={false}/>
		</div>
	);
}
