"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { ASSETS } from "@/lib/assets";

export type BackgroundVideoHandle = {
  play: () => void;
  setIntensity: (opacity: number, blurPx?: number) => void;
};

type Props = {
  active: boolean;
};

const BackgroundVideo = forwardRef<BackgroundVideoHandle, Props>(
  function BackgroundVideo({ active }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      play() {
        videoRef.current?.play().catch(() => {});
      },
      setIntensity(opacity: number, blurPx = 0) {
        const el = wrapRef.current;
        if (!el) return;
        el.style.opacity = String(opacity);
        el.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
      },
    }));

    useEffect(() => {
      if (!active) return;
      videoRef.current?.play().catch(() => {});
    }, [active]);

    return (
      <div
        ref={wrapRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center bg-rb-black transition-[opacity,filter] duration-500"
        style={{ opacity: active ? 1 : 0 }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover md:h-full md:w-auto md:max-w-[min(100vw,56.25vh)]"
          src={ASSETS.productVideo}
          poster={ASSETS.img1}
          preload="auto"
          playsInline
          muted
          loop
        />
      </div>
    );
  },
);

export default BackgroundVideo;
