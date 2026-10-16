// Password hashing (PBKDF2-SHA256) and signed access cookies (HMAC-SHA256).
// Uses Web Crypto only, so it runs the same in a Cloudflare Worker and Node.

const enc = new TextEncoder();
const ITERATIONS = 100000; // Workers cap PBKDF2 at 100k iterations

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64url = (buf) => toB64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toB64(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), iterations: ITERATIONS, hash: await pbkdf2(password, salt, ITERATIONS) };
}

export async function verifyPassword(password, record) {
  if (!record?.hash || !record?.salt) return false;
  const hash = await pbkdf2(password, fromB64(record.salt), record.iterations || ITERATIONS);
  return timingSafeEqual(hash, record.hash);
}

// Private link keys: long random strings, compared in constant time.
export function makeKey() {
  return toB64url(crypto.getRandomValues(new Uint8Array(24)));
}

export function verifyKey(key, stored) {
  return Boolean(key && stored) && timingSafeEqual(String(key), String(stored));
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toB64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

// Cookie value: <expiry>.<signature over slug + expiry + password hash>.
// The secret passed in covers the password hash and link key, so changing
// either signs everyone out of that proposal.
export async function makeToken(secret, slug, accessSecret, maxAgeSec) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  return `${exp}.${await hmac(secret, `${slug}|${exp}|${accessSecret}`)}`;
}

export async function checkToken(secret, slug, accessSecret, token) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return timingSafeEqual(sig, await hmac(secret, `${slug}|${exp}|${accessSecret}`));
}
