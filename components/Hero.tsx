"use client";

import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/animations";

type Props = {
  active: boolean;
};

export default function Hero({ active }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!dateRef.current) return;
    const label = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateRef.current.textContent = `Certificado el ${label} — Royal Boss Original`;
  }, []);

  useGSAP(
    () => {
      if (!active || !titleRef.current) return;
      registerGsap();
      const split = new SplitType(titleRef.current, { types: "chars" });
      const chars = split.chars ?? [];
      const reduced = prefersReducedMotion();

      if (reduced) {
        gsap.set(chars, { opacity: 1, y: 0 });
        return () => split.revert();
      }

      gsap.fromTo(
        chars,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.035,
          duration: 0.55,
          ease: "power2.out",
          delay: 0.1,
        },
      );

      return () => split.revert();
    },
    { dependencies: [active], scope: rootRef },
  );

  if (!active) return null;

  return (
    <section
      ref={rootRef}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[max(5rem,env(safe-area-inset-bottom))] pt-16 sm:px-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-rb-red drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
        Verificado
      </p>
      <h1
        ref={titleRef}
        className="mt-3 max-w-[18rem] text-center font-[family-name:var(--font-bebas)] text-[clamp(2.35rem,11.5vw,3.75rem)] leading-[0.92] tracking-wide text-rb-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] xs:max-w-md sm:max-w-lg"
      >
        CERTIFICADO.
        <br />
        ORIGINAL.
        <br />
        TUYA.
      </h1>
      <p
        ref={dateRef}
        className="mt-5 max-w-[17rem] text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-rb-silver drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:max-w-sm sm:text-[10px] sm:tracking-[0.22em]"
      />
      <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.4em] text-rb-silver/80 animate-pulse">
        ↓ Seguí
      </p>
    </section>
  );
}
