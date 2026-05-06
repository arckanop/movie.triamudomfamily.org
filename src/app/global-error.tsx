"use client";

import {useEffect} from "react";

export default function GlobalError({
	error,
	unstable_retry,
}: {
	error: Error & {digest?: string};
	unstable_retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="en">
			<body style={{margin: 0, background: "#050509", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100svh", alignItems: "center", justifyContent: "center"}}>
				<div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "1.5rem", textAlign: "center", maxWidth: "24rem"}}>
					<div style={{width: 48, height: 48, borderRadius: 14, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(127,29,29,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171"}}>
						<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
						</svg>
					</div>
					<div>
						<p style={{margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700}}>เกิดข้อผิดพลาดร้ายแรง</p>
						<p style={{margin: 0, fontSize: "0.875rem", color: "#71717a"}}>กรุณาลองโหลดหน้าใหม่</p>
						{error.digest && (
							<p style={{margin: "0.5rem 0 0", fontSize: "0.625rem", color: "#3f3f46", fontFamily: "monospace"}}>ref: {error.digest}</p>
						)}
					</div>
					<button
						type="button"
						onClick={unstable_retry}
						style={{padding: "0.625rem 1.5rem", borderRadius: 9999, background: "#f43f5e", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer"}}
					>
						ลองอีกครั้ง
					</button>
				</div>
			</body>
		</html>
	);
}
