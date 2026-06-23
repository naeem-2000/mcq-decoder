// Simple client-side admin gate (per user request).
// NOTE: This is not real security; anyone reading the bundle can see the password.
// The Supabase tables are unrestricted by design for a single-admin workflow.
const KEY = "naeem-admin-ok";
export const ADMIN_PASSWORD = "Naeem678@";

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}
export function setAdmin(ok: boolean) {
  if (typeof window === "undefined") return;
  if (ok) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
}
