/** Helpers para autoplay confiable en Safari iOS / WebKit */

export function isLikelySafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
}

/**
 * Safari exige muted + playsInline reales (propiedad + atributo)
 * y a menudo un gesto del usuario para desbloquear play.
 */
export function prepareVideoEl(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("autoplay", "");
}

export function tryPlayVideo(video: HTMLVideoElement | null | undefined) {
  if (!video) return Promise.resolve();
  prepareVideoEl(video);
  return video.play().catch(() => {
    /* Autoplay bloqueado hasta gesto — se reintenta en unlock */
  });
}

/** Enlaza un gesto (touch/scroll) para desbloquear el video una vez */
export function unlockVideoOnGesture(
  video: HTMLVideoElement | null | undefined,
  onUnlocked?: () => void,
): () => void {
  if (!video || typeof window === "undefined") return () => {};

  let done = false;
  const unlock = () => {
    if (done) return;
    done = true;
    tryPlayVideo(video).then(() => onUnlocked?.());
    cleanup();
  };

  const opts: AddEventListenerOptions = { capture: true, passive: true };
  const events = [
    "touchstart",
    "touchend",
    "pointerdown",
    "scroll",
    "wheel",
    "click",
  ] as const;

  const cleanup = () => {
    events.forEach((e) => window.removeEventListener(e, unlock, opts));
  };

  events.forEach((e) => window.addEventListener(e, unlock, opts));
  // Intento inmediato por si ya hay permiso
  tryPlayVideo(video);

  return cleanup;
}
