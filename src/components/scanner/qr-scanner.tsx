"use client";

import { useEffect, useRef } from "react";

type Html5QrcodeCtor = new (
  elementId: string,
  config?: { verbose?: boolean },
) => Html5QrcodeInstance;

type Html5QrcodeInstance = {
  start: (
    cameraIdOrConfig: { facingMode: string } | string,
    config: { fps: number; qrbox?: number | { width: number; height: number } },
    onScanSuccess: (decodedText: string) => void,
    onScanError?: (err: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

export function QrScanner({
  onScan,
  onError,
  paused,
}: {
  onScan: (token: string) => void;
  onError?: (msg: string) => void;
  paused?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const elementId = useRef(`qr-scanner-${Math.random().toString(36).slice(2)}`);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import("html5-qrcode");
      const Html5QrcodeCtor: Html5QrcodeCtor =
        (mod as unknown as { Html5Qrcode: Html5QrcodeCtor }).Html5Qrcode;
      if (cancelled) return;
      const id = elementId.current;
      const instance = new Html5QrcodeCtor(id, { verbose: false });
      scannerRef.current = instance;
      try {
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            onScanRef.current(decoded);
          },
          (err) => {
            // Most "errors" are just frames without a QR — skip noise.
            if (err && /NotFound|No.+code|null/i.test(err)) return;
            onErrorRef.current?.(err);
          },
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera failed to start";
        onErrorRef.current?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst) {
        inst
          .stop()
          .catch(() => undefined)
          .finally(() => inst.clear());
      }
      scannerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={elementId.current}
      className="w-full max-w-sm rounded-lg overflow-hidden border bg-black"
      style={{ aspectRatio: "1 / 1", opacity: paused ? 0.4 : 1 }}
    />
  );
}
