export type AdminTheme = "dark" | "light";

export const ADMIN_THEME_STORAGE_KEY = "playstorcraft-admin-theme";
export const ADMIN_THEME_EVENT = "playstorcraft-admin-theme-change";

export function parseAdminTheme(value: string | null): AdminTheme {
  return value === "light" ? "light" : "dark";
}

export function persistAdminTheme(theme: AdminTheme) {
  localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<AdminTheme>(ADMIN_THEME_EVENT, { detail: theme }));
}
