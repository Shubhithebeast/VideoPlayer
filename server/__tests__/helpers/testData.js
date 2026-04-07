import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { User } from "../../src/models/user.model.js";
import { Video } from "../../src/models/video.model.js";
import { Comment } from "../../src/models/comment.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sampleAvatarPath = path.resolve(__dirname, "../../../sampleData/images/p1.jpg");

export const createUser = async (overrides = {}) => {
    const userNumber = Math.random().toString(36).slice(2, 8);

    return User.create({
        username: `user_${userNumber}`,
        email: `user_${userNumber}@example.com`,
        fullname: "Test User",
        password: "Password123",
        avatar: "https://mock-cloudinary.local/default-avatar.jpg",
        coverImage: "https://mock-cloudinary.local/default-cover.jpg",
        ...overrides,
    });
};

export const createVideo = async (ownerId, overrides = {}) => {
    return Video.create({
        video: "https://mock-cloudinary.local/video.mp4",
        thumbnail: "https://mock-cloudinary.local/thumbnail.jpg",
        title: "Integration Test Video",
        description: "Video created for integration testing",
        duration: 120,
        uploadBy: ownerId,
        ...overrides,
    });
};

export const createComment = async (ownerId, videoId, overrides = {}) => {
    return Comment.create({
        content: "Seeded test comment",
        owner: ownerId,
        video: videoId,
        ...overrides,
    });
};

export const createAccessToken = (user) =>
    jwt.sign(
        {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );

export const authHeaderForUser = (user) => ({
    Authorization: `Bearer ${createAccessToken(user)}`,
});
