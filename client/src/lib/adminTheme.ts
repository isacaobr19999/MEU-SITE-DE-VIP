export type AdminTheme = "dark" | "light";

export const ADMIN_THEME_STORAGE_KEY = "playstorcraft-admin-theme";

export function parseAdminTheme(value: string | null): AdminTheme {
  return value === "light" ? "light" : "dark";
}
