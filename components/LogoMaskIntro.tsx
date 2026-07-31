"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ASSETS } from "@/lib/assets";
import {
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/animations";

type Props = {
  active: boolean;
  onComplete: () => void;
};

/**
 * Réplica del approach landing-gta-vi:
 * mask-image = logo-royal.webp + scale del fondo + scrub GSAP.
 * Después del scroll → handoff al video de fondo.
 */
export default function LogoMaskIntro({ active, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
  }, [active]);

  useGSAP(
    () => {
      if (!active) return;
      registerGsap();

      const reduced = prefersReducedMotion();

      const finish = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        onComplete();
      };

      if (reduced) {
        gsap.set("#logo-mask", {
          maskSize: "clamp(22vh, 28%, 36vh)",
          webkitMaskSize: "clamp(22vh, 28%, 36vh)",
        });
        gsap.set("#hero-key", { scale: 1, opacity: 0 });
        const t = window.setTimeout(finish, 500);
        return () => window.clearTimeout(t);
      }

      const tl = gsap.timeline({
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onLeave: finish,
          onUpdate: (self) => {
            if (self.progress > 0.94) finish();
          },
        },
      });

      // Igual que GTA: zoom out del fondo + mask shrink al logo + fade
      tl.to("#hero-key", { duration: 1, scale: 1 }, 0)
        .to("#intro-hint", { opacity: 0, duration: 0.3 }, 0)
        .to(
          "#logo-mask",
          {
            maskSize: "clamp(18vh, 26%, 34vh)",
            webkitMaskSize: "clamp(18vh, 26%, 34vh)",
          },
          0.15,
        )
        .to("#hero-key", { opacity: 0, duration: 0.25 }, 0.55)
        .to("#logo-mask", { opacity: 0, duration: 0.2 }, 0.75);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { dependencies: [active, onComplete], scope: rootRef },
  );

  if (!active) return null;

  return (
    <div ref={rootRef} className="relative z-30 h-[300vh] w-full">
      <div id="logo-mask" className="fixed inset-0 top-0 z-30 h-screen w-full">
        <div
          id="hero-key"
          className="fixed block h-screen w-full scale-125 overflow-hidden"
        >
          {/* Fondo que se “acerca” (scale) — misma técnica GTA */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="hero-key-background"
            src={ASSETS.img1}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <p
        id="intro-hint"
        className="pointer-events-none fixed bottom-10 left-1/2 z-40 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.4em] text-rb-silver"
      >
        Deslizá
      </p>
    </div>
  );
}
