export type CatalogVisualSource = {
  kind: "VIP" | "COINS" | "KIT" | "COSMETIC";
  categoryName?: string | null;
};

const categoryArt = {
  vip: {
    url: "/manus-storage/playstorcraft-vip-category_22e6314d.png",
    alt: "Ilustração de uma insígnia esmeralda para benefícios VIP",
    label: "VIP",
  },
  cash: {
    url: "/manus-storage/playstorcraft-cash-category_c3a83ee5.png",
    alt: "Ilustração de moedas e cristais esmeralda para Cash",
    label: "Cash",
  },
  booster: {
    url: "/manus-storage/playstorcraft-booster-category_758429ad.png",
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

export function getVipPreview(source: { shortDescription?: string | null; description?: string | null }) {
  const text = source.shortDescription?.trim() || source.description?.trim();
  return text ? text.replace(/\s+/g, " ") : null;
}

export function getVipBenefits(source: { shortDescription?: string | null; description?: string | null }) {
  const content = source.description?.trim() || source.shortDescription?.trim() || "";
  return content
    .split(/\n+|[•;]|(?<=[.!?])\s+/)
    .map(item => item.replace(/^[-–]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}
