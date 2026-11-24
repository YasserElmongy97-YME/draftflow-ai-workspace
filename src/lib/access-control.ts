import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "draftflow_access";
export const ACCESS_SESSION_TTL_SECONDS = 60 * 60 * 12;
export const ACCESS_PASSWORD_MIN_LENGTH = 24;
const ACCESS_PASSWORD_MAX_LENGTH = 256;

function configuredPassword(): string | null {
  const password = process.env.DEMO_ACCESS_PASSWORD;
  if (
    !password ||
    password.length < ACCESS_PASSWORD_MIN_LENGTH ||
    password.length > ACCESS_PASSWORD_MAX_LENGTH
  ) {
    return null;
  }
  return password;
}

export function isAccessPasswordConfigured(): boolean {
  return configuredPassword() !== null;
}

export function verifyAccessPassword(candidate: string): boolean {
  const expected = configuredPassword();
  if (!expected || candidate.length > ACCESS_PASSWORD_MAX_LENGTH) return false;

  const expectedDigest = createHash("sha256").update(expected).digest();
  const candidateDigest = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expectedDigest, candidateDigest);
}

function signatureFor(expiration: string, password: string): Buffer {
  return createHmac("sha256", password).update(expiration).digest();
}

export function createAccessToken(now = Date.now()): string | null {
  const password = configuredPassword();
  if (!password) return null;

  const expiration = String(
    Math.floor(now / 1000) + ACCESS_SESSION_TTL_SECONDS,
  );
  const signature = signatureFor(expiration, password).toString("base64url");
  return `${expiration}.${signature}`;
}

export function verifyAccessToken(
  token: string | undefined,
  now = Date.now(),
): boolean {
  const password = configuredPassword();
  if (!password || !token || token.length > 128) return false;

  const [expiration, encodedSignature, extra] = token.split(".");
  if (!expiration || !encodedSignature || extra !== undefined) return false;
  if (!/^\d{10}$/.test(expiration)) return false;
  if (Number(expiration) <= Math.floor(now / 1000)) return false;

  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = signatureFor(expiration, password);
  return (
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(suppliedSignature, expectedSignature)
  );
}
