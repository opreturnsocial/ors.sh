import type { WindowNostr } from "nostr-tools/nip07";

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
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
