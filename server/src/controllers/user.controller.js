import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, next) => {
    // Registration logic here
    await res.status(200).json({ success: true, message: "User registered successfully" });
});

export { registerUser };