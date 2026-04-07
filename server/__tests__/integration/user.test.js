import request from "supertest";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.model.js";
import { createUser, sampleAvatarPath } from "../helpers/testData.js";

describe("User API", () => {
    it("should register a new user with avatar upload", async () => {
        const response = await request(app)
            .post("/api/v1/users/register")
            .field("username", "new_user")
            .field("email", "new_user@example.com")
            .field("fullname", "New User")
            .field("password", "Password123")
            .attach("avatar", sampleAvatarPath);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("User registered successfully");
        expect(response.body.data.username).toBe("new_user");
        expect(response.body.data.avatar).toContain("mock-cloudinary.local");
    });

    it("should reject duplicate user registration", async () => {
        await createUser({
            username: "existing_user",
            email: "existing@example.com",
        });

        const response = await request(app)
            .post("/api/v1/users/register")
            .field("username", "existing_user")
            .field("email", "existing@example.com")
            .field("fullname", "Existing User")
            .field("password", "Password123")
            .attach("avatar", sampleAvatarPath);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("User with this email or username already exists");
    });

    it("should log in with valid credentials and return tokens", async () => {
        await createUser({
            username: "login_user",
            email: "login@example.com",
            password: "Password123",
        });

        const response = await request(app)
            .post("/api/v1/users/login")
            .send({
                email: "login@example.com",
                password: "Password123",
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe("login@example.com");
        expect(response.body.data.accessToken).toBeTruthy();
        expect(response.body.data.refreshToken).toBeTruthy();
        expect(response.headers["set-cookie"]).toEqual(
            expect.arrayContaining([
                expect.stringContaining("accessToken="),
                expect.stringContaining("refreshToken="),
            ])
        );

        const savedUser = await User.findOne({ email: "login@example.com" }).lean();
        expect(savedUser.refreshToken).toBe(response.body.data.refreshToken);
    });

    it("should reject login with invalid password", async () => {
        await createUser({
            username: "wrong_password_user",
            email: "wrong-password@example.com",
            password: "Password123",
        });

        const response = await request(app)
            .post("/api/v1/users/login")
            .send({
                email: "wrong-password@example.com",
                password: "bad-password",
            });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Invalid user credentials");
    });

    it("should issue new tokens from a valid refresh token", async () => {
        const loginUser = await createUser({
            username: "refresh_user",
            email: "refresh@example.com",
            password: "Password123",
        });

        const loginResponse = await request(app)
            .post("/api/v1/users/login")
            .send({
                email: "refresh@example.com",
                password: "Password123",
            });

        const refreshResponse = await request(app)
            .post("/api/v1/users/refreshToken")
            .send({
                refreshToken: loginResponse.body.data.refreshToken,
            });

        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.accessToken).toBeTruthy();
        expect(refreshResponse.body.data.refreshToken).toBeTruthy();

        const updatedUser = await User.findById(loginUser._id).lean();
        expect(updatedUser.refreshToken).toBe(refreshResponse.body.data.refreshToken);
    });
});
