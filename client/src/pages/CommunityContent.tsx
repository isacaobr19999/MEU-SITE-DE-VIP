import { StoreHeader } from "@/components/StoreHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpenText, CalendarDays, Loader2, Newspaper, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

type CommunityKind = "RULE" | "NEWS";

const pageCopy: Record<CommunityKind, { eyebrow: string; title: string; description: string; empty: string; icon: typeof ShieldCheck; alternateLabel: string; alternatePath: string }> = {
  RULE: {
    eyebrow: "COMUNIDADE PLAYSTORCRAFT",
    title: "Regras para uma aventura justa.",
    description: "As regras oficiais da comunidade são organizadas aqui para que todos joguem com segurança, respeito e clareza.",
    empty: "As regras oficiais serão publicadas pela administração em breve.",
    icon: ShieldCheck,
    alternateLabel: "Ver novidades",
    alternatePath: "/news",
  },
  NEWS: {
    eyebrow: "CENTRAL DE NOVIDADES",
    title: "Acompanhe o que acontece no servidor.",
    description: "Atualizações, eventos e comunicados importantes da PlayStorCraft aparecem aqui assim que forem publicados.",
    empty: "Ainda não há novidades publicadas. Volte em breve para acompanhar o servidor.",
    icon: Newspaper,
    alternateLabel: "Ver regras",
    alternatePath: "/rules",
  },
};

export function CommunityContent({ kind }: { kind: CommunityKind }) {
  const copy = pageCopy[kind];
  const Icon = copy.icon;
  const posts = trpc.community.posts.useQuery({ kind });
  return <div className="min-h-screen overflow-x-hidden bg-[#07111d] text-slate-100 selection:bg-emerald-300 selection:text-slate-950">
    <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:36px_36px]" />
    <StoreHeader />
    <main className="relative z-10 container pb-20 pt-14 sm:pt-20">
      <div className="surface-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <Link href="/" className="relative inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-emerald-200"><ArrowLeft size={16} /> Voltar à loja</Link>
        <div className="relative mt-10 max-w-3xl"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"><Icon size={23} /></div><p className="section-kicker mt-6">{copy.eyebrow}</p><h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{copy.title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{copy.description}</p></div>
      </div>
      <section className="mt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold text-white">{kind === "RULE" ? "Orientações publicadas" : "Publicações recentes"}</h2><Link href={copy.alternatePath}><Button variant="outline" className="border-white/10 text-slate-200 hover:bg-white/[.06]">{copy.alternateLabel}</Button></Link></div>
        {posts.isLoading ? <div className="grid min-h-60 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : posts.isError ? <div className="rounded-[1.6rem] border border-rose-300/20 bg-rose-300/[.06] p-7 text-center"><h2 className="font-bold text-white">Não foi possível carregar este conteúdo</h2><p className="mt-2 text-sm text-slate-400">Verifique a conexão e tente novamente.</p><Button onClick={() => posts.refetch()} variant="outline" className="mt-5 border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Tentar novamente</Button></div> : posts.data?.length ? <div className="grid gap-5 lg:grid-cols-2">{posts.data.map((post, index) => <article key={post.id} className="surface-panel rounded-[1.6rem] p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><span className="font-mono text-xs font-bold text-emerald-200">{String(index + 1).padStart(2, "0")}</span>{kind === "NEWS" && post.publishedAt ? <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13} />{new Date(post.publishedAt).toLocaleDateString("pt-BR")}</span> : null}</div><h2 className="font-display mt-5 text-2xl font-bold text-white">{post.title}</h2>{post.summary ? <p className="mt-3 text-sm font-medium leading-6 text-emerald-100">{post.summary}</p> : null}<p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">{post.body}</p></article>)}</div> : <div className="surface-panel grid min-h-60 place-items-center rounded-[1.6rem] p-8 text-center"><div><BookOpenText className="mx-auto text-emerald-300" size={32} /><p className="mt-4 max-w-md text-sm leading-6 text-slate-400">{copy.empty}</p></div></div>}
      </section>
    </main>
  </div>;
}

export function RulesPage() { return <CommunityContent kind="RULE" />; }
export function NewsPage() { return <CommunityContent kind="NEWS" />; }
