import { jest } from "@jest/globals";
import { asyncHandler } from "../../../src/utils/asyncHandler.js";

describe("asyncHandler", () => {
    it("should forward rejected promises to next", async () => {
        const error = new Error("boom");
        const next = jest.fn();
        const handler = asyncHandler(async () => {
            throw error;
        });

        await handler({}, {}, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});
