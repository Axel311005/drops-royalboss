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

      prepareVideoEl(video, { withAudio: false });
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

      // Precarga en silencio
      tryPlayVideo(video, { withAudio: false });

      return () => {
        video.removeEventListener("error", onError);
        video.removeEventListener("playing", onPlaying);
      };
    }, [mounted]);

    useEffect(() => {
      if (!visible || !mounted) return;
      const video = videoRef.current;
      if (!video) return;

      // Al hacerse visible: audio YA (sin esperar scroll)
      const kick = () => {
        if (withAudio) unmuteAndPlay(video);
        else tryPlayVideo(video, { withAudio: false });
      };

      kick();
      const retries = [50, 150, 350, 700, 1200].map((ms) =>
        window.setTimeout(kick, ms),
      );

      // Fallback solo por tap/click si el browser bloquea autoplay con sonido
      const cleanupTap = withAudio ? unlockAudioOnTap(video) : () => {};

      return () => {
        retries.forEach(clearTimeout);
        cleanupTap();
      };
    }, [visible, mounted, withAudio]);

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
