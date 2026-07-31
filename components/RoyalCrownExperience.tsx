"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundVideo, {
  type BackgroundVideoHandle,
} from "@/components/BackgroundVideo";
import AuthenticatingOverlay from "@/components/AuthenticatingOverlay";
import AuthenticBadge from "@/components/AuthenticBadge";
import Hero from "@/components/Hero";
import StoryOverlays from "@/components/StoryOverlays";
import DetailZoom from "@/components/DetailZoom";
import ClubFooter from "@/components/ClubFooter";
import { hasNfcAuth, markNfcAuthenticated } from "@/lib/nfc";

type Phase = "checking" | "authenticating" | "playing";

function StoryCycle({
  active,
  videoRef,
}: {
  active: boolean;
  videoRef: React.RefObject<BackgroundVideoHandle | null>;
}) {
  return (
    <>
      <div className="pointer-events-none relative z-10 h-[100svh] w-full" />
      <Hero active={active} />
      <StoryOverlays active={active} />
      <DetailZoom active={active} videoRef={videoRef} />
      <ClubFooter active={active} />
    </>
  );
}

/**
 * 1) Verificando / Es auténtica
 * 2) Video + badge Authentic abajo (siempre)
 * 3) Scroll infinito sin salto visual (contenido duplicado)
 */
export default function RoyalCrownExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const videoRef = useRef<BackgroundVideoHandle>(null);
  const allowedRef = useRef(false);
  const cycleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allowedRef.current) return;

    if (hasNfcAuth()) {
      allowedRef.current = true;
      setPhase("authenticating");
      return;
    }

    const ref = typeof document !== "undefined" ? document.referrer : "";
    const fromOwnSite =
      Boolean(ref) &&
      (ref.includes("royal-boss.com") ||
        ref.includes("localhost") ||
        ref.includes("127.0.0.1"));

    if (!fromOwnSite) {
      markNfcAuthenticated(true);
      allowedRef.current = true;
      setPhase("authenticating");
      return;
    }

    router.replace("/");
  }, [router]);

  const startPlayback = useCallback(() => {
    videoRef.current?.setIntensity(1, 0);
    videoRef.current?.play(false);
  }, []);

  const onAuthComplete = useCallback(() => {
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    startPlayback();
    const timers = [80, 250, 700].map((ms) =>
      window.setTimeout(startPlayback, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, startPlayback]);

  useEffect(() => {
    if (phase !== "playing") return;

    const resumePlayback = (e: Event) => {
      const target = e.target;
      if (target instanceof Element && target.closest("[data-sound-btn]"))
        return;
      videoRef.current?.play();
    };

    // Scroll infinito sin salto: 2 copias iguales; al pasar la 1ª, restamos su altura
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const cycle = cycleRef.current;
        if (!cycle) return;
        const h = cycle.offsetHeight;
        if (h <= 0) return;

        if (window.scrollY >= h) {
          window.scrollTo({ top: window.scrollY - h, behavior: "auto" });
        }
      });
    };

    const touchOpts: AddEventListenerOptions = { passive: true };

    document.addEventListener("touchstart", resumePlayback, touchOpts);
    window.addEventListener("scroll", resumePlayback, touchOpts);
    window.addEventListener("scroll", onScroll, touchOpts);
    window.addEventListener("wheel", resumePlayback, touchOpts);

    return () => {
      document.removeEventListener("touchstart", resumePlayback);
      window.removeEventListener("scroll", resumePlayback);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", resumePlayback);
    };
  }, [phase]);

  if (phase === "checking") {
    return <div className="min-h-svh bg-rb-black" />;
  }

  const playing = phase === "playing";

  return (
    <div className="grain relative min-h-svh bg-rb-black text-rb-white">
      {phase === "authenticating" && (
        <AuthenticatingOverlay onComplete={onAuthComplete} />
      )}

      <BackgroundVideo
        ref={videoRef}
        mounted={phase === "authenticating" || playing}
        visible={playing}
      />

      {playing && (
        <>
          <AuthenticBadge />
          <div ref={cycleRef}>
            <StoryCycle active videoRef={videoRef} />
          </div>
          {/* Copia idéntica — permite loop sin que se sienta el salto */}
          <div aria-hidden>
            <StoryCycle active={false} videoRef={videoRef} />
          </div>
        </>
      )}
    </div>
  );
}
