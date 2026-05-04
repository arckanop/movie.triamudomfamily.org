export default function RegisterLayout({children}: {children: React.ReactNode}) {
	return (
		<div className="flex-1 flex flex-col min-h-svh bg-[#050509] text-white [color-scheme:dark]">
			{children}
		</div>
	);
}
