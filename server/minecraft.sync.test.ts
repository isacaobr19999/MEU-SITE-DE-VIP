import { describe, expect, it } from "vitest";
import { playerSyncInput } from "./minecraft";

describe("Minecraft player synchronization input", () => {
  it("accepts a valid Minecraft name and UUID", () => {
    expect(playerSyncInput.parse({ username: "_Nube", uuid: "8b824b33-26eb-44fc-af0c-b04e43dcd572" })).toEqual({ username: "_Nube", uuid: "8b824b33-26eb-44fc-af0c-b04e43dcd572" });
  });

  it("rejects malformed names and UUIDs", () => {
    expect(() => playerSyncInput.parse({ username: "nome com espaço", uuid: "not-a-uuid" })).toThrow();
  });
});
