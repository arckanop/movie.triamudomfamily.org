"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    class: "",
    rollNumber: "",
    studentId: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{3}$/.test(form.class)) {
      toast.error("Class must be a 3-digit string (leading zeros matter, e.g. 042).");
      return;
    }
    start(async () => {
      const res = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          class: form.class,
          rollNumber: Number(form.rollNumber),
          studentId: form.studentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        return;
      }
      toast.success("Registered!");
      router.push("/register/how-to");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">First name</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="surname">Surname</Label>
        <Input
          id="surname"
          required
          value={form.surname}
          onChange={(e) => update("surname", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="class">
          Class <span className="text-muted-foreground">(3 digits, e.g. 401 or 042)</span>
        </Label>
        <Input
          id="class"
          required
          inputMode="numeric"
          maxLength={3}
          value={form.class}
          onChange={(e) =>
            update("class", e.target.value.replace(/\D/g, "").slice(0, 3))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rollNumber">Roll number</Label>
        <Input
          id="rollNumber"
          required
          inputMode="numeric"
          value={form.rollNumber}
          onChange={(e) =>
            update("rollNumber", e.target.value.replace(/\D/g, ""))
          }
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="studentId">Student ID</Label>
        <Input
          id="studentId"
          required
          value={form.studentId}
          onChange={(e) => update("studentId", e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="sm:col-span-2">
        {pending ? "Submitting…" : "Submit registration"}
      </Button>
    </form>
  );
}
