export type SeatType = "normal" | "honeymoon" | "privilege_plus" | "privilege_normal" | "vip" | "premium" | "balcony";
export type SeatSection = "left" | "right" | "center";

export type SeatDef = {
	id: string;
	row: string;
	number: number;
	section: SeatSection;
	type: SeatType;
	col: number;
	gridRow: number;
};

// Grid layout: col 1 = left label, cols 2–47 = seats (46 cols), col 48 = right label.
// Corridor runs vertically between cols 24–25 (center of seat area).
const GRID_COLS = 48;

type BlockSpec = {
	start: number;
	count: number;
	type?: SeatType;
	section?: SeatSection;
	phantom?: boolean; // advances seat counter without placing a physical seat
};

type RowSpec = {
	row: string;
	type: SeatType;
	blocks: BlockSpec[];
};

// ── Main floor ──────────────────────────────────────────────────────────────

const MAIN_ROWS: RowSpec[] = [
	// X: 32 seats (16 + 16), corridor between seats 16 and 17 (cols 24–25)
	{
		row: "X", type: "normal", blocks: [
			{start: 8, count: 16, section: "left"},
			{start: 26, count: 16, section: "right"},
		],
	},
	// W: 40 seats (20 + 20)
	{
		row: "W", type: "normal", blocks: [
			{start: 4, count: 20, section: "left"},
			{start: 26, count: 20, section: "right"},
		],
	},
	// V: 40 seats (20 + 20)
	{
		row: "V", type: "normal", blocks: [
			{start: 4, count: 20, section: "left"},
			{start: 26, count: 20, section: "right"},
		],
	},
	// U–N: 44 seats (22 + 22)
	...(["U", "T", "S", "R", "Q", "P", "O", "N"] as const).map((row) => ({
		row, type: "normal" as SeatType, blocks: [
			{start: 2, count: 22, section: "left" as SeatSection},
			{start: 26, count: 22, section: "right" as SeatSection},
		],
	})),
	// M–G: seats 1–15 + 20–34 = Honeymoon, seats 16–19 = Privilege+
	...(["M", "L", "K", "J", "I", "H", "G"] as const).map((row) => ({
		row, type: "honeymoon" as SeatType, blocks: [
			{start: 2, count: 15, section: "left" as SeatSection},
			{start: 20, count: 2, section: "center" as SeatSection, type: "privilege_plus" as SeatType},
			{start: 29, count: 2, section: "center" as SeatSection, type: "privilege_plus" as SeatType},
			{start: 33, count: 15, section: "right" as SeatSection},
		],
	})),
	// F: 41 seats — seats 1–15 + 27–41 = Honeymoon, seats 16–26 = Privilege+
	{
		row: "F", type: "honeymoon", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 20, count: 11, section: "center", type: "privilege_plus" as SeatType},
			{start: 33, count: 15, section: "right"},
		],
	},
	// E: 41 seats — same as F
	{
		row: "E", type: "honeymoon", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 20, count: 11, section: "center", type: "privilege_plus" as SeatType},
			{start: 33, count: 15, section: "right"},
		],
	},
	// D: 39 seats — seats 1–15 + 27–39 = Honeymoon, seats 16–26 = Privilege+
	{
		row: "D", type: "honeymoon", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 20, count: 11, section: "center", type: "privilege_plus" as SeatType},
			{start: 33, count: 13, section: "right"},
		],
	},
	// C: 27 seats — Privilege Normal
	{
		row: "C", type: "privilege_normal", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 33, count: 12, section: "right"},
		],
	},
	// B: 26 seats — Privilege Normal
	{
		row: "B", type: "privilege_normal", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 33, count: 11, section: "right"},
		],
	},
	// A: 25 seats — Privilege Normal
	{
		row: "A", type: "privilege_normal", blocks: [
			{start: 2, count: 15, section: "left"},
			{start: 33, count: 10, section: "right"},
		],
	},
	// AA: 10 seats — Privilege Normal (AA1 aligns with A16 at col 33)
	{
		row: "AA", type: "privilege_normal", blocks: [
			{start: 33, count: 10, section: "right"},
		],
	},
	// VP: 8 seats in 4 pairs (Opera Chair) — VIP
	// VP2=FH1(col4), VP3=FH3(col6), VP5=FH6(col9), VP7=FH9(col12)
	{
		row: "VP", type: "vip", blocks: [
			{start: 3, count: 2, section: "left"},
			{start: 6, count: 2, section: "left"},
			{start: 9, count: 2, section: "left"},
			{start: 12, count: 2, section: "left"},
		],
	},
];

// ── 2nd floor (balcony) ──────────────────────────────────────────────────────

const FRONT_ROWS: RowSpec[] = [
	// FH: 28 seats — Balcony (left block start=4 so FH1 aligns with VP2)
	// right start=31: FH15 aligns with FG24 at col 31
	{
		row: "FH", type: "balcony", blocks: [
			{start: 4, count: 14, section: "left"},
			{start: 31, count: 14, section: "right"},
		],
	},
	// FG: seats 1–14 + 24–37 = Balcony, seats 15–23 = Premium
	// left start=4: FG13 aligns with A15 at col 16
	// center start=20: FG15 aligns with FF-FA seat 12 at col 20; FG20/FG21 adjacent at cols 25/26
	// center start=26: FG21 aligns with FF-FA seat 16 at col 26
	// right start=31: FG24 aligns with FF-FA seat 21 at col 31
	{
		row: "FG", type: "balcony", blocks: [
			{start: 4, count: 14, section: "left"},
			{start: 20, count: 6, section: "center", type: "premium" as SeatType},
			{start: 26, count: 3, section: "center", type: "premium" as SeatType},
			{start: 31, count: 14, section: "right"},
		],
	},
	// FF–FA: 30 seats each — Balcony
	// left start=9 → FF-FA seat 12 at col 20 (aligns with FG15)
	// right start=26 → FF-FA seat 16 at col 26 (aligns with FG21)
	...(["FF", "FE", "FD", "FC", "FB", "FA"] as const).map((row) => ({
		row, type: "balcony" as SeatType, blocks: [
			{start: 9, count: 15, section: "left" as SeatSection},
			{start: 26, count: 15, section: "right" as SeatSection},
		],
	})),
];

// ── Build helpers ────────────────────────────────────────────────────────────

function expandRow(spec: RowSpec, gridRow: number): SeatDef[] {
	const seats: SeatDef[] = [];
	let n = 1;
	for (const block of spec.blocks) {
		if (block.phantom) {
			n += block.count;
			continue;
		}
		for (let i = 0; i < block.count; i++) {
			seats.push({
				id: `${spec.row}-${n}`,
				row: spec.row,
				number: n,
				section: block.section ?? "center",
				type: block.type ?? spec.type,
				col: block.start + i,
				gridRow,
			});
			n++;
		}
	}
	return seats;
}

export type SectionSeparator = { gridRow: number; label: string };

function buildLayout(): {
	seats: SeatDef[];
	rows: number;
	cols: number;
	mainRowCount: number;
	separators: SectionSeparator[];
	rowLabels: { row: string; gridRow: number }[];
} {
	const all: SeatDef[] = [];
	const separators: SectionSeparator[] = [];
	const rowLabels: { row: string; gridRow: number }[] = [];
	let gridRow = 1;
	for (const spec of MAIN_ROWS) {
		if (spec.row === "M") {
			separators.push({gridRow, label: "Honeymoon Zone"});
			gridRow++;
		}
		all.push(...expandRow(spec, gridRow));
		rowLabels.push({row: spec.row, gridRow});
		gridRow++;
	}
	const mainRowCount = gridRow - 1;
	gridRow += 1; // visual gap between main and 2nd floor
	for (const spec of FRONT_ROWS) {
		all.push(...expandRow(spec, gridRow));
		rowLabels.push({row: spec.row, gridRow});
		gridRow++;
	}
	return {seats: all, rows: gridRow - 1, cols: GRID_COLS, mainRowCount, separators, rowLabels};
}

export const SEAT_LAYOUT = buildLayout();

export const ROW_LABELS = SEAT_LAYOUT.rowLabels;

export const SEAT_TYPE_COLORS: Record<SeatType, string> = {
	normal: "#4ADE80",
	honeymoon: "#F472B6",
	privilege_plus: "#C084FC",
	privilege_normal: "#6366F1",
	vip: "#ec4899",
	premium: "#E879F9",
	balcony: "#10b981",
};

export const SEAT_TYPE_LABELS: Record<SeatType, string> = {
	normal: "Normal",
	honeymoon: "Honeymoon",
	privilege_plus: "Privilege+",
	privilege_normal: "Privilege",
	vip: "VIP",
	premium: "Premium",
	balcony: "Balcony",
};
