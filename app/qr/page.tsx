import type { Metadata } from "next";
import QrClient from "./QrClient";

export const metadata: Metadata = {
  title: "QR simulación — Royal Boss",
  description: "QR de prueba con valor https://royal-boss.com/RoyalCrown",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <QrClient />;
}
