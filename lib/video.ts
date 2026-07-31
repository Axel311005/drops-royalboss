/** Helpers mínimos de video — autoplay siempre muted. */

export function playMuted(video: HTMLVideoElement): Promise<boolean> {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  return video
    .play()
    .then(() => true)
    .catch(() => false);
}

export function unmuteFromUserGesture(
  video: HTMLVideoElement | null | undefined,
): boolean {
  if (!video) return false;
  video.muted = false;
  video.defaultMuted = false;
  video.removeAttribute("muted");
  video.volume = 1;
  void video.play().catch(() => {
    void playMuted(video);
  });
  return true;
}

export function resumeMutedIfPaused(
  video: HTMLVideoElement | null | undefined,
) {
  if (!video || !video.paused) return;
  void playMuted(video);
}
