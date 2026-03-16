export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  if (!url.startsWith("https://")) {
    return { valid: false, error: "URL must start with https://" };
  }

  if (url.length > 500) {
    return { valid: false, error: "URL must be less than 500 characters" };
  }

  return { valid: true };
}
