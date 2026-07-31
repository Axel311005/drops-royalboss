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
  unmuteAndPlay,
  unlockVideoOnGesture,
} from "@/lib/video";

export type BackgroundVideoHandle = {
  play: (withAudio?: boolean) => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
};

type Props = {
  mounted: boolean;
  visible: boolean;
  /** Reproducir con sonido (tras gesto NFC / tap) */
  withAudio?: boolean;
};

const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ mounted, visible, withAudio = false }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [showPosterFallback, setShowPosterFallback] = useState(false);
    const audioRef = useRef(withAudio);

    useEffect(() => {
      audioRef.current = withAudio;
    }, [withAudio]);

    useImperativeHandle(ref, () => ({
      play(nextAudio) {
        const useAudio = nextAudio ?? audioRef.current;
        if (useAudio) unmuteAndPlay(videoRef.current);
        else tryPlayVideo(videoRef.current, { withAudio: false });
      },
      setIntensity(opacity: number) {
        const el = wrapRef.current;
        if (!el) return;
        el.style.opacity = String(Math.max(opacity, 0.01));
        el.style.filter = "none";
      },
    }));

    useEffect(() => {
      if (!mounted) return;
      const video = videoRef.current;
      if (!video) return;

      prepareVideoEl(video, { withAudio: audioRef.current });
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

      video.addEventListener("error", onError);
      video.addEventListener("playing", onPlaying);

      const cleanupUnlock = unlockVideoOnGesture(video, {
        withAudio: audioRef.current,
      });

      const retries = [50, 200, 600, 1500].map((ms) =>
        window.setTimeout(
          () =>
            tryPlayVideo(video, { withAudio: audioRef.current }),
          ms,
        ),
      );

      return () => {
        cleanupUnlock();
        retries.forEach(clearTimeout);
        video.removeEventListener("error", onError);
        video.removeEventListener("playing", onPlaying);
      };
    }, [mounted]);

    useEffect(() => {
      if (!visible) return;
      if (withAudio) unmuteAndPlay(videoRef.current);
      else tryPlayVideo(videoRef.current, { withAudio: false });
      const t = window.setTimeout(() => {
        if (withAudio) unmuteAndPlay(videoRef.current);
        else tryPlayVideo(videoRef.current, { withAudio: false });
      }, 300);
      return () => clearTimeout(t);
    }, [visible, withAudio]);

    if (!mounted) return null;

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
          loop
          autoPlay
          // muted solo si no hay audio; con audio el gesto NFC desbloquea
          muted={!withAudio}
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
