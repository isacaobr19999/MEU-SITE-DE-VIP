import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, CloudCog, Loader2, PackageOpen, RadioTower, RefreshCw, ServerCog, UsersRound } from "lucide-react";
import { Link } from "wouter";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function statusTone(status: string) {
  if (["ONLINE", "COMPLETED", "PAID"].includes(status)) return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (["DEGRADED", "PENDING", "RETRYING", "CLAIMED", "PROCESSING"].includes(status)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-rose-300/20 bg-rose-300/10 text-rose-100";
}

function CommandCenterContent() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const center = trpc.admin.operationsCenter.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000, refetchIntervalInBackground: false });
  const monitoring = trpc.admin.monitoring.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000, refetchIntervalInBackground: false });

  if (loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div>;
  if (!isAdmin) return <div className="grid min-h-screen place-items-center bg-[#07111d] p-6 text-center text-white"><div><AlertTriangle className="mx-auto text-rose-300" /><h1 className="mt-4 text-2xl font-bold">Área restrita</h1><Link href="/" className="mt-5 inline-flex text-sm font-bold text-emerald-300">Voltar à loja</Link></div></div>;

  const overview = center.data?.overview;
  const attentionCount = (overview?.pendingOrders ?? 0) + (overview?.pendingDeliveries ?? 0) + (overview?.failedDeliveries ?? 0);
  const services = monitoring.data?.services ?? [];

  return <div className="mx-auto max-w-7xl space-y-5 text-slate-100">
    <header className="admin-page-header">
      <div><p className="section-kicker">COMANDO OPERACIONAL</p><h1>Uma leitura para agir com segurança.</h1><p>Priorize entregas, pagamentos, saúde dos serviços e os últimos eventos sem precisar cruzar telas.</p></div>
      <div className="admin-page-header__actions"><Button type="button" variant="outline" onClick={() => { void Promise.all([center.refetch(), monitoring.refetch()]); }} className="border-white/10 bg-white/[.03] text-slate-100 hover:bg-white/[.08]"><RefreshCw size={16} /> Atualizar agora</Button><Link href="/admin/operations" className="admin-link-button"><ClipboardList size={16} /> Abrir operações</Link></div>
    </header>

    <section className={`rounded-[1.4rem] border p-5 ${attentionCount ? "border-amber-300/20 bg-amber-300/[.05]" : "border-emerald-300/20 bg-emerald-300/[.05]"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${attentionCount ? "bg-amber-300/15 text-amber-200" : "bg-emerald-300/15 text-emerald-200"}`}>{attentionCount ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}</span><div><p className="text-sm font-bold text-white">{attentionCount ? `${attentionCount} item(ns) precisam de acompanhamento` : "Nenhuma pendência operacional crítica"}</p><p className="mt-1 text-sm text-slate-400">{attentionCount ? "Revise a fila antes de alterar catálogo ou abrir novas campanhas." : "Os principais indicadores não apontam pedidos ou entregas pendentes."}</p></div></div><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-white/8 text-slate-200">{overview?.pendingOrders ?? 0} pedido(s)</Badge><Badge className="border-0 bg-white/8 text-slate-200">{overview?.pendingDeliveries ?? 0} na fila</Badge><Badge className={`border ${overview?.failedDeliveries ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-white/8 bg-white/[.03] text-slate-300"}`}>{overview?.failedDeliveries ?? 0} falha(s)</Badge></div></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Vendas hoje", value: money.format((overview?.salesTodayCents ?? 0) / 100), detail: "Pagamentos confirmados", icon: Activity }, { label: "Vendas no mês", value: money.format((overview?.salesMonthCents ?? 0) / 100), detail: "Faturamento confirmado", icon: ClipboardList }, { label: "Jogadores", value: String(overview?.playerCount ?? 0), detail: "Perfis cadastrados", icon: UsersRound }, { label: "Entregas abertas", value: String((overview?.pendingDeliveries ?? 0) + (overview?.failedDeliveries ?? 0)), detail: "Fila e exceções", icon: PackageOpen }].map(item => <article key={item.label} className="admin-metric-card"><div><p>{item.label}</p><strong>{item.value}</strong><small>{item.detail}</small></div><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-300/[.07] text-sky-100"><item.icon size={18} /></span></article>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <article className="surface-panel rounded-[1.4rem] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="section-kicker">FILA PRIORITÁRIA</p><h2>Entregas que exigem atenção</h2><p>As ações continuam protegidas por estado e não repetem comandos concluídos.</p></div><Link href="/admin/operations" className="admin-section-link">Ver todas <ArrowRight size={14} /></Link></div><div className="mt-5 space-y-2">{center.isLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : center.data?.attentionDeliveries.length ? center.data.attentionDeliveries.map(delivery => <div key={delivery.id} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Link href={`/admin/players/${delivery.playerId}`} className="font-semibold text-white hover:text-emerald-200">{delivery.playerName}</Link><span className="font-mono text-[11px] text-slate-500">{delivery.orderNumber}</span></div><p className="mt-1 text-xs text-slate-400">{delivery.serverName} · tentativa {delivery.attemptCount}/{delivery.maxAttempts} · atualização {new Date(delivery.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>{delivery.lastError ? <p className="mt-2 text-xs text-rose-200">{delivery.lastError}</p> : null}</div><Link href={`/admin/deliveries/${delivery.id}`} className="admin-section-link">Analisar <ArrowRight size={14} /></Link></div></div>) : <div className="rounded-2xl border border-dashed border-emerald-300/20 p-6 text-center text-sm text-slate-400"><CheckCircle2 className="mx-auto mb-2 text-emerald-300" size={20} />Nenhuma entrega pendente ou com falha.</div>}</div></article>
      <article className="surface-panel rounded-[1.4rem] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="section-kicker">SAÚDE DA PLATAFORMA</p><h2>Loja, API, Discord e Minecraft</h2><p>Indicadores atualizados enquanto este painel permanece aberto.</p></div><Link href="/admin/monitoring" className="admin-section-link">Monitorar <ArrowRight size={14} /></Link></div><div className="mt-5 grid gap-2">{services.map(service => <div key={service.serviceKey} className="flex items-center justify-between rounded-2xl border border-white/[.08] bg-white/[.025] p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.04] text-sky-200"><ServerCog size={16} /></span><div><strong className="block text-sm text-white">{service.label}</strong><small className="text-xs text-slate-500">{service.lastCheckedAt ? `Verificado ${new Date(service.lastCheckedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : "Sem verificação registrada"}</small></div></div><Badge className={`border text-[10px] ${statusTone(service.currentStatus)}`}>{service.currentStatus}</Badge></div>)}{!services.length && !monitoring.isLoading ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400"><RadioTower className="mx-auto mb-2 text-slate-500" size={20} />Aguardando o primeiro relatório de monitoramento.</div> : null}</div></article>
    </section>

    <section className="grid gap-5 xl:grid-cols-2"><article className="surface-panel rounded-[1.4rem] p-5 sm:p-6"><p className="section-kicker">MOVIMENTAÇÃO COMERCIAL</p><h2>Pedidos recentes</h2><div className="mt-5 space-y-2">{center.data?.recentOrders.map(order => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><div><Link href={`/admin/players/${order.playerId}`} className="font-semibold text-white hover:text-emerald-200">{order.playerName}</Link><p className="font-mono text-xs text-slate-500">{order.orderNumber}</p></div><div className="text-right"><strong className="block text-sm text-emerald-100">{money.format(order.totalCents / 100)}</strong><small className="text-xs text-slate-500">{order.status}</small></div></div>)}</div></article><article className="surface-panel rounded-[1.4rem] p-5 sm:p-6"><p className="section-kicker">AUDITORIA</p><h2>Últimas ações registradas</h2><div className="mt-5 space-y-2">{center.data?.recentAudit.map(event => <div key={event.id} className="rounded-xl border border-white/[.08] bg-white/[.025] p-3"><div className="flex items-center justify-between gap-2"><strong className="font-mono text-xs text-emerald-200">{event.action}</strong><small className="text-[11px] text-slate-500">{new Date(event.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</small></div><p className="mt-1 text-sm text-slate-300">{event.entityType}{event.entityId ? ` · ${event.entityId}` : ""} <span className="text-slate-500">por {event.actorType}</span></p></div>)}</div></article></section>
    <section className="admin-growth-strip"><CloudCog size={18} /><p><strong>Ritmo seguro:</strong> a atualização automática ocorre somente enquanto esta tela está aberta; não cria temporizadores no servidor nem altera estados por conta própria.</p><Link href="/admin/insights" className="font-bold text-emerald-200 hover:text-emerald-100">Abrir relatórios <ArrowRight className="inline" size={14} /></Link></section>
  </div>;
}

export default function AdminCommandCenter() { return <DashboardLayout><CommandCenterContent /></DashboardLayout>; }
