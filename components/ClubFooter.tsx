"use client";

type Props = {
  active: boolean;
};

export default function ClubFooter({ active: _active }: Props) {
  return (
    <footer className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[max(18rem,calc(env(safe-area-inset-bottom)+16rem))] pt-28 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-rb-red drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
        Royal Boss Club
      </p>
      <h2 className="mt-3 max-w-[20rem] text-center font-[family-name:var(--font-bebas)] text-[clamp(2.25rem,10vw,3.25rem)] leading-none tracking-wide text-rb-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] sm:max-w-md">
        Bienvenido a la corona
      </h2>
      <p className="mt-4 max-w-[18rem] text-center text-[13px] leading-relaxed text-rb-silver drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:max-w-sm sm:text-sm">
        Sos parte del club. Original en la cabeza, certificado en la mano.
      </p>
    </footer>
  );
}
