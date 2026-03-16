import { finalizeEvent } from "nostr-tools";
import { nip19 } from "nostr-tools";
import type { WindowNostr } from "nostr-tools/nip07";

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
}

export function createNip98EventFromPrivkey(
  url: string,
  method: string,
  nsec: string
) {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== "nsec") {
    throw new Error("Invalid nsec - must start with 'nsec1'");
  }
  const privkey = decoded.data;
  const template = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", url],
      ["method", method],
    ],
    content: "",
  };
  return finalizeEvent(template, privkey);
}

export async function createNip98Event(url: string, method: string) {
  if (!window.nostr) {
    throw new Error("No Nostr extension found. Please install one.");
  }

  const event = await window.nostr.signEvent({
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", url],
      ["method", method],
    ],
    content: "",
  });

  return event;
}
