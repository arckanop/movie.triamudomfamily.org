"use client";

import {useEffect, useId, useRef, useState, useCallback} from "react";

type CameraDevice = {id: string; label: string};

type Html5QrcodeCtor = {
	new (elementId: string, config?: {verbose?: boolean}): Html5QrcodeInstance;
	getCameras: () => Promise<CameraDevice[]>;
};

type Html5QrcodeInstance = {
	start: (
		cameraIdOrConfig: {facingMode: string} | string,
		config: {fps: number; qrbox?: number | {width: number; height: number}},
		onScanSuccess: (decodedText: string) => void,
		onScanError?: (err: string) => void,
	) => Promise<void>;
	stop: () => Promise<void>;
	clear: () => void;
};

export function QrScanner({onScan, onError, paused}: {
	onScan: (token: string) => void;
	onError?: (msg: string) => void;
	paused?: boolean;
}) {
	const scannerRef = useRef<Html5QrcodeInstance | null>(null);
	const isScanningRef = useRef(false);
	const rawId = useId();
	const elementId = useRef(`qr-scanner-${rawId.replace(/:/g, "")}`);
	const onScanRef = useRef(onScan);
	const onErrorRef = useRef(onError);
	const CtorRef = useRef<Html5QrcodeCtor | null>(null);

	const [cameras, setCameras] = useState<CameraDevice[]>([]);
	const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [started, setStarted] = useState(false);
	const [libReady, setLibReady] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);

	useEffect(() => { onScanRef.current = onScan; }, [onScan]);
	useEffect(() => { onErrorRef.current = onError; }, [onError]);

	// Suppress benign AbortErrors from the video element's play() promise
	// that reject after srcObject is cleared on unmount / camera switch.
	useEffect(() => {
		function handleRejection(e: PromiseRejectionEvent) {
			if (e.reason?.name === "AbortError") e.preventDefault();
		}
		window.addEventListener("unhandledrejection", handleRejection);
		return () => window.removeEventListener("unhandledrejection", handleRejection);
	}, []);

	// Restore auto-start after hydration
	useEffect(() => {
		if (sessionStorage.getItem("qr-cam-started") === "1") setStarted(true);
	}, []);

	const stopScanner = useCallback(async () => {
		// Null the srcObject before stop() so the browser doesn't fire an
		// AbortError for a play() promise that's still pending.
		const container = document.getElementById(elementId.current);
		const video = container?.querySelector("video");
		if (video) {
			video.pause();
			video.srcObject = null;
		}

		const inst = scannerRef.current;
		if (inst && isScanningRef.current) {
			try { await inst.stop(); } catch { /* ignore */ }
			isScanningRef.current = false;
			try { inst.clear(); } catch { /* ignore */ }
		}
		scannerRef.current = null;
	}, []);

	const startScanner = useCallback(async (camera: string | {facingMode: string}) => {
		const Ctor = CtorRef.current;
		if (!Ctor) return;
		const instance = new Ctor(elementId.current, {verbose: false});
		scannerRef.current = instance;
		try {
			await instance.start(
				camera,
				{fps: 10},
				(decoded) => onScanRef.current(decoded),
				(err) => {
					if (err && /NotFound|No.+code|null/i.test(err)) return;
					onErrorRef.current?.(err);
				},
			);
			isScanningRef.current = true;
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Camera failed to start";
			setStartError(msg);
			onErrorRef.current?.(msg);
		}
	}, []);

	// Load the library; signal when ready
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const mod = await import("html5-qrcode");
			const Ctor = (mod as unknown as {Html5Qrcode: Html5QrcodeCtor}).Html5Qrcode;
			if (!cancelled) {
				CtorRef.current = Ctor;
				setLibReady(true);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	// Start the camera only once both the library is loaded and the user has started
	useEffect(() => {
		if (!started || !libReady) return;
		const id = elementId.current;

		const style = document.createElement("style");
		style.textContent = `
			#${id} { position: relative !important; }
			#${id} > div:first-child {
				position: absolute !important;
				inset: 0 !important;
				width: 100% !important;
				height: 100% !important;
				overflow: hidden !important;
			}
			#${id} video {
				width: 100% !important;
				height: 100% !important;
				object-fit: cover !important;
				display: block !important;
			}
			#${id} img { display: none !important; }
		`;
		document.head.appendChild(style);

		let cancelled = false;
		(async () => {
			try {
				const cams = await CtorRef.current!.getCameras();
				if (!cancelled && cams.length > 0) setCameras(cams);
			} catch { /* permissions not yet granted or unavailable */ }
			if (!cancelled) await startScanner({facingMode: "environment"});
		})();

		return () => {
			cancelled = true;
			document.head.removeChild(style);
			stopScanner();
		};
	}, [started, libReady, startScanner, stopScanner]);

	async function handleTapStart() {
		setStartError(null);
		// Must call getUserMedia inside the tap handler so mobile browsers
		// show the permission prompt while the user gesture is still active.
		// html5-qrcode will open its own stream; we just need the grant here.
		try {
			const stream = await navigator.mediaDevices.getUserMedia({video: true});
			stream.getTracks().forEach((t) => t.stop());
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Camera permission denied";
			setStartError(msg);
			onErrorRef.current?.(msg);
			return;
		}
		sessionStorage.setItem("qr-cam-started", "1");
		setStarted(true);
	}

	async function handleCameraSelect(cameraId: string) {
		setShowSettings(false);
		setActiveCameraId(cameraId);
		await stopScanner();
		await startScanner(cameraId);
	}

	return (
		<div className="relative w-full max-w-sm" style={{opacity: paused ? 0.4 : 1}}>
			<div
				id={elementId.current}
				className="w-full rounded-lg overflow-hidden border bg-black"
				style={{aspectRatio: "1 / 1"}}
			/>
			{!started && (
				<div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-zinc-900/95">
					<button
						type="button"
						onClick={handleTapStart}
						className="flex flex-col items-center gap-3 text-white"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
							<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
							<circle cx="12" cy="13" r="3"/>
						</svg>
						<span className="text-sm font-medium">แตะเพื่อเปิดกล้อง</span>
						<span className="text-xs text-zinc-400">กดอนุญาตเมื่อระบบถาม</span>
					</button>
				</div>
			)}
			{startError && started && (
				<div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-zinc-900/95 gap-3 px-4 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
					<p className="text-sm text-white">ไม่สามารถเปิดกล้องได้</p>
					<p className="text-xs text-zinc-400">ตรวจสอบว่าอนุญาตการใช้กล้องแล้ว</p>
					<button
						type="button"
						onClick={() => { sessionStorage.removeItem("qr-cam-started"); setStarted(false); setStartError(null); }}
						className="mt-1 rounded-md bg-white/10 px-4 py-1.5 text-xs text-white hover:bg-white/20"
					>
						ลองอีกครั้ง
					</button>
				</div>
			)}

			{cameras.length > 1 && (
				<div className="absolute top-2 right-2 z-10">
					<button
						type="button"
						onClick={() => setShowSettings((s) => !s)}
						className="p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
						aria-label="Camera settings"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					</button>

					{showSettings && (
						<div className="absolute right-0 top-9 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[200px]">
							<div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
								Camera
							</div>
							{cameras.map((cam) => (
								<button
									key={cam.id}
									type="button"
									onClick={() => handleCameraSelect(cam.id)}
									className={`w-full text-left px-3 py-2 text-sm transition-colors truncate flex items-center gap-2 ${
										activeCameraId === cam.id
											? "bg-slate-100 text-slate-900 font-medium"
											: "text-slate-700 hover:bg-slate-50"
									}`}
								>
									{activeCameraId === cam.id && (
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
									)}
									<span className={activeCameraId === cam.id ? "" : "pl-[20px]"}>
										{cam.label || `Camera ${cam.id.slice(0, 8)}`}
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
