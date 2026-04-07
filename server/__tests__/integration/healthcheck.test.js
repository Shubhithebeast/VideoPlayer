import request from "supertest";
import { app } from "../../src/app.js";

describe("Healthcheck API", () => {
    it("should return liveness details", async () => {
        const response = await request(app).get("/api/v1/healthcheck/liveness");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Liveness check passed");
        expect(response.body.data.status).toBe("OK");
    });

    it("should return readiness details when database is connected", async () => {
        const response = await request(app).get("/api/v1/healthcheck/readiness");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.ready).toBe(true);
        expect(response.body.data.checks.database.status).toBe("Connected");
    });
});
