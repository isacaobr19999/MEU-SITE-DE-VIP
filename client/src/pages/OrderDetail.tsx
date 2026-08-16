import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { StoreHeader } from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, Loader2, PackageCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function getOrderStatusMessage(status: string) {
  if (status === "FAILED") return { tone: "rose", message: "O pagamento não foi aprovado. Nenhuma entrega foi liberada para este pedido." };
  if (status === "CANCELLED") return { tone: "rose", message: "Este pedido foi cancelado. Nenhuma entrega foi liberada." };
  if (status === "COMPLETED") return { tone: "emerald", message: "O pagamento foi confirmado e a entrega foi concluída pelo servidor." };
  if (status === "PAID" || status === "PROCESSING") return { tone: "sky", message: "O pagamento foi confirmado. A entrega está sendo preparada para o servidor configurado." };
  return { tone: "emerald", message: "Após a confirmação do pagamento pelo gateway, o pedido avançará para processamento e a entrega será disponibilizada ao servidor configurado." };
}

export default function OrderDetail() {
  const { isAuthenticated, loading } = useAuth();
  const [, params] = useRoute("/orders/:id");
  const order = trpc.orders.byId.useQuery({ id: params?.id ?? "00000000-0000-0000-0000-000000000000" }, { enabled: isAuthenticated && Boolean(params?.id) });
  if (loading || order.isLoading) return <main className="account-page grid min-h-screen place-items-center"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (order.isError) return <main className="account-page grid min-h-screen place-items-center p-6 text-center text-white"><div className="account-guard"><h1 className="font-display text-2xl font-bold">Não foi possível carregar este pedido</h1><p className="mt-2 text-sm text-slate-400">Tente novamente em alguns instantes.</p><Button onClick={() => order.refetch()} className="mt-5 bg-emerald-300 text-slate-950 hover:bg-emerald-200">Tentar novamente</Button></div></main>;
  if (!isAuthenticated || !order.data) return <main className="account-page grid min-h-screen place-items-center p-6 text-center text-white"><div className="account-guard"><div className="status-orb mx-auto"><PackageCheck size={21} /></div><h1 className="font-display mt-5 text-2xl font-bold">Pedido não localizado</h1><Link href="/orders" className="mt-5 inline-flex text-sm font-bold text-emerald-300">Voltar aos pedidos</Link></div></main>;
  const detail = order.data;
  const statusInfo = getOrderStatusMessage(detail.status);
  const isWarning = statusInfo.tone === "rose";
  return <div className="account-page text-slate-100"><StoreHeader /><main className="px-5 py-8 sm:p-12"><div className="mx-auto max-w-3xl"><Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-200"><ArrowLeft size={16} /> Meus pedidos</Link><div className="surface-panel mt-7 overflow-hidden rounded-[1.6rem]"><div className="border-b border-white/10 p-6 sm:p-8"><p className="section-kicker">PEDIDO {detail.orderNumber}</p><div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-bold text-white">Acompanhamento da recompensa</h1><p className="mt-2 text-sm text-slate-400">Criado em {new Date(detail.createdAt).toLocaleString("pt-BR")}</p></div><span className={`rounded-xl border px-4 py-2 font-mono text-xs font-bold ${isWarning ? "border-rose-300/20 bg-rose-300/10 text-rose-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>{detail.status.replaceAll("_", " ")}</span></div></div><div className="space-y-3 p-6 sm:p-8">{detail.items.map(item => <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.025] p-4"><div><p className="font-semibold text-white">{item.productName}</p><p className="mt-1 text-xs text-slate-400">{item.durationDays ? `${item.durationDays} dias` : "Permanente"}</p></div><p className="font-mono text-sm font-bold text-emerald-200">{money.format(item.unitPriceCents / 100)}</p></div>)}</div><div className="space-y-3 border-t border-white/10 bg-black/10 p-6 sm:px-8"><div className="flex items-center justify-between text-sm"><span className="text-slate-400">Valor original</span><span className="font-mono text-slate-200">{money.format(detail.subtotalCents / 100)}</span></div>{detail.couponCode ? <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Cupom aplicado <strong className="font-mono text-emerald-200">{detail.couponCode}</strong></span><span className="font-mono text-emerald-200">-{money.format(detail.discountCents / 100)}</span></div> : null}<div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="text-sm font-semibold text-slate-300">Valor final</span><strong className="font-mono text-2xl text-white">{money.format(detail.totalCents / 100)}</strong></div></div></div><div className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm ${isWarning ? "border-rose-300/20 bg-rose-300/[.06] text-rose-50" : "border-emerald-300/15 bg-emerald-300/[.06] text-emerald-50"}`}>{isWarning ? <AlertTriangle className="shrink-0 text-rose-300" size={20} /> : <PackageCheck className="shrink-0 text-emerald-300" size={20} />}<p>{statusInfo.message}</p></div></div></main></div>;
}
