"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Log = {
  id: string;
  seatId: string;
  studentId: string | null;
  action: string;
  performedAt: string;
  note: string | null;
  student: {
    name: string;
    surname: string;
    class: string;
    studentId: string;
  } | null;
  performedByUser: { username: string | null; name: string } | null;
};

const ACTIONS = ["", "BOOKED", "CANCELLED", "OVERRIDDEN", "BLOCKED", "UNBLOCKED"];

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filters, setFilters] = useState({
    action: "",
    row: "",
    from: "",
    to: "",
  });

  async function load() {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.row) params.set("row", filters.row);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await fetch(`/api/logs?${params.toString()}`);
    if (res.ok) setLogs((await res.json()).logs);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    const header = [
      "timestamp",
      "seat",
      "action",
      "student_id",
      "student_name",
      "class",
      "performed_by",
      "note",
    ].join(",");
    const rows = logs.map((l) => {
      const cells = [
        new Date(l.performedAt).toISOString(),
        l.seatId,
        l.action,
        l.student?.studentId ?? "",
        l.student ? `${l.student.name} ${l.student.surname}` : "",
        l.student?.class ?? "",
        l.performedByUser?.username ?? l.performedByUser?.name ?? "",
        (l.note ?? "").replace(/"/g, '""'),
      ];
      return cells
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking logs</h1>
          <p className="text-sm text-muted-foreground">
            Every booking, override, and seat status change is logged here.
          </p>
        </div>
        <Button onClick={exportCsv}>Export CSV</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label>Action</Label>
            <Select
              value={filters.action || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, action: v === "all" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a || "all"} value={a || "all"}>
                    {a || "All"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Seat row</Label>
            <Input
              placeholder="e.g. A or FH"
              value={filters.row}
              onChange={(e) =>
                setFilters({ ...filters, row: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <Button onClick={load} className="sm:col-span-4">
            Apply filters
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">
                    {new Date(l.performedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.seatId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.student
                      ? `${l.student.name} ${l.student.surname} (class ${l.student.class}, ${l.student.studentId})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.performedByUser?.username ??
                      l.performedByUser?.name ??
                      "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.note ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
