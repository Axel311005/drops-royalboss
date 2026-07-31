import type { Metadata } from "next";
import RoyalCrownExperience from "@/components/RoyalCrownExperience";
import { ASSETS } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Royal Crown — Certificado Original | Royal Boss",
  description:
    "Certificado digital de autenticidad. Esta es tu Royal Boss — Original.",
  alternates: {
    canonical: "https://royal-boss.com/RoyalCrown",
  },
};

export default function RoyalCrownPage() {
  return (
    <>
      <link rel="preload" as="image" href={ASSETS.logoRoyal} />
      <link rel="preload" as="image" href={ASSETS.img1} />
      <link rel="preload" as="video" href={ASSETS.productVideo} />
      <RoyalCrownExperience />
    </>
  );
}
