"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";
import { prefersReducedMotion } from "@/lib/animations";

type Props = {
  onComplete: () => void;
};

export default function AuthReveal({ onComplete }: Props) {
  const [visible, setVisible] = useState(true);
  const [status, setStatus] = useState<"scanning" | "authentic">("scanning");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );

    const reduced = prefersReducedMotion();
    const scanMs = reduced ? 400 : 1800;
    const holdMs = reduced ? 500 : 1100;

    const t1 = window.setTimeout(() => setStatus("authentic"), scanMs);
    const t2 = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onComplete, 450);
    }, scanMs + holdMs);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="auth-reveal"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-rb-black px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="relative flex h-40 w-40 items-center justify-center">
            {status === "scanning" &&
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
                  strokeDashoffset: status === "authentic" ? 0 : 90,
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>

            <motion.div
              className="relative h-24 w-24"
              initial={{ opacity: 0.35, scale: 0.92 }}
              animate={{
                opacity: 1,
                scale: status === "authentic" ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ASSETS.logoRoyal}
                alt="Royal Boss"
                className="h-full w-full object-contain"
              />
            </motion.div>
          </div>

          <div className="mt-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-rb-silver">
              {status === "scanning"
                ? "Verificando certificado…"
                : "✔ Auténtico"}
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
            {dateLabel && (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-rb-silver/70">
                {dateLabel}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
