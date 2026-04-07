import { apiError } from "../../../src/utils/apiError.js";

describe("apiError", () => {
    it("should build a structured error object", () => {
        const error = new apiError(400, "Validation failed", ["username is required"]);

        expect(error).toBeInstanceOf(Error);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Validation failed");
        expect(error.errors).toEqual(["username is required"]);
        expect(error.success).toBe(false);
        expect(error.data).toBeNull();
    });
});
