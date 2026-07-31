"use client";

import { useCallback, useRef, useState } from "react";
import AuthReveal from "@/components/AuthReveal";
import BackgroundVideo, {
  type BackgroundVideoHandle,
} from "@/components/BackgroundVideo";
import LogoMaskIntro from "@/components/LogoMaskIntro";
import Hero from "@/components/Hero";
import StoryOverlays from "@/components/StoryOverlays";
import DetailZoom from "@/components/DetailZoom";
import ClubFooter from "@/components/ClubFooter";

type Phase = "auth" | "intro" | "experience";

export default function RoyalCrownExperience() {
  const [phase, setPhase] = useState<Phase>("auth");
  const videoRef = useRef<BackgroundVideoHandle>(null);
  const introDone = useRef(false);

  const onAuthComplete = useCallback(() => {
    setPhase("intro");
    // Montamos el video ya en intro para precargar + desbloquear con el scroll
    requestAnimationFrame(() => videoRef.current?.play());
  }, []);

  const onIntroComplete = useCallback(() => {
    if (introDone.current) return;
    introDone.current = true;
    window.scrollTo(0, 0);
    setPhase("experience");
    requestAnimationFrame(() => {
      videoRef.current?.play();
      videoRef.current?.setIntensity(1, 0);
    });
    // Segundo intento tras el paint (Safari)
    window.setTimeout(() => videoRef.current?.play(), 250);
  }, []);

  const videoMounted = phase === "intro" || phase === "experience";
  const videoVisible = phase === "experience";
  const showContent = phase === "experience";

  return (
    <div className="grain relative min-h-svh bg-rb-black text-rb-white">
      {phase === "auth" && <AuthReveal onComplete={onAuthComplete} />}

      {/* Montado desde intro: precarga + unlock con gesto de scroll (Safari) */}
      <BackgroundVideo
        ref={videoRef}
        mounted={videoMounted}
        visible={videoVisible}
      />

      {phase === "intro" && (
        <LogoMaskIntro active onComplete={onIntroComplete} />
      )}

      {showContent && (
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
