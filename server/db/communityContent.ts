import { and, desc, eq } from "drizzle-orm";
import { communityPosts } from "../../drizzle/schema";
import { requireDb } from "../db";

export type CommunityPostKind = "RULE" | "NEWS";

export type CommunityPostInput = {
  slug: string;
  kind: CommunityPostKind;
  title: string;
  summary?: string;
  body: string;
  published: boolean;
  position: number;
};

export async function listPublishedCommunityPosts(kind: CommunityPostKind) {
  const db = await requireDb();
  return db.select({
    id: communityPosts.id,
    slug: communityPosts.slug,
    title: communityPosts.title,
    summary: communityPosts.summary,
    body: communityPosts.body,
    publishedAt: communityPosts.publishedAt,
    updatedAt: communityPosts.updatedAt,
  }).from(communityPosts).where(and(eq(communityPosts.kind, kind), eq(communityPosts.published, true))).orderBy(desc(communityPosts.position), desc(communityPosts.publishedAt), desc(communityPosts.updatedAt));
}

export async function listAdminCommunityPosts() {
  const db = await requireDb();
  return db.select().from(communityPosts).orderBy(communityPosts.kind, desc(communityPosts.position), desc(communityPosts.updatedAt));
}

export async function createCommunityPost(input: CommunityPostInput) {
  const db = await requireDb();
  const publishedAt = input.published ? new Date() : null;
  const result = await db.insert(communityPosts).values({ ...input, summary: input.summary || null, publishedAt });
  return Number(result[0].insertId);
}

export async function updateCommunityPost(id: number, input: CommunityPostInput) {
  const db = await requireDb();
  const [existing] = await db.select({ published: communityPosts.published, publishedAt: communityPosts.publishedAt }).from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  if (!existing) throw new Error("Conteúdo comunitário não localizado.");
  await db.update(communityPosts).set({
    ...input,
    summary: input.summary || null,
    publishedAt: input.published && !existing.published ? new Date() : input.published ? existing.publishedAt ?? new Date() : null,
  }).where(eq(communityPosts.id, id));
}

export async function deleteCommunityPost(id: number) {
  const db = await requireDb();
  const result = await db.delete(communityPosts).where(eq(communityPosts.id, id));
  if (!result[0].affectedRows) throw new Error("Conteúdo comunitário não localizado.");
}
