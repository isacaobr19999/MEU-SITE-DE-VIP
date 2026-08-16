import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, Radio, Server, Users } from "lucide-react";

const minecraftStatusLabel = {
  UNKNOWN: "Aguardando dados do servidor",
  ONLINE: "Servidor online",
  OFFLINE: "Servidor offline",
  MAINTENANCE: "Servidor em manutenção",
} as const;

export function DiscordCommunity() {
  const community = trpc.community.status.useQuery();
  const status = community.data;
  const canJoin = Boolean(status?.discordInviteUrl);
  const minecraftStatus = status?.minecraftStatus ?? "UNKNOWN";

  return <section id="discord" className="discord-community-section border-y border-white/[.08] py-16 sm:py-20">
    <div className="container grid items-center gap-8 lg:grid-cols-[1fr_.9fr]">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/[.08] px-3 py-1.5 text-[10px] font-bold tracking-[.15em] text-indigo-100"><MessageCircle size={14} /> COMUNIDADE OFICIAL</div>
        <h2 className="font-display max-w-xl text-3xl font-bold text-white sm:text-4xl">Sua aventura continua no <span className="text-indigo-200">Discord</span>.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Receba novidades, encontre jogadores e acompanhe os avisos do servidor em uma comunidade integrada à sua experiência na PlayStorCraft.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {canJoin ? <a href={status?.discordInviteUrl ?? undefined} target="_blank" rel="noreferrer"><Button className="h-12 rounded-xl bg-indigo-300 px-5 font-bold text-slate-950 shadow-[0_14px_30px_rgba(129,140,248,.16)] hover:bg-indigo-200"><MessageCircle size={18} /> Entrar no Discord <ExternalLink size={15} /></Button></a> : <Button disabled className="h-12 rounded-xl bg-indigo-300/40 px-5 font-bold text-slate-900">Convite em configuração</Button>}
          <span className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={16} className="text-emerald-300" /> Integração segura, sem token no site</span>
        </div>
      </div>
      <aside className="discord-status-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-indigo-200/25 bg-indigo-300/15 text-indigo-100">{status?.discordIconUrl ? <img src={status.discordIconUrl} alt="Ícone da comunidade Discord" className="h-full w-full object-cover" /> : <MessageCircle size={23} />}</div><div className="min-w-0"><p className="section-kicker text-indigo-200">DISCORD</p><h3 className="truncate font-display text-xl font-bold text-white">{status?.discordName ?? "Comunidade PlayStorCraft"}</h3></div></div><span className={`mt-1 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status?.discordOnline ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[.04] text-slate-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${status?.discordOnline ? "bg-emerald-300 shadow-[0_0_8px_currentColor]" : "bg-slate-500"}`} />{status?.discordOnline ? "CONECTADO" : "AGUARDANDO"}</span></div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[.08] bg-black/15 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Users size={15} className="text-indigo-200" /> Comunidade</div><p className="mt-2 font-mono text-2xl font-bold text-white">{community.isLoading ? <Loader2 className="animate-spin text-indigo-200" size={21} /> : status?.discordMemberCount?.toLocaleString("pt-BR") ?? "—"}</p><p className="mt-1 text-xs text-slate-500">membros registrados</p></div><div className="rounded-xl border border-white/[.08] bg-black/15 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Radio size={15} className="text-emerald-300" /> Agora no Discord</div><p className="mt-2 font-mono text-2xl font-bold text-white">{community.isLoading ? <Loader2 className="animate-spin text-emerald-300" size={21} /> : status?.discordOnlineCount?.toLocaleString("pt-BR") ?? "—"}</p><p className="mt-1 text-xs text-slate-500">membros online</p></div></div>
        <div className="relative mt-3 rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Server size={16} className="text-emerald-300" /> Paper 1.21.x</div><span className={`text-xs font-bold ${minecraftStatus === "ONLINE" ? "text-emerald-200" : minecraftStatus === "MAINTENANCE" ? "text-amber-200" : "text-slate-400"}`}>{minecraftStatusLabel[minecraftStatus]}</span></div><div className="mt-3 flex items-end justify-between gap-4"><p className="max-w-[17rem] text-xs leading-5 text-slate-500">{status?.minecraftMotd ?? "O bot poderá publicar aqui o status e os avisos do servidor."}</p>{typeof status?.minecraftPlayersOnline === "number" ? <span className="font-mono text-sm font-bold text-emerald-200">{status.minecraftPlayersOnline}/{status.minecraftPlayersMax ?? "—"}</span> : null}</div></div>
      </aside>
    </div>
  </section>;
}
