"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { NFC_EXPECTED_URL } from "@/lib/nfc";

/** Mismo valor que el chip NFC */
const QR_VALUE = NFC_EXPECTED_URL; // https://royal-boss.com/RoyalCrown

export default function QrClient() {
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(QR_VALUE, {
      width: 320,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo generar el QR");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-rb-black px-6 text-rb-white">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-rb-red">
        Simulación
      </p>
      <h1 className="mt-3 text-center font-[family-name:var(--font-bebas)] text-4xl tracking-wide">
        QR Royal Crown
      </h1>
      <p className="mt-3 max-w-sm text-center text-sm text-rb-silver">
        Escaneá este código desde la home con <strong>Escanear QR</strong>.
      </p>

      <div className="mt-10 rounded-2xl bg-white p-4 shadow-xl">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR Royal Crown" className="h-64 w-64" />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center text-sm text-neutral-500">
            {error || "Generando…"}
          </div>
        )}
      </div>

      <p className="mt-6 max-w-xs break-all text-center font-mono text-[11px] text-rb-silver/80">
        {QR_VALUE}
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/"
          className="flex min-h-12 items-center justify-center border border-rb-red bg-rb-red/90 px-6 py-3 text-center font-[family-name:var(--font-bebas)] text-lg tracking-wider text-rb-white hover:bg-rb-red"
        >
          Ir a escanear
        </Link>
        <a
          href={dataUrl || undefined}
          download="royal-crown-qr.png"
          className={`flex min-h-12 items-center justify-center border border-white/35 px-6 py-3 text-center font-[family-name:var(--font-bebas)] text-lg tracking-wider ${
            dataUrl ? "text-rb-white" : "pointer-events-none opacity-40"
          }`}
        >
          Descargar QR
        </a>
      </div>
    </main>
  );
}
