# VideoPlayer Backend — Progress Notes
> **Last updated:** April 2026 | **Status:** Modules 1–3 Done, Module 4 Next

---

## Project Stack Snapshot

| Layer | Tech |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express 5.2.1 |
| Database | MongoDB 7.0 + Mongoose 9.0 |
| Cache / Queue broker | Redis (ioredis 5) |
| Auth | JWT — access token (short TTL) + refresh token (long TTL) |
| File upload | Multer (temp local) → Cloudinary (permanent) |
| Job queue | BullMQ 5 |
| Logging | Winston + daily-rotate-file |
| API style | RESTful `/api/v1/{resource}` |
| Dev tooling | Nodemon, Prettier, dotenv |

---

## Architecture Overview

```
Client
  └─► Express App (app.js)
        ├── CORS middleware
        ├── Rate limiters (global / login / upload)  ← Redis-backed
        ├── Body parser (20 KB limit)
        └── Routes → Controllers
                          ├── MongoDB (Mongoose)
                          ├── Redis (cache-aside)
                          └── BullMQ queue → Worker (background)
```

---

## ✅ MODULE 1 — Rate Limiting (DONE)

**Packages:** `express-rate-limit` + `rate-limit-redis`

### Limiters implemented

| Limiter | Scope | Limit | Store |
|---|---|---|---|
| Global | All routes | 100 req / 15 min / IP | Redis |
| Login strict | `POST /login` | 5 attempts / 15 min / IP | Redis |
| Upload | `POST /videos` | 10 uploads / hour / userId | Redis |

### Key concepts
- **Window** — time period for counting requests
- **Max** — allowed requests in that window
- **Key** — identifier (IP or userId)
- **Store** — Redis (shared across instances, survives restarts)
- Returns `429 Too Many Requests` when exceeded

### Why it matters
Stops brute-force login, upload spam, and basic DDoS.

---

## ✅ MODULE 2 — Redis + Caching (DONE)

**Package:** `ioredis`
**Files:** `server/src/database/redis.js`, `server/src/utils/cache.js`

### Cache helper functions

| Function | What it does |
|---|---|
| `getCache(key)` | Redis GET + JSON.parse → `null` on miss |
| `setCache(key, data, ttlSeconds)` | Redis SET with EX expiry |
| `deleteCache(key)` | Redis DEL single key |
| `deleteCachePattern(pattern)` | SCAN + DEL (non-blocking, pattern-based) |

### What is cached

| Data | Cache key | TTL |
|---|---|---|
| Single video details | `video:{videoId}` | 10 min |
| Dashboard / channel stats | `dashboard:stats:{userId}` | 1 hour |

### Cache invalidation triggers
- Video updated → `deleteCache("video:{id}")`
- Video liked/unliked → delete `video:{id}` + `dashboard:stats:{ownerId}`
- Worker finishes upload → delete `video:{id}` + `dashboard:stats:{ownerId}`

### Pattern used — Cache-Aside
```
Request → check Redis
  HIT  → return instantly (no DB hit)
  MISS → query MongoDB → store in Redis with TTL → return
```

---

## ✅ MODULE 3 — Message Queues / BullMQ (DONE)

**Package:** `bullmq`
**Files:** `server/src/queues/`

### Queues implemented

#### 1. `video-processing`

| Property | Value |
|---|---|
| Files | `videoQueue.js` + `videoWorker.js` |
| Concurrency | 2 jobs at a time |
| Retries | 3 attempts, exponential backoff: 5s → 10s → 20s |
| Retention | 50 completed, 100 failed |

**Job data:** `{ localVideoPath, localThumbnailPath, title, description, ownerId }`

**Worker progress steps:**
- `10%` → job started
- `60%` → video uploaded to Cloudinary
- `80%` → thumbnail uploaded to Cloudinary
- `100%` → saved to MongoDB, Redis cache invalidated

#### 2. `temp-cleanup`

| Property | Value |
|---|---|
| Files | `cleanupQueue.js` + `cleanupWorker.js` |
| Schedule | Cron — every hour (`0 * * * *`) |
| Task | Delete temp files older than 1 hour from `./public/temp/` |
| Concurrency | 1 |

### Upload flow (with queue)
```
POST /videos
  ├── File saved to ./public/temp  (Multer — fast)
  ├── Job added to Redis queue     (instant)
  └── 202 returned → { jobId }

Background Worker:
  ├── Upload video → Cloudinary
  ├── Upload thumbnail → Cloudinary
  ├── Extract duration
  ├── Save Video document → MongoDB
  └── Invalidate Redis cache
```

**Poll endpoint:** `GET /api/v1/videos/jobs/:jobId` → `{ state, progress, result/failReason }`

### Key BullMQ concepts understood
- **Producer** — controller adds jobs (`addVideoJob()`)
- **Worker** — processes jobs in background (separate process)
- **Retry + backoff** — failed jobs retry with increasing delay
- **Events** — `completed`, `failed`, `error` listeners on worker
- **Scheduled jobs** — cron-style recurring jobs via `repeat` option

---

## 🔜 MODULE 4 — Database Optimization (NEXT)

### What to implement

| Optimization | Where | Expected gain |
|---|---|---|
| Compound indexes | All models | 10–100x faster queries |
| `.lean()` on reads | All controllers | 2–5x faster reads |
| Field projection `.select()` | Controllers | Less data transferred |
| Early `$match` in aggregations | Aggregation pipelines | Filter before expensive stages |
| `explain()` analysis | MongoDB Compass / shell | Confirm index is actually used |

### Priority indexes to add
- `Video` — `{ uploadBy, isPublished, createdAt }`
- `Subscription` — `{ subscriber, channel }` (compound + unique)
- `Like` — `{ likedBy, video }`, `{ likedBy, comment }`
- `Comment` — `{ video }`

---

## Data Models (7 Collections)

### User
| Field | Type | Notes |
|---|---|---|
| `username` | String | unique, lowercase, indexed |
| `email` | String | unique, lowercase |
| `fullname` | String | indexed |
| `avatar` | String | Cloudinary URL, required |
| `coverImage` | String | Cloudinary URL, optional |
| `watchHistory` | ObjectId[] | refs Video |
| `password` | String | bcrypt hashed |
| `refreshToken` | String | stored for revocation |

**Methods:** `generateAccessToken()`, `generateRefreshToken()`, `isPasswordCorrect()`

### Video
| Field | Type | Notes |
|---|---|---|
| `video` | String | Cloudinary URL |
| `thumbnail` | String | Cloudinary URL |
| `title` | String | **text-indexed** (enables `$text` search) |
| `description` | String | **text-indexed** |
| `duration` | Number | seconds |
| `views` | Number | default 0 |
| `isPublished` | Boolean | default true |
| `uploadBy` | ObjectId | ref User |

### Comment
`content`, `video` → Video, `owner` → User | Plugin: mongooseAggregatePaginate

### Like *(polymorphic — only one of three set per doc)*
`video` OR `comment` OR `tweet` + `likedBy` → User

### Tweet
`owner` → User, `content` (max 500 chars)

### Playlist
`name`, `description`, `videos[]` → Video, `owner` → User

### Subscription
`subscriber` → User, `channel` → User

---

## All API Endpoints (38 total)

### `/api/v1/users` — 11 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | avatar + optional cover image (Multer) |
| POST | `/login` | — | ⛔ rate-limited 5/15min |
| POST | `/logout` | ✅ | clears refresh token + cookies |
| POST | `/refreshToken` | — | issues new access token |
| GET | `/getUser` | ✅ | current user (no password/refreshToken) |
| POST | `/changePassword` | ✅ | old + new password |
| POST | `/updateAccountDetails` | ✅ | fullname, email, username |
| POST | `/avatar` | ✅ | replaces old avatar on Cloudinary |
| POST | `/coverImage` | ✅ | replaces old cover on Cloudinary |
| GET | `/c/:username` | ✅ | channel profile (sub counts, isSubscribed flag) |
| GET | `/history` | ✅ | watch history with full video + uploader info |

### `/api/v1/videos` — 7 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | ✅ | paginated, `$text` search, sort, filter by user |
| POST | `/` | ✅ | ⛔ rate-limited 10/hour → queued → returns `{ jobId }` |
| GET | `/jobs/:jobId` | ✅ | poll processing status + % progress |
| GET | `/:videoId` | ✅ | cached 10 min, increments views, adds to history |
| DELETE | `/:videoId` | ✅ | deletes video + related likes/comments |
| PATCH | `/:videoId` | ✅ | update title / description / thumbnail |
| PATCH | `/toggle/publish/:videoId` | ✅ | toggle `isPublished` |

### `/api/v1/tweets` — 4 endpoints
| Method | Path | Auth |
|---|---|---|
| POST | `/` | ✅ |
| GET | `/user/:userId` | ✅ |
| PATCH | `/:tweetId` | ✅ |
| DELETE | `/:tweetId` | ✅ |

### `/api/v1/comments` — 4 endpoints
| Method | Path | Auth |
|---|---|---|
| GET | `/:videoId` | ✅ |
| POST | `/:videoId` | ✅ |
| PATCH | `/c/:commentId` | ✅ |
| DELETE | `/c/:commentId` | ✅ |

### `/api/v1/likes` — 4 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/toggle/l/:videoId` | ✅ | invalidates video cache |
| POST | `/toggle/c/:commentId` | ✅ | |
| POST | `/toggle/t/:tweetId` | ✅ | |
| GET | `/videos` | ✅ | paginated liked videos |

### `/api/v1/subscriptions` — 3 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/channel/:channelId` | ✅ | subscribe/unsubscribe (no self-subscribe) |
| GET | `/channel/:channelId/subscribers` | ✅ | channel owner only |
| GET | `/subscriber/:subscriberId/channels` | ✅ | self only |

### `/api/v1/playlists` — 8 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/` | ✅ | create playlist |
| GET | `/me` | ✅ | my playlists, paginated |
| GET | `/user/:userId` | ✅ | user's public playlists |
| GET | `/:playlistId` | ✅ | full playlist with video details |
| PATCH | `/:playlistId` | ✅ | update name/description |
| DELETE | `/:playlistId` | ✅ | delete playlist |
| PATCH | `/add/:videoId/:playlistId` | ✅ | add video (no duplicates) |
| PATCH | `/remove/:videoId/:playlistId` | ✅ | remove video |

### `/api/v1/dashboard` — 2 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/stats` | ✅ | totalVideos, totalViews, totalSubs, totalLikes — cached 1h |
| GET | `/videos` | ✅ | channel videos, paginated |

### `/api/v1/healthcheck` — 2 endpoints
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/liveness` | — | uptime + timestamp |
| GET | `/readiness` | — | DB + memory check → 200 or 503 |

---

## Key Controller Patterns

### Auth (user.controller.js)
- Tokens set as **HTTP-only cookies** (XSS-safe)
- `loginUser` — validates creds, issues both tokens, sets cookies
- `logoutUser` — removes refreshToken from DB, clears cookies
- `refreshAccessToken` — verifies token stored in DB (prevents post-logout reuse)
- `userChannelProfile` — aggregation: subscriber count, subscription count, `isSubscribed` flag
- `getWatchHistory` — aggregation with full video doc + uploader info

### Video (video.controller.js)
- `getAllVideos` — `$text` search on title+description, sort, filter by `uploadBy`, paginated
- `publishVideo` — save to temp → add BullMQ job → return `202 { jobId }` (non-blocking)
- `getVideoById` — aggregation (lookup user + likes + comments) → Redis cache-aside (10 min) → increment `views` → push to `watchHistory`
- `getVideoJobStatus` — queries BullMQ for job state + progress %

### Like toggle pattern (like.controller.js)
```
find existing like doc
  → exists → deleteOne  (unlike)
  → missing → create    (like)
→ if video: invalidate cache
```

### Dashboard (dashboard.controller.js)
- Single aggregation across Videos + Subscriptions + Likes — **cached 1 hour in Redis**

---

## Infrastructure

### JWT Auth Flow
```
Login  →  accessToken (HTTP-only cookie, short TTL)
          refreshToken (HTTP-only cookie + stored in DB, long TTL)

Request →  verifyJWT middleware reads cookie → attaches req.user

Token expired →  POST /refreshToken → verify DB token → new accessToken

Logout  →  refreshToken removed from DB → both cookies cleared
```

### Middleware
- **`verifyJWT`** — reads cookie OR `Authorization: Bearer <token>`, verifies secret, attaches `req.user`
- **`upload`** (Multer) — disk storage to `./public/temp/`, original filenames

### Error & Response classes
- **`apiError`** — `{ statusCode, message, errors[], success: false }`
- **`apiResponse`** — `{ statusCode, data, message, success: true }`
- **`asyncHandler`** — wraps async controllers, auto-forwards errors to Express handler

### Cloudinary utilities (server/src/utils/cloudinary.js)
- `uploadOnCloudinary(path)` — uploads file, deletes local temp after
- `deleteFromCloudinary(publicId, type)` — remove from cloud
- `extractPublicIdFromUrl(url)` — parse Cloudinary URL to get publicId (needed before delete)

### Logging (server/src/utils/logger.js)
- Winston — debug level in dev, info in prod
- Rotating log files: 20 MB max, 10-day retention
- Files: `server/logs/combined-audit.json`, `server/logs/error-audit.json`

---

## Module Roadmap

| # | Module | Status |
|---|---|---|
| 1 | Rate Limiting | ✅ Done |
| 2 | Redis + Caching | ✅ Done |
| 3 | BullMQ Message Queues | ✅ Done |
| 4 | Database Optimization (indexes, lean, projections) | 🔜 Next |
| 5 | API Documentation (Swagger) | ⏳ Pending |
| 6 | Testing (Jest + Supertest) | ⏳ Pending |
| 7 | Docker + CI/CD | ⏳ Pending |
