import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { STORE_ROUTES } from "@/lib/storeRoutes";
import { CircleUserRound, Menu, ShieldCheck, ShoppingBag } from "lucide-react";
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
        <a href="/#como-funciona">Como funciona</a>
        {isAuthenticated ? <Link href="/orders">Pedidos</Link> : null}
        {user?.role === "admin" ? <Link href="/admin">Operação</Link> : null}
      </nav>
      <div className="store-header__actions">
        {!loading && (isAuthenticated ? <Link href="/orders" className="store-header__account"><CircleUserRound size={17} /><span>{user?.name || "Minha conta"}</span></Link> : <Button variant="ghost" onClick={startLogin} className="hidden rounded-xl text-slate-300 hover:bg-white/5 hover:text-white sm:inline-flex">Entrar</Button>)}
        <Button onClick={goToCart} aria-label="Abrir carrinho" className="store-header__cart"><ShoppingBag size={18} /><span className="hidden sm:inline">Carrinho</span>{itemCount ? <span className="store-header__count">{itemCount}</span> : null}</Button>
        <span className="sr-only"><Menu /> <ShieldCheck /></span>
      </div>
    </div>
  </header>;
}
