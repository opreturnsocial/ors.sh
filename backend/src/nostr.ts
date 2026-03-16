import { schnorr } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

function serializeEvent(event: Omit<NostrEvent, "id" | "sig">): string {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

function getEventId(event: Omit<NostrEvent, "id" | "sig">): string {
  const serialized = serializeEvent(event);
  const hash = sha256(new TextEncoder().encode(serialized));
  return bytesToHex(hash);
}

export function validateNip98Event(
  event: NostrEvent,
  baseUrl: string
): { valid: boolean; error?: string } {
  if (event.kind !== 27235) {
    return { valid: false, error: "Invalid event kind, expected 27235" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - event.created_at) > 60) {
    return { valid: false, error: "Event timestamp too old or in the future" };
  }

  const uTag = event.tags.find((t) => t[0] === "u");
  if (!uTag || !uTag[1].startsWith(baseUrl)) {
    return { valid: false, error: "Auth event is not for this site" };
  }

  const computedId = getEventId({
    pubkey: event.pubkey,
    created_at: event.created_at,
    kind: event.kind,
    tags: event.tags,
    content: event.content,
  });

  if (computedId !== event.id) {
    return { valid: false, error: "Invalid event id" };
  }

  try {
    const pubkeyBytes = hexToBytes(event.pubkey);
    const sigBytes = hexToBytes(event.sig);
    const idBytes = hexToBytes(event.id);
    const valid = schnorr.verify(sigBytes, idBytes, pubkeyBytes);
    if (!valid) {
      return { valid: false, error: "Invalid signature" };
    }
  } catch {
    return { valid: false, error: "Signature verification failed" };
  }

  return { valid: true };
}
