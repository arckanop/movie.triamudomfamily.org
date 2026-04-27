import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { prisma } from "@/server/prisma";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role === "ADMIN") redirect("/admin");
    if (user?.role === "STAFF") redirect("/staff");
    if (user?.role === "STUDENT") redirect("/register/ticket");
  }
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Staff & Admin Login</CardTitle>
          <CardDescription>
            Students should use{" "}
            <a className="underline underline-offset-4" href="/register">
              /register
            </a>{" "}
            with their school Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
