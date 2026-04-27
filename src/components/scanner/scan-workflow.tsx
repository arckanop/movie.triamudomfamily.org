"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, X, Check } from "lucide-react";
import { QrScanner } from "@/components/scanner/qr-scanner";
import { SeatMap, type SeatStatusMap } from "@/components/seat/seat-map";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type ScannedStudent = {
  id: string;
  name: string;
  surname: string;
  class: string;
  rollNumber: number;
  studentId: string;
  seatId: string | null;
  qrToken?: string;
};

export function ScanWorkflow({
  initialStatus,
  isAdmin,
}: {
  initialStatus: SeatStatusMap;
  isAdmin: boolean;
}) {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [scanned, setScanned] = useState<ScannedStudent[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"scanning" | "seating">("scanning");
  const [overrideContext, setOverrideContext] = useState<{
    seatId: string;
    studentId: string;
    occupant: { name: string; class: string; studentId: string } | null;
  } | null>(null);

  const lastScanAt = useRef(0);

  const handleScan = useCallback(
    async (token: string) => {
      const now = Date.now();
      if (now - lastScanAt.current < 1500) return;
      lastScanAt.current = now;
      if (!token.startsWith("STU-")) {
        toast.error("Not a valid student QR.");
        return;
      }
      try {
        const res = await fetch(
          `/api/students/lookup?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Student not found");
          return;
        }
        const s: ScannedStudent = { ...data.student, qrToken: token };
        setScanned((prev) => {
          if (prev.some((p) => p.id === s.id)) {
            toast.info(`${s.name} ${s.surname} already scanned.`);
            return prev;
          }
          toast.success(`Scanned: ${s.name} ${s.surname}`);
          if (mode === "single") {
            setPhase("seating");
            setActiveStudentId(s.id);
            return [s];
          }
          return [...prev, s];
        });
      } catch {
        toast.error("Lookup failed");
      }
    },
    [mode],
  );

  function removeScanned(id: string) {
    setScanned((prev) => prev.filter((p) => p.id !== id));
    if (activeStudentId === id) setActiveStudentId(null);
  }

  function proceedToSeating() {
    if (scanned.length === 0) {
      toast.error("Scan at least one student first.");
      return;
    }
    setActiveStudentId(scanned[0]?.id ?? null);
    setPhase("seating");
  }

  const ownedSeatIds = useMemo(
    () =>
      scanned
        .map((s) => s.seatId)
        .filter((v): v is string => !!v),
    [scanned],
  );

  const seatToStudent = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of scanned) if (s.seatId) map[s.seatId] = s.id;
    return map;
  }, [scanned]);

  async function commitSeatAssignment(
    seatId: string,
    studentId: string,
    note?: string,
  ) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatId, studentId, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Booking failed");
      return false;
    }
    setScanned((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, seatId }
          : s.seatId === seatId
            ? { ...s, seatId: null }
            : s,
      ),
    );
    toast.success(`${seatId} assigned`);
    const idx = scanned.findIndex((s) => s.id === studentId);
    if (idx >= 0 && idx + 1 < scanned.length) {
      setActiveStudentId(scanned[idx + 1].id);
    }
    return true;
  }

  async function handleSeatClick(
    seatId: string,
    seatStatus: "AVAILABLE" | "BOOKED" | "BLOCKED",
  ) {
    if (!activeStudentId) {
      toast.info("Select a scanned student first.");
      return;
    }
    if (seatStatus === "BLOCKED" && !isAdmin) {
      toast.error("Blocked seats cannot be assigned.");
      return;
    }
    const ownerStudentId = seatToStudent[seatId];
    if (
      seatStatus === "BOOKED" &&
      ownerStudentId &&
      ownerStudentId !== activeStudentId
    ) {
      toast.error("That seat already belongs to another scanned student.");
      return;
    }
    if (seatStatus === "BOOKED" && !ownerStudentId) {
      if (!isAdmin) {
        toast.error("That seat is taken by a student not in this scan session.");
        return;
      }
      try {
        const res = await fetch(`/api/seats/${seatId}/info`);
        const data = await res.json();
        const occupant = data?.seat?.student
          ? {
              name: `${data.seat.student.name} ${data.seat.student.surname}`,
              class: `${data.seat.student.class} #${data.seat.student.rollNumber}`,
              studentId: data.seat.student.studentId,
            }
          : null;
        setOverrideContext({ seatId, studentId: activeStudentId, occupant });
      } catch {
        setOverrideContext({ seatId, studentId: activeStudentId, occupant: null });
      }
      return;
    }
    await commitSeatAssignment(seatId, activeStudentId);
  }

  function finishSession() {
    setScanned([]);
    setActiveStudentId(null);
    setPhase("scanning");
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "single" | "multi");
          setScanned([]);
          setActiveStudentId(null);
          setPhase("scanning");
        }}
      >
        <TabsList>
          <TabsTrigger value="single">Single Mode</TabsTrigger>
          <TabsTrigger value="multi">Multi Mode</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4">
          {phase === "scanning" ? (
            <Card>
              <CardHeader>
                <CardTitle>Scan one student</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <QrScanner onScan={handleScan} />
                <p className="text-xs text-muted-foreground">
                  Hold the student&apos;s QR steady in the frame.
                </p>
              </CardContent>
            </Card>
          ) : (
            <SeatingPanel
              scanned={scanned}
              activeStudentId={activeStudentId}
              setActiveStudentId={setActiveStudentId}
              initialStatus={initialStatus}
              ownedSeatIds={ownedSeatIds}
              onSeatClick={handleSeatClick}
              onFinish={finishSession}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>
        <TabsContent value="multi" className="mt-4">
          {phase === "scanning" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Scan students</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <QrScanner onScan={handleScan} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Scanned ({scanned.length})
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanned([])}
                      disabled={scanned.length === 0}
                    >
                      <X className="h-4 w-4" /> Clear
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scanned.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nothing scanned yet.
                    </p>
                  )}
                  {scanned.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">
                          {s.name} {s.surname}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Class {s.class} · #{s.rollNumber} · {s.studentId}
                          {s.seatId ? ` · current seat ${s.seatId}` : ""}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeScanned(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    className="w-full"
                    onClick={proceedToSeating}
                    disabled={scanned.length === 0}
                  >
                    <Check className="h-4 w-4" /> Done — assign seats
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <SeatingPanel
              scanned={scanned}
              activeStudentId={activeStudentId}
              setActiveStudentId={setActiveStudentId}
              initialStatus={initialStatus}
              ownedSeatIds={ownedSeatIds}
              onSeatClick={handleSeatClick}
              onFinish={finishSession}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!overrideContext}
        onOpenChange={(o) => !o && setOverrideContext(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override booked seat?</DialogTitle>
            <DialogDescription>
              Seat <span className="font-mono">{overrideContext?.seatId}</span>{" "}
              is currently booked
              {overrideContext?.occupant
                ? ` by ${overrideContext.occupant.name} (class ${overrideContext.occupant.class}, ID ${overrideContext.occupant.studentId})`
                : ""}
              . Overriding will cancel their booking.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideContext(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!overrideContext) return;
                await commitSeatAssignment(
                  overrideContext.seatId,
                  overrideContext.studentId,
                  "Admin override via scanner",
                );
                setOverrideContext(null);
              }}
            >
              Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SeatingPanel({
  scanned,
  activeStudentId,
  setActiveStudentId,
  initialStatus,
  ownedSeatIds,
  onSeatClick,
  onFinish,
  isAdmin,
}: {
  scanned: ScannedStudent[];
  activeStudentId: string | null;
  setActiveStudentId: (id: string) => void;
  initialStatus: SeatStatusMap;
  ownedSeatIds: string[];
  onSeatClick: (seat: string, status: "AVAILABLE" | "BOOKED" | "BLOCKED") => void;
  onFinish: () => void;
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {scanned.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStudentId(s.id)}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              activeStudentId === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground"
            }`}
          >
            <div className="font-medium">
              {s.name} {s.surname}
            </div>
            <div className="opacity-70">
              {s.studentId} {s.seatId ? `· ${s.seatId}` : ""}
            </div>
          </button>
        ))}
        <Badge variant="outline" className="ml-2">
          Selecting for:{" "}
          {scanned.find((s) => s.id === activeStudentId)?.name ?? "—"}
        </Badge>
        <Button variant="outline" size="sm" className="ml-auto" onClick={onFinish}>
          Finish
        </Button>
      </div>
      <SeatMap
        initialStatus={initialStatus}
        ownedByCurrentScan={ownedSeatIds}
        selectedSeats={
          activeStudentId
            ? [scanned.find((s) => s.id === activeStudentId)?.seatId ?? ""].filter(Boolean) as string[]
            : []
        }
        onSeatClick={onSeatClick}
        isAdmin={isAdmin}
      />
    </div>
  );
}
