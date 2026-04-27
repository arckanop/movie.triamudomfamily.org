"use client";

import {Toaster as Sonner, type ToasterProps} from "sonner";

const Toaster = (props: ToasterProps) => (
	<Sonner
		theme="dark"
		position="top-center"
		toastOptions={{
			style: {
				background: "var(--card)",
				color: "var(--foreground)",
				border: "1px solid var(--border)",
			},
		}}
		{...props}
	/>
);

export {Toaster};
