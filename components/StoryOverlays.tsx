"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/animations";

const BLOCKS = [
  {
    eyebrow: "La corona",
    title: "RB no es un logo. Es una marca de dueño.",
    body: "La corona y las iniciales RB identifican a quien eligió no aparentar — a quien carga el original.",
  },
  {
    eyebrow: "Única",
    title: "No hay dos iguales.",
    body: "Tu Royal Boss es verificable y personal. Este certificado existe porque escaneaste tu gorra.",
  },
] as const;

type Props = {
  active: boolean;
};

export default function StoryOverlays({ active }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!active || !rootRef.current) return;
      registerGsap();
      const reduced = prefersReducedMotion();
      const panels =
        rootRef.current.querySelectorAll<HTMLElement>("[data-story]");

      panels.forEach((panel) => {
        if (reduced) {
          gsap.set(panel, { opacity: 1, y: 0 });
          return;
        }
        gsap.fromTo(
          panel,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 80%",
              end: "top 40%",
              scrub: 1,
            },
          },
        );
        gsap.to(panel, {
          opacity: 0,
          y: -20,
          ease: "power2.in",
          scrollTrigger: {
            trigger: panel,
            start: "bottom 40%",
            end: "bottom 8%",
            scrub: 1,
          },
        });
      });
    },
    { dependencies: [active], scope: rootRef },
  );

  if (!active) return null;

  return (
    <div ref={rootRef} className="relative z-10 px-6">
      {BLOCKS.map((block) => (
        <section
          key={block.eyebrow}
          className="flex min-h-[85svh] items-center justify-center py-12"
        >
          <div data-story className="max-w-md text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-rb-red drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {block.eyebrow}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-bebas)] text-3xl leading-tight tracking-wide text-rb-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] sm:text-4xl">
              {block.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-rb-silver drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              {block.body}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
