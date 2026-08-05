"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/animations";



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

  return (
    <div ref={rootRef} className="relative z-10 px-6">

    </div>
  );
}
