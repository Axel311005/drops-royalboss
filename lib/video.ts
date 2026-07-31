/** Helpers de video — Safari / Chrome / audio post-gesto NFC */

export function isLikelySafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
}

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
  if (!video) return Promise.resolve();
  prepareVideoEl(video, opts);
  return video.play().catch(() => {
    // Si falla con audio, intentar muted y desmutear en el próximo gesto
    if (opts.withAudio) {
      prepareVideoEl(video, { withAudio: false });
      return video.play().then(() => {
        // Se desmuteará cuando el gesto lo permita
      }).catch(() => {});
    }
  });
}

export function unmuteAndPlay(video: HTMLVideoElement | null | undefined) {
  if (!video) return Promise.resolve();
  prepareVideoEl(video, { withAudio: true });
  return video.play().catch(() => {});
}

/** Desbloquea play (y audio si se pide) con el primer gesto del usuario */
export function unlockVideoOnGesture(
  video: HTMLVideoElement | null | undefined,
  opts: { withAudio?: boolean; onUnlocked?: () => void } = {},
): () => void {
  if (!video || typeof window === "undefined") return () => {};

  let done = false;
  const unlock = () => {
    if (done) return;
    done = true;
    const run = opts.withAudio
      ? unmuteAndPlay(video)
      : tryPlayVideo(video, { withAudio: false });
    run.then(() => opts.onUnlocked?.());
    cleanup();
  };

  const listenerOpts: AddEventListenerOptions = { capture: true, passive: true };
  const events = [
    "touchstart",
    "touchend",
    "pointerdown",
    "scroll",
    "wheel",
    "click",
  ] as const;

  const cleanup = () => {
    events.forEach((e) => window.removeEventListener(e, unlock, listenerOpts));
  };

  events.forEach((e) => window.addEventListener(e, unlock, listenerOpts));
  tryPlayVideo(video, { withAudio: opts.withAudio });

  return cleanup;
}
