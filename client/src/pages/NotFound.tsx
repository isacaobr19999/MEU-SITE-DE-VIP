import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="account-page flex min-h-screen w-full items-center justify-center p-5">
      <section className="account-guard text-center">
        <BrandMark className="mx-auto w-fit" />
        <div className="status-orb mx-auto mt-8 border-rose-300/25 bg-rose-300/[.08] text-rose-200"><AlertCircle size={23} /></div>
        <p className="section-kicker mt-6">ROTAS DO SERVIDOR</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-white">404</h1>
        <h2 className="font-display mt-2 text-xl font-bold text-white">Esta área não foi encontrada</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">O link pode estar incompleto ou a página pode ter sido movida. Volte para a vitrine e continue sua jornada.</p>
        <div id="not-found-button-group" className="mt-7 flex justify-center">
          <Button onClick={handleGoHome} className="bg-emerald-300 px-6 text-slate-950 shadow-[0_14px_28px_rgba(16,185,129,.15)] hover:bg-emerald-200"><Home className="mr-2 h-4 w-4" /> Voltar à loja</Button>
        </div>
      </section>
    </main>
  );
}
