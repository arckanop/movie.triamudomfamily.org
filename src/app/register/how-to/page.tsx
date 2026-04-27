import Link from "next/link";
import {QrCode, ScanLine, ArmchairIcon, Smartphone} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

const STEPS = [
	{
		icon: Smartphone,
		title: "Bring your phone",
		body: "On the day of the event, open this site on your phone — your QR ticket lives at /register/ticket.",
	},
	{
		icon: QrCode,
		title: "Show your QR",
		body: "At the entrance, hold your screen up so a staff member can see your QR ticket clearly.",
	},
	{
		icon: ScanLine,
		title: "Staff will scan you in",
		body: "A staff member will scan your QR and assign you a seat. The screen will display your seat number.",
	},
	{
		icon: ArmchairIcon,
		title: "Find your seat",
		body: "Walk into the hall and find the seat number assigned to you. Enjoy the movie!",
	},
];

export default function HowToPage() {
	return (
		<div className="flex flex-1 flex-col items-center p-6">
			<div className="w-full max-w-3xl space-y-6">
				<div>
					<h1 className="text-3xl font-bold">You&apos;re registered!</h1>
					<p className="text-muted-foreground mt-1">
						Here&apos;s what to do on movie day.
					</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{STEPS.map((s, i) => {
						const Icon = s.icon;
						return (
							<Card key={s.title}>
								<CardHeader>
									<div className="flex items-center gap-3">
										<div className="rounded-md bg-primary text-primary-foreground p-2">
											<Icon className="h-5 w-5"/>
										</div>
										<CardTitle>
											Step {i + 1} · {s.title}
										</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<CardDescription>{s.body}</CardDescription>
								</CardContent>
							</Card>
						);
					})}
				</div>
				<Button asChild className="w-full" size="lg">
					<Link href="/register/ticket">OK, got it!</Link>
				</Button>
			</div>
		</div>
	);
}
