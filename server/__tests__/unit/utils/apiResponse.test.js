import { apiResponse } from "../../../src/utils/apiResponse.js";

describe("apiResponse", () => {
    it("should mark 2xx responses as successful", () => {
        const response = new apiResponse(201, "Created", { id: 1 });

        expect(response.statuscode).toBe(201);
        expect(response.message).toBe("Created");
        expect(response.data).toEqual({ id: 1 });
        expect(response.success).toBe(true);
    });

    it("should mark 4xx responses as unsuccessful", () => {
        const response = new apiResponse(400, "Bad request");

        expect(response.success).toBe(false);
    });
});
