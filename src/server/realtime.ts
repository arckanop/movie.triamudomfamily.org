import {createClient} from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

function getServerClient() {
	if (cached) return cached;
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	cached = createClient(url, key, {
		auth: {persistSession: false},
	});
	return cached;
}

export type SeatBroadcastStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export async function broadcastSeatUpdate(seat: string, status: SeatBroadcastStatus) {
	const client = getServerClient();
	if (!client) return;
	const channel = client.channel("seats");
	await channel.subscribe();
	await channel.send({
		type: "broadcast",
		event: "seat-update",
		payload: {seat, status},
	});
	await client.removeChannel(channel);
}

export async function broadcastSeatUpdates(
	updates: { seat: string; status: SeatBroadcastStatus }[],
) {
	const client = getServerClient();
	if (!client) return;
	const channel = client.channel("seats");
	await channel.subscribe();
	for (const u of updates) {
		await channel.send({
			type: "broadcast",
			event: "seat-update",
			payload: u,
		});
	}
	await client.removeChannel(channel);
}
