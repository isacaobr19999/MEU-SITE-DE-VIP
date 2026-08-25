import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ADMIN_THEME_STORAGE_KEY, parseAdminTheme, persistAdminTheme, type AdminTheme } from "@/lib/adminTheme";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { useState } from "react";

function AdminAppearanceContent() {
  const [selected, setSelected] = useState<AdminTheme>(() => parseAdminTheme(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)));
  const save = (theme: AdminTheme) => { setSelected(theme); persistAdminTheme(theme); };

  return <div className="admin-appearance mx-auto max-w-5xl space-y-6"><header className="admin-page-header"><p className="section-kicker">PREFERÊNCIAS</p><h1>Aparência do painel</h1><p>Visualize cada tema antes de aplicá-lo. Esta preferência é mantida somente nas áreas administrativas deste navegador.</p></header><section className="grid gap-5 md:grid-cols-2">{(["dark", "light"] as const).map(theme => <article key={theme} className={`theme-preview-card theme-preview-card--${theme} ${selected === theme ? "is-selected" : ""}`}><div className="theme-preview-card__screen"><div className="theme-preview-card__bar"><span>{theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}</span><i /><i /></div><div className="theme-preview-card__body"><aside><b /><b /><b /></aside><div><span /><span /><div /></div></div></div><div className="mt-5 flex items-start justify-between gap-4"><div><p className="section-kicker">{theme === "dark" ? "MODO ESCURO" : "MODO CLARO"}</p><h2>{theme === "dark" ? "Operação noturna" : "Clareza diurna"}</h2><p>{theme === "dark" ? "Mantém o painel imersivo e confortável em ambientes escuros." : "Aumenta a luminosidade dos cartões e a leitura em ambientes claros."}</p></div>{selected === theme ? <span className="theme-preview-card__check"><Check size={16} /></span> : null}</div><Button type="button" onClick={() => save(theme)} className={selected === theme ? "mt-5 w-full bg-emerald-300 text-slate-950 hover:bg-emerald-200" : "mt-5 w-full"} variant={selected === theme ? "default" : "outline"}>{selected === theme ? "Tema aplicado" : "Visualizar e aplicar"}</Button></article>)}</section><div className="surface-panel flex items-start gap-3 rounded-[1.25rem] p-4"><Palette className="mt-0.5 text-emerald-300" size={19} /><p className="text-sm leading-6 text-slate-300">A vitrine pública continua no tema oficial PlayStorCraft. Apenas a área de gestão muda quando a preferência é aplicada.</p></div></div>;
}

export default function AdminAppearance() { return <DashboardLayout><AdminAppearanceContent /></DashboardLayout>; }
