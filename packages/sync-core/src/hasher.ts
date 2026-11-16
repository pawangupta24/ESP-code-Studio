/**
 * Fast standard SHA-256 computation in browser / Node / pure JS environments.
 */
export async function computeSha256(text: string): Promise<string> {
  const normalized = text.replace(/\r\n/g, '\n');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple checksum for environments without WebCrypto
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}
