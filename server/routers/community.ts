import { getPublicCommunityStatus } from "../db/community";
import { listPublishedCommunityPosts } from "../db/communityContent";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const communityRouter = router({
  status: publicProcedure.query(async () => getPublicCommunityStatus()),
  posts: publicProcedure.input(z.object({ kind: z.enum(["RULE", "NEWS"]) })).query(({ input }) => listPublishedCommunityPosts(input.kind)),
});
