export type SeatType = "premium" | "standard" | "gold" | "vip" | "front";
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

const GRID_COLS = 28;

type RowSpec = {
	row: string;
	type: SeatType;
	leftCount: number;
	rightCount: number;
	leftStart?: number;
	rightStart?: number;
	centerCount?: number;
	centerStart?: number;
};

const MAIN_ROWS: RowSpec[] = [
	{row: "X", type: "premium", leftCount: 13, rightCount: 13},
	{row: "W", type: "premium", leftCount: 13, rightCount: 13},
	{row: "V", type: "premium", leftCount: 13, rightCount: 13},
	{row: "U", type: "premium", leftCount: 13, rightCount: 13},
	{row: "T", type: "premium", leftCount: 13, rightCount: 13},
	{row: "S", type: "premium", leftCount: 13, rightCount: 13},
	{row: "R", type: "premium", leftCount: 13, rightCount: 13},
	{row: "Q", type: "premium", leftCount: 13, rightCount: 13},
	{row: "P", type: "premium", leftCount: 13, rightCount: 13},
	{row: "O", type: "premium", leftCount: 13, rightCount: 13},
	{row: "N", type: "premium", leftCount: 13, rightCount: 13},
	{row: "M", type: "standard", leftCount: 11, rightCount: 11},
	{row: "L", type: "standard", leftCount: 11, rightCount: 11},
	{row: "K", type: "standard", leftCount: 11, rightCount: 11},
	{row: "J", type: "standard", leftCount: 11, rightCount: 11},
	{row: "I", type: "standard", leftCount: 11, rightCount: 11},
	{row: "H", type: "standard", leftCount: 11, rightCount: 11},
	{row: "G", type: "standard", leftCount: 11, rightCount: 11},
	{row: "F", type: "standard", leftCount: 11, rightCount: 11, centerCount: 4, centerStart: 13},
	{row: "E", type: "standard", leftCount: 11, rightCount: 11, centerCount: 4, centerStart: 13},
	{row: "D", type: "standard", leftCount: 11, rightCount: 11},
	{row: "C", type: "gold", leftCount: 9, rightCount: 0},
	{row: "B", type: "gold", leftCount: 8, rightCount: 0},
	{row: "A", type: "gold", leftCount: 7, rightCount: 0},
	{row: "AA", type: "gold", leftCount: 0, rightCount: 9, rightStart: 17},
	{row: "VP", type: "vip", leftCount: 4, rightCount: 0},
];

const FRONT_ROWS: RowSpec[] = [
	{row: "FH", type: "front", leftCount: 7, rightCount: 7, leftStart: 4, rightStart: 18},
	{row: "FG", type: "front", leftCount: 7, rightCount: 7, leftStart: 4, rightStart: 18},
	{row: "FF", type: "front", leftCount: 8, rightCount: 8, leftStart: 3, rightStart: 18},
	{row: "FE", type: "front", leftCount: 8, rightCount: 8, leftStart: 3, rightStart: 18},
	{row: "FD", type: "front", leftCount: 8, rightCount: 8, leftStart: 3, rightStart: 18},
	{row: "FC", type: "front", leftCount: 8, rightCount: 8, leftStart: 3, rightStart: 18},
	{row: "FB", type: "front", leftCount: 8, rightCount: 8, leftStart: 3, rightStart: 18},
	{row: "FA", type: "front", leftCount: 7, rightCount: 7, leftStart: 4, rightStart: 18},
];

function expandRow(spec: RowSpec, gridRow: number): SeatDef[] {
	const seats: SeatDef[] = [];
	const leftStart = spec.leftStart ?? 1;
	const rightStart = spec.rightStart ?? GRID_COLS - spec.rightCount + 1;

	let n = 1;
	for (let i = 0; i < spec.leftCount; i++) {
		const col = leftStart + i;
		seats.push({
			id: `${spec.row}-${n}`,
			row: spec.row,
			number: n,
			section: "left",
			type: spec.type,
			col,
			gridRow,
		});
		n++;
	}

	if (spec.centerCount && spec.centerStart) {
		for (let i = 0; i < spec.centerCount; i++) {
			const col = spec.centerStart + i;
			seats.push({
				id: `${spec.row}-${n}`,
				row: spec.row,
				number: n,
				section: "center",
				type: spec.type,
				col,
				gridRow,
			});
			n++;
		}
	}

	for (let i = 0; i < spec.rightCount; i++) {
		const col = rightStart + i;
		seats.push({
			id: `${spec.row}-${n}`,
			row: spec.row,
			number: n,
			section: "right",
			type: spec.type,
			col,
			gridRow,
		});
		n++;
	}

	return seats;
}

function buildLayout(): { seats: SeatDef[]; rows: number; cols: number; mainRowCount: number } {
	const all: SeatDef[] = [];
	let gridRow = 1;
	for (const spec of MAIN_ROWS) {
		all.push(...expandRow(spec, gridRow));
		gridRow++;
	}
	const mainRowCount = gridRow - 1;
	gridRow += 1;
	for (const spec of FRONT_ROWS) {
		all.push(...expandRow(spec, gridRow));
		gridRow++;
	}
	return {seats: all, rows: gridRow - 1, cols: GRID_COLS, mainRowCount};
}

export const SEAT_LAYOUT = buildLayout();

export const ROW_LABELS: { row: string; gridRow: number }[] = (() => {
	const out: { row: string; gridRow: number }[] = [];
	let gridRow = 1;
	for (const spec of MAIN_ROWS) {
		out.push({row: spec.row, gridRow});
		gridRow++;
	}
	gridRow += 1;
	for (const spec of FRONT_ROWS) {
		out.push({row: spec.row, gridRow});
		gridRow++;
	}
	return out;
})();

export const SEAT_TYPE_COLORS: Record<SeatType, string> = {
	premium: "#dc2626",
	standard: "#7c3aed",
	gold: "#eab308",
	vip: "#94a3b8",
	front: "#7c3aed",
};

export const SEAT_TYPE_LABELS: Record<SeatType, string> = {
	premium: "Premium",
	standard: "Standard",
	gold: "Gold",
	vip: "VIP",
	front: "Front",
};
