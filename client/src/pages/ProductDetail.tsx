import { Button } from "@/components/ui/button";
import { StoreHeader } from "@/components/StoreHeader";
import { trpc } from "@/lib/trpc";
import { addCartItem, readCart, writeCart } from "@/lib/cart";
import { ArrowLeft, Box, Loader2, ShoppingBag } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const product = trpc.catalog.product.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  const destinations = trpc.catalog.productServers.useQuery({ productId: product.data?.id ?? 0 }, { enabled: Boolean(product.data?.id) });

  function addToCart() {
    const destination = destinations.data?.[0];
    if (!product.data || !destination) return toast.error("Este produto não possui um destino disponível.");
    const updated = addCartItem(readCart(), { ...product.data, featured: false }, destination.id, destination.name);
    writeCart(updated);
    toast.success("Produto adicionado ao carrinho. Volte à loja para finalizar.");
  }

  if (product.isLoading) return <main className="account-page grid min-h-screen place-items-center"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (product.isError) return <main className="account-page grid min-h-screen place-items-center p-6 text-center text-white"><div className="account-guard"><div className="status-orb mx-auto"><Box size={21} /></div><h1 className="font-display mt-5 text-2xl font-bold">Não foi possível carregar este benefício</h1><p className="mt-2 text-sm leading-6 text-slate-400">Verifique a conexão e tente abrir a recompensa novamente.</p><Button onClick={() => product.refetch()} className="mt-6 bg-emerald-300 text-slate-950 hover:bg-emerald-200">Tentar novamente</Button></div></main>;
  if (!product.data) return <main className="account-page grid min-h-screen place-items-center p-6 text-center text-white"><div className="account-guard"><div className="status-orb mx-auto"><Box size={21} /></div><h1 className="font-display mt-5 text-2xl font-bold">Benefício não encontrado</h1><p className="mt-2 text-sm leading-6 text-slate-400">Este item pode ter sido removido ou não estar disponível neste momento.</p><Link href="/" className="mt-6 inline-flex text-sm font-bold text-emerald-300">Voltar à loja</Link></div></main>;

  return <div className="account-page text-slate-100"><StoreHeader /><main className="px-5 py-8 sm:p-12"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-200"><ArrowLeft size={16} /> Voltar aos benefícios</Link><section className="surface-panel mt-7 grid gap-8 rounded-[2rem] p-5 sm:p-7 lg:grid-cols-[.82fr_1.18fr] lg:p-10"><div className="product-card__media grid min-h-64 place-items-center rounded-[1.5rem] p-5"><div className="relative grid h-28 w-28 place-items-center rounded-[2rem] border border-white/20 bg-gradient-to-br from-emerald-200 to-cyan-300 text-slate-950 shadow-[0_0_60px_rgba(52,211,153,.25)]"><Box size={55} /><span className="absolute -bottom-3 rounded-full bg-slate-950 px-3 py-1 font-mono text-[9px] font-bold tracking-[.14em] text-emerald-200">ITEM DIGITAL</span></div></div><div><p className="section-kicker">{product.data.categoryName.toUpperCase()}</p><h1 className="font-display mt-3 text-4xl font-extrabold text-white">{product.data.name}</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{product.data.description || product.data.shortDescription || "Benefício digital configurado para ser entregue com segurança no servidor selecionado."}</p>{destinations.isError ? <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">Os destinos deste produto não puderam ser carregados. Tente novamente antes de comprar.</p> : <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300"><span className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-2">{product.data.durationDays ? `${product.data.durationDays} dias` : "Permanente"}</span>{destinations.data?.map(server => <span key={server.id} className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">{server.name}</span>)}</div>}<div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-6"><div><p className="text-xs font-semibold text-slate-500">VALOR DO BENEFÍCIO</p><strong className="mt-1 block font-mono text-3xl text-emerald-200">{money.format(product.data.priceCents / 100)}</strong></div><Button disabled={destinations.isLoading || destinations.isError || !destinations.data?.length} onClick={addToCart} className="h-12 rounded-xl bg-emerald-300 px-6 font-bold text-slate-950 shadow-[0_14px_28px_rgba(16,185,129,.15)] hover:bg-emerald-200"><ShoppingBag size={18} /> Adicionar ao carrinho</Button></div></div></section></div></main></div>;
}
