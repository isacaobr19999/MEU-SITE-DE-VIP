export type CatalogVisualSource = {
  kind: "VIP" | "COINS" | "KIT" | "COSMETIC";
  categoryName?: string | null;
};

const githubIconBase = "https://raw.githubusercontent.com/Templarian/MaterialDesign-SVG/master/svg";

const categoryArt = {
  vip: {
    url: "/manus-storage/playstorcraft-vip-category_22e6314d.png",
    fallbackUrl: `${githubIconBase}/diamond.svg`,
    alt: "Ilustração de uma insígnia esmeralda para benefícios VIP",
    label: "VIP",
  },
  cash: {
    url: "/manus-storage/playstorcraft-cash-category_c3a83ee5.png",
    fallbackUrl: `${githubIconBase}/cash.svg`,
    alt: "Ilustração de moedas e cristais esmeralda para Cash",
    label: "Cash",
  },
  booster: {
    url: "/manus-storage/playstorcraft-booster-category_758429ad.png",
    fallbackUrl: `${githubIconBase}/rocket-launch.svg`,
    alt: "Ilustração de poção encantada para Booster",
    label: "Booster",
  },
} as const;

export function getCatalogVisual(source: CatalogVisualSource) {
  const category = (source.categoryName ?? "").toLocaleLowerCase("pt-BR");
  if (source.kind === "COINS" || /cash|coin|moeda/.test(category)) return categoryArt.cash;
  if (source.kind === "KIT" || source.kind === "COSMETIC" || /booster|boost|poten/.test(category)) return categoryArt.booster;
  return categoryArt.vip;
}

export function getVipPreview(source: { kind?: CatalogVisualSource["kind"]; shortDescription?: string | null; description?: string | null }) {
  const text = source.kind === "VIP" ? source.description?.trim() || source.shortDescription?.trim() : source.shortDescription?.trim() || source.description?.trim();
  return text ? text.replace(/\s+/g, " ") : null;
}

export function getVipBenefits(source: { shortDescription?: string | null; description?: string | null }) {
  const content = source.description?.trim() || source.shortDescription?.trim() || "";
  const genericVip = content.match(/^Acesso ao grupo\s+(.+?)\s+durante\s+(\d+)\s+dias\.?$/i);
  if (genericVip) return [`Grupo incluído: ${genericVip[1]}.`, `Duração: ${genericVip[2]} dias.`];
  return content
    .split(/\n+|[•;]|(?<=[.!?])\s+/)
    .map(item => item.replace(/^[-–]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function getBestVipValue<T extends { id: number; durationDays?: number | null; priceCents: number }>(products: T[]) {
  const comparable = products.filter(product => Boolean(product.durationDays && product.durationDays > 0 && product.priceCents > 0));
  if (!comparable.length) return undefined;
  return comparable.reduce((best, product) => product.priceCents / product.durationDays! < best.priceCents / best.durationDays! ? product : best);
}
