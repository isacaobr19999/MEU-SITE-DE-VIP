export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Encaminha ao login próprio preservando o destino interno solicitado. */
export const startLogin = () => {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
};
