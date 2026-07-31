/** Helpers de video — autoplay muted + activación con gesto (Safari iOS). */

export function ensureInline(video: HTMLVideoElement) {
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("x5-playsinline", "");
}

/** play() sin rechazos no capturados — evita NotAllowedError en consola. */
export function safePlay(video: HTMLVideoElement): void {
  try {
    const result = video.play();
    if (result !== undefined) {
      result.catch(() => {});
    }
  } catch {
    /* ignorar */
  }
}

export function playMuted(video: HTMLVideoElement): Promise<boolean> {
  ensureInline(video);
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  return video
    .play()
    .then(() => true)
    .catch(() => false);
}

/** play() síncrono muted — solo dentro del stack de un gesto en Safari iOS. */
export function playMutedSync(video: HTMLVideoElement): void {
  ensureInline(video);
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  safePlay(video);
}

/**
 * Activa audio en el mismo gesto de usuario.
 * Orden: play muted → unmute → play (todo síncrono, mismo stack).
 */
export function activateFromUserGesture(video: HTMLVideoElement): void {
  ensureInline(video);

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  safePlay(video);

  video.muted = false;
  video.defaultMuted = false;
  video.removeAttribute("muted");
  video.volume = 1;
  safePlay(video);
}

export function muteVideo(video: HTMLVideoElement): void {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  safePlay(video);
}

export function resumeMutedIfPaused(
  video: HTMLVideoElement | null | undefined,
) {
  if (!video || !video.paused) return;
  void playMuted(video);
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
