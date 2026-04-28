import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {GoogleSignInButton} from "./google-sign-in-button";
import {RegisterForm} from "./register-form";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

function Shell({title, description, email, children}: {
	title: string;
	description: string;
	email?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-1 flex-col bg-slate-50">
			<nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					กลับหน้าหลัก
				</Link>
				<Link href="/login" className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-700 transition-colors">
					Staff login
				</Link>
			</nav>
			<div className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-md p-8">
					<div className="mb-6">
						{/*<span className="text-xs font-mono tracking-widest text-pink-400 uppercase">Triamudom Suksa School</span>*/}
						<h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
						<p className="mt-1.5 text-sm text-slate-500">{description}</p>
						{email && (
							<div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
								<span className="text-xs text-slate-400 shrink-0">บัญชี</span>
								<span className="font-mono text-sm text-slate-700 break-all">{email}</span>
							</div>
						)}
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}

export default async function RegisterPage() {
	const session = await getSession();

	if (!session) {
		return (
			<Shell
				title="ลงทะเบียนนักเรียน"
				description={`เข้าสู่ระบบด้วยบัญชี Google ของโรงเรียน (${STUDENT_DOMAIN}) เพื่อลงทะเบียนชมภาพยนตร์`}
			>
				<GoogleSignInButton/>
			</Shell>
		);
	}

	const email = session.user.email;
	if (!email || !email.endsWith(STUDENT_DOMAIN)) {
		return (
			<Shell
				title="บัญชีไม่ถูกต้อง"
				description={`การลงทะเบียนจำกัดเฉพาะบัญชี ${STUDENT_DOMAIN} เท่านั้น`}
				email={email ?? undefined}
			>
				<GoogleSignInButton signOutFirst label="เข้าสู่ระบบด้วยบัญชีที่ถูกต้อง"/>
			</Shell>
		);
	}

	const student = await prisma.student.findUnique({
		where: {userId: session.user.id},
	});
	if (student) redirect("/register/ticket");

	return (
		<Shell
			title="ลงทะเบียนไปดูหนัง"
			description="กรอกข้อมูลด้านล่างเพื่อรับ E-ticket ของคุณ"
			email={email}
		>
			<RegisterForm email={email}/>
		</Shell>
	);
}
