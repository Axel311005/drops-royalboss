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

/** El tag/QR es válido si apunta a /RoyalCrown (con o sin www, query, mayúsculas). */
export function isValidRoyalCrownUrl(raw: string): boolean {
  const cleaned = raw
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Extraer URL si viene con texto alrededor
  const urlMatch = cleaned.match(/https?:\/\/[^\s<>"']+/i);
  const candidate = urlMatch?.[0] ?? cleaned;

  try {
    const u = new URL(candidate.trim());
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    const hostOk =
      host === "royal-boss.com" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app");
    return hostOk && path === "/royalcrown";
  } catch {
    return /royal-boss\.com\/royalcrown/i.test(cleaned);
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
    "ftp://anonymous:anonymous@",
    "ftp://ftp.",
    "ftps://",
    "sftp://",
    "smb://",
    "nfs://",
    "ftp://",
    "dav://",
    "news:",
    "telnet://",
    "imap:",
    "rtsp://",
    "urn:",
    "pop:",
    "sip:",
    "sips:",
    "tftp:",
    "btspp://",
    "btl2cap://",
    "btgoep://",
    "tcpobex://",
    "irdaobex://",
    "file://",
    "urn:epc:id:",
    "urn:epc:tag:",
    "urn:epc:pat:",
    "urn:epc:raw:",
    "urn:epc:",
    "urn:nfc:",
  ];

  if (!message?.records?.length) {
    return ["(etiqueta vacía)"];
  }

  for (const record of message.records) {
    const type = record.recordType || "";

    if (!record.data) {
      out.push(`[${type || "record"} sin datos]`);
      continue;
    }

    const bytes = new Uint8Array(
      record.data.buffer,
      record.data.byteOffset,
      record.data.byteLength,
    );

    if (type === "url" || type === "absolute-url") {
      try {
        if (type === "absolute-url") {
          out.push(new TextDecoder("utf-8").decode(bytes));
        } else {
          const prefix = uriPrefixes[bytes[0]] ?? "";
          const rest = new TextDecoder("utf-8").decode(bytes.slice(1));
          out.push(prefix + rest);
        }
        continue;
      } catch {
        /* fallthrough */
      }
    }

    if (type === "text") {
      try {
        const langLen = bytes[0] & 0x3f;
        out.push(new TextDecoder("utf-8").decode(bytes.slice(1 + langLen)));
        continue;
      } catch {
        /* fallthrough */
      }
    }

    // Cualquier otro tipo: intentar texto plano
    try {
      const raw = new TextDecoder("utf-8").decode(bytes).trim();
      if (raw) out.push(raw);
      else out.push(`[${type || "desconocido"}]`);
    } catch {
      out.push(`[${type || "binario"}]`);
    }
  }

  return out.length ? out : ["(sin contenido legible)"];
}
