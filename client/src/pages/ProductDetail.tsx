import { Button } from "@/components/ui/button";
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

  if (product.isLoading) return <main className="grid min-h-screen place-items-center bg-[#07111d]"><Loader2 className="animate-spin text-emerald-300" /></main>;
  if (product.isError) return <main className="grid min-h-screen place-items-center bg-[#07111d] p-6 text-center text-white"><div><h1 className="text-2xl font-bold">Não foi possível carregar este produto</h1><p className="mt-2 text-sm text-slate-400">Tente novamente em alguns instantes.</p><Button onClick={() => product.refetch()} className="mt-5 bg-emerald-300 text-slate-950 hover:bg-emerald-200">Tentar novamente</Button></div></main>;
  if (!product.data) return <main className="grid min-h-screen place-items-center bg-[#07111d] p-6 text-center text-white"><div><Box className="mx-auto text-slate-600" /><h1 className="mt-4 text-2xl font-bold">Produto não encontrado</h1><Link href="/" className="mt-4 inline-flex text-sm font-bold text-emerald-300">Voltar à loja</Link></div></main>;

  return <main className="min-h-screen bg-[#07111d] px-5 py-8 text-slate-100 sm:p-12"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-200"><ArrowLeft size={16} /> Voltar à loja</Link><section className="mt-8 grid gap-8 rounded-[2rem] border border-white/10 bg-slate-950/40 p-7 lg:grid-cols-[.8fr_1.2fr] lg:p-10"><div className="grid min-h-64 place-items-center rounded-[1.5rem] bg-gradient-to-br from-emerald-300/20 via-cyan-400/10 to-slate-950"><div className="grid h-28 w-28 place-items-center rounded-[2rem] bg-emerald-300 text-slate-950 shadow-[0_0_60px_rgba(52,211,153,.25)]"><Box size={58} /></div></div><div><p className="font-mono text-xs font-bold tracking-[.16em] text-emerald-300">{product.data.categoryName.toUpperCase()}</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white">{product.data.name}</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{product.data.description || product.data.shortDescription || "Benefício digital configurado para ser entregue com segurança no servidor selecionado."}</p>{destinations.isError ? <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">Os destinos deste produto não puderam ser carregados. Tente novamente antes de comprar.</p> : <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300"><span className="rounded-lg bg-white/5 px-3 py-2">{product.data.durationDays ? `${product.data.durationDays} dias` : "Permanente"}</span>{destinations.data?.map(server => <span key={server.id} className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">{server.name}</span>)}</div>}<div className="mt-10 flex flex-wrap items-center justify-between gap-5"><strong className="font-mono text-3xl text-emerald-200">{money.format(product.data.priceCents / 100)}</strong><Button disabled={destinations.isLoading || destinations.isError || !destinations.data?.length} onClick={addToCart} className="h-12 rounded-xl bg-emerald-300 px-6 font-bold text-slate-950 hover:bg-emerald-200"><ShoppingBag size={18} /> Adicionar ao carrinho</Button></div></div></section></div></main>;
}
