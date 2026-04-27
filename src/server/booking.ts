import {Prisma} from "@prisma/client";
import {prisma} from "./prisma";
import {broadcastSeatUpdate} from "./realtime";

export type BookSeatInput = {
	seatId: string;
	studentId: string;
	performedBy: string;
	isAdmin: boolean;
	note?: string;
};

export type BookSeatResult =
	| { ok: true; overrode: boolean }
	| { ok: false; error: string; status: number };

export async function bookSeat(input: BookSeatInput): Promise<BookSeatResult> {
	const {seatId, studentId, performedBy, isAdmin, note} = input;

	try {
		const result = await prisma.$transaction(async (tx) => {
			const seat = await tx.seat.findUnique({where: {id: seatId}});
			if (!seat) throw new Error("SEAT_NOT_FOUND");

			if (seat.status === "BLOCKED") {
				if (!isAdmin) throw new Error("SEAT_BLOCKED");
			}

			const student = await tx.student.findUnique({
				where: {id: studentId},
			});
			if (!student) throw new Error("STUDENT_NOT_FOUND");

			const isStudentSeat = student.seatId === seatId;

			if (seat.status === "BOOKED" && !isStudentSeat) {
				if (!isAdmin) throw new Error("SEAT_TAKEN");
			}

			const previousSeatId = student.seatId;
			const overrode = seat.status === "BOOKED" && !isStudentSeat;

			// Free the student's previous seat if it differs
			if (previousSeatId && previousSeatId !== seatId) {
				await tx.seat.update({
					where: {id: previousSeatId},
					data: {
						status: "AVAILABLE",
						bookedBy: null,
						bookedAt: null,
					},
				});
				await tx.bookingLog.create({
					data: {
						seatId: previousSeatId,
						studentId: student.id,
						action: "CANCELLED",
						performedBy,
						note: `Reassigned to ${seatId}`,
					},
				});
			}

			// If overriding, log the previous occupant
			if (overrode) {
				const previousOccupant = await tx.student.findUnique({
					where: {seatId},
				});
				if (previousOccupant && previousOccupant.id !== student.id) {
					await tx.student.update({
						where: {id: previousOccupant.id},
						data: {seatId: null},
					});
					await tx.bookingLog.create({
						data: {
							seatId,
							studentId: previousOccupant.id,
							action: "OVERRIDDEN",
							performedBy,
							note: note ?? `Overridden by admin for student ${student.studentId}`,
						},
					});
				}
			}

			await tx.seat.update({
				where: {id: seatId},
				data: {
					status: "BOOKED",
					bookedBy: performedBy,
					bookedAt: new Date(),
				},
			});

			await tx.student.update({
				where: {id: student.id},
				data: {seatId},
			});

			await tx.bookingLog.create({
				data: {
					seatId,
					studentId: student.id,
					action: "BOOKED",
					performedBy,
					note: overrode ? note ?? "Override booking" : note,
				},
			});

			return {
				ok: true as const,
				overrode,
				previousSeatId,
			};
		});

		if (result.previousSeatId && result.previousSeatId !== seatId) {
			await broadcastSeatUpdate(result.previousSeatId, "AVAILABLE");
		}
		await broadcastSeatUpdate(seatId, "BOOKED");

		return {ok: true, overrode: result.overrode};
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			return {ok: false, error: "Database error", status: 500};
		}
		const msg = e instanceof Error ? e.message : "ERROR";
		if (msg === "SEAT_NOT_FOUND")
			return {ok: false, error: "Seat not found", status: 404};
		if (msg === "STUDENT_NOT_FOUND")
			return {ok: false, error: "Student not found", status: 404};
		if (msg === "SEAT_BLOCKED")
			return {
				ok: false,
				error: "This seat is blocked.",
				status: 409,
			};
		if (msg === "SEAT_TAKEN")
			return {
				ok: false,
				error: "Seat already booked by another student.",
				status: 409,
			};
		return {ok: false, error: msg, status: 500};
	}
}

export async function cancelBooking(
	seatId: string,
	performedBy: string,
	note?: string,
) {
	const result = await prisma.$transaction(async (tx) => {
		const seat = await tx.seat.findUnique({where: {id: seatId}});
		if (!seat) throw new Error("SEAT_NOT_FOUND");
		const student = await tx.student.findUnique({where: {seatId}});
		await tx.seat.update({
			where: {id: seatId},
			data: {status: "AVAILABLE", bookedBy: null, bookedAt: null},
		});
		if (student) {
			await tx.student.update({
				where: {id: student.id},
				data: {seatId: null},
			});
		}
		await tx.bookingLog.create({
			data: {
				seatId,
				studentId: student?.id,
				action: "CANCELLED",
				performedBy,
				note,
			},
		});
	});
	await broadcastSeatUpdate(seatId, "AVAILABLE");
	return result;
}

export async function setSeatBlocked(
	seatId: string,
	performedBy: string,
	blocked: boolean,
	note?: string,
) {
	await prisma.$transaction(async (tx) => {
		const seat = await tx.seat.findUnique({where: {id: seatId}});
		if (!seat) throw new Error("SEAT_NOT_FOUND");
		if (blocked && seat.status === "BOOKED") {
			throw new Error("SEAT_BOOKED");
		}
		await tx.seat.update({
			where: {id: seatId},
			data: {
				status: blocked ? "BLOCKED" : "AVAILABLE",
				bookedBy: null,
				bookedAt: null,
			},
		});
		await tx.bookingLog.create({
			data: {
				seatId,
				action: blocked ? "BLOCKED" : "UNBLOCKED",
				performedBy,
				note,
			},
		});
	});
	await broadcastSeatUpdate(seatId, blocked ? "BLOCKED" : "AVAILABLE");
}
