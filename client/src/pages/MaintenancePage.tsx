import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function MaintenancePage({ message, estimatedReturnAt }: { message: string; estimatedReturnAt?: Date | string | null }) {
  const returnDate = estimatedReturnAt ? new Date(estimatedReturnAt) : null;
  const estimatedReturn = returnDate && !Number.isNaN(returnDate.getTime()) ? returnDate.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : null;
  return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-center text-slate-100"><section className="surface-panel max-w-xl rounded-[1.75rem] p-7 sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/[.08] text-amber-200"><ShieldCheck size={26} /></div><p className="section-kicker mt-6">MANUTENÇÃO PROGRAMADA</p><h1 className="font-display mt-3 text-2xl font-bold leading-relaxed text-white sm:text-3xl">A loja está temporariamente offline</h1><p className="mt-4 text-sm leading-7 text-slate-300">{message}</p>{estimatedReturn ? <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm font-semibold text-emerald-100">Previsão de retorno: {estimatedReturn}</p> : null}<p className="mt-5 text-xs leading-5 text-slate-500">Compras e pagamentos estão pausados enquanto a manutenção estiver ativa.</p><Link href="/maintenance-history" className="mt-5 inline-flex text-xs font-bold text-emerald-200 underline-offset-4 hover:underline">Ver histórico de manutenções</Link></section></main>;
}
