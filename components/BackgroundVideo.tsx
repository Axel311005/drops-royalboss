"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ASSETS } from "@/lib/assets";
import {
  activateFromUserGesture,
  isTouchDevice,
  muteVideo,
  playMuted,
  playMutedSync,
  resumeMutedIfPaused,
} from "@/lib/video";

export type BackgroundVideoHandle = {
  play: (withAudio?: boolean) => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
  unmute: () => void;
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

const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mutedRef = useRef(true);
    const [failed, setFailed] = useState(false);
    const [muted, setMuted] = useState(true);

    const setMutedState = useCallback((next: boolean) => {
      mutedRef.current = next;
      setMuted(next);
    }, []);

    const tryPlayMuted = useCallback(() => {
      const video = videoRef.current;
      if (!video || failed || !mutedRef.current) return;
      void playMuted(video);
    }, [failed]);

    const unmuteFromButton = useCallback(() => {
      const video = videoRef.current;
      if (!video || !mutedRef.current) return;
      // Ref primero: evita que tryPlayMuted (canplay) re-mute durante el gesto
      setMutedState(false);
      activateFromUserGesture(video);
    }, [setMutedState]);

    const muteFromButton = useCallback(() => {
      const video = videoRef.current;
      if (!video || mutedRef.current) return;
      setMutedState(true);
      muteVideo(video);
    }, [setMutedState]);

    const activateAudio = useCallback(() => {
      unmuteFromButton();
    }, [unmuteFromButton]);

    useImperativeHandle(
      ref,
      () => ({
        play() {
          const video = videoRef.current;
          if (!video || failed) return;
          if (mutedRef.current) void playMuted(video);
          else video.play()?.catch(() => {});
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
      [activateAudio, failed],
    );

    // Listener nativo — touch O click, nunca ambos (evita doble toggle en iOS)
    useEffect(() => {
      const btn = buttonRef.current;
      if (!btn || !visible) return;

      const touch = isTouchDevice();

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (mutedRef.current) unmuteFromButton();
        else muteFromButton();
      };

      const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (mutedRef.current) unmuteFromButton();
        else muteFromButton();
      };

      if (touch) {
        btn.addEventListener("touchstart", onTouchStart, { passive: false });
      } else {
        btn.addEventListener("click", onClick);
      }

      return () => {
        if (touch) {
          btn.removeEventListener("touchstart", onTouchStart);
        } else {
          btn.removeEventListener("click", onClick);
        }
      };
    }, [visible, unmuteFromButton, muteFromButton]);

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

      mutedRef.current = true;
      setMutedState(true);
      playMutedSync(video);

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
    }, [mounted, tryPlayMuted, setMutedState]);

    useEffect(() => {
      if (!mounted || !visible) return;
      tryPlayMuted();
      const timers = [0, 250, 600, 1200].map((ms) =>
        window.setTimeout(tryPlayMuted, ms),
      );
      return () => timers.forEach(clearTimeout);
    }, [mounted, visible, tryPlayMuted]);

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
              ref={videoRef}
              src={ASSETS.productVideo}
              poster={ASSETS.img1}
              autoPlay
              muted={muted}
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
            ref={buttonRef}
            type="button"
            data-sound-btn
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
