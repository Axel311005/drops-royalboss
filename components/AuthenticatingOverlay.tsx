"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";
import { prefersReducedMotion } from "@/lib/animations";

type Props = {
  onComplete: () => void;
};

/** Carga: verificando → Es auténtica → pasa al video */
export default function AuthenticatingOverlay({ onComplete }: Props) {
  const [status, setStatus] = useState<"loading" | "authentic">("loading");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const loadMs = reduced ? 350 : 1600;
    const holdMs = reduced ? 450 : 1000;

    const t1 = window.setTimeout(() => setStatus("authentic"), loadMs);
    const t2 = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onComplete, 400);
    }, loadMs + holdMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-rb-black px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative flex h-40 w-40 items-center justify-center">
            {status === "loading" &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border border-rb-silver/35"
                  initial={{ scale: 0.55, opacity: 0.55 }}
                  animate={{ scale: 1.55, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeOut",
                  }}
                />
              ))}

            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(212,212,216,0.12)"
                strokeWidth="1.5"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={status === "authentic" ? "#c8102e" : "#d4d4d8"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{
                  strokeDashoffset: status === "authentic" ? 0 : 100,
                }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </svg>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.logoRoyal}
              alt=""
              className="relative h-20 w-20 object-contain"
            />
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.35em] text-rb-silver">
            {status === "loading" ? "Verificando…" : "✔ Es auténtica"}
          </p>
          {status === "authentic" && (
            <motion.p
              className="mt-3 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-rb-red sm:text-4xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Royal Boss Original
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
