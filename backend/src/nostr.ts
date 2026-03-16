import { verifyEvent } from "nostr-tools";

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
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

  if (!verifyEvent(event)) {
    return { valid: false, error: "Invalid event id or signature" };
  }

  return { valid: true };
}
