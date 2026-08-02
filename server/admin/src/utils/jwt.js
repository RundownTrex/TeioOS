/**
 * JWT helpers for the administration dashboard.
 *
 * The client never verifies tokens cryptographically — the backend is the
 * authority (signature + exp are enforced server-side on every request).
 * These helpers only READ the payload for convenience, e.g. to skip a
 * doomed /me call when a persisted token is already expired.
 */

const base64UrlDecode = (segment) => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
};

/**
 * Decode the payload segment of a JWT without any signature validation.
 * Returns null when the token is malformed or the payload is not JSON.
 */
export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch (error) {
    return null;
  }
};

/**
 * Return the token's `exp` claim as unix seconds, or null when absent/invalid.
 */
export const getTokenExpirySeconds = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp;
};

/**
 * Client-side expiration check. The backend remains the source of truth:
 * a missing `exp` fails open (false) so the server gets to decide.
 *
 * @param {string} token
 * @param {number} skewSeconds grace period (default 5s) for clock drift
 */
export const isTokenExpired = (token, skewSeconds = 5) => {
  const exp = getTokenExpirySeconds(token);
  if (exp === null) return false;
  return Math.floor(Date.now() / 1000) + skewSeconds >= exp;
};

export default { decodeJwtPayload, getTokenExpirySeconds, isTokenExpired };
