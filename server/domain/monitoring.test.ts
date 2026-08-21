import { describe, expect, it } from "vitest";
import { MONITORING_SERVICE_DEFAULTS } from "../db/monitoring";

describe("monitoring service contract", () => {
  it("declares the store, API, Discord and Paper services", () => {
    expect(MONITORING_SERVICE_DEFAULTS.map(service => service.serviceKey)).toEqual(["store", "api", "discord", "minecraft"]);
  });

  it("keeps the external snapshot endpoint separate from the public store root", () => {
    expect(MONITORING_SERVICE_DEFAULTS[0].endpoint).toBe("/");
    expect(MONITORING_SERVICE_DEFAULTS.slice(1).every(service => service.endpoint.includes("community.status"))).toBe(true);
  });
});
