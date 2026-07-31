"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";
import {
  decodeNdefRecords,
  isValidRoyalCrownUrl,
  markNfcAuthenticated,
  supportsWebNfc,
} from "@/lib/nfc";

type Status = "idle" | "scanning" | "invalid";

const SCAN_LABELS = [
  "Escaneando…",
  "Esperando…",
  "Acercá el chip…",
  "Leyendo…",
] as const;

export default function ScanAndPlay() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [labelIdx, setLabelIdx] = useState(0);
  const [readValue, setReadValue] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const enterRoyalCrown = useCallback(() => {
    markNfcAuthenticated(true);
    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
    router.push("/RoyalCrown");
  }, [router]);

  const resetToIdle = useCallback(() => {
    setStatus("idle");
    setReadValue("");
    setLabelIdx(0);
  }, []);

  // Rotar textos mientras escanea
  useEffect(() => {
    if (status !== "scanning") return;
    const id = window.setInterval(() => {
      setLabelIdx((i) => (i + 1) % SCAN_LABELS.length);
    }, 1400);
    return () => clearInterval(id);
  }, [status]);

  const startScan = useCallback(async () => {
    setReadValue("");
    setLabelIdx(0);
    setStatus("scanning");

    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }

    if (!supportsWebNfc()) {
      // Sin Web NFC: igual mostramos la animación de espera
      return;
    }

    try {
      const reader = new window.NDEFReader();
      const ac = new AbortController();
      abortRef.current = ac;

      reader.addEventListener(
        "reading",
        (event: {
          message: {
            records: {
              recordType: string;
              data?: DataView;
              encoding?: string;
            }[];
          };
        }) => {
          const values = decodeNdefRecords(event.message);
          const ok = values.some(
            (v) =>
              isValidRoyalCrownUrl(v) ||
              /royal-boss\.com\/RoyalCrown/i.test(v),
          );

          if (ok) {
            enterRoyalCrown();
            return;
          }

          try {
            ac.abort();
          } catch {
            /* ignore */
          }
          setReadValue(values[0] ?? "(sin URL legible)");
          setStatus("invalid");
        },
      );

      await reader.scan({ signal: ac.signal });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      // Seguimos en animación de escaneo; el usuario puede reintentar
    }
  }, [enterRoyalCrown]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <main className="grain relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-rb-black px-6 text-rb-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.logoRoyal}
        alt="Royal Boss"
        className="mb-10 h-20 w-20 object-contain"
      />

      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-rb-red">
        Autenticación NFC
      </p>
      <h1 className="mt-3 max-w-xs text-center font-[family-name:var(--font-bebas)] text-4xl tracking-wide sm:text-5xl">
        Escaneá tu Royal Boss
      </h1>
      <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-rb-silver">
        Tocá escanear y acercá el chip al teléfono.
      </p>

      {/* Radar / ondas */}
      <div className="relative mt-12 flex h-48 w-48 items-center justify-center">
        {status === "scanning" && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-rb-red/35"
                initial={{ scale: 0.35, opacity: 0.7 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: "easeOut",
                }}
              />
            ))}
            <motion.div
              className="absolute inset-[18%] rounded-full border border-dashed border-rb-silver/25"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[8%] rounded-full border border-rb-red/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}

        <motion.div
          className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full border ${
            status === "scanning"
              ? "border-rb-red bg-rb-red/10"
              : status === "invalid"
                ? "border-rb-red bg-rb-red/15"
                : "border-rb-red/60"
          }`}
          animate={
            status === "scanning"
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={
            status === "scanning"
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.25em]">
            {status === "invalid" ? "✕" : "NFC"}
          </span>
        </motion.div>
      </div>

      {/* Texto animado Escaneando / Esperando */}
      <div className="mt-8 flex h-8 items-center justify-center">
        <AnimatePresence mode="wait">
          {status === "scanning" && (
            <motion.p
              key={SCAN_LABELS[labelIdx]}
              className="font-mono text-[11px] uppercase tracking-[0.35em] text-rb-silver"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {SCAN_LABELS[labelIdx]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de movimiento */}
      {status === "scanning" && (
        <div className="relative mt-6 h-[2px] w-full max-w-[200px] overflow-hidden rounded bg-rb-silver/15">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-rb-red"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {status !== "scanning" && (
        <button
          type="button"
          onClick={status === "invalid" ? resetToIdle : startScan}
          className="mt-8 min-h-12 w-full max-w-xs border border-rb-red px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white transition-colors hover:bg-rb-red"
        >
          {status === "invalid" ? "Volver" : "Escanear"}
        </button>
      )}

      {status === "scanning" && (
        <button
          type="button"
          onClick={resetToIdle}
          className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver/70"
        >
          Cancelar
        </button>
      )}

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
              Validación fallida
            </p>
            <h2 className="mt-3 text-center font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-rb-white sm:text-4xl">
              No es auténtica
            </h2>
            <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-rb-silver">
              El chip leído no corresponde a una Royal Boss Original.
            </p>
            {readValue ? (
              <p className="mt-3 max-w-xs break-all text-center font-mono text-[9px] tracking-wide text-rb-silver/50">
                Valor leído: {readValue}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                resetToIdle();
                window.setTimeout(() => startScan(), 100);
              }}
              className="mt-10 min-h-12 w-full max-w-xs border border-rb-red px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white hover:bg-rb-red"
            >
              Escanear de nuevo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
