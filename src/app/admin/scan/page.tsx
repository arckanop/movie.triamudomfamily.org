import { loadSeatStatuses } from "@/components/seat/seat-map-loader";
import { ScanWorkflow } from "@/components/scanner/scan-workflow";

export default async function AdminScanPage() {
  const initial = await loadSeatStatuses();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scan QR (Admin)</h1>
        <p className="text-sm text-muted-foreground">
          Admin scanning can override booked seats. You will be prompted to
          confirm before any override.
        </p>
      </div>
      <ScanWorkflow initialStatus={initial} isAdmin />
    </div>
  );
}
