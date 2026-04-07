import request from "supertest";
import { app } from "../../src/app.js";
import { Comment } from "../../src/models/comment.model.js";
import {
    authHeaderForUser,
    createComment,
    createUser,
    createVideo,
} from "../helpers/testData.js";

describe("Comment API", () => {
    it("should add a comment for an authenticated user", async () => {
        const user = await createUser();
        const video = await createVideo(user._id);

        const response = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .set(authHeaderForUser(user))
            .send({ content: "This video was really helpful." });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe("This video was really helpful.");

        const savedComment = await Comment.findById(response.body.data._id).lean();
        expect(savedComment).not.toBeNull();
    });

    it("should reject comment creation without auth", async () => {
        const user = await createUser();
        const video = await createVideo(user._id);

        const response = await request(app)
            .post(`/api/v1/comments/${video._id}`)
            .send({ content: "Unauthorized comment" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Unauthorized access, invalid token");
    });

    it("should update a comment owned by the logged-in user", async () => {
        const user = await createUser();
        const video = await createVideo(user._id);
        const comment = await createComment(user._id, video._id);

        const response = await request(app)
            .patch(`/api/v1/comments/c/${comment._id}`)
            .set(authHeaderForUser(user))
            .send({ content: "Updated comment text" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe("Updated comment text");
    });

    it("should prevent one user from deleting another user's comment", async () => {
        const owner = await createUser({ username: "owner_user", email: "owner@example.com" });
        const intruder = await createUser({ username: "intruder_user", email: "intruder@example.com" });
        const video = await createVideo(owner._id);
        const comment = await createComment(owner._id, video._id);

        const response = await request(app)
            .delete(`/api/v1/comments/c/${comment._id}`)
            .set(authHeaderForUser(intruder));

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("You are not authorized to delete this comment");
    });

    it("should fetch paginated comments for a video", async () => {
        const user = await createUser();
        const video = await createVideo(user._id);
        await createComment(user._id, video._id, { content: "First comment" });
        await createComment(user._id, video._id, { content: "Second comment" });

        const response = await request(app)
            .get(`/api/v1/comments/${video._id}?page=1&limit=10`)
            .set(authHeaderForUser(user));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.docs).toHaveLength(2);
        expect(response.body.data.page).toBe(1);
    });
});
