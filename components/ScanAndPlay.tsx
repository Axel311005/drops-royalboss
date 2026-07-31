"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";
import {
  decodeNdefRecords,
  isValidRoyalCrownUrl,
  supportsWebNfc,
} from "@/lib/nfc";
import BackgroundVideo, {
  type BackgroundVideoHandle,
} from "@/components/BackgroundVideo";
import AuthenticatingOverlay from "@/components/AuthenticatingOverlay";
import Hero from "@/components/Hero";
import StoryOverlays from "@/components/StoryOverlays";
import DetailZoom from "@/components/DetailZoom";
import ClubFooter from "@/components/ClubFooter";

type ScanStatus =
  | "idle"
  | "waiting"
  | "invalid"
  | "unsupported"
  | "error";

type Phase = "scan" | "authenticating" | "playing";

/**
 * Link que se manda: /
 * Android (Chrome): Web NFC lee el chip → autenticación → video acá mismo.
 * iPhone: acercar el chip abre /RoyalCrown (valor del tag) con el mismo flujo.
 */
export default function ScanAndPlay() {
  const [phase, setPhase] = useState<Phase>("scan");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [hint, setHint] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const videoRef = useRef<BackgroundVideoHandle>(null);
  const unlockedRef = useRef(false);
  const beginAuthenticating = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    abortRef.current?.abort();
    setPhase("authenticating");
  }, []);

  const onAuthComplete = useCallback(() => {
    setPhase("playing");
    requestAnimationFrame(() => {
      videoRef.current?.play(true);
      videoRef.current?.setIntensity(1, 0);
    });
    window.setTimeout(() => videoRef.current?.play(true), 200);
  }, []);

  const handleNfcPayload = useCallback(
    (values: string[]) => {
      const match =
        values.find((v) => isValidRoyalCrownUrl(v)) ||
        values.find((v) => /royal-boss\.com\/RoyalCrown/i.test(v));
      if (match) {
        beginAuthenticating();
        return;
      }
      setStatus("invalid");
      setHint("Chip no reconocido. Debe ser una Royal Boss Original.");
    },
    [beginAuthenticating],
  );

  const startScan = useCallback(async () => {
    abortRef.current?.abort();

    if (!supportsWebNfc()) {
      setStatus("unsupported");
      setHint("Acercá el teléfono al chip NFC de la gorra.");
      return;
    }

    setStatus("waiting");
    setHint("Acercá el teléfono al chip NFC…");

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
          handleNfcPayload(decodeNdefRecords(event.message));
        },
      );

      reader.addEventListener("readingerror", () => {
        setStatus("error");
        setHint("No se pudo leer el chip. Intentá de nuevo.");
      });

      await reader.scan({ signal: ac.signal });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") return;
      setStatus("error");
      setHint(
        name === "NotAllowedError"
          ? "Permiso NFC denegado. Activá NFC e intentá de nuevo."
          : "No se pudo iniciar el escaneo NFC.",
      );
    }
  }, [handleNfcPayload]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (phase !== "playing") return;
    videoRef.current?.play(true);
  }, [phase]);

  const playing = phase === "playing";
  const scanning = phase === "scan";

  return (
    <div className="grain relative min-h-svh bg-rb-black text-rb-white">
      <BackgroundVideo
        ref={videoRef}
        mounted={playing}
        visible={playing}
        withAudio
      />

      {phase === "authenticating" && (
        <AuthenticatingOverlay onComplete={onAuthComplete} />
      )}

      <AnimatePresence mode="wait">
        {scanning && (
          <motion.main
            key="scan"
            className="relative z-20 flex min-h-svh flex-col items-center justify-center px-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
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
              Acercá el teléfono al chip NFC de la gorra.
            </p>

            <div className="relative mt-12 flex h-44 w-44 items-center justify-center">
              {(status === "waiting" || status === "idle") &&
                [0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full border border-rb-silver/30"
                    initial={{ scale: 0.55, opacity: 0.5 }}
                    animate={
                      status === "waiting"
                        ? { scale: 1.55, opacity: 0 }
                        : { scale: 1, opacity: 0.25 }
                    }
                    transition={
                      status === "waiting"
                        ? {
                            duration: 1.6,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut",
                          }
                        : { duration: 0.4 }
                    }
                  />
                ))}

              <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-rb-red/60">
                {status === "waiting" ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-rb-silver">
                    Esperando
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rb-white">
                    NFC
                  </span>
                )}
              </div>
            </div>

            <p className="mt-8 min-h-[2.5rem] max-w-sm text-center font-mono text-[10px] uppercase tracking-[0.22em] text-rb-silver">
              {status === "waiting"
                ? "Esperando escaneo…"
                : hint || "Tocá el botón e acercá el chip"}
            </p>

            <button
              type="button"
              onClick={startScan}
              className="mt-6 min-h-12 w-full max-w-xs border border-rb-red px-6 py-3 font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white transition-colors hover:bg-rb-red"
            >
              {status === "waiting" ? "Escaneando…" : "Escanear chip NFC"}
            </button>
          </motion.main>
        )}
      </AnimatePresence>

      {playing && (
        <>
          <Hero active />
          <StoryOverlays active />
          <DetailZoom active videoRef={videoRef} />
          <ClubFooter active />
        </>
      )}
    </div>
  );
}
