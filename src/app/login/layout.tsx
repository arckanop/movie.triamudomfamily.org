export default function LoginLayout({children}: {children: React.ReactNode}) {
	return (
		<div className="flex-1 flex flex-col bg-[#050509] text-white [color-scheme:dark]">
			{children}
		</div>
	);
}
