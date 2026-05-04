"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

export function RegisterForm({email}: {email: string}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const studentId = email.split("@")[0].slice(2);
	const [form, setForm] = useState({
		name: "",
		surname: "",
		class: "",
		rollNumber: "",
		studentId,
	});

	function update<K extends keyof typeof form>(key: K, value: string) {
		setForm((prev) => ({...prev, [key]: value}));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!/^\d{3}$/.test(form.class)) {
			toast.error("ห้อง เช่น 070 หรือ 946");
			return;
		}
		start(async () => {
			const res = await fetch("/api/students/register", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
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
				toast.error(data.error ?? "การลงทะเบียนล้มเหลว");
				return;
			}
			toast.success("ลงทะเบียนสำเร็จ!");
			router.push("/register/how-to");
		});
	}

	const inputClass =
		"w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition shadow-sm";
	const labelClass = "block text-xs font-semibold text-zinc-400 mb-1.5";

	return (
		<form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
			<div>
				<label htmlFor="name" className={labelClass}>ชื่อ</label>
				<input
					id="name"
					className={inputClass}
					required
					value={form.name}
					onChange={(e) => update("name", e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="surname" className={labelClass}>นามสกุล</label>
				<input
					id="surname"
					className={inputClass}
					required
					value={form.surname}
					onChange={(e) => update("surname", e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="class" className={labelClass}>
					ห้อง{" "}
					<span className="font-normal text-zinc-500">เช่น 070 หรือ 946</span>
				</label>
				<input
					id="class"
					className={inputClass}
					required
					inputMode="numeric"
					maxLength={3}
					value={form.class}
					onChange={(e) => update("class", e.target.value.replace(/\D/g, "").slice(0, 3))}
				/>
			</div>
			<div>
				<label htmlFor="rollNumber" className={labelClass}>เลขที่</label>
				<input
					id="rollNumber"
					className={inputClass}
					required
					inputMode="numeric"
					value={form.rollNumber}
					onChange={(e) => update("rollNumber", e.target.value.replace(/\D/g, ""))}
				/>
			</div>
			<div className="sm:col-span-2">
				<label htmlFor="studentId" className={labelClass}>รหัสนักเรียน</label>
				<input
					id="studentId"
					className={`${inputClass} cursor-not-allowed opacity-50`}
					required
					disabled
					value={form.studentId}
				/>
			</div>

			<div className="sm:col-span-2 pt-1">
				<button
					type="submit"
					disabled={pending}
					className="w-full rounded-lg bg-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-900/50 transition-colors hover:bg-pink-400 disabled:opacity-60"
				>
					{pending ? (
						<span className="flex items-center justify-center gap-2">
							<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
							</svg>
							กำลังส่ง…
						</span>
					) : (
						"ยืนยันการลงทะเบียน"
					)}
				</button>
			</div>
		</form>
	);
}
