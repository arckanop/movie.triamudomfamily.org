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

	const inputClass = "w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 focus:bg-white transition";
	const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

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
					ห้อง <span className="text-slate-400 font-normal">เช่น 070 หรือ 946</span>
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
					className={`${inputClass} opacity-60 cursor-not-allowed`}
					required
					disabled
					value={form.studentId}
				/>
			</div>
			<button
				type="submit"
				disabled={pending}
				className="sm:col-span-2 w-full px-4 py-2.5 rounded-lg bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 disabled:opacity-60 transition-colors"
			>
				{pending ? "กำลังส่ง…" : "ยืนยันการลงทะเบียน"}
			</button>
		</form>
	);
}
