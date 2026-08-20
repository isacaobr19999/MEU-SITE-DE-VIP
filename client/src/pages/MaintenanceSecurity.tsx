import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { LoginAttemptAudit } from "./MaintenancePortal";

export default function MaintenanceSecurity() {
  const { user, loading } = useAuth();
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#07111d]"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-center text-slate-100"><section className="surface-panel max-w-md rounded-[1.75rem] p-7"><ShieldCheck className="mx-auto text-amber-200" size={30} /><h1 className="mt-5 text-2xl font-bold">Autenticação necessária</h1><p className="mt-3 text-sm leading-6 text-slate-400">Entre no painel de manutenção antes de consultar o registro de segurança.</p><Link href="/maintenance" className="mt-6 inline-flex text-sm font-bold text-emerald-200">Ir para o login de manutenção</Link></section></main>;
  if (user.role !== "admin") return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-center text-slate-100"><section className="surface-panel max-w-md rounded-[1.75rem] p-7"><ShieldCheck className="mx-auto text-rose-200" size={30} /><h1 className="mt-5 text-2xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-sm leading-6 text-slate-400">Somente administradores podem consultar a auditoria de login.</p></section></main>;
  return <main className="min-h-screen bg-[#07111d] px-4 py-6 text-slate-100 sm:p-8"><section className="mx-auto max-w-4xl"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="section-kicker">PAINEL DE MANUTENÇÃO</p><h1 className="mt-2 text-2xl font-bold text-white">Auditoria de acesso</h1></div><Link href="/maintenance" className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/[.05]">Voltar ao painel</Link></header><LoginAttemptAudit /></section></main>;
}
