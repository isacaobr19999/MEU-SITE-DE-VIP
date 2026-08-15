import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCartItem, readCart, writeCart, type CartItem, type StoreProduct } from "@/lib/cart";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Box, ChevronRight, CircleUserRound, Gamepad2, Loader2, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const kindLabels: Record<StoreProduct["kind"], string> = { VIP: "VIP", COINS: "Coins", KIT: "Kits", COSMETIC: "Cosméticos" };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function ProductCard({ product, onAdd }: { product: StoreProduct; onAdd: (product: StoreProduct, serverId: number, serverName: string) => void }) {
  const destinations = trpc.catalog.productServers.useQuery({ productId: product.id });
  const [serverId, setServerId] = useState<number | null>(null);
  const selectedServer = destinations.data?.find(server => server.id === serverId) ?? destinations.data?.[0];

  function addToCart() {
    if (!selectedServer) {
      toast.error("Este produto ainda não possui um servidor de destino configurado.");
      return;
    }
    onAdd(product, selectedServer.id, selectedServer.name);
  }

  return (
    <article className="store-card group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/35">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-slate-950 shadow-[0_0_32px_rgba(52,211,153,.22)]">
          <Box size={25} strokeWidth={2.4} />
        </div>
        <Badge className="border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold tracking-[.14em] text-emerald-200">{kindLabels[product.kind].toUpperCase()}</Badge>
      </div>
      <div className="space-y-2">
        <Link href={`/products/${product.slug}`} className="text-lg font-bold tracking-tight text-white transition hover:text-emerald-200">{product.name}</Link>
        <p className="min-h-10 text-sm leading-5 text-slate-400">{product.shortDescription || "Benefício digital entregue automaticamente no seu servidor."}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
        {product.durationDays ? <span className="rounded-lg bg-white/5 px-2.5 py-1.5">{product.durationDays} dias</span> : <span className="rounded-lg bg-white/5 px-2.5 py-1.5">Permanente</span>}
        <span className="rounded-lg bg-white/5 px-2.5 py-1.5">{product.categoryName}</span>
      </div>
      {destinations.isError ? <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100">Não foi possível consultar os servidores de destino.</p> : null}
      {destinations.data && destinations.data.length > 1 ? (
        <select aria-label="Servidor de destino" value={serverId ?? destinations.data[0]?.id} onChange={event => setServerId(Number(event.target.value))} className="mt-5 h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-200 outline-none transition focus:border-emerald-300">
          {destinations.data.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}
        </select>
      ) : null}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="font-mono text-lg font-bold text-emerald-300">{money.format(product.priceCents / 100)}</p>
        <Button disabled={destinations.isLoading || destinations.isError || !destinations.data?.length} onClick={addToCart} className="h-10 rounded-xl bg-white px-4 text-xs font-bold text-slate-950 hover:bg-emerald-200">
          {destinations.isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Adicionar</>}
        </Button>
      </div>
    </article>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [cart, setCart] = useState<CartItem[]>(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [uuid, setUuid] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const productQuery = useMemo(() => ({ query: search.trim() || undefined, categorySlug: category }), [search, category]);
  const categories = trpc.catalog.categories.useQuery();
  const products = trpc.catalog.products.useQuery(productQuery);
  const featured = trpc.catalog.products.useQuery({ featuredOnly: true });
  const checkoutPayment = trpc.orders.checkout.useMutation({
    onSuccess: result => {
      setCart([]);
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

  useEffect(() => { writeCart(cart); }, [cart]);

  function addToCart(product: StoreProduct, serverId: number, serverName: string) {
    setCart(current => addCartItem(current, product, serverId, serverName));
    setCartOpen(true);
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
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setCheckoutOpen(true);
  }

  function submitOrder(event: FormEvent) {
    event.preventDefault();
    createOrder.mutate({
      username,
      uuid,
      couponCode: couponCode.trim() || undefined,
      idempotencyKey: crypto.randomUUID(),
      items: cart.flatMap(item => Array.from({ length: item.quantity }, () => ({ productId: item.id, serverId: item.serverId }))),
    });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111d] text-slate-100 selection:bg-emerald-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:36px_36px]" />
      <header className="relative z-20 border-b border-white/10 bg-[#07111d]/85 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950 shadow-[0_0_28px_rgba(52,211,153,.3)]"><Gamepad2 size={22} /></span>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">PlayStor<span className="text-emerald-300">Craft</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#loja" className="transition hover:text-emerald-200">Loja</a>
            <a href="#como-funciona" className="transition hover:text-emerald-200">Como funciona</a>
            {isAuthenticated ? <Link href="/orders" className="transition hover:text-emerald-200">Meus pedidos</Link> : null}
            {user?.role === "admin" ? <Link href="/admin" className="transition hover:text-emerald-200">Administração</Link> : null}
          </nav>
          <div className="flex items-center gap-2">
            {!loading && (isAuthenticated ? <Link href="/orders" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 sm:flex"><CircleUserRound size={17} />{user?.name || "Conta"}</Link> : <Button variant="ghost" onClick={startLogin} className="hidden rounded-xl text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex">Entrar</Button>)}
            <Button onClick={() => setCartOpen(true)} className="relative h-11 rounded-xl bg-white px-4 text-slate-950 hover:bg-emerald-200"><ShoppingBag size={18} /><span className="hidden sm:inline">Carrinho</span>{itemCount ? <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-300 px-1 text-[10px] font-bold text-slate-950">{itemCount}</span> : null}</Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container grid gap-12 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold tracking-[.12em] text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_currentColor]" /> LOJA OFICIAL</div>
            <h1 className="font-display max-w-xl text-5xl font-black leading-[.98] tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">O próximo nível da sua <span className="text-emerald-300">jornada</span> começa aqui.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300">VIPs, coins e itens digitais entregues com segurança no servidor certo. Escolha seu benefício e continue sua aventura.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><Button onClick={() => document.getElementById("loja")?.scrollIntoView({ behavior: "smooth" })} className="h-12 rounded-xl bg-emerald-300 px-6 font-bold text-slate-950 hover:bg-emerald-200">Explorar a loja <ChevronRight size={18} /></Button><div className="flex items-center gap-2 px-3 text-xs text-slate-400"><ShieldCheck size={16} className="text-emerald-300" /> Pagamento verificado no servidor</div></div>
          </div>
          <div className="hero-voxel-stage min-h-[360px] rounded-[2rem] border border-white/10 bg-slate-950/40 p-5 lg:min-h-[430px]">
            <div className="hero-glow" />
            <div className="voxel voxel-main"><span className="voxel-top" /><span className="voxel-front" /><span className="voxel-side" /></div>
            <div className="voxel voxel-small voxel-a"><span className="voxel-top" /><span className="voxel-front" /><span className="voxel-side" /></div>
            <div className="voxel voxel-small voxel-b"><span className="voxel-top" /><span className="voxel-front" /><span className="voxel-side" /></div>
            <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur"><p className="font-mono text-[10px] font-bold tracking-[.16em] text-emerald-300">ENTREGA AUTOMÁTICA</p><p className="mt-1 text-sm font-semibold text-white">Seu benefício, no mundo certo.</p></div>
          </div>
        </section>

        {featured.isError ? <section className="container pb-20"><div className="rounded-[1.5rem] border border-rose-300/20 bg-rose-300/[.06] p-6 text-center"><p className="font-mono text-xs font-bold tracking-[.16em] text-rose-200">DESTAQUES INDISPONÍVEIS</p><p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">Não foi possível carregar os produtos em destaque no momento.</p><Button onClick={() => featured.refetch()} variant="outline" className="mt-4 border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Tentar novamente</Button></div></section> : featured.data?.length ? <section className="container pb-20"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="font-mono text-xs font-bold tracking-[.16em] text-violet-300">EM DESTAQUE</p><h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white">Os upgrades mais procurados</h2></div><a href="#loja" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">Ver catálogo</a></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{featured.data.slice(0, 4).map(product => <ProductCard key={`featured-${product.id}`} product={product} onAdd={addToCart} />)}</div></section> : null}

        <section id="loja" className="border-y border-white/10 bg-slate-950/45 py-16 sm:py-20">
          <div className="container">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-xs font-bold tracking-[.16em] text-emerald-300">CATÁLOGO</p><h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Escolha seu próximo upgrade</h2></div><label className="relative block w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar produtos" className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 text-slate-100 placeholder:text-slate-500 focus-visible:border-emerald-300" /></label></div>
            <div className="mb-8 flex gap-2 overflow-x-auto pb-1"><Button onClick={() => setCategory(undefined)} variant="ghost" className={`rounded-xl ${!category ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>Todos</Button>{categories.data?.map(item => <Button key={item.id} onClick={() => setCategory(item.slug)} variant="ghost" className={`rounded-xl whitespace-nowrap ${category === item.slug ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>{item.name}</Button>)}</div>
            {categories.isError ? <p className="-mt-5 mb-6 text-sm text-rose-200">As categorias não puderam ser carregadas. Você ainda pode buscar produtos.</p> : null}
            {products.isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-emerald-300" /></div> : products.isError ? <div className="rounded-[1.6rem] border border-rose-300/20 bg-rose-300/[.06] px-6 py-16 text-center"><h3 className="text-lg font-bold text-white">Não foi possível carregar o catálogo</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Verifique sua conexão e tente novamente em alguns instantes.</p><Button onClick={() => products.refetch()} variant="outline" className="mt-5 border-rose-300/30 text-rose-100 hover:bg-rose-300/10">Tentar novamente</Button></div> : products.data?.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{products.data.map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div> : <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[.025] px-6 py-16 text-center"><PackageCheck className="mx-auto mb-4 text-emerald-300" size={32} /><h3 className="text-lg font-bold text-white">A loja está sendo preparada</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Assim que a administração publicar os produtos, eles aparecerão nesta vitrine. Você também pode ajustar os filtros ou a busca.</p></div>}
          </div>
        </section>

        <section id="como-funciona" className="container py-20"><div className="grid gap-5 md:grid-cols-3"><div className="process-card"><span>01</span><h3>Escolha o benefício</h3><p>Selecione o produto e o servidor de destino para sua compra.</p></div><div className="process-card"><span>02</span><h3>Confirme o pagamento</h3><p>O pagamento será confirmado pelo gateway, nunca somente pelo navegador.</p></div><div className="process-card"><span>03</span><h3>Receba no jogo</h3><p>O servidor recebe a entrega autenticada quando seu jogador estiver online.</p></div></div></section>
      </main>

      {cartOpen ? <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-sm"><aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b1725] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="font-mono text-[10px] font-bold tracking-[.16em] text-emerald-300">SEU INVENTÁRIO</p><h2 className="mt-1 text-xl font-bold text-white">Carrinho</h2></div><Button onClick={() => setCartOpen(false)} variant="ghost" size="icon" className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"><X /></Button></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{cart.length ? cart.map(item => <div key={`${item.id}:${item.serverId}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex justify-between gap-4"><div><h3 className="font-semibold text-white">{item.name}</h3><p className="mt-1 text-xs text-slate-400">{item.serverName}</p></div><button aria-label={`Remover ${item.name}`} onClick={() => adjustQuantity(item.id, item.serverId, -item.quantity)} className="text-slate-500 transition hover:text-rose-300"><X size={17} /></button></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center rounded-lg border border-white/10"><button onClick={() => adjustQuantity(item.id, item.serverId, -1)} className="grid h-8 w-8 place-items-center text-slate-300 hover:bg-white/10"><Minus size={14} /></button><span className="grid h-8 w-8 place-items-center text-xs font-bold">{item.quantity}</span><button onClick={() => adjustQuantity(item.id, item.serverId, 1)} className="grid h-8 w-8 place-items-center text-slate-300 hover:bg-white/10"><Plus size={14} /></button></div><span className="font-mono text-sm font-bold text-emerald-200">{money.format((item.priceCents * item.quantity) / 100)}</span></div></div>) : <div className="grid h-52 place-items-center text-center"><ShoppingBag className="mb-3 text-slate-600" /><p className="text-sm text-slate-400">Seu carrinho está vazio.</p></div>}</div><div className="border-t border-white/10 p-5"><div className="mb-4 flex items-baseline justify-between"><span className="text-sm text-slate-400">Subtotal</span><strong className="font-mono text-xl text-white">{money.format(totalCents / 100)}</strong></div><Button disabled={!cart.length} onClick={startCheckout} className="h-12 w-full rounded-xl bg-emerald-300 font-bold text-slate-950 hover:bg-emerald-200">{isAuthenticated ? "Continuar para pagamento" : "Entrar para continuar"} <ChevronRight size={18} /></Button></div></aside></div> : null}

      {checkoutOpen ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"><form onSubmit={submitOrder} className="w-full max-w-lg rounded-[1.6rem] border border-white/10 bg-[#0b1725] p-6 shadow-2xl"><div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] font-bold tracking-[.16em] text-emerald-300">IDENTIFICAÇÃO NO JOGO</p><h2 className="mt-1 text-2xl font-bold text-white">Finalize seu pedido</h2><p className="mt-2 text-sm leading-6 text-slate-400">Usamos estas informações somente para entregar o benefício ao jogador correto. PIX e cartão serão processados no ambiente seguro do gateway.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setCheckoutOpen(false)} className="rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"><X /></Button></div><div className="mt-6 space-y-4"><div><label className="mb-2 block text-xs font-semibold text-slate-300">Nome do jogador</label><Input required value={username} onChange={event => setUsername(event.target.value)} maxLength={16} placeholder="SeuNick" className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500" /></div><div><label className="mb-2 block text-xs font-semibold text-slate-300">UUID do jogador</label><Input required value={uuid} onChange={event => setUuid(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-white placeholder:text-slate-500" /></div><div><label className="mb-2 block text-xs font-semibold text-slate-300">Cupom de desconto <span className="font-normal text-slate-500">(opcional)</span></label><Input value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} maxLength={48} placeholder="SEUCUPOM" className="h-11 rounded-xl border-white/10 bg-white/5 font-mono text-white placeholder:text-slate-500" /></div></div><div className="mt-6 flex items-center justify-between rounded-xl bg-white/5 p-4"><span className="text-sm text-slate-400">Total antes do cupom</span><strong className="font-mono text-lg text-emerald-200">{money.format(totalCents / 100)}</strong></div><Button type="submit" disabled={createOrder.isPending || checkoutPayment.isPending} className="mt-5 h-12 w-full rounded-xl bg-emerald-300 font-bold text-slate-950 hover:bg-emerald-200">{createOrder.isPending || checkoutPayment.isPending ? <Loader2 className="animate-spin" /> : "Ir para pagamento seguro"}</Button></form></div> : null}
    </div>
  );
}
