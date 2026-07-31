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
 * Al entrar a /RoyalCrown: autenticación → video + audio al instante (sin scroll).
 */
export default function RoyalCrownExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const videoRef = useRef<BackgroundVideoHandle>(null);
  const allowedRef = useRef(false);

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
    videoRef.current?.play(true);
    // Reintentos inmediatos de audio (sin scroll)
    [0, 80, 200, 400, 800].forEach((ms) => {
      window.setTimeout(() => videoRef.current?.play(true), ms);
    });
  }, []);

  const onAuthComplete = useCallback(() => {
    setPhase("playing");
    requestAnimationFrame(startPlayback);
  }, [startPlayback]);

  useEffect(() => {
    if (phase !== "playing") return;
    startPlayback();
  }, [phase, startPlayback]);

  if (phase === "checking") {
    return <div className="min-h-svh bg-rb-black" />;
  }

  const playing = phase === "playing";
  // Montar durante autenticación para precargar; visible al terminar
  const videoMounted = phase === "authenticating" || phase === "playing";

  return (
    <div className="grain relative min-h-svh bg-rb-black text-rb-white">
      {phase === "authenticating" && (
        <AuthenticatingOverlay onComplete={onAuthComplete} />
      )}

      <BackgroundVideo
        ref={videoRef}
        mounted={videoMounted}
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
