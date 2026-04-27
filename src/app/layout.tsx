import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";

import {IBM_Plex_Sans_Thai as IBMPlexSansThai, JetBrains_Mono} from "next/font/google";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";

const ibmPlexSansThai = IBMPlexSansThai({
	variable: "--font-ibm-plex-sans-thai",
	subsets: ["thai", "latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700"]
})

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Triamudom Family Movie Booking",
	description: "Registration for Triamudom Family Movie Booking.",
};

export default function RootLayout({
	                                   children,
                                   }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${ibmPlexSansThai.variable} ${jetbrainsMono.variable} h-full antialiased dark`}>
		<body className="min-h-full flex flex-col bg-background text-foreground font-sans">
		{children}
		<Toaster/>
		</body>
		</html>
	);
}
