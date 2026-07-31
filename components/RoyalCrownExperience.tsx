"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BackgroundVideo, {
  type BackgroundVideoHandle,
} from "@/components/BackgroundVideo";
import AuthenticatingOverlay from "@/components/AuthenticatingOverlay";
import Hero from "@/components/Hero";
import StoryOverlays from "@/components/StoryOverlays";
import DetailZoom from "@/components/DetailZoom";
import ClubFooter from "@/components/ClubFooter";

type Phase = "authenticating" | "playing";

/**
 * Valor del chip: /RoyalCrown
 * Android + iPhone: al abrir esta URL → “Es auténtica” → video automático.
 */
export default function RoyalCrownExperience() {
  const [phase, setPhase] = useState<Phase>("authenticating");
  const videoRef = useRef<BackgroundVideoHandle>(null);

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

  // Desbloquear audio en el primer toque (sobre todo iPhone)
  useEffect(() => {
    const unlock = () => videoRef.current?.play(true);
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const evs = ["touchstart", "pointerdown", "click"] as const;
    evs.forEach((e) => window.addEventListener(e, unlock, opts));
    return () =>
      evs.forEach((e) => window.removeEventListener(e, unlock, opts));
  }, []);

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
