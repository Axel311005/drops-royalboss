import { LINKS } from "@/lib/assets";

/** Valor que debe tener grabado el chip NFC */
export const NFC_EXPECTED_URL = LINKS.certificate; // https://royal-boss.com/RoyalCrown

export const NFC_AUTH_KEY = "rb-nfc-authenticated";
export const NFC_AUDIO_KEY = "rb-nfc-audio-unlock";

export function normalizeNfcUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    // Mantener path; ignorar query extraña salvo comparación de path
    let path = u.pathname.replace(/\/+$/, "") || "";
    return `${u.protocol}//${u.host}${path}`.toLowerCase();
  } catch {
    return raw.trim().replace(/\/+$/, "").toLowerCase();
  }
}

/** El tag es válido si apunta a /RoyalCrown (con o sin www, con o sin query) */
export function isValidRoyalCrownUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    return (
      (host === "royal-boss.com" || host === "localhost" || host.endsWith(".vercel.app")) &&
      path === "/RoyalCrown"
    );
  } catch {
    return /royal-boss\.com\/RoyalCrown/i.test(raw);
  }
}

export function markNfcAuthenticated(withAudioGesture = true) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(NFC_AUTH_KEY, "1");
  if (withAudioGesture) sessionStorage.setItem(NFC_AUDIO_KEY, "1");
}

export function hasNfcAuth(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(NFC_AUTH_KEY) === "1";
}

export function clearNfcAuth() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(NFC_AUTH_KEY);
  sessionStorage.removeItem(NFC_AUDIO_KEY);
}

export function consumeAudioUnlock(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const ok = sessionStorage.getItem(NFC_AUDIO_KEY) === "1";
  if (ok) sessionStorage.removeItem(NFC_AUDIO_KEY);
  return ok;
}

export function supportsWebNfc(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NDEFReader: new () => any;
  }
}

type NdefRecordLike = {
  recordType: string;
  data?: DataView;
  encoding?: string;
};

type NdefMessageLike = {
  records: NdefRecordLike[];
};

export function decodeNdefRecords(message: NdefMessageLike): string[] {
  const out: string[] = [];
  const uriPrefixes = [
    "",
    "http://www.",
    "https://www.",
    "http://",
    "https://",
    "tel:",
    "mailto:",
  ];

  for (const record of message.records) {
    if (!record.data) continue;
    const bytes = new Uint8Array(
      record.data.buffer,
      record.data.byteOffset,
      record.data.byteLength,
    );

    if (record.recordType === "url" || record.recordType === "absolute-url") {
      try {
        if (record.recordType === "absolute-url") {
          out.push(new TextDecoder("utf-8").decode(bytes));
        } else {
          const prefix = uriPrefixes[bytes[0]] ?? "";
          const rest = new TextDecoder("utf-8").decode(bytes.slice(1));
          out.push(prefix + rest);
        }
      } catch {
        /* ignore */
      }
    }

    if (record.recordType === "text") {
      try {
        const langLen = bytes[0] & 0x3f;
        out.push(new TextDecoder("utf-8").decode(bytes.slice(1 + langLen)));
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}
