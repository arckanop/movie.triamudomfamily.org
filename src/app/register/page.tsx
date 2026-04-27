import {redirect} from "next/navigation";
import {getSession} from "@/server/session";
import {prisma} from "@/server/prisma";
import {GoogleSignInButton} from "./google-sign-in-button";
import {RegisterForm} from "./register-form";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";

const STUDENT_DOMAIN =
	process.env.STUDENT_EMAIL_DOMAIN ?? "@student.triamudom.ac.th";

export default async function RegisterPage() {
	const session = await getSession();

	if (!session) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Student Registration</CardTitle>
						<CardDescription>
							Sign in with your school Google account ({STUDENT_DOMAIN}) to register
							for the movie event.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<GoogleSignInButton/>
					</CardContent>
				</Card>
			</div>
		);
	}

	const email = session.user.email;
	if (!email || !email.endsWith(STUDENT_DOMAIN)) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Wrong account</CardTitle>
						<CardDescription>
							You signed in with <span className="font-mono">{email}</span>, but
							registration is restricted to {STUDENT_DOMAIN} accounts.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<GoogleSignInButton signOutFirst label="Sign in with the right account"/>
					</CardContent>
				</Card>
			</div>
		);
	}

	const student = await prisma.student.findUnique({
		where: {userId: session.user.id},
	});
	if (student) redirect("/register/ticket");

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Complete your registration</CardTitle>
					<CardDescription>
						Signed in as <span className="font-mono">{email}</span>. Fill out
						your details to receive your QR ticket.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RegisterForm/>
				</CardContent>
			</Card>
		</div>
	);
}
