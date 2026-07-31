"use client";

import { motion } from "framer-motion";
import { ASSETS, LINKS } from "@/lib/assets";

type Props = {
  active: boolean;
};

export default function ClubFooter({ active }: Props) {
  if (!active) return null;

  return (
    <footer className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-24 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-rb-red drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
        Royal Boss Club
      </p>
      <h2 className="mt-3 max-w-[20rem] text-center font-[family-name:var(--font-bebas)] text-[clamp(2.25rem,10vw,3.25rem)] leading-none tracking-wide text-rb-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] sm:max-w-md">
        Bienvenido a la corona
      </h2>
      <p className="mt-4 max-w-[18rem] text-center text-[13px] leading-relaxed text-rb-silver drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:max-w-sm sm:text-sm">
        Sos parte del club. Original en la cabeza, certificado en la mano.
      </p>

      <motion.a
        href={LINKS.shop}
        target="_blank"
        rel="noreferrer"
        whileTap={{ scale: 0.97 }}
        className="mt-8 inline-flex min-h-12 w-full max-w-xs items-center justify-center border border-rb-red px-8 py-3.5 text-center font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white transition-colors hover:bg-rb-red"
      >
        Visitar la tienda
      </motion.a>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <a
          href={LINKS.instagram}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver transition-colors hover:text-rb-white"
        >
          Instagram
        </a>
        <a
          href={LINKS.tiktok}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver transition-colors hover:text-rb-white"
        >
          TikTok
        </a>
        <a
          href={LINKS.shop}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-rb-silver transition-colors hover:text-rb-white"
        >
          Tienda
        </a>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.logoRoyal}
        alt=""
        className="mt-12 h-12 w-12 object-contain opacity-90 animate-pulse sm:h-14 sm:w-14"
      />
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.35em] text-rb-silver/55">
        © {new Date().getFullYear()} Royal Boss
      </p>
    </footer>
  );
}
