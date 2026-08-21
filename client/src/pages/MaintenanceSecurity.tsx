import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Loader2, ShieldCheck, TicketCheck, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { LoginAttemptAudit } from "./MaintenancePortal";

function LoginLockoutsPanel() {
  const utils = trpc.useUtils();
  const lockouts = trpc.admin.loginLockouts.useQuery({ limit: 25 });
  const release = trpc.admin.releaseLoginLockout.useMutation({
    onSuccess: () => { toast.success("Bloqueio temporário removido."); utils.admin.loginLockouts.invalidate(); },
    onError: error => toast.error(error.message || "Não foi possível liberar o bloqueio."),
  });
  return <section className="minecraft-utility-card p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">CONTROLES DE SEGURANÇA</p><h2 className="font-pixel mt-2 text-xl font-bold text-white">Bloqueios temporários ativos</h2><p className="mt-2 text-sm leading-6 text-slate-400">A liberação é manual e registrada. Somente a impressão criptográfica do login é exibida.</p></div><span className="minecraft-utility-icon grid h-10 w-10 place-items-center text-amber-200"><AlertTriangle size={18} /></span></div><div className="mt-5 space-y-2">{lockouts.isLoading ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : lockouts.data?.length ? lockouts.data.map(lockout => <div key={lockout.emailHash} className="minecraft-utility-stat flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs text-slate-200">{lockout.emailHash.slice(0, 12)}••••••••</p><p className="mt-1 text-xs text-slate-400">{lockout.failedAttempts} falhas · encerra em {new Date(lockout.lockedUntil!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div><Button type="button" size="sm" variant="outline" disabled={release.isPending} onClick={() => { if (window.confirm("Liberar este bloqueio de login agora?")) release.mutate({ emailHash: lockout.emailHash }); }} className="border-emerald-300/30 text-emerald-100 hover:bg-emerald-300/10"><Unlock size={15} /> Liberar</Button></div>) : <div className="minecraft-empty-state px-4 py-6 text-center text-sm text-slate-500">Nenhum bloqueio temporário está ativo.</div>}</div></section>;
}

function TicketMetricsPanel() {
  const metrics = trpc.admin.ticketMetrics.useQuery();
  const total = metrics.data?.reduce((sum, item) => sum + item.closedTickets, 0) ?? 0;
  const max = Math.max(1, ...(metrics.data?.map(item => item.closedTickets) ?? []));
  return <section className="minecraft-utility-card p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="section-kicker">ATENDIMENTO</p><h2 className="font-pixel mt-2 text-xl font-bold text-white">Tickets encerrados</h2><p className="mt-2 text-sm leading-6 text-slate-400">Métricas mensais formadas somente por metadados de transcrições registradas no ChatLog privado.</p></div><span className="minecraft-utility-icon grid h-10 w-10 place-items-center text-sky-200"><TicketCheck size={18} /></span></div>{metrics.isLoading ? <div className="grid h-36 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : <><p className="mt-5 text-3xl font-bold text-white">{total}<span className="ml-2 text-sm font-medium text-slate-400">nos últimos 6 meses</span></p><div className="mt-5 grid grid-cols-6 gap-2">{metrics.data?.map(item => <div key={item.key} className="min-w-0 text-center"><div className="minecraft-utility-stat flex h-20 items-end"><div className="w-full rounded-t-md bg-sky-300/75 transition-[height] duration-200" style={{ height: `${Math.max(4, (item.closedTickets / max) * 100)}%` }} title={`${item.closedTickets} tickets encerrados`} /></div><p className="mt-2 truncate text-[10px] font-bold uppercase text-slate-500">{item.label}</p><p className="text-xs font-semibold text-slate-200">{item.closedTickets}</p></div>)}</div></>}</section>;
}

export default function MaintenanceSecurity() {
  const { user, loading } = useAuth();
  if (loading) return <main className="minecraft-utility-page grid min-h-screen place-items-center"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (!user) return <main className="minecraft-utility-page grid min-h-screen place-items-center px-5 text-center text-slate-100"><section className="minecraft-auth-panel max-w-md p-7"><ShieldCheck className="mx-auto text-amber-200" size={30} /><h1 className="font-pixel mt-5 text-2xl font-bold">Autenticação necessária</h1><p className="mt-3 text-sm leading-6 text-slate-400">Entre no painel de manutenção antes de consultar o registro de segurança.</p><Link href="/maintenance" className="minecraft-backlink mt-6 inline-flex text-sm">Ir para o login de manutenção</Link></section></main>;
  if (user.role !== "admin") return <main className="minecraft-utility-page grid min-h-screen place-items-center px-5 text-center text-slate-100"><section className="minecraft-auth-panel max-w-md p-7"><ShieldCheck className="mx-auto text-rose-200" size={30} /><h1 className="font-pixel mt-5 text-2xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-sm leading-6 text-slate-400">Somente administradores podem consultar a auditoria de login.</p></section></main>;
  return <main className="minecraft-utility-page min-h-screen px-4 py-6 text-slate-100 sm:p-8"><section className="mx-auto max-w-5xl"><header className="minecraft-utility-card mb-5 flex flex-wrap items-center justify-between gap-3 p-5 sm:p-7"><div><p className="section-kicker">PAINEL DE MANUTENÇÃO</p><h1 className="font-pixel mt-2 text-2xl font-bold text-white">Auditoria de acesso</h1></div><Link href="/maintenance" className="minecraft-backlink inline-flex h-10 items-center">Voltar ao painel</Link></header><div className="grid gap-5 lg:grid-cols-2"><LoginLockoutsPanel /><TicketMetricsPanel /></div><div className="mt-5"><LoginAttemptAudit /></div></section></main>;
}
