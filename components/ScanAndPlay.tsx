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

type Status = "idle" | "scanning" | "invalid" | "error";

/**
 * Link que se manda: /
 * Si el NFC no es https://royal-boss.com/RoyalCrown → validación fallida.
 * Si coincide → /RoyalCrown
 */
export default function ScanAndPlay() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [hint, setHint] = useState("");
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
    setHint("");
    setReadValue("");
  }, []);

  const startScan = useCallback(async () => {
    setHint("");
    setReadValue("");
    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }

    if (!supportsWebNfc()) {
      setStatus("error");
      setHint(
        "Este navegador no puede abrir el lector NFC de la web. Acercá el chip al teléfono para que el sistema lo lea.",
      );
      return;
    }

    setStatus("scanning");

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

          // Otro valor → validación fallida (no entra a RoyalCrown)
          try {
            ac.abort();
          } catch {
            /* ignore */
          }
          setReadValue(values[0] ?? "(sin URL legible)");
          setStatus("invalid");
          setHint("Validación fallida");
        },
      );

      reader.addEventListener("readingerror", () => {
        setStatus("error");
        setHint("Error al leer. Acercá de nuevo la etiqueta.");
      });

      await reader.scan({ signal: ac.signal });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      setStatus("error");
      if (name === "NotAllowedError") {
        setHint("Tenés que permitir NFC para escanear.");
      } else {
        setHint("No se pudo abrir el lector NFC. Revisá que NFC esté activado.");
      }
    }
  }, [enterRoyalCrown]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <main className="grain relative flex min-h-svh flex-col items-center justify-center bg-rb-black px-6 text-rb-white">
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

      <div className="relative mt-12 flex h-40 w-40 items-center justify-center">
        {status === "scanning" &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-rb-red/40"
              initial={{ scale: 0.55, opacity: 0.5 }}
              animate={{ scale: 1.55, opacity: 0 }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        <div
          className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full border ${
            status === "invalid" ? "border-rb-red bg-rb-red/15" : "border-rb-red/60"
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            {status === "invalid" ? "✕" : "NFC"}
          </span>
        </div>
      </div>

      {status === "error" && hint ? (
        <p className="mt-8 max-w-sm text-center text-sm text-rb-red">{hint}</p>
      ) : (
        <p className="mt-8 min-h-[1.25rem]" />
      )}

      <button
        type="button"
        onClick={status === "invalid" ? resetToIdle : startScan}
        className="mt-4 min-h-12 w-full max-w-xs border border-rb-red px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white transition-colors hover:bg-rb-red"
      >
        {status === "scanning"
          ? "Escaneando…"
          : status === "invalid"
            ? "Volver a intentar"
            : "Escanear"}
      </button>

      {/* Overlay de validación fallida */}
      <AnimatePresence>
        {status === "invalid" && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-rb-black/95 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-rb-red">
              <span className="font-[family-name:var(--font-bebas)] text-4xl text-rb-red">
                ✕
              </span>
            </div>
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
