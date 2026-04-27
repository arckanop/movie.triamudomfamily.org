"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { SeatMap, type SeatStatusMap } from "@/components/seat/seat-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Analytics = {
  summary: { total: number; available: number; booked: number; blocked: number };
  bookingsPerHour: { hour: string; count: number }[];
  bookingsPerStaff: { userId: string; username: string; count: number }[];
};

type SeatInfo = {
  seat: {
    id: string;
    status: "AVAILABLE" | "BOOKED" | "BLOCKED";
    bookedBy: string | null;
    bookedAt: string | null;
    student: {
      id: string;
      name: string;
      surname: string;
      class: string;
      rollNumber: number;
      studentId: string;
    } | null;
  };
  performer: { id: string; name: string; username: string | null } | null;
};

type SearchedStudent = {
  id: string;
  name: string;
  surname: string;
  class: string;
  rollNumber: number;
  studentId: string;
  seatId: string | null;
};

export function AdminDashboard({ initialStatus }: { initialStatus: SeatStatusMap }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [info, setInfo] = useState<SeatInfo | null>(null);
  const [openSeat, setOpenSeat] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "cancel"; seatId: string }
    | { kind: "block"; seatId: string }
    | { kind: "unblock"; seatId: string }
    | { kind: "override"; seatId: string; studentId: string }
    | null
  >(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedStudent[]>([]);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);

  useEffect(() => {
    refreshAnalytics();
  }, []);

  async function refreshAnalytics() {
    const res = await fetch("/api/analytics");
    if (res.ok) setAnalytics(await res.json());
  }

  async function loadInfo(seatId: string) {
    setOpenSeat(seatId);
    setInfo(null);
    const res = await fetch(`/api/seats/${seatId}/info`);
    if (res.ok) setInfo(await res.json());
  }

  function handleSeatClick(
    seatId: string,
    status: "AVAILABLE" | "BOOKED" | "BLOCKED",
  ) {
    if (status === "AVAILABLE") {
      setAssignTarget(seatId);
      setSearch("");
      setSearchResults([]);
      return;
    }
    loadInfo(seatId);
  }

  async function searchStudents(q: string) {
    setSearch(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.students);
    }
  }

  async function assignSeat(seatId: string, studentId: string) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatId, studentId }),
    });
    if (res.ok) {
      toast.success(`${seatId} assigned`);
      setAssignTarget(null);
      refreshAnalytics();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Booking failed");
    }
  }

  async function applyConfirm() {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    if (action.kind === "cancel") {
      const res = await fetch(`/api/bookings/${action.seatId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${action.seatId} freed`);
        setOpenSeat(null);
        refreshAnalytics();
      } else toast.error("Failed");
    } else if (action.kind === "block") {
      const res = await fetch(`/api/seats/${action.seatId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        toast.success(`${action.seatId} blocked`);
        setOpenSeat(null);
        refreshAnalytics();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed");
      }
    } else if (action.kind === "unblock") {
      const res = await fetch(`/api/seats/${action.seatId}/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (res.ok) {
        toast.success(`${action.seatId} unblocked`);
        setOpenSeat(null);
        refreshAnalytics();
      } else toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total seats" value={analytics?.summary.total ?? "—"} />
        <Stat label="Available" value={analytics?.summary.available ?? "—"} accent="green" />
        <Stat label="Booked" value={analytics?.summary.booked ?? "—"} accent="red" />
        <Stat label="Blocked" value={analytics?.summary.blocked ?? "—"} accent="zinc" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings per hour</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.bookingsPerHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333" }} />
                  <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings per staff</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 220 }}>
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bookingsPerStaff}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="username" stroke="#999" fontSize={10} />
                  <YAxis stroke="#999" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #333" }} />
                  <Bar dataKey="count" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seat map</CardTitle>
        </CardHeader>
        <CardContent>
          <SeatMap
            initialStatus={initialStatus}
            isAdmin
            onSeatClick={handleSeatClick}
          />
        </CardContent>
      </Card>

      <Dialog open={!!openSeat} onOpenChange={(o) => !o && setOpenSeat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Seat {openSeat}{" "}
              {info && (
                <Badge variant="secondary" className="ml-2">
                  {info.seat.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {info ? (
            <div className="space-y-3 text-sm">
              {info.seat.student && (
                <div className="rounded-md border p-3">
                  <div className="font-medium">
                    {info.seat.student.name} {info.seat.student.surname}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Class {info.seat.student.class} · #{info.seat.student.rollNumber} ·{" "}
                    {info.seat.student.studentId}
                  </div>
                </div>
              )}
              {info.seat.bookedAt && (
                <div className="text-xs text-muted-foreground">
                  Booked by{" "}
                  <span className="font-medium text-foreground">
                    {info.performer?.username ?? info.performer?.name ?? "unknown"}
                  </span>{" "}
                  on {new Date(info.seat.bookedAt).toLocaleString()}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {info.seat.status === "BOOKED" && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setConfirmAction({ kind: "cancel", seatId: info.seat.id })
                    }
                  >
                    Cancel booking
                  </Button>
                )}
                {info.seat.status === "AVAILABLE" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmAction({ kind: "block", seatId: info.seat.id })
                    }
                  >
                    Block seat
                  </Button>
                )}
                {info.seat.status === "BLOCKED" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmAction({ kind: "unblock", seatId: info.seat.id })
                    }
                  >
                    Unblock seat
                  </Button>
                )}
                {info.seat.status === "BOOKED" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmAction({ kind: "block", seatId: info.seat.id })
                    }
                  >
                    Block (after cancelling)
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign seat {assignTarget}</DialogTitle>
            <DialogDescription>
              Search for a student by name, surname, class, or student ID.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Type to search…"
            value={search}
            onChange={(e) => searchStudents(e.target.value)}
          />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.id}
                onClick={() => assignTarget && assignSeat(assignTarget, s.id)}
                className="flex w-full items-center justify-between rounded-md border p-2 text-left text-sm hover:bg-accent"
              >
                <div>
                  <div className="font-medium">
                    {s.name} {s.surname}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Class {s.class} · #{s.rollNumber} · {s.studentId}
                  </div>
                </div>
                {s.seatId && (
                  <span className="text-xs text-amber-400">
                    has seat {s.seatId}
                  </span>
                )}
              </button>
            ))}
            {search.length >= 2 && searchResults.length === 0 && (
              <div className="text-xs text-muted-foreground">No matches.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmAction}
        onOpenChange={(o) => !o && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              {confirmAction?.kind === "cancel" &&
                `This will cancel the booking for ${confirmAction.seatId} and free the seat.`}
              {confirmAction?.kind === "block" &&
                `This will block ${confirmAction.seatId}. Staff will not be able to assign it.`}
              {confirmAction?.kind === "unblock" &&
                `This will unblock ${confirmAction.seatId} and make it available.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={applyConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "green" | "red" | "zinc";
}) {
  const tint =
    accent === "green"
      ? "text-emerald-400"
      : accent === "red"
        ? "text-rose-400"
        : accent === "zinc"
          ? "text-zinc-400"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`mt-1 text-2xl font-bold ${tint}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
