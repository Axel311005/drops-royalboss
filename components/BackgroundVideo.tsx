"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ASSETS } from "@/lib/assets";

export type BackgroundVideoHandle = {
  play: (withAudio?: boolean) => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
  unmute: () => void;
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
 * Botón mute en esquina → audio con UN solo toque (Android / iPhone / desktop).
 * @see https://imagekit.io/blog/nextjs-video-autoplay/
 */
const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [muted, setMuted] = useState(true);

    const setMutedState = useCallback((next: boolean) => {
      const video = videoRef.current;
      if (!video) return;

      if (next) {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
        setMuted(true);
        void video.play().catch(() => {});
        return;
      }

      // Un mute: sincrónico en el click del botón (gesto de usuario)
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute("muted");
      video.volume = 1;
      setMuted(false);

      void video.play().catch(() => {
        // Si falla, volver a muted
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
        setMuted(true);
        void video.play().catch(() => {});
      });
    }, []);

    const toggleMute = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setMutedState(!muted);
      },
      [muted, setMutedState],
    );

    useImperativeHandle(
      ref,
      () => ({
        play() {
          const video = videoRef.current;
          if (!video) return;
          if (muted) {
            video.muted = true;
            video.setAttribute("muted", "");
          }
          void video.play().catch(() => {});
        },
        unmute() {
          setMutedState(false);
        },
        setIntensity(opacity: number) {
          const el = wrapRef.current;
          if (!el) return;
          el.style.opacity = String(Math.max(opacity, 0.05));
          el.style.filter = "none";
        },
      }),
      [muted, setMutedState],
    );

    useEffect(() => {
      if (!mounted || !visible) return;
      const video = videoRef.current;
      if (!video) return;

      const onError = () => setFailed(true);
      video.addEventListener("error", onError);

      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("x5-playsinline", "");
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      setMuted(true);

      const tryPlay = () => {
        void video.play().catch(() => {});
      };
      tryPlay();
      const timers = [80, 250, 700].map((ms) => window.setTimeout(tryPlay, ms));

      return () => {
        timers.forEach(clearTimeout);
        video.removeEventListener("error", onError);
      };
    }, [mounted, visible]);

    if (!mounted) return null;

    return (
      <>
        <div
          ref={wrapRef}
          className="fixed inset-0 z-0 bg-rb-black"
          style={{
            opacity: visible ? 1 : 0,
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
                if (el) {
                  el.setAttribute("playsinline", "");
                  el.setAttribute("webkit-playsinline", "");
                  el.setAttribute("x5-playsinline", "");
                }
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
            onClick={toggleMute}
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/55 text-rb-white backdrop-blur-sm active:scale-95"
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
