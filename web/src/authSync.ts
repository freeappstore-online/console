/**
 * Cross-subdomain auth sync for FAS.
 * Mirrors the FAS session token to a cookie on .freeappstore.online so the
 * storefront can detect sign-in state without an API call.
 */

const COOKIE_NAME = 'fas_token'
const COOKIE_DOMAIN = '.freeappstore.online'
const MAX_AGE = 30 * 24 * 60 * 60

export function syncTokenToCookie(token: string | null): void {
  if (typeof document === 'undefined') return
  if (token) {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`
  } else {
    document.cookie = `${COOKIE_NAME}=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax; Secure`
  }
}

export function restoreFromCookie(): void {
  const STORAGE_KEY = 'fas:session'
  if (localStorage.getItem(STORAGE_KEY)) return
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: null }))
}
