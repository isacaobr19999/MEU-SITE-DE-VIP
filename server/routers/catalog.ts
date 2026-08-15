import { z } from "zod";
import { getPublicProductBySlug, listProductServers, listPublicCategories, listPublicProducts } from "../db/catalog";
import { publicProcedure, router } from "../_core/trpc";

export const catalogRouter = router({
  categories: publicProcedure.query(() => listPublicCategories()),
  products: publicProcedure
    .input(z.object({ categorySlug: z.string().min(1).optional(), query: z.string().trim().max(80).optional(), featuredOnly: z.boolean().optional() }).optional())
    .query(({ input }) => listPublicProducts(input)),
  product: publicProcedure.input(z.object({ slug: z.string().min(1).max(160) })).query(({ input }) => getPublicProductBySlug(input.slug)),
  productServers: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => listProductServers(input.productId)),
});
