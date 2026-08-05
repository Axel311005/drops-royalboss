"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { ASSETS } from "@/lib/assets";
import {
  gsap,
  prefersReducedMotion,
  registerGsap,
} from "@/lib/animations";
import type { BackgroundVideoHandle } from "./BackgroundVideo";

const DETAILS = [
  {
    src: ASSETS.img1,
    label: "Detalle #1",
    title: "Diamante en el logo RB",
  },
  {
    src: ASSETS.img2,
    label: "Detalle #2",
    title: "Coronas en relieve",
  },
  {
    src: ASSETS.img3,
    label: "Detalle #3",
    title: "Broche y tag metálico",
  },
  {
    src: ASSETS.img4,
    label: "Detalle #4",
    title: "ROYAL bordado",
  },
  {
    src: ASSETS.img5,
    label: "Detalle #5",
    title: "Interior — PROV 21:31",
  },
] as const;

type Props = {
  active: boolean;
  videoRef: React.RefObject<BackgroundVideoHandle | null>;
};

export default function DetailZoom({ active, videoRef }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useGSAP(
    () => {
      if (!active || !sectionRef.current) return;
      registerGsap();
      const reduced = prefersReducedMotion();
      const section = sectionRef.current;

      gsap.fromTo(
        section,
        { opacity: 1 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "bottom 25%",
            // Solo opacidad — blur rompe el video en Safari iOS
            onEnter: () =>
              videoRef.current?.setIntensity(reduced ? 0.22 : 0.18, 0),
            onEnterBack: () =>
              videoRef.current?.setIntensity(reduced ? 0.22 : 0.18, 0),
            onLeave: () => videoRef.current?.setIntensity(1, 0),
            onLeaveBack: () => videoRef.current?.setIntensity(1, 0),
          },
        },
      );
    },
    { dependencies: [active, videoRef], scope: sectionRef },
  );

  // Auto-scroll suave continuo del carrusel (pausa al tocar)
  useEffect(() => {
    if (!active) return;
    const track = trackRef.current;
    if (!track) return;
    if (prefersReducedMotion()) return;

    let raf = 0;
    const speed = 0.45; // px por frame ~27px/s a 60fps

    const tick = () => {
      if (!pausedRef.current && track) {
        const max = track.scrollWidth - track.clientWidth;
        if (max > 0) {
          if (track.scrollLeft >= max - 1) {
            track.scrollLeft = 0;
          } else {
            track.scrollLeft += speed;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const pause = () => {
      pausedRef.current = true;
    };
    const resume = () => {
      window.setTimeout(() => {
        pausedRef.current = false;
      }, 1800);
    };

    track.addEventListener("pointerdown", pause);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("pointerup", resume);
    track.addEventListener("touchend", resume);
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("pointerdown", pause);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("pointerup", resume);
      track.removeEventListener("touchend", resume);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, [active]);

  return (
    <section ref={sectionRef} className="relative z-10 py-12 sm:py-16">
      <div className="mb-8 px-5 text-center sm:mb-10 sm:px-6">
        <h2 className="mt-2 font-[family-name:var(--font-bebas)] text-[clamp(1.75rem,8vw,2.5rem)] tracking-wide text-rb-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          Los detalles del original
        </h2>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto px-[max(1.25rem,calc((100vw-min(82vw,22rem))/2))] pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {DETAILS.map((item) => (
          <figure
            key={item.label}
            className="w-[min(82vw,22rem)] shrink-0"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="(max-width: 430px) 82vw, 352px"
                className="object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-5 pt-20">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-rb-red">
                  {item.label}
                </p>
                <figcaption className="mt-1 font-[family-name:var(--font-bebas)] text-lg tracking-wide text-rb-white sm:text-xl">
                  {item.title}
                </figcaption>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
