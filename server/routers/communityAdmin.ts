import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCommunityPost, deleteCommunityPost, listAdminCommunityPosts, updateCommunityPost } from "../db/communityContent";
import { getPublicCommunityStatus, updateCommunityInvite } from "../db/community";
import { writeAdminAuditLog } from "../db/admin";
import { adminProcedure, router } from "../_core/trpc";

const communityPostInput = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(3).max(160),
  kind: z.enum(["RULE", "NEWS", "POLICY"]),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(280).optional(),
  body: z.string().trim().min(2).max(8000),
  published: z.boolean().default(false),
  position: z.number().int().min(0).max(9999).default(0),
});

async function audit(actorId: string, action: string, entityId?: string, metadata?: Record<string, unknown>) {
  await writeAdminAuditLog(actorId, action, "community_post", entityId, metadata).catch(() => undefined);
}

export const communityAdminRouter = router({
  list: adminProcedure.query(listAdminCommunityPosts),
  status: adminProcedure.query(getPublicCommunityStatus),
  updateInvite: adminProcedure.input(z.object({ inviteUrl: z.string().trim().url().max(512).refine(value => value.startsWith("https://"), "O convite deve usar HTTPS").nullable() })).mutation(async ({ ctx, input }) => {
    const status = await updateCommunityInvite(input.inviteUrl);
    await audit(ctx.user.openId, "community.invite_updated", "1", { configured: Boolean(input.inviteUrl) });
    return status;
  }),
  create: adminProcedure.input(communityPostInput).mutation(async ({ ctx, input }) => {
    try {
      const id = await createCommunityPost(input);
      await audit(ctx.user.openId, "community_post.created", String(id), { kind: input.kind, published: input.published });
      return { id };
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && String((error as { code?: unknown }).code) === "ER_DUP_ENTRY") throw new TRPCError({ code: "CONFLICT", message: "Já existe um conteúdo com este endereço." });
      throw error;
    }
  }),
  update: adminProcedure.input(communityPostInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { id, ...content } = input;
    try {
      await updateCommunityPost(id, content);
      await audit(ctx.user.openId, "community_post.updated", String(id), { kind: content.kind, published: content.published });
      return { success: true };
    } catch (error) {
      throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "Conteúdo não localizado." });
    }
  }),
  delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await deleteCommunityPost(input.id);
      await audit(ctx.user.openId, "community_post.deleted", String(input.id));
      return { success: true };
    } catch (error) {
      throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "Conteúdo não localizado." });
    }
  }),
});
