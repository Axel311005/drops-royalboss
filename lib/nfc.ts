import { LINKS } from "@/lib/assets";

export const NFC_EXPECTED_URL = LINKS.certificate; // https://royal-boss.com/RoyalCrown
export const NFC_AUTH_KEY = "rb-nfc-authenticated";
export const NFC_AUDIO_KEY = "rb-nfc-audio-unlock";

export function normalizeNfcUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.search = "";
    let path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.host}${path}`;
  } catch {
    return raw.trim().replace(/\/+$/, "");
  }
}

export function isValidRoyalCrownUrl(raw: string): boolean {
  const got = normalizeNfcUrl(raw).toLowerCase();
  const expected = normalizeNfcUrl(NFC_EXPECTED_URL).toLowerCase();
  // Acepta con o sin www, y path exacto /RoyalCrown
  const gotPath = got.replace(/^https?:\/\/(www\.)?/, "");
  const expPath = expected.replace(/^https?:\/\/(www\.)?/, "");
  return gotPath === expPath;
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

type NdefReadingEventLike = {
  message: NdefMessageLike;
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

export type { NdefReadingEventLike };
