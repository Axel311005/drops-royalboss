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

/** Contenido de certificado — aparece al scrollear (debajo del video). */
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
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            once: true,
          },
        },
      );

      return () => split.revert();
    },
    { dependencies: [active], scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 py-20 sm:px-6"
    >

    </section>
  );
}
