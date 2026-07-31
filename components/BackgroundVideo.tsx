"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ASSETS } from "@/lib/assets";
import {
  ensureSharedVideo,
  getSharedVideo,
  hideSharedVideo,
  playMuted,
  playNowWithAudio,
  resumeIfPaused,
  setSharedVideoIntensity,
  showSharedVideo,
  unlockAudioOnTap,
} from "@/lib/video";

export type BackgroundVideoHandle = {
  play: (withAudio?: boolean) => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
};

type Props = {
  mounted: boolean;
  visible: boolean;
  withAudio?: boolean;
};

const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible, withAudio = true }, ref) {
    const fallbackRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const unlockCleanup = useRef<(() => void) | null>(null);

    const resolveVideo = () => getSharedVideo() ?? fallbackRef.current;

    useImperativeHandle(ref, () => ({
      play(withAudioFlag = true) {
        const video = resolveVideo();
        if (!video) return;
        if (withAudioFlag) void playNowWithAudio(video);
        else void playMuted(video);
      },
      setIntensity(opacity: number) {
        const shared = getSharedVideo();
        if (shared && !useFallback) {
          setSharedVideoIntensity(opacity);
          return;
        }
        const el = wrapRef.current;
        if (!el) return;
        el.style.opacity = String(Math.max(opacity, 0.05));
        el.style.filter = "none";
      },
    }));

    // Montaje: elemento compartido + preload muted (sin spam de unmute)
    useEffect(() => {
      if (!mounted) return;

      const video = ensureSharedVideo(ASSETS.productVideo);
      if (!video) {
        setUseFallback(true);
        return;
      }

      const onError = () => setFailed(true);
      video.addEventListener("error", onError);
      hideSharedVideo();
      void playMuted(video);

      return () => {
        video.removeEventListener("error", onError);
      };
    }, [mounted]);

    // Visible: mostrar + intentar audio una vez; si falla, queda muted reproduciendo
    useEffect(() => {
      if (!mounted || !visible) return;

      if (getSharedVideo()) {
        showSharedVideo();
      }

      const run = async () => {
        const v = resolveVideo();
        if (!v) return;
        if (withAudio) await playNowWithAudio(v);
        else await playMuted(v);
      };

      void run();

      const retries = [150, 500].map((ms) =>
        window.setTimeout(() => {
          const v = resolveVideo();
          if (!v) return;
          if (v.paused) void playMuted(v);
          else if (withAudio && v.muted) void playNowWithAudio(v);
        }, ms),
      );

      unlockCleanup.current?.();
      unlockCleanup.current = withAudio
        ? unlockAudioOnTap(resolveVideo())
        : null;

      const onPause = () => {
        const v = resolveVideo();
        if (!v || !visible) return;
        window.setTimeout(() => resumeIfPaused(v), 60);
      };
      const v = resolveVideo();
      v?.addEventListener("pause", onPause);

      return () => {
        retries.forEach(clearTimeout);
        unlockCleanup.current?.();
        unlockCleanup.current = null;
        v?.removeEventListener("pause", onPause);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, mounted, withAudio, useFallback]);

    if (!mounted) return null;

    return (
      <div
        ref={wrapRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-rb-black"
        style={{
          // Shared video está en body; este wrap solo cubre fallback/poster
          opacity: visible && (useFallback || failed) ? 1 : 0,
          visibility: visible && (useFallback || failed) ? "visible" : "hidden",
        }}
      >
        {failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ASSETS.img1}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {useFallback && (
          <video
            ref={fallbackRef}
            className="absolute inset-0 h-full w-full object-cover md:inset-y-0 md:left-1/2 md:right-auto md:h-full md:w-auto md:max-w-[min(100vw,56.25vh)] md:-translate-x-1/2"
            poster={ASSETS.img1}
            src={ASSETS.productVideo}
            preload="auto"
            playsInline
            muted
            loop
            autoPlay
            controls={false}
            disablePictureInPicture
          />
        )}
      </div>
    );
  },
);

export default BackgroundVideo;
