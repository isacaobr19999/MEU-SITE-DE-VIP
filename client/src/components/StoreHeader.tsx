import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { STORE_ROUTES } from "@/lib/storeRoutes";
import { CircleUserRound, Menu, MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";
import { Button } from "./ui/button";
import { BrandMark } from "./BrandMark";
import { Link, useLocation } from "wouter";

export function StoreHeader({ itemCount = 0, onCart }: { itemCount?: number; onCart?: () => void }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  function goToCart() { onCart ? onCart() : navigate(STORE_ROUTES.CART); }
  return <header className="store-header">
    <div className="container store-header__inner">
      <BrandMark />
      <nav className="store-header__nav" aria-label="Navegação principal">
        <a href="/#loja">Benefícios</a>
        <a href="/#discord">Discord</a>
        <Link href="/rules">Regras</Link>
        <Link href="/news">Novidades</Link>
        <a href="/#como-funciona">Como funciona</a>
        {isAuthenticated ? <Link href="/orders">Pedidos</Link> : null}
        {user?.role === "admin" ? <Link href="/admin">Operação</Link> : null}
      </nav>
      <div className="store-header__actions">
        <a href="/#discord" aria-label="Abrir área da comunidade Discord" className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-300/15 bg-indigo-300/[.06] text-indigo-100 transition hover:border-indigo-200/40 hover:bg-indigo-300/[.13]"><MessageCircle size={18} /></a>
        {!loading && (isAuthenticated ? <Link href="/orders" className="store-header__account"><CircleUserRound size={17} /><span>{user?.name || "Minha conta"}</span></Link> : <Button variant="ghost" onClick={startLogin} className="hidden rounded-xl text-slate-300 hover:bg-white/5 hover:text-white sm:inline-flex">Entrar</Button>)}
        <Button onClick={goToCart} aria-label="Abrir carrinho" className="store-header__cart"><ShoppingBag size={18} /><span className="hidden sm:inline">Carrinho</span>{itemCount ? <span className="store-header__count">{itemCount}</span> : null}</Button>
        <span className="sr-only"><Menu /> <ShieldCheck /></span>
      </div>
    </div>
  </header>;
}
