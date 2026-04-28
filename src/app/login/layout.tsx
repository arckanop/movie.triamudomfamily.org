export default function LoginLayout({children}: {children: React.ReactNode}) {
	return (
		<div className="flex-1 flex flex-col bg-white text-slate-900 [color-scheme:light]">
			{children}
		</div>
	);
}
