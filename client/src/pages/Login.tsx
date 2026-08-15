import { Link, useLocation } from "wouter";
import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

type Mode = "login" | "register";

function validDestination(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const destination = validDestination(new URLSearchParams(window.location.search).get("next"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível concluir a autenticação.");
      navigate(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a autenticação.");
    } finally {
      setPending(false);
    }
  }

  return <main className="min-h-screen overflow-hidden bg-[#07111d] px-4 py-8 text-slate-100 sm:grid sm:place-items-center sm:p-8">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,.16),transparent_24rem),radial-gradient(circle_at_88%_85%,rgba(59,130,246,.13),transparent_25rem)]" />
    <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30 backdrop-blur sm:grid-cols-[.9fr_1.1fr]">
      <div className="hidden border-r border-white/10 bg-emerald-300 p-10 text-slate-950 sm:flex sm:flex-col">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-emerald-300">P</span>PlayStorCraft</Link>
        <div className="my-auto"><p className="font-mono text-xs font-bold tracking-[.18em] text-slate-700">CONTA DO JOGADOR</p><h1 className="mt-4 text-4xl font-black leading-tight">Entre e acompanhe cada conquista.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-700">Seu histórico de pedidos e as entregas vinculadas ao seu jogador ficam protegidos em uma única conta.</p></div>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700"><ShieldCheck size={20} /> Credenciais protegidas no servidor</div>
      </div>
      <div className="p-6 sm:p-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-200 sm:hidden">← Voltar à loja</Link>
        <div className="mt-7 sm:mt-0"><p className="font-mono text-xs font-bold tracking-[.16em] text-emerald-300">PLAYSTORCRAFT</p><h2 className="mt-3 text-3xl font-black text-white">{mode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2><p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Use seus dados para continuar suas compras." : "O primeiro cadastro recebe acesso administrativo inicial."}</p></div>
        <div className="mt-7 grid grid-cols-2 rounded-xl bg-white/[.045] p-1 text-sm font-bold"><button type="button" onClick={() => { setMode("login"); setError(null); }} className={`rounded-lg px-3 py-2 transition ${mode === "login" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>Entrar</button><button type="button" onClick={() => { setMode("register"); setError(null); }} className={`rounded-lg px-3 py-2 transition ${mode === "register" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>Cadastrar</button></div>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "register" && <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Nome</span><span className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-3 focus-within:border-emerald-300"><UserRound size={18} className="text-slate-500" /><input required minLength={2} value={name} onChange={event => setName(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="Seu nome" /></span></label>}
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">E-mail</span><span className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-3 focus-within:border-emerald-300"><Mail size={18} className="text-slate-500" /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="voce@email.com" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Senha</span><span className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.035] px-3 focus-within:border-emerald-300"><LockKeyhole size={18} className="text-slate-500" /><input required minLength={10} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder={mode === "register" ? "Mínimo de 10 caracteres" : "Sua senha"} /></span></label>
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-200">{error}</p>}
          <button disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">{pending && <Loader2 className="animate-spin" size={17} />}{mode === "login" ? "Entrar com segurança" : "Criar conta"}</button>
        </form>
      </div>
    </section>
  </main>;
}
