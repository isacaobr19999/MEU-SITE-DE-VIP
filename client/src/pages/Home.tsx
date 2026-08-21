import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreHeader } from "@/components/StoreHeader";
import { DiscordCommunity } from "@/components/DiscordCommunity";
import { addCartItem, readCart, removeUnavailableCartItems, writeCart, type CartItem, type StoreProduct } from "@/lib/cart";
import { STORE_ROUTES } from "@/lib/storeRoutes";
import { getCatalogVisual, getVipPreview } from "@/lib/catalogVisuals";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, BadgeCheck, Box, ChevronRight, CreditCard, Gamepad2, Gem, Loader2, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const kindLabels: Record<StoreProduct["kind"], string> = { VIP: "VIP", COINS: "Coins", KIT: "Kits", COSMETIC: "Cosméticos" };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ProductCard({ product, onAdd }: { product: StoreProduct; onAdd: (product: StoreProduct, serverId: number, serverName: string) => void }) {
  const destinations = trpc.catalog.productServers.useQuery({ productId: product.id });
  const [serverId, setServerId] = useState<number | null>(null);
  const selectedServer = destinations.data?.find(server => server.id === serverId) ?? destinations.data?.[0];
  const visual = getCatalogVisual(product);
  const vipPreview = product.kind === "VIP" ? getVipPreview(product) : null;

  function addToCart() {
    if (!selectedServer) {
      toast.error("Este produto ainda não possui um servidor de destino configurado.");
      return;
    }
    onAdd(product, selectedServer.id, selectedServer.name);
  }

  return (
    <article className="product-card product-card--store group overflow-hidden rounded-[1.6rem] transition duration-300 hover:-translate-y-1">
      <div className="product-card__visual relative overflow-hidden">
        <img src={product.imageUrl || visual.url} alt={product.imageUrl ? "" : visual.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111d]/90 via-[#07111d]/20 to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3"><Badge className="category-art-badge px-3 py-1 text-[10px] font-bold tracking-[.14em] text-emerald-100">{product.imageUrl ? kindLabels[product.kind].toUpperCase() : visual.label.toUpperCase()}</Badge>{product.featured ? <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[9px] font-extrabold tracking-[.12em] text-slate-950">DESTAQUE</span> : null}</div>
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between"><span className="product-card__duration">{product.durationDays ? `${product.durationDays} dias` : "Permanente"}</span><span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur"><Gem size={15} /></span></div>
      </div>
      <div className="p-5">
        <div className="space-y-2"><Link href={`/products/${product.slug}`} className="text-xl font-bold tracking-tight text-white transition hover:text-emerald-200">{product.name}</Link><p className="min-h-10 text-sm leading-5 text-slate-400">{product.shortDescription || "Benefício digital entregue automaticamente no seu servidor."}</p></div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400"><span className="product-chip">{product.categoryName}</span><span className="product-chip">Entrega no jogo</span></div>
        {product.kind === "VIP" ? <div className="vip-preview mt-4"><div className="flex items-center justify-between gap-3"><span>PRÉVIA VIP</span><strong>{product.durationDays ? `${product.durationDays} dias` : "Permanente"}</strong></div>{vipPreview ? <p>{vipPreview}</p> : <p>Confira os detalhes cadastrados deste VIP antes de adicionar ao carrinho.</p>}</div> : null}
      {destinations.isError ? <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">Não foi possível consultar os servidores de destino.</p> : null}
      {destinations.data && destinations.data.length > 1 ? (
        <select aria-label="Servidor de destino" value={serverId ?? destinations.data[0]?.id} onChange={event => setServerId(Number(event.target.value))} className="mt-5 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-200 outline-none transition focus:border-emerald-300">
          {destinations.data.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}
        </select>
      ) : null}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[.08] pt-4"><div><p className="text-[10px] font-bold tracking-[.14em] text-slate-500">A PARTIR DE</p><p className="mt-1 font-mono text-xl font-bold text-emerald-200">{money.format(product.priceCents / 100)}</p></div><Button disabled={destinations.isLoading || destinations.isError || !destinations.data?.length} onClick={addToCart} className="h-11 rounded-xl bg-emerald-300 px-4 text-xs font-bold text-slate-950 shadow-[0_10px_26px_rgba(16,185,129,.16)] hover:bg-emerald-200">{destinations.isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Adicionar</>}</Button></div>
        <Link href={`/products/${product.slug}`} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-emerald-200">Ver detalhes <ArrowUpRight size={14} /></Link>
      </div>
    </article>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const [cartOpen, setCartOpen] = useState(() => location === STORE_ROUTES.CART);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const productQuery = useMemo(() => ({ query: search.trim() || undefined, categorySlug: category }), [search, category]);
  const categories = trpc.catalog.categories.useQuery();
  const products = trpc.catalog.products.useQuery(productQuery);
  const availableProducts = trpc.catalog.products.useQuery({});
  const featured = trpc.catalog.products.useQuery({ featuredOnly: true });
  const ranking = trpc.community.ranking.useQuery();
  const availability = trpc.store.availability.useQuery(undefined, { staleTime: 15_000, refetchOnWindowFocus: true });
  const checkoutPayment = trpc.orders.checkout.useMutation({
    onSuccess: result => {
      setCart([]);
      if (result.complimentary) toast.success("Cupom aplicado: seu pedido ficou gratuito e já foi enviado para entrega.");
      window.location.assign(result.checkoutUrl);
    },
    onError: error => toast.error(error.message),
  });
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: result => {
      setCheckoutOpen(false);
      setCartOpen(false);
      toast.success(`Pedido ${result.order.orderNumber} criado. Abrindo ambiente seguro de pagamento…`);
      checkoutPayment.mutate({ orderId: result.order.id });
    },
    onError: error => toast.error(error.message),
  });

  const totalCents = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const catalogOnly = availability.data?.publicOnline === false && availability.data?.maintenanceMode === "CATALOG_ONLY";
  const vipProducts = useMemo(() => (availableProducts.data ?? []).filter(product => product.kind === "VIP").sort((left, right) => left.priceCents - right.priceCents), [availableProducts.data]);

  useEffect(() => { writeCart(cart); }, [cart]);
  useEffect(() => {
    if (!availableProducts.data) return;
    setCart(current => removeUnavailableCartItems(current, availableProducts.data));
  }, [availableProducts.data]);
  useEffect(() => {
    if (location === STORE_ROUTES.CART) setCartOpen(true);
  }, [location]);

  function openCart() {
    setCartOpen(true);
    if (location !== STORE_ROUTES.CART) setLocation(STORE_ROUTES.CART);
  }

  function closeCart() {
    setCartOpen(false);
    if (location === STORE_ROUTES.CART) setLocation(STORE_ROUTES.HOME);
  }

  function addToCart(product: StoreProduct, serverId: number, serverName: string) {
    setCart(current => addCartItem(current, product, serverId, serverName));
    openCart();
    toast.success(`${product.name} adicionado ao carrinho.`);
  }

  function adjustQuantity(productId: number, serverId: number, change: number) {
    setCart(current => current.flatMap(item => {
      if (item.id !== productId || item.serverId !== serverId) return [item];
      const quantity = item.quantity + change;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  function startCheckout() {
    if (!cart.length) return;
    if (catalogOnly) {
      toast.error("A loja está em modo catálogo. Compras e pagamentos serão liberados após a manutenção.");
      return;
    }
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setCheckoutOpen(true);
  }

  function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (catalogOnly) return toast.error("A loja está em modo catálogo. Não é possível criar pedidos agora.");
    createOrder.mutate({
      username,
      couponCode: couponCode.trim() || undefined,
      idempotencyKey: crypto.randomUUID(),
      items: cart.flatMap(item => Array.from({ length: item.quantity }, () => ({ productId: item.id, serverId: item.serverId }))),
    });
  }

  return (
    <div className="minecraft-store min-h-screen overflow-x-hidden bg-[#07111d] text-slate-100 selection:bg-emerald-300 selection:text-slate-950">
	      <div className="minecraft-world-texture pointer-events-none fixed inset-0" />
      <StoreHeader itemCount={itemCount} onCart={openCart} />

      <main className="relative z-10">
        {catalogOnly ? <div className="container pt-5"><div className="rounded-2xl border border-amber-300/25 bg-amber-300/[.08] px-4 py-3 text-sm text-amber-100"><strong>Modo somente catálogo.</strong> {availability.data?.offlineMessage || "Você pode consultar os benefícios, mas compras e pagamentos voltam após a manutenção."}{availability.data?.estimatedReturnAt ? <span className="mt-1 block text-xs text-amber-200">Previsão de retorno: {new Date(availability.data.estimatedReturnAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span> : null}</div></div> : null}
	        <section className="store-hero minecraft-hero container grid items-center gap-8 pb-20 pt-10 sm:gap-10 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:pb-28 lg:pt-24">
	          <div className="max-w-2xl">
	            <div className="minecraft-kicker mb-6 inline-flex items-center gap-2 border border-emerald-300/20 bg-emerald-300/[.08] px-4 py-2 text-[10px] font-bold tracking-[.16em] text-emerald-100"><span className="h-1.5 w-1.5 bg-emerald-300 shadow-[0_0_12px_currentColor]" /> RECOMPENSAS DO SERVIDOR</div>
	            <h1 className="minecraft-heading font-display max-w-xl text-[2.55rem] font-extrabold leading-[1.01] text-white sm:text-6xl lg:text-7xl">Equipe seu próximo <span className="text-emerald-300">nível</span> de aventura.</h1>
	            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:mt-7 sm:text-lg">VIPs, moedas e benefícios entregues no jogador certo. Compre com segurança e deixe a progressão continuar no servidor.</p>
	            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-9"><Button onClick={() => document.getElementById("loja")?.scrollIntoView({ behavior: "smooth" })} className="minecraft-cta h-13 px-6 font-bold text-slate-950">Ver benefícios <ChevronRight size={18} /></Button><div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><ShieldCheck size={16} className="text-emerald-300" /> Pagamento e entrega verificados</div></div>
	          </div>
	          <div className="hero-voxel-stage minecraft-frame surface-panel relative aspect-[1.35] overflow-hidden p-3 sm:aspect-video sm:p-4">
	            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(110,231,183,.24),transparent_30%),radial-gradient(circle_at_8%_90%,rgba(56,189,248,.17),transparent_30%)]" />
	            <div className="absolute inset-3 rounded-[1.15rem] border border-emerald-200/10 bg-[#091827] sm:rounded-[1.5rem]" />
	            <img src="/store-assets/PlayStorCraft-Banner.webp?v=20260816" onError={event => { event.currentTarget.style.opacity = "0"; }} alt="Banner PlayStorCraft com guerreiro e cidade fantástica" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-[1.15rem] object-cover object-center transition-opacity duration-300 sm:rounded-[1.5rem]" />
	            <div className="absolute inset-3 rounded-[1.15rem] bg-gradient-to-t from-[#07111d]/88 via-transparent to-[#07111d]/15 sm:rounded-[1.5rem]" />
	            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8"><div><p className="section-kicker">LOOT VINCULADO</p><p className="mt-2 max-w-[14rem] font-display text-lg font-bold leading-tight text-white sm:text-xl">Pronto para receber no seu inventário.</p></div><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/15 text-emerald-100 sm:h-11 sm:w-11"><Sparkles size={19} /></div></div>
	          </div>
	          <div className="hero-proof-grid grid gap-2 sm:col-span-2 sm:grid-cols-3 lg:col-span-1 lg:col-start-1"><div className="hero-proof"><BadgeCheck size={16} /><span>Entrega vinculada<br /><strong>ao jogador</strong></span></div><div className="hero-proof"><CreditCard size={16} /><span>PIX e cartão<br /><strong>em ambiente seguro</strong></span></div><div className="hero-proof"><Gamepad2 size={16} /><span>Servidor oficial<br /><strong>benefícios verificados</strong></span></div></div>
	        </section>

        {featured.isError ? <section className="container pb-20"><div className="rounded-[1.5rem] border border-rose-300/20 bg-rose-300/[.06] p-6 text-center"><p className="font-mono text-xs font-bold tracking-[.16em] text-rose-200">DESTAQUES INDISPONÍVEIS</p><p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">Não foi possível carregar os produtos em destaque no momento.</p><Button onClick={() => featured.refetch()} variant="outline" className="mt-4 border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Tentar novamente</Button></div></section> : featured.data?.length ? <section className="container pb-20"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="font-mono text-xs font-bold tracking-[.16em] text-violet-300">EM DESTAQUE</p><h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white">Os upgrades mais procurados</h2></div><a href="#loja" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">Ver catálogo</a></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{featured.data.slice(0, 4).map(product => <ProductCard key={`featured-${product.id}`} product={product} onAdd={addToCart} />)}</div></section> : null}

        <section id="loja" className="catalog-section py-16 sm:py-20">
          <div className="container">
	            <div className="minecraft-catalog-panel catalog-intro mb-8 flex flex-col justify-between gap-5 p-5 md:flex-row md:items-end sm:p-7"><div><p className="section-kicker">CATÁLOGO OFICIAL</p><h2 className="minecraft-heading font-display mt-2 max-w-xl text-3xl font-bold text-white sm:text-4xl">Escolha um benefício para a sua próxima sessão.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Produtos organizados por objetivo, com entrega preparada para o servidor e o jogador selecionados.</p><div className="mt-5 flex flex-wrap gap-2"><span className="catalog-stat">{availableProducts.data?.length ?? 0} benefícios disponíveis</span><span className="catalog-stat">Checkout protegido</span></div></div><label className="field-shell relative block w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar benefícios" className="h-12 border-0 bg-transparent pl-11 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0" /></label></div>
	            <div className="mb-8 flex gap-2 overflow-x-auto pb-1"><Button onClick={() => setCategory(undefined)} variant="ghost" className={`minecraft-tab ${!category ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>Todos</Button>{categories.data?.map(item => <Button key={item.id} onClick={() => setCategory(item.slug)} variant="ghost" className={`minecraft-tab whitespace-nowrap ${category === item.slug ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>{item.name}</Button>)}</div>
            {categories.isError ? <p className="-mt-5 mb-6 text-sm text-rose-200">As categorias não puderam ser carregadas. Você ainda pode buscar produtos.</p> : null}
            {products.isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : products.isError ? <div className="rounded-[1.6rem] border border-rose-300/20 bg-rose-300/[.06] px-6 py-16 text-center"><h3 className="text-lg font-bold text-white">Não foi possível carregar o catálogo</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Verifique sua conexão e tente novamente em alguns instantes.</p><Button onClick={() => products.refetch()} variant="outline" className="mt-5 border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Tentar novamente</Button></div> : products.data?.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{products.data.map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div> : <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[.025] px-6 py-16 text-center"><PackageCheck className="mx-auto mb-4 text-emerald-300" size={32} /><h3 className="text-lg font-bold text-white">A loja está sendo preparada</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Assim que a administração publicar os produtos, eles aparecerão nesta vitrine. Você também pode ajustar os filtros ou a busca.</p></div>}
          </div>
        </section>

        {vipProducts.length ? <section id="comparar-vips" className="container py-16 sm:py-20"><div className="surface-panel overflow-hidden rounded-[1.8rem]"><div className="border-b border-white/10 p-6 sm:p-8"><p className="section-kicker">COMPARATIVO REAL</p><h2 className="minecraft-heading font-display mt-2 text-3xl font-bold text-white">Escolha seu VIP com clareza.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">A comparação usa somente os produtos VIP ativos e suas informações cadastradas no catálogo oficial.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="bg-white/[.025] text-[10px] font-bold tracking-[.14em] text-slate-500"><tr><th className="px-6 py-4">VIP</th><th className="px-6 py-4">DURAÇÃO</th><th className="px-6 py-4">BENEFÍCIO CADASTRADO</th><th className="px-6 py-4 text-right">VALOR</th><th className="px-6 py-4" /></tr></thead><tbody>{vipProducts.map(product => <tr key={`vip-${product.id}`} className="border-t border-white/[.07] text-sm"><td className="px-6 py-5 font-bold text-white">{product.name}</td><td className="px-6 py-5 text-slate-300">{product.durationDays ? `${product.durationDays} dias` : "Permanente"}</td><td className="max-w-sm px-6 py-5 text-slate-400">{product.shortDescription || "Informação disponível na página do produto."}</td><td className="px-6 py-5 text-right font-mono font-bold text-emerald-200">{money.format(product.priceCents / 100)}</td><td className="px-6 py-5 text-right"><Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-200 hover:text-emerald-100">Ver VIP <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div></div></section> : null}

        {ranking.data?.length ? <section className="container pb-16 sm:pb-20"><div className="surface-panel rounded-[1.8rem] p-6 sm:p-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="section-kicker">APOIADORES DO SERVIDOR</p><h2 className="minecraft-heading font-display mt-2 text-3xl font-bold text-white">Quem mais reforçou a aventura.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-400">Ranking por quantidade de pedidos concluídos, sem mostrar valores de compra.</p></div><ol className="mt-7 grid gap-3 md:grid-cols-5">{ranking.data.map((player, index) => <li key={player.username} className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-black/15 p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300/10 font-mono text-sm font-bold text-emerald-100">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate font-bold text-white">{player.username}</p><p className="text-xs text-slate-500">{player.completedOrders} pedido{player.completedOrders === 1 ? "" : "s"} concluído{player.completedOrders === 1 ? "" : "s"}</p></div></li>)}</ol></div></section> : null}

        <section id="como-funciona" className="minecraft-process container py-20"><div className="mb-8 text-center"><p className="section-kicker">COMO FUNCIONA</p><h2 className="minecraft-heading font-display mt-2 text-3xl font-bold text-white">Três etapas. Um upgrade no jogo.</h2></div><div className="store-process grid gap-5 md:grid-cols-3"><div className="minecraft-step process-card process-card--store"><span>01</span><div className="process-card__icon"><Gem size={20} /></div><h3>Escolha o benefício</h3><p>Compare os benefícios, selecione o item e defina o servidor de destino.</p></div><div className="minecraft-step process-card process-card--store"><span>02</span><div className="process-card__icon"><ShieldCheck size={20} /></div><h3>Confirme o pagamento</h3><p>O pedido é criado com segurança e o pagamento é confirmado pelo gateway.</p></div><div className="minecraft-step process-card process-card--store"><span>03</span><div className="process-card__icon"><Gamepad2 size={20} /></div><h3>Receba no jogo</h3><p>O servidor prepara a entrega autenticada para o jogador correto.</p></div></div></section>
        <DiscordCommunity />
      </main>

      <footer className="relative z-10 border-t border-white/[.08] bg-black/20"><div className="container flex flex-col gap-3 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>PlayStorCraft · benefícios digitais para o servidor.</p><nav className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/policies" className="hover:text-emerald-200">Privacidade e reembolso</Link><Link href="/rules" className="hover:text-emerald-200">Regras</Link><Link href="/status" className="hover:text-emerald-200">Status</Link></nav></div></footer>

      {cartOpen ? <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"><aside className="cart-drawer flex h-full w-full max-w-md flex-col"><div className="flex items-center justify-between border-b border-white/[.08] p-5"><div><p className="section-kicker">SEU INVENTÁRIO</p><h2 className="font-display mt-1 text-xl font-bold text-white">Carrinho de benefícios</h2></div><Button onClick={closeCart} variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"><X /></Button></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{cart.length ? cart.map(item => <div key={`${item.id}:${item.serverId}`} className="surface-panel--soft rounded-2xl p-4"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-white">{item.name}</h3><p className="mt-1 text-xs text-slate-400">Destino: {item.serverName}</p></div><button aria-label={`Remover ${item.name}`} onClick={() => adjustQuantity(item.id, item.serverId, -item.quantity)} className="text-slate-500 transition hover:text-rose-300"><X size={17} /></button></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center rounded-lg border border-white/10 bg-black/10"><button onClick={() => adjustQuantity(item.id, item.serverId, -1)} className="grid h-8 w-8 place-items-center text-slate-300 hover:bg-white/10"><Minus size={14} /></button><span className="grid h-8 w-8 place-items-center text-xs font-bold">{item.quantity}</span><button onClick={() => adjustQuantity(item.id, item.serverId, 1)} className="grid h-8 w-8 place-items-center text-xs text-slate-300 hover:bg-white/10"><Plus size={14} /></button></div><span className="font-mono text-sm font-bold text-emerald-200">{money.format((item.priceCents * item.quantity) / 100)}</span></div></div>) : <div className="empty-state grid h-52 place-items-center rounded-2xl p-6 text-center"><div><ShoppingBag className="mx-auto text-emerald-300" /><p className="mt-3 text-sm text-slate-300">Seu inventário está vazio.</p></div></div>}</div><div className="border-t border-white/[.08] p-5">{catalogOnly ? <p className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[.07] px-3 py-2 text-xs leading-5 text-amber-100">Modo somente catálogo ativo. Seus itens ficam salvos aqui, mas o pagamento está temporariamente pausado.</p> : null}<div className="mb-4 rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-baseline justify-between"><span className="text-sm text-slate-400">Subtotal</span><strong className="font-mono text-xl text-white">{money.format(totalCents / 100)}</strong></div><p className="mt-2 text-xs text-slate-500">Cupons serão calculados antes de abrir o pagamento.</p></div><Button disabled={!cart.length || catalogOnly} onClick={startCheckout} className="h-12 w-full rounded-xl bg-emerald-300 font-bold text-slate-950 shadow-[0_14px_28px_rgba(16,185,129,.15)] hover:bg-emerald-200">{catalogOnly ? "Checkout pausado" : isAuthenticated ? "Continuar para pagamento" : "Entrar para continuar"} <ChevronRight size={18} /></Button></div></aside></div> : null}

      {checkoutOpen ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={submitOrder} className="checkout-sheet w-full max-w-lg rounded-[1.6rem] p-6 sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="section-kicker">IDENTIFICAÇÃO NO JOGO</p><h2 className="font-display mt-1 text-2xl font-bold text-white">Finalize sua recompensa</h2><p className="mt-2 text-sm leading-6 text-slate-400">Use seu nome no jogo. O benefício será preparado para o jogador correto após a confirmação.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setCheckoutOpen(false)} className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"><X /></Button></div><div className="mt-6 space-y-4"><div><label className="mb-2 block text-xs font-semibold text-slate-300">Nome do jogador</label><div className="field-shell rounded-xl"><Input required value={username} onChange={event => setUsername(event.target.value)} maxLength={16} placeholder="SeuNick" className="h-11 border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0" /></div></div><p className="rounded-xl border border-emerald-300/15 bg-emerald-300/[.06] px-4 py-3 text-xs leading-5 text-emerald-100">Entre no servidor pelo menos uma vez antes de comprar. Assim, a entrega será vinculada automaticamente ao seu jogador.</p><div><label className="mb-2 block text-xs font-semibold text-slate-300">Cupom de desconto <span className="font-normal text-slate-500">(opcional)</span></label><div className="field-shell rounded-xl"><Input value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} maxLength={48} placeholder="SEUCUPOM" className="h-11 border-0 bg-transparent font-mono text-white placeholder:text-slate-500 focus-visible:ring-0" /></div></div></div><div className="mt-6 rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">Valor original</span><strong className="font-mono text-lg text-emerald-200">{money.format(totalCents / 100)}</strong></div><p className="mt-2 text-xs text-slate-500">O total final e qualquer desconto válido serão confirmados antes do pagamento.</p></div><Button type="submit" disabled={createOrder.isPending || checkoutPayment.isPending} className="mt-5 h-12 w-full rounded-xl bg-emerald-300 font-bold text-slate-950 shadow-[0_14px_30px_rgba(16,185,129,.16)] hover:bg-emerald-200">{createOrder.isPending || checkoutPayment.isPending ? <Loader2 className="animate-spin" /> : "Ir para pagamento seguro"}</Button></form></div> : null}
    </div>
  );
}
