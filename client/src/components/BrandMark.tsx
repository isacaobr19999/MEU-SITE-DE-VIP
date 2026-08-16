import { Gem } from "lucide-react";
import { Link } from "wouter";

export function BrandMark({ compact = false, href = "/", className = "" }: { compact?: boolean; href?: string; className?: string }) {
  return <Link href={href} className={`brand-mark ${compact ? "brand-mark--compact" : ""} ${className}`} aria-label="PlayStorCraft — voltar à loja">
    <span className="brand-mark__emblem"><Gem size={compact ? 15 : 18} strokeWidth={2.5} /></span>
    {!compact ? <span className="brand-mark__word"><b>PlayStor</b><em>Craft</em></span> : null}
  </Link>;
}
