"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { ASSETS } from "@/lib/assets";
import {
  decodeNdefRecords,
  isValidRoyalCrownUrl,
  markNfcAuthenticated,
  NFC_EXPECTED_URL,
  supportsWebNfc,
} from "@/lib/nfc";

type Status = "idle" | "scanning-nfc" | "scanning-qr" | "invalid";

const QR_READER_ID = "rb-qr-reader";

/**
 * NFC y QR comparten el mismo valor válido:
 * https://royal-boss.com/RoyalCrown
 * Si coincide → /RoyalCrown. Si no → invalid.
 */
function isValidScanValue(raw: string): boolean {
  const cleaned = raw.trim().replace(/^\uFEFF/, "");
  return (
    isValidRoyalCrownUrl(cleaned) ||
    cleaned === NFC_EXPECTED_URL ||
    /royal-boss\.com\/royalcrown/i.test(cleaned)
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function IconNfcWaves({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M24 34v4" />
      <path d="M18 28c3.3-3.3 8.7-3.3 12 0" />
      <path d="M14 23c5.5-5.5 14.5-5.5 20 0" />
      <path d="M10 18c7.7-7.7 20.3-7.7 28 0" />
    </svg>
  );
}

/** Recuadro de scan — esquinas en L + línea de escaneo animada */
function ScanFrame({ active }: { active?: boolean }) {
  const corner =
    "pointer-events-none absolute h-10 w-10 border-white sm:h-12 sm:w-12";
  return (
    <div
      className={`relative aspect-square w-[min(72vw,19rem)] overflow-hidden ${
        active ? "opacity-100" : "opacity-95"
      }`}
      aria-hidden
    >
      <span
        className={`${corner} left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-sm`}
      />
      <span
        className={`${corner} right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-sm`}
      />
      <span
        className={`${corner} bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-sm`}
      />
      <span
        className={`${corner} bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-sm`}
      />

      <div className="absolute inset-[10%] overflow-hidden rounded-2xl border border-white/25">
        {/* Línea de scan que baja y sube */}
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rb-red to-transparent shadow-[0_0_12px_rgba(200,16,46,0.85)]"
          initial={{ top: "8%" }}
          animate={{ top: ["8%", "92%", "8%"] }}
          transition={{
            duration: active ? 1.6 : 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-x-0 h-16 bg-gradient-to-b from-rb-red/25 to-transparent"
          initial={{ top: "8%" }}
          animate={{ top: ["8%", "70%", "8%"] }}
          transition={{
            duration: active ? 1.6 : 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <IconNfcWaves className="h-14 w-14 text-white/85 sm:h-16 sm:w-16" />
        </motion.div>
      </div>
    </div>
  );
}

export default function ScanAndPlay() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [readValue, setReadValue] = useState("");
  const [cameraError, setCameraError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scanIdRef = useRef(0);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const handledQrRef = useRef(false);

  const stopQr = useCallback(async () => {
    const scanner = qrRef.current;
    qrRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      /* ignore */
    }
    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
  }, []);

  const enterRoyalCrown = useCallback(() => {
    markNfcAuthenticated(true);
    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
    void stopQr();
    router.push("/RoyalCrown");
  }, [router, stopQr]);

  const markInvalid = useCallback(
    (detail: string) => {
      try {
        abortRef.current?.abort();
      } catch {
        /* ignore */
      }
      void stopQr();
      setReadValue(detail);
      setStatus("invalid");
    },
    [stopQr],
  );

  const resetToIdle = useCallback(() => {
    scanIdRef.current += 1;
    handledQrRef.current = false;
    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
    abortRef.current = null;
    void stopQr();
    setStatus("idle");
    setReadValue("");
    setCameraError("");
  }, [stopQr]);

  const startNfcScan = useCallback(async () => {
    const myId = ++scanIdRef.current;
    handledQrRef.current = false;
    setReadValue("");
    setCameraError("");
    setStatus("scanning-nfc");

    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
    await stopQr();

    if (!supportsWebNfc()) {
      window.setTimeout(() => {
        if (scanIdRef.current !== myId) return;
        markInvalid("NFC no disponible en este dispositivo");
      }, 2500);
      return;
    }

    await new Promise((r) => setTimeout(r, 80));
    if (scanIdRef.current !== myId) return;

    try {
      const reader = new window.NDEFReader();
      const ac = new AbortController();
      abortRef.current = ac;

      const onReading = (event: {
        message?: {
          records: {
            recordType: string;
            data?: DataView;
            encoding?: string;
          }[];
        };
        serialNumber?: string;
      }) => {
        if (scanIdRef.current !== myId) return;

        const values = decodeNdefRecords(event.message ?? { records: [] });
        const ok = values.some(isValidScanValue);

        if (ok) {
          enterRoyalCrown();
          return;
        }

        const detail =
          values.filter(Boolean).join(" · ") ||
          (event.serialNumber
            ? `ID ${event.serialNumber}`
            : "Etiqueta incorrecta");
        markInvalid(detail);
      };

      const onReadingError = () => {
        if (scanIdRef.current !== myId) return;
        markInvalid("Etiqueta incorrecta");
      };

      reader.addEventListener("reading", onReading);
      reader.addEventListener("readingerror", onReadingError);
      reader.onreading = onReading;
      reader.onreadingerror = onReadingError;

      await reader.scan({ signal: ac.signal });
    } catch (err) {
      if (scanIdRef.current !== myId) return;
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      markInvalid("No se pudo leer la etiqueta");
    }
  }, [enterRoyalCrown, markInvalid, stopQr]);

  const startQrScan = useCallback(async () => {
    const myId = ++scanIdRef.current;
    handledQrRef.current = false;
    setReadValue("");
    setCameraError("");
    setStatus("scanning-qr");

    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
    await stopQr();

    await new Promise((r) => setTimeout(r, 100));
    if (scanIdRef.current !== myId) return;

    try {
      const scanner = new Html5Qrcode(QR_READER_ID);
      qrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (decoded) => {
          if (scanIdRef.current !== myId || handledQrRef.current) return;

          if (isValidScanValue(decoded)) {
            handledQrRef.current = true;
            enterRoyalCrown();
            return;
          }

          // Solo invalidar si hay contenido real (evitar falsos por ruido)
          const text = decoded?.trim();
          if (!text) return;

          handledQrRef.current = true;
          markInvalid(text);
        },
        () => {
          /* ignore frame errors */
        },
      );
    } catch (err) {
      if (scanIdRef.current !== myId) return;
      const message =
        err instanceof Error ? err.message : "No se pudo abrir la cámara";
      setCameraError(
        /permission|NotAllowed|denied/i.test(message)
          ? "Permiso de cámara denegado. Activalo e intentá de nuevo."
          : "No se pudo abrir la cámara.",
      );
      setStatus("idle");
      void stopQr();
    }
  }, [enterRoyalCrown, markInvalid, stopQr]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      void stopQr();
    };
  }, [stopQr]);

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-rb-black text-rb-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.img1}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex min-h-svh flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        {/* Logo arriba */}
        <div className="flex flex-col items-center pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.logoRoyal}
            alt="Royal Boss"
            className="h-14 w-14 object-contain drop-shadow-lg sm:h-16 sm:w-16"
          />
        </div>

        {/* Recuadro de scan al centro */}
        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <ScanFrame active={status === "scanning-nfc"} />

          {cameraError ? (
            <p className="mt-4 max-w-xs text-center text-sm text-rb-red">
              {cameraError}
            </p>
          ) : null}
        </div>

        {/* Branding abajo + botones */}
        <div className="flex flex-col items-center pb-2">
          <h1 className="text-center font-[family-name:var(--font-bebas)] text-2xl tracking-[0.12em] text-rb-white sm:text-3xl">
            AUTHENTICATE YOUR PRODUCT
          </h1>
          <p className="mt-2 text-center text-sm font-light tracking-wide text-white/75">
            Authentic Royal Boss Product
          </p>

          {status === "idle" && (
            <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
              <button
                type="button"
                onClick={startNfcScan}
                className="min-h-12 w-full border border-rb-red bg-rb-red/90 px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white transition-colors hover:bg-rb-red"
              >
                Escanear NFC
              </button>
              <button
                type="button"
                onClick={startQrScan}
                className="min-h-12 w-full border border-white/40 bg-black/40 px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white backdrop-blur-sm transition-colors hover:border-white/70"
              >
                Escanear QR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cuadro NFC — bottom sheet grande estilo referencia */}
      <AnimatePresence>
        {status === "scanning-nfc" && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/35"
              onClick={resetToIdle}
            />

            <motion.div
              role="dialog"
              aria-label="Listo para escanear"
              className="relative z-10 flex min-h-[52svh] flex-col rounded-t-[1.75rem] bg-[#2a2a2e] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:min-h-[48svh]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetToIdle}
                  className="flex h-10 w-10 items-center justify-center text-white/90"
                  aria-label="Cerrar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={resetToIdle}
                  className="px-2 py-2 text-[17px] font-medium text-[#0a84ff]"
                >
                  Cancelar
                </button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center pb-6 pt-2">
                <div className="flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-[#0a84ff] sm:h-28 sm:w-28">
                  <IconPhone className="h-12 w-12 text-white sm:h-14 sm:w-14" />
                </div>

                <p className="mt-8 text-center text-[1.65rem] font-semibold tracking-tight text-white sm:text-3xl">
                  Listo para escanear
                </p>

                <IconNfcWaves className="mt-6 h-12 w-12 text-white/90 sm:h-14 sm:w-14" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "scanning-qr" && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-rb-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver">
                Escaneá el QR
              </p>
              <button
                type="button"
                onClick={resetToIdle}
                className="rounded-full border border-white/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-rb-white"
              >
                Cancelar
              </button>
            </div>
            <div className="relative mx-auto w-full max-w-md flex-1 px-4 pb-8">
              <div
                id={QR_READER_ID}
                className="overflow-hidden rounded-2xl border border-white/15 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />
              <p className="mt-4 text-center text-sm text-rb-silver">
                Apuntá al código con el valor de tu Royal Boss.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === "invalid" && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-rb-black/95 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-rb-red"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <span className="font-[family-name:var(--font-bebas)] text-4xl text-rb-red">
                ✕
              </span>
            </motion.div>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.35em] text-rb-red">
              Incorrecto
            </p>
            <h2 className="mt-3 text-center font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-rb-white sm:text-4xl">
              Validación fallida
            </h2>
            <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-rb-silver">
              Este código no tiene el valor de una Royal Boss Original.
            </p>
            {readValue ? (
              <p className="mt-3 max-w-xs break-all text-center font-mono text-[9px] tracking-wide text-rb-silver/50">
                Leído: {readValue}
              </p>
            ) : null}
            <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  resetToIdle();
                  window.setTimeout(() => startNfcScan(), 120);
                }}
                className="min-h-12 w-full border border-rb-red px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white hover:bg-rb-red"
              >
                Escanear NFC
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToIdle();
                  window.setTimeout(() => startQrScan(), 120);
                }}
                className="min-h-12 w-full border border-white/40 px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white"
              >
                Escanear QR
              </button>
              <button
                type="button"
                onClick={resetToIdle}
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver/70"
              >
                Volver
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
