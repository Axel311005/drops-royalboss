import { ASSETS } from "@/lib/assets";

const SHARED_ID = "rb-shared-product-video";

type PlayResult = {
  playing: boolean;
  withAudio: boolean;
};

function applyInlineAttrs(video: HTMLVideoElement) {
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("x5-playsinline", "");
  video.loop = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.preload = "auto";
  video.setAttribute("preload", "auto");
}

function styleSharedHidden(video: HTMLVideoElement) {
  Object.assign(video.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: "0",
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
    background: "#0a0a0a",
  } as Partial<CSSStyleDeclaration>);
}

/** Video único en el documento — sobrevive navegación SPA y conserva el unlock de audio. */
export function getSharedVideo(): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(SHARED_ID) as HTMLVideoElement | null;
}

/** Crea el video compartido si no existe (sin intentar audio). */
export function ensureSharedVideo(
  src = ASSETS.productVideo,
): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;

  let video = getSharedVideo();
  if (video) {
    applyInlineAttrs(video);
    return video;
  }

  video = document.createElement("video");
  video.id = SHARED_ID;
  video.setAttribute("aria-hidden", "true");
  styleSharedHidden(video);
  applyInlineAttrs(video);
  video.poster = ASSETS.img1;
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.src = src;
  document.body.appendChild(video);
  return video;
}

/**
 * Llamar DENTRO del click de "Escanear" (gesto de usuario).
 * Arranca el video con audio; Chrome/Android lo permiten por el gesto.
 */
export function primeVideoFromUserGesture(
  src = ASSETS.productVideo,
): HTMLVideoElement | null {
  const video = ensureSharedVideo(src);
  if (!video) return null;

  applyInlineAttrs(video);

  video.muted = false;
  video.defaultMuted = false;
  video.removeAttribute("muted");
  video.volume = 0;
  video.dataset.rbPrimed = "1";

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.volume = 1;
      delete video.dataset.rbPrimed;
      video.play().catch(() => {});
    });
  }

  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AC) {
      const ctx = new AC();
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.01);
      window.setTimeout(() => ctx.close().catch(() => {}), 200);
    }
  } catch {
    /* ignore */
  }

  return video;
}

export function showSharedVideo() {
  const video = getSharedVideo();
  if (!video) return;
  // Restaurar volumen al revelar (prime usó volume 0)
  if (!video.muted) video.volume = 1;
  Object.assign(video.style, {
    opacity: "1",
    visibility: "visible",
    zIndex: "0",
  } as Partial<CSSStyleDeclaration>);

  const mq = window.matchMedia("(min-width: 768px)");
  if (mq.matches) {
    Object.assign(video.style, {
      width: "auto",
      height: "100%",
      maxWidth: "min(100vw, 56.25vh)",
      left: "50%",
      right: "auto",
      transform: "translateX(-50%)",
    } as Partial<CSSStyleDeclaration>);
  } else {
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      maxWidth: "none",
      left: "0",
      transform: "none",
    } as Partial<CSSStyleDeclaration>);
  }
}

export function hideSharedVideo() {
  const video = getSharedVideo();
  if (!video) return;
  Object.assign(video.style, {
    opacity: "0",
    visibility: "hidden",
  } as Partial<CSSStyleDeclaration>);
}

export function setSharedVideoIntensity(opacity: number) {
  const video = getSharedVideo();
  if (!video) return;
  video.style.opacity = String(Math.max(opacity, 0.05));
  video.style.filter = "none";
}

export function playMuted(video: HTMLVideoElement): Promise<boolean> {
  applyInlineAttrs(video);

  // Si ya se desbloqueó con gesto, NO volver a mutear (rompe el audio en Android)
  if (video.dataset.rbPrimed === "1") {
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute("muted");
    // Silencio hasta revelar
    if (video.style.visibility === "hidden" || video.style.opacity === "0") {
      video.volume = 0;
    }
    return video
      .play()
      .then(() => true)
      .catch(() => false);
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  return video
    .play()
    .then(() => true)
    .catch(() => false);
}

/**
 * Intenta audio UNA sola vez. Si el browser pausa al desmutear,
 * remutea y reanuda — NUNCA entra en bucle de unmute.
 */
export async function playNowWithAudio(
  video: HTMLVideoElement | null | undefined,
): Promise<PlayResult> {
  if (!video) return { playing: false, withAudio: false };

  applyInlineAttrs(video);

  const primed = video.dataset.rbPrimed === "1";

  // Asegurar que esté reproduciendo (respeta primed → no mutea)
  if (video.paused) {
    const ok = await playMuted(video);
    if (!ok) {
      await new Promise((r) => setTimeout(r, 80));
      await playMuted(video);
    }
  }

  if (video.paused) return { playing: false, withAudio: false };

  // Activar audio
  video.muted = false;
  video.defaultMuted = false;
  video.removeAttribute("muted");
  video.volume = 1;

  try {
    await video.play();
  } catch {
    // Sin permiso: si estaba primed, igual intentamos no romper play
    if (!primed) {
      delete video.dataset.rbPrimed;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      await playMuted(video);
    }
    return { playing: !video.paused, withAudio: !video.muted && !video.paused };
  }

  // Chrome a veces pausa tras unmute sin rechazar el promise
  await new Promise((r) => setTimeout(r, 50));

  if (video.paused) {
    // Recuperar reproducción SIN spamear unmute
    if (primed) {
      // Mantener unlocked; reanudar
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
      } catch {
        await playMuted(video);
      }
      return {
        playing: !video.paused,
        withAudio: !video.muted && !video.paused,
      };
    }

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    await playMuted(video);
    return { playing: !video.paused, withAudio: false };
  }

  if (video.muted) {
    return { playing: true, withAudio: false };
  }

  return { playing: true, withAudio: true };
}

export function resumeIfPaused(video: HTMLVideoElement | null | undefined) {
  if (!video || !video.paused) return;
  void playMuted(video);
}

export function unlockAudioOnTap(
  video: HTMLVideoElement | null | undefined,
): () => void {
  if (!video || typeof window === "undefined") return () => {};

  let done = false;
  const unlock = () => {
    if (done) return;
    if (!video.muted && !video.paused) {
      done = true;
      cleanup();
      return;
    }
    done = true;
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute("muted");
    video.volume = 1;
    video.play().catch(() => {
      void playMuted(video);
    });
    cleanup();
  };

  const opts: AddEventListenerOptions = { capture: true, passive: true };
  const events = ["touchstart", "pointerdown", "click"] as const;
  const cleanup = () => {
    events.forEach((e) => window.removeEventListener(e, unlock, opts));
  };
  events.forEach((e) => window.addEventListener(e, unlock, opts));
  return cleanup;
}
