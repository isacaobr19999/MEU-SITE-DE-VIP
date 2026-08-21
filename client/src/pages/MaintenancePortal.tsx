import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CalendarClock, CheckCircle2, CircleAlert, Loader2, LockKeyhole, LogIn, ShieldCheck, Store } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

function MaintenanceLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível entrar no painel de manutenção.");
      navigate("/maintenance");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar no painel de manutenção.");
    } finally {
      setPending(false);
    }
  }
  return <main className="minecraft-utility-page grid min-h-screen place-items-center px-5 py-8 text-slate-100"><section className="minecraft-auth-panel w-full max-w-md p-6 sm:p-8"><div className="minecraft-utility-icon grid h-12 w-12 place-items-center text-amber-200"><LockKeyhole size={22} /></div><p className="section-kicker mt-6">ACESSO RESTRITO</p><h1 className="font-pixel mt-3 text-2xl font-bold text-white">Painel de manutenção</h1><p className="mt-3 text-sm leading-6 text-slate-400">Entre com o e-mail e a senha de uma conta administrativa para controlar a disponibilidade da loja.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">E-mail administrativo</span><Input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@email.com" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Senha</span><Input required minLength={10} type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Sua senha" /></label>{error ? <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-3 py-2 text-sm text-rose-200">{error}</p> : null}<Button disabled={pending} className="minecraft-cta w-full">{pending ? <Loader2 className="animate-spin" /> : <LogIn size={17} />} Entrar no painel</Button></form><Link href="/" className="minecraft-backlink mt-5 inline-flex text-xs">Voltar para a loja</Link></section></main>;
}

export function LoginAttemptAudit() {
  const attempts = trpc.admin.loginAttempts.useQuery({ limit: 12 });
  return <section className="surface-panel rounded-[1.75rem] p-5 sm:p-7"><div><p className="section-kicker">SEGURANÇA DE ACESSO</p><h2 className="mt-2 text-xl font-bold text-white">Tentativas recentes de login</h2><p className="mt-2 text-sm leading-6 text-slate-400">A lista mostra somente um identificador de e-mail minimizado e o resultado. Senhas, IPs e tokens não são registrados.</p></div><div className="mt-5 space-y-2">{attempts.isLoading ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : attempts.data?.length ? attempts.data.map(attempt => <div key={attempt.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-white/[.025] px-4 py-3"><div><p className="text-sm font-semibold text-slate-100">{attempt.emailHint}</p><p className="mt-1 text-xs text-slate-500">{new Date(attempt.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${attempt.outcome === "SUCCESS" ? "bg-emerald-300/10 text-emerald-100" : "bg-rose-300/10 text-rose-100"}`}>{attempt.outcome === "SUCCESS" ? "Permitido" : "Recusado"}</span></div>) : <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">Ainda não há tentativas registradas.</div>}</div></section>;
}

export default function MaintenancePortal() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const control = trpc.admin.maintenanceControl.useQuery(undefined, { enabled: isAdmin });
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"CLOSED" | "CATALOG_ONLY">("CLOSED");
  const [reason, setReason] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  useEffect(() => {
    const settings = control.data?.settings;
    if (!settings) return;
    setMessage(settings.offlineMessage);
    setMode(settings.maintenanceMode);
    setReason(settings.maintenanceReason ?? "");
    setStartAt(settings.scheduledStartAt ? new Date(settings.scheduledStartAt).toISOString().slice(0, 16) : "");
    setEndAt(settings.scheduledEndAt ? new Date(settings.scheduledEndAt).toISOString().slice(0, 16) : "");
  }, [control.data]);
  const refresh = () => { utils.admin.maintenanceControl.invalidate(); utils.admin.storeAvailability.invalidate(); utils.store.availability.invalidate(); };
  const showError = (error: { message: string }) => toast.error(error.message || "Não foi possível concluir a ação.");
  const setManual = trpc.admin.setManualMaintenance.useMutation({ onSuccess: result => { toast.success(result.publicOnline ? "Loja reaberta." : "Manutenção aplicada com sucesso."); refresh(); }, onError: showError });
  const schedule = trpc.admin.scheduleMaintenance.useMutation({ onSuccess: () => { toast.success("Manutenção agendada."); refresh(); }, onError: showError });
  const cancel = trpc.admin.cancelMaintenanceSchedule.useMutation({ onSuccess: () => { toast.success("Agendamento cancelado."); refresh(); }, onError: showError });
  const testNotice = trpc.admin.sendMaintenanceNotificationTest.useMutation({ onSuccess: () => toast.success("Teste de aviso colocado na fila do Discord."), onError: showError });
  function apply(publicOnline: boolean) {
    if (!publicOnline && !window.confirm("Colocar a loja em manutenção agora? Novas compras serão pausadas.")) return;
    setManual.mutate({ publicOnline, mode, offlineMessage: message.trim(), reason: reason.trim() || undefined });
  }
  function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const start = new Date(startAt); const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return toast.error("Informe horários válidos de início e término.");
    schedule.mutate({ startAt: start, endAt: end, mode, offlineMessage: message.trim(), reason: reason.trim() || undefined });
  }
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#07111d]"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (!user) return <MaintenanceLogin />;
  if (!isAdmin) return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-center text-slate-100"><section className="surface-panel max-w-md rounded-[1.75rem] p-7"><ShieldCheck className="mx-auto text-rose-200" size={30} /><h1 className="mt-5 text-2xl font-bold">Acesso não autorizado</h1><p className="mt-3 text-sm leading-6 text-slate-400">Esta conta está autenticada, mas não possui permissão administrativa para controlar a manutenção.</p><Link href="/" className="mt-6 inline-flex text-sm font-bold text-emerald-200">Voltar para a loja</Link></section></main>;
  const online = control.data?.settings.publicOnline !== false;
  return <main className="min-h-screen bg-[#07111d] px-4 py-6 text-slate-100 sm:p-8"><section className="mx-auto max-w-4xl space-y-5"><header className="surface-panel flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7"><div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/[.08] text-amber-200"><Store size={20} /></span><div><p className="section-kicker">CONTROLE RESTRITO</p><h1 className="mt-1 text-2xl font-bold text-white">Painel de manutenção</h1></div></div><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Acesso isolado para manter a loja disponível, agendar pausas e comunicar a comunidade sem navegar pelo painel completo.</p></div><Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/[.05]">Painel completo</Link></header><section className={`rounded-2xl border p-4 ${online ? "border-emerald-300/20 bg-emerald-300/[.06]" : "border-amber-300/20 bg-amber-300/[.07]"}`}><div className="flex items-center gap-3"><span className={online ? "text-emerald-200" : "text-amber-200"}>{online ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}</span><div><strong>{online ? "Loja online" : "Manutenção ativa"}</strong><p className="mt-1 text-sm text-slate-400">{online ? "Compras e pagamentos estão liberados." : "Novas compras estão pausadas; pedidos confirmados continuam protegidos."}</p></div></div></section><section className="surface-panel rounded-[1.75rem] p-5 sm:p-7">{control.isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold text-slate-300">Modo de manutenção</span><select value={mode} onChange={event => setMode(event.target.value as "CLOSED" | "CATALOG_ONLY")} className="h-10 w-full rounded-xl border border-white/10 bg-[#0b1725] px-3 text-sm text-slate-100"><option value="CLOSED">Loja fechada</option><option value="CATALOG_ONLY">Somente catálogo</option></select></label><label><span className="mb-2 block text-sm font-semibold text-slate-300">Motivo interno</span><Input value={reason} onChange={event => setReason(event.target.value)} maxLength={280} placeholder="Ex.: atualização programada" /></label></div><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Mensagem para jogadores</span><Textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={280} className="min-h-24" /></label><div className="flex flex-wrap gap-2"><Button type="button" disabled={setManual.isPending} onClick={() => apply(false)} className="bg-amber-300 text-slate-950 hover:bg-amber-200">Ativar manutenção</Button><Button type="button" disabled={setManual.isPending} onClick={() => apply(true)} variant="outline" className="border-emerald-300/30 text-emerald-100 hover:bg-emerald-300/10">Reabrir loja</Button><Button type="button" disabled={testNotice.isPending} onClick={() => { if (window.confirm("Enviar um teste ao canal Discord sem alterar a loja?")) testNotice.mutate(); }} variant="outline" className="border-sky-300/30 text-sky-100 hover:bg-sky-300/10">Testar aviso</Button></div><form onSubmit={submitSchedule} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-start gap-3"><CalendarClock className="mt-0.5 text-sky-200" size={19} /><div><h2 className="font-semibold text-white">Agendamento automático</h2><p className="mt-1 text-sm leading-6 text-slate-400">Defina quando a manutenção começa e quando a loja volta automaticamente.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Início</span><Input type="datetime-local" value={startAt} onChange={event => setStartAt(event.target.value)} /></label><label><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Término</span><Input type="datetime-local" value={endAt} onChange={event => setEndAt(event.target.value)} /></label></div><div className="mt-4 flex flex-wrap gap-2"><Button type="submit" disabled={schedule.isPending} className="bg-sky-200 text-slate-950 hover:bg-sky-100">Agendar manutenção</Button>{["SCHEDULED", "ACTIVE"].includes(control.data?.settings.scheduleStatus ?? "NONE") ? <Button type="button" variant="outline" disabled={cancel.isPending} onClick={() => { if (window.confirm("Cancelar o agendamento atual?")) cancel.mutate(); }} className="border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Cancelar agendamento</Button> : null}</div></form></div>}</section></section></main>;
}
