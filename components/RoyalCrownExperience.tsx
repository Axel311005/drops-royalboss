"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundVideo, {
  type BackgroundVideoHandle,
} from "@/components/BackgroundVideo";
import AuthenticatingOverlay from "@/components/AuthenticatingOverlay";
import Hero from "@/components/Hero";
import StoryOverlays from "@/components/StoryOverlays";
import DetailZoom from "@/components/DetailZoom";
import ClubFooter from "@/components/ClubFooter";
import { hasNfcAuth, markNfcAuthenticated } from "@/lib/nfc";

type Phase = "checking" | "authenticating" | "playing";

/**
 * /RoyalCrown solo si el NFC fue leído:
 * - Web NFC en / validó la URL y guardó sesión, o
 * - El sistema abrió esta URL desde el chip (tap nativo iOS/Android).
 * Si entrás a mano sin eso → volvés a /.
 */
export default function RoyalCrownExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const videoRef = useRef<BackgroundVideoHandle>(null);
  const allowedRef = useRef(false);

  useEffect(() => {
    if (allowedRef.current) return;

    // 1) Vino del escaneo Web NFC en /
    if (hasNfcAuth()) {
      allowedRef.current = true;
      setPhase("authenticating");
      return;
    }

    // 2) Tap nativo del SO: el chip tiene https://royal-boss.com/RoyalCrown
    //    y el sistema abre esta página (no hay referrer del propio sitio).
    const ref = typeof document !== "undefined" ? document.referrer : "";
    const fromOwnSite =
      Boolean(ref) &&
      (ref.includes("royal-boss.com") ||
        ref.includes("localhost") ||
        ref.includes("127.0.0.1"));

    if (!fromOwnSite) {
      // Entrada externa / NFC del sistema → válido
      markNfcAuthenticated(true);
      allowedRef.current = true;
      setPhase("authenticating");
      return;
    }

    // Entró desde el mismo sitio sin escanear → bloqueado
    router.replace("/");
  }, [router]);

  const onAuthComplete = useCallback(() => {
    setPhase("playing");
    requestAnimationFrame(() => {
      videoRef.current?.play(true);
      videoRef.current?.setIntensity(1, 0);
    });
    window.setTimeout(() => videoRef.current?.play(true), 200);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    videoRef.current?.play(true);
  }, [phase]);

  useEffect(() => {
    const unlock = () => videoRef.current?.play(true);
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const evs = ["touchstart", "pointerdown", "click"] as const;
    evs.forEach((e) => window.addEventListener(e, unlock, opts));
    return () =>
      evs.forEach((e) => window.removeEventListener(e, unlock, opts));
  }, []);

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
        mounted={playing}
        visible={playing}
        withAudio
      />

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
