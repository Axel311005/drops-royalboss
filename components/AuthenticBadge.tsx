"use client";

import { motion } from "framer-motion";
import { ASSETS } from "@/lib/assets";

/** Card Authentic fija — siempre por encima del scroll */
export default function AuthenticBadge() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[55] flex justify-center px-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full max-w-[260px] flex-col items-center rounded-3xl border border-white/15 bg-white/10 px-6 py-5 shadow-lg backdrop-blur-sm sm:max-w-[280px]">
        <p className="text-center text-[14px] font-medium leading-snug tracking-tight text-white drop-shadow-sm sm:text-[15px]">
          Authentic Royal Boss Product
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.sealRbGold}
          alt="Royal Boss"
          className="mt-4 h-20 w-20 object-contain sm:h-24 sm:w-24"
        />
      </div>
    </motion.div>
  );
}
