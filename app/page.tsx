import type { Metadata } from "next";
import ScanAndPlay from "@/components/ScanAndPlay";
import { ASSETS } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Royal Boss — Escaneá tu gorra",
  description: "Escaneá el chip NFC de tu Royal Boss.",
};

/** Link para mandar. Acá se abre el lector NFC (nativo en Android Chrome). */
export default function Home() {
  return (
    <>
      <link rel="preload" as="video" href={ASSETS.productVideo} />
      <link rel="preload" as="image" href={ASSETS.logoRoyal} />
      <ScanAndPlay />
    </>
  );
}
