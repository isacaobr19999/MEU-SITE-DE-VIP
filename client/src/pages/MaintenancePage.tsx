import { ShieldCheck } from "lucide-react";

export default function MaintenancePage({ message }: { message: string }) {
  return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-center text-slate-100"><section className="surface-panel max-w-xl rounded-[1.75rem] p-7 sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/[.08] text-amber-200"><ShieldCheck size={26} /></div><p className="section-kicker mt-6">MANUTENÇÃO PROGRAMADA</p><h1 className="font-display mt-3 text-2xl font-bold leading-relaxed text-white sm:text-3xl">A loja está temporariamente offline</h1><p className="mt-4 text-sm leading-7 text-slate-300">{message}</p><p className="mt-5 text-xs leading-5 text-slate-500">Compras e pagamentos estão pausados enquanto a manutenção estiver ativa.</p></section></main>;
}
