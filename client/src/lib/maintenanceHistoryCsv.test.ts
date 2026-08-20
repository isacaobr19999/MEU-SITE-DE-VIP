import { describe, expect, it } from "vitest";
import { buildMaintenanceHistoryCsv } from "./maintenanceHistoryCsv";

describe("buildMaintenanceHistoryCsv", () => {
  it("gera um CSV localizado e neutraliza fórmulas em campos administrativos", () => {
    const csv = buildMaintenanceHistoryCsv([{ eventType: "SCHEDULED", mode: "CLOSED", message: "=IMPORTXML()", reason: "Atualização", scheduledStartAt: "2026-08-20T14:00:00.000Z", scheduledEndAt: "2026-08-20T15:00:00.000Z", actorType: "admin", createdAt: "2026-08-20T13:00:00.000Z" }]);

    expect(csv).toContain('"Evento";"Modo";"Motivo"');
    expect(csv).toContain("'=IMPORTXML()");
    expect(csv).not.toContain("Agendada");
    expect(csv).toContain("SCHEDULED");
  });
});
