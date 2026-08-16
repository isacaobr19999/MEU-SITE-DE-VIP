import { Link, useLocation } from "wouter";
import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

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

  return <main className="account-page grid min-h-screen overflow-hidden px-4 py-8 text-slate-100 sm:place-items-center sm:p-8">
    <section className="surface-panel relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] sm:grid-cols-[.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden border-r border-white/10 bg-[linear-gradient(155deg,#b8f7dc_0%,#5be0b1_48%,#42bde0_125%)] p-10 text-slate-950 sm:flex sm:flex-col">
        <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" /><div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-slate-950/15 blur-3xl" />
        <BrandMark className="relative" />
        <div className="relative my-auto"><p className="font-mono text-xs font-bold tracking-[.18em] text-slate-700">CONTA DO JOGADOR</p><h1 className="font-display mt-4 text-4xl font-extrabold leading-tight">Acompanhe cada recompensa conquistada.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-700">Seu histórico, descontos e entregas ficam organizados em uma única conta vinculada à sua jornada.</p></div>
        <div className="relative flex items-center gap-3 text-sm font-bold text-slate-700"><span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-950/10 bg-white/20"><ShieldCheck size={18} /></span> Credenciais protegidas no servidor</div>
      </div>
      <div className="p-6 sm:p-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-200 sm:hidden">← Voltar à loja</Link>
        <div className="mt-7 sm:mt-0"><BrandMark className="sm:hidden" /><p className="section-kicker mt-7 sm:mt-0">ACESSO SEGURO</p><h2 className="font-display mt-3 text-3xl font-extrabold text-white">{mode === "login" ? "Sua conta de jogador" : "Prepare sua conta"}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{mode === "login" ? "Entre para acompanhar benefícios, pedidos e entregas no servidor." : "Crie uma conta para manter sua progressão e histórico organizados."}</p></div>
        <div className="mt-7 grid grid-cols-2 rounded-xl border border-white/5 bg-black/15 p-1 text-sm font-bold"><button type="button" onClick={() => { setMode("login"); setError(null); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "login" ? "bg-emerald-200 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}>Entrar</button><button type="button" onClick={() => { setMode("register"); setError(null); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "register" ? "bg-emerald-200 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}>Cadastrar</button></div>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "register" && <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Nome</span><span className="field-shell flex items-center gap-3 rounded-xl px-3"><UserRound size={18} className="text-slate-500" /><input required minLength={2} value={name} onChange={event => setName(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="Seu nome" /></span></label>}
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">E-mail</span><span className="field-shell flex items-center gap-3 rounded-xl px-3"><Mail size={18} className="text-slate-500" /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="voce@email.com" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Senha</span><span className="field-shell flex items-center gap-3 rounded-xl px-3"><LockKeyhole size={18} className="text-slate-500" /><input required minLength={10} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder={mode === "register" ? "Mínimo de 10 caracteres" : "Sua senha"} /></span></label>
          {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-200">{error}</p>}
          <button disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-slate-950 shadow-[0_14px_30px_rgba(16,185,129,.15)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">{pending && <Loader2 className="animate-spin" size={17} />}{mode === "login" ? "Entrar com segurança" : "Criar conta"}</button>
        </form>
      </div>
    </section>
  </main>;
}
