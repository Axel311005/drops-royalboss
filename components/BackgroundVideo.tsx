"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
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

/**
 * Patrón ImageKit / Next.js autoplay:
 * autoPlay + muted + playsInline → funciona en Chrome, Safari, iOS.
 * Primer toque → audio.
 * @see https://imagekit.io/blog/nextjs-video-autoplay/
 */
const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const unlockedRef = useRef(false);
    const [failed, setFailed] = useState(false);

    const unmute = () => {
      const video = videoRef.current;
      if (!video || unlockedRef.current) return;
      unlockedRef.current = true;
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute("muted");
      video.volume = 1;
      void video.play().catch(() => {
        // Si falla el unmute, que al menos siga muted
        video.muted = true;
        video.setAttribute("muted", "");
        unlockedRef.current = false;
        void video.play().catch(() => {});
      });
    };

    useImperativeHandle(ref, () => ({
      play() {
        const video = videoRef.current;
        if (!video) return;
        video.muted = true;
        video.setAttribute("muted", "");
        void video.play().catch(() => {});
      },
      unmute,
      setIntensity(opacity: number) {
        const el = wrapRef.current;
        if (!el) return;
        el.style.opacity = String(Math.max(opacity, 0.05));
        el.style.filter = "none";
      },
    }));

    // Forzar play muted cuando se hace visible (Safari a veces necesita .play())
    useEffect(() => {
      if (!mounted || !visible) return;
      const video = videoRef.current;
      if (!video) return;

      const onError = () => setFailed(true);
      video.addEventListener("error", onError);

      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      const tryPlay = () => {
        void video.play().catch(() => {});
      };
      tryPlay();
      const t1 = window.setTimeout(tryPlay, 150);
      const t2 = window.setTimeout(tryPlay, 500);

      const onGesture = () => unmute();
      window.addEventListener("pointerdown", onGesture, { passive: true });
      window.addEventListener("touchstart", onGesture, { passive: true });

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        video.removeEventListener("error", onError);
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("touchstart", onGesture);
      };
      // deps fijas — no incluir callbacks que cambien de tamaño el array
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, visible]);

    if (!mounted) return null;

    return (
      <div
        ref={wrapRef}
        className="fixed inset-0 z-0 bg-rb-black"
        style={{
          opacity: visible ? 1 : 0,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
        }}
        onPointerDown={unmute}
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
    );
  },
);

export default BackgroundVideo;
