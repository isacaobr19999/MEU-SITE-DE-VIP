import { getPublicCommunityStatus } from "../db/community";
import { publicProcedure, router } from "../_core/trpc";

export const communityRouter = router({
  status: publicProcedure.query(async () => getPublicCommunityStatus()),
});
