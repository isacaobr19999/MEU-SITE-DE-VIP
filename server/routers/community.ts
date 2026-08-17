import { getPublicCommunityStatus, getPublicOperationsStatus } from "../db/community";
import { listPublishedCommunityPosts } from "../db/communityContent";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const communityRouter = router({
  status: publicProcedure.query(async () => getPublicCommunityStatus()),
  operations: publicProcedure.query(async () => {
    const [community, operations] = await Promise.all([getPublicCommunityStatus(), getPublicOperationsStatus()]);
    return { community, operations };
  }),
  posts: publicProcedure.input(z.object({ kind: z.enum(["RULE", "NEWS"]) })).query(({ input }) => listPublishedCommunityPosts(input.kind)),
});
