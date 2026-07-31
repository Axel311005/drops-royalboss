/** Helpers de video — autoplay + audio al entrar (sin depender del scroll) */

export function prepareVideoEl(
  video: HTMLVideoElement,
  opts: { withAudio?: boolean } = {},
) {
  const withAudio = Boolean(opts.withAudio);
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("autoplay", "");

  if (withAudio) {
    video.muted = false;
    video.defaultMuted = false;
    video.removeAttribute("muted");
    video.volume = 1;
  } else {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
  }
}

export function tryPlayVideo(
  video: HTMLVideoElement | null | undefined,
  opts: { withAudio?: boolean } = {},
) {
  if (!video) return Promise.resolve(false);
  prepareVideoEl(video, opts);
  return video
    .play()
    .then(() => true)
    .catch(() => false);
}

/** Intenta audio ya; si el browser bloquea, deja video muted y reintenta unmute. */
export async function unmuteAndPlay(
  video: HTMLVideoElement | null | undefined,
): Promise<boolean> {
  if (!video) return false;

  prepareVideoEl(video, { withAudio: true });
  try {
    await video.play();
    return !video.muted;
  } catch {
    // Fallback: video visible ya (muted), luego desmutear
    prepareVideoEl(video, { withAudio: false });
    try {
      await video.play();
    } catch {
      return false;
    }
    prepareVideoEl(video, { withAudio: true });
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }
}

/** Solo toque/click — NO scroll (el audio no debe esperar al scroll) */
export function unlockAudioOnTap(
  video: HTMLVideoElement | null | undefined,
  onUnlocked?: () => void,
): () => void {
  if (!video || typeof window === "undefined") return () => {};

  let done = false;
  const unlock = () => {
    if (done) return;
    done = true;
    unmuteAndPlay(video).then(() => onUnlocked?.());
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
