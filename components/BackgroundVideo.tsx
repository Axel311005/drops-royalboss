"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { ASSETS } from "@/lib/assets";
import {
  activateFromUserGesture,
  muteVideo,
  playMuted,
  playMutedSync,
  resumeMutedIfPaused,
} from "@/lib/video";

export type BackgroundVideoHandle = {
  play: (withAudio?: boolean) => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
  unmute: () => void;
  /** Llamar solo dentro de touchstart/pointerdown/click — Safari iOS exige play() síncrono. */
  activateFromUserGesture: () => void;
};

type Props = {
  mounted: boolean;
  visible: boolean;
};

function IconMuted({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m23 9-6 6M17 9l6 6" />
    </svg>
  );
}

function IconUnmuted({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/**
 * autoPlay + muted + playsInline → video en todos los browsers.
 * Safari iOS: play() en gesto debe ser síncrono; rechazos de play() siempre con .catch().
 */
const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [muted, setMuted] = useState(true);

    const tryPlayMuted = useCallback(() => {
      const video = videoRef.current;
      if (!video || failed) return;
      void playMuted(video);
    }, [failed]);

    const activateAudio = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      activateFromUserGesture(video);
      setMuted(false);
    }, []);

    const muteAudio = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      muteVideo(video);
      setMuted(true);
    }, []);

    const onSoundPointerDown = useCallback(
      (e: PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (muted) activateAudio();
      },
      [muted, activateAudio],
    );

    const onSoundClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!muted) muteAudio();
      },
      [muted, muteAudio],
    );

    useImperativeHandle(
      ref,
      () => ({
        play() {
          tryPlayMuted();
        },
        unmute() {
          activateAudio();
        },
        activateFromUserGesture() {
          activateAudio();
        },
        setIntensity(opacity: number) {
          const el = wrapRef.current;
          if (!el) return;
          el.style.opacity = String(Math.max(opacity, 0.05));
          el.style.filter = "none";
        },
      }),
      [activateAudio, tryPlayMuted],
    );

    useEffect(() => {
      if (!mounted) return;
      const video = videoRef.current;
      if (!video) return;

      const onError = () => setFailed(true);
      const onReady = () => tryPlayMuted();
      const onVisibility = () => {
        if (document.visibilityState === "visible") resumeMutedIfPaused(video);
      };

      video.addEventListener("error", onError);
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("canplaythrough", onReady);
      document.addEventListener("visibilitychange", onVisibility);

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      setMuted(true);

      tryPlayMuted();
      const timers = [80, 250, 700, 1500].map((ms) =>
        window.setTimeout(tryPlayMuted, ms),
      );

      return () => {
        timers.forEach(clearTimeout);
        video.removeEventListener("error", onError);
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("canplaythrough", onReady);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, [mounted, tryPlayMuted]);

    if (!mounted) return null;

    return (
      <>
        <div
          ref={wrapRef}
          className="fixed inset-0 z-0 bg-rb-black"
          style={{
            opacity: 1,
            pointerEvents: "none",
          }}
          aria-hidden={!visible}
        >
          {failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ASSETS.img1}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) playMutedSync(el);
              }}
              src={ASSETS.productVideo}
              poster={ASSETS.img1}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              controls={false}
              disablePictureInPicture
              className="absolute inset-0 h-full w-full object-cover md:inset-y-0 md:left-1/2 md:right-auto md:h-full md:w-auto md:max-w-[min(100vw,56.25vh)] md:-translate-x-1/2"
            />
          )}
        </div>

        {visible && (
          <button
            type="button"
            onPointerDown={onSoundPointerDown}
            onClick={onSoundClick}
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/55 text-rb-white backdrop-blur-sm active:scale-95 touch-manipulation"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            aria-pressed={!muted}
          >
            {muted ? (
              <IconMuted className="h-5 w-5" />
            ) : (
              <IconUnmuted className="h-5 w-5" />
            )}
          </button>
        )}
      </>
    );
  },
);

export default BackgroundVideo;
