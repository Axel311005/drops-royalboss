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
    videoRef.current?.play();
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
  }, []);

  const showVideo = phase !== "auth";
  const showContent = phase === "experience";

  return (
    <div className="grain relative min-h-screen bg-rb-black text-rb-white">
      {phase === "auth" && <AuthReveal onComplete={onAuthComplete} />}

      <BackgroundVideo ref={videoRef} active={showVideo && showContent} />

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
