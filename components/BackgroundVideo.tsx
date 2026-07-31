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
  prepareVideoEl,
  tryPlayVideo,
  unlockVideoOnGesture,
} from "@/lib/video";

export type BackgroundVideoHandle = {
  play: () => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
};

type Props = {
  mounted: boolean;
  visible: boolean;
};

const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [showPosterFallback, setShowPosterFallback] = useState(false);

    useImperativeHandle(ref, () => ({
      play() {
        tryPlayVideo(videoRef.current);
      },
      setIntensity(opacity: number) {
        const el = wrapRef.current;
        if (!el) return;
        // Solo opacity — filter:blur rompe el video en Safari iOS
        el.style.opacity = String(Math.max(opacity, 0.01));
        el.style.filter = "none";
      },
    }));

    useEffect(() => {
      if (!mounted) return;
      const video = videoRef.current;
      if (!video) return;

      prepareVideoEl(video);
      try {
        video.load();
      } catch {
        /* ignore */
      }

      const onError = () => {
        setFailed(true);
        setShowPosterFallback(true);
      };
      const onPlaying = () => setShowPosterFallback(false);
      const onStalled = () => {
        // Si tras unos segundos no hay frames, mostrar poster
        window.setTimeout(() => {
          if (video.paused || video.readyState < 2) {
            setShowPosterFallback(true);
          }
        }, 2500);
      };

      video.addEventListener("error", onError);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("stalled", onStalled);

      const cleanupUnlock = unlockVideoOnGesture(video);

      const retries = [50, 200, 600, 1500, 3000].map((ms) =>
        window.setTimeout(() => tryPlayVideo(video), ms),
      );

      return () => {
        cleanupUnlock();
        retries.forEach(clearTimeout);
        video.removeEventListener("error", onError);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("stalled", onStalled);
      };
    }, [mounted]);

    useEffect(() => {
      if (!visible) return;
      tryPlayVideo(videoRef.current);
      const t = window.setTimeout(() => tryPlayVideo(videoRef.current), 300);
      return () => clearTimeout(t);
    }, [visible]);

    if (!mounted) return null;

    // opacity mínima 0.01 en intro: Safari sigue decodificando el stream
    const wrapOpacity = visible ? 1 : 0.01;

    return (
      <div
        ref={wrapRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-rb-black transition-opacity duration-500"
        style={{ opacity: wrapOpacity }}
      >
        {(failed || showPosterFallback) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ASSETS.img1}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover md:inset-y-0 md:left-1/2 md:right-auto md:h-full md:w-auto md:max-w-[min(100vw,56.25vh)] md:-translate-x-1/2"
          poster={ASSETS.img1}
          preload="auto"
          playsInline
          muted
          loop
          autoPlay
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src={ASSETS.productVideo} type="video/mp4" />
        </video>
      </div>
    );
  },
);

export default BackgroundVideo;
