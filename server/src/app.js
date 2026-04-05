import express from 'express';
const app = express();

import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from './database/redis.js';

const defaultDevOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000"];
const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins;

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (Postman/cURL) and same-origin requests
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

// --- Global Rate Limiter ---
// Limits each IP to 100 requests per 15-minute window across ALL routes.
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // 100 requests per window per IP
    standardHeaders: true,      // Send RateLimit-* headers in response
    legacyHeaders: false,       // Disable old X-RateLimit-* headers
    store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:global:',   // Keys in Redis: rl:global:192.168.1.5
    }),
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes."
    }
});
app.use(globalLimiter);

app.use(express.json({limit:'20kb'}));
app.use(express.urlencoded({ extended: true, limit:'20kb' }));
app.use(express.static("public"));
app.use(cookieParser());


// routes import

import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// Swagger UI — API docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes  declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)



// http://localhost:8000/api/v1/users/register

export {app};
