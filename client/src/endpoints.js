export const endpointGroups = [
  {
    id: "health",
    title: "Health",
    description: "Service liveness and readiness checks.",
    endpoints: [
      {
        id: "health-liveness",
        title: "Liveness",
        method: "GET",
        path: "/healthcheck/liveness",
        requiresAuth: false,
        query: [],
        params: [],
        body: []
      },
      {
        id: "health-readiness",
        title: "Readiness",
        method: "GET",
        path: "/healthcheck/readiness",
        requiresAuth: false,
        query: [],
        params: [],
        body: []
      }
    ]
  },
  {
    id: "users",
    title: "Users",
    description: "Authentication and account management.",
    endpoints: [
      {
        id: "users-register",
        title: "Register",
        method: "POST",
        path: "/users/register",
        requiresAuth: false,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "username", label: "Username", type: "text", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "fullname", label: "Full name", type: "text", required: true },
          { key: "password", label: "Password", type: "password", required: true }
        ],
        files: [
          { key: "avatar", label: "Avatar", required: true, accept: "image/*" },
          { key: "coverImage", label: "Cover image", required: false, accept: "image/*" }
        ]
      },
      {
        id: "users-login",
        title: "Login",
        method: "POST",
        path: "/users/login",
        requiresAuth: false,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "email", label: "Email", type: "email", required: false },
          { key: "username", label: "Username", type: "text", required: false },
          { key: "password", label: "Password", type: "password", required: true }
        ]
      },
      {
        id: "users-logout",
        title: "Logout",
        method: "POST",
        path: "/users/logout",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: []
      },
      {
        id: "users-refresh",
        title: "Refresh Token",
        method: "POST",
        path: "/users/refreshToken",
        requiresAuth: false,
        contentType: "multipart",
        params: [],
        query: [],
        body: [{ key: "refreshToken", label: "Refresh token", type: "text", required: false }]
      },
      {
        id: "users-current",
        title: "Get Current User",
        method: "GET",
        path: "/users/getUser",
        requiresAuth: false,
        params: [],
        query: [],
        body: []
      },
      {
        id: "users-password",
        title: "Change Password",
        method: "POST",
        path: "/users/changePassword",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "oldPassword", label: "Old password", type: "password", required: true },
          { key: "newPassword", label: "New password", type: "password", required: true }
        ]
      },
      {
        id: "users-update",
        title: "Update Account",
        method: "POST",
        path: "/users/updateAccountDetails",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "fullname", label: "Full name", type: "text", required: true },
          { key: "email", label: "Email", type: "email", required: true }
        ]
      },
      {
        id: "users-avatar",
        title: "Update Avatar",
        method: "POST",
        path: "/users/avatar",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [],
        files: [{ key: "avatar", label: "Avatar", required: true, accept: "image/*" }]
      },
      {
        id: "users-cover",
        title: "Update Cover",
        method: "POST",
        path: "/users/coverImage",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [],
        files: [{ key: "coverImage", label: "Cover image", required: true, accept: "image/*" }]
      },
      {
        id: "users-channel",
        title: "Channel Profile",
        method: "GET",
        path: "/users/c/:username",
        requiresAuth: true,
        params: [{ key: "username", label: "Username", required: true }],
        query: [],
        body: []
      },
      {
        id: "users-history",
        title: "Watch History",
        method: "GET",
        path: "/users/history",
        requiresAuth: true,
        params: [],
        query: [],
        body: []
      }
    ]
  },
  {
    id: "videos",
    title: "Videos",
    description: "Browse, publish, and manage videos.",
    endpoints: [
      {
        id: "videos-list",
        title: "List Videos",
        method: "GET",
        path: "/videos",
        requiresAuth: true,
        params: [],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false },
          { key: "query", label: "Search", required: false },
          { key: "sortBy", label: "Sort By", required: false },
          { key: "sortType", label: "Sort Type (asc/desc)", required: false },
          { key: "userId", label: "User ID", required: false }
        ],
        body: []
      },
      {
        id: "videos-publish",
        title: "Publish Video",
        method: "POST",
        path: "/videos",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea", required: true }
        ],
        files: [
          { key: "video", label: "Video file", required: true, accept: "video/*" },
          { key: "thumbnail", label: "Thumbnail", required: false, accept: "image/*" }
        ]
      },
      {
        id: "videos-by-id",
        title: "Get Video By ID",
        method: "GET",
        path: "/videos/:videoId",
        requiresAuth: true,
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "videos-update",
        title: "Update Video",
        method: "PATCH",
        path: "/videos/:videoId",
        requiresAuth: true,
        contentType: "multipart",
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: [
          { key: "title", label: "Title", type: "text", required: false },
          { key: "description", label: "Description", type: "textarea", required: false }
        ],
        files: [{ key: "thumbnail", label: "New Thumbnail", required: false, accept: "image/*" }]
      },
      {
        id: "videos-delete",
        title: "Delete Video",
        method: "DELETE",
        path: "/videos/:videoId",
        requiresAuth: true,
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "videos-toggle",
        title: "Toggle Publish",
        method: "PATCH",
        path: "/videos/toggle/publish/:videoId",
        requiresAuth: true,
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: []
      }
    ]
  },
  {
    id: "comments",
    title: "Comments",
    description: "Create and moderate video comments.",
    endpoints: [
      {
        id: "comments-list",
        title: "Get Video Comments",
        method: "GET",
        path: "/comments/:videoId",
        requiresAuth: true,
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      },
      {
        id: "comments-add",
        title: "Add Comment",
        method: "POST",
        path: "/comments/:videoId",
        requiresAuth: true,
        contentType: "multipart",
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: [{ key: "content", label: "Comment", type: "textarea", required: true }]
      },
      {
        id: "comments-update",
        title: "Update Comment",
        method: "PATCH",
        path: "/comments/c/:commentId",
        requiresAuth: true,
        contentType: "multipart",
        params: [{ key: "commentId", label: "Comment ID", required: true }],
        query: [],
        body: [{ key: "content", label: "Comment", type: "textarea", required: true }]
      },
      {
        id: "comments-delete",
        title: "Delete Comment",
        method: "DELETE",
        path: "/comments/c/:commentId",
        requiresAuth: true,
        params: [{ key: "commentId", label: "Comment ID", required: true }],
        query: [],
        body: []
      }
    ]
  },
  {
    id: "likes",
    title: "Likes",
    description: "Toggle likes and fetch liked videos.",
    endpoints: [
      {
        id: "likes-video",
        title: "Toggle Video Like",
        method: "POST",
        path: "/likes/toggle/l/:videoId",
        requiresAuth: true,
        params: [{ key: "videoId", label: "Video ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "likes-comment",
        title: "Toggle Comment Like",
        method: "POST",
        path: "/likes/toggle/c/:commentId",
        requiresAuth: true,
        params: [{ key: "commentId", label: "Comment ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "likes-tweet",
        title: "Toggle Tweet Like",
        method: "POST",
        path: "/likes/toggle/t/:tweetId",
        requiresAuth: true,
        params: [{ key: "tweetId", label: "Tweet ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "likes-videos",
        title: "Get Liked Videos",
        method: "GET",
        path: "/likes/videos",
        requiresAuth: true,
        params: [],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      }
    ]
  },
  {
    id: "playlists",
    title: "Playlists",
    description: "Create playlists and manage playlist videos.",
    endpoints: [
      {
        id: "playlists-create",
        title: "Create Playlist",
        method: "POST",
        path: "/playlist",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea", required: false }
        ]
      },
      {
        id: "playlists-by-id",
        title: "Get Playlist By ID",
        method: "GET",
        path: "/playlist/:playlistId",
        requiresAuth: true,
        params: [{ key: "playlistId", label: "Playlist ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      },
      {
        id: "playlists-update",
        title: "Update Playlist",
        method: "PATCH",
        path: "/playlist/:playlistId",
        requiresAuth: true,
        contentType: "multipart",
        params: [{ key: "playlistId", label: "Playlist ID", required: true }],
        query: [],
        body: [
          { key: "name", label: "Name", type: "text", required: false },
          { key: "description", label: "Description", type: "textarea", required: false }
        ]
      },
      {
        id: "playlists-delete",
        title: "Delete Playlist",
        method: "DELETE",
        path: "/playlist/:playlistId",
        requiresAuth: true,
        params: [{ key: "playlistId", label: "Playlist ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "playlists-add-video",
        title: "Add Video To Playlist",
        method: "PATCH",
        path: "/playlist/add/:videoId/:playlistId",
        requiresAuth: true,
        params: [
          { key: "videoId", label: "Video ID", required: true },
          { key: "playlistId", label: "Playlist ID", required: true }
        ],
        query: [],
        body: []
      },
      {
        id: "playlists-remove-video",
        title: "Remove Video From Playlist",
        method: "PATCH",
        path: "/playlist/remove/:videoId/:playlistId",
        requiresAuth: true,
        params: [
          { key: "videoId", label: "Video ID", required: true },
          { key: "playlistId", label: "Playlist ID", required: true }
        ],
        query: [],
        body: []
      },
      {
        id: "playlists-user",
        title: "Get User Playlists",
        method: "GET",
        path: "/playlist/user/:userId",
        requiresAuth: true,
        params: [{ key: "userId", label: "User ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      }
    ]
  },
  {
    id: "tweets",
    title: "Tweets",
    description: "Post and manage short text updates.",
    endpoints: [
      {
        id: "tweets-create",
        title: "Create Tweet",
        method: "POST",
        path: "/tweets",
        requiresAuth: true,
        contentType: "multipart",
        params: [],
        query: [],
        body: [{ key: "tweet", label: "Tweet text", type: "textarea", required: true }]
      },
      {
        id: "tweets-user",
        title: "Get User Tweets",
        method: "GET",
        path: "/tweets/user/:userId",
        requiresAuth: true,
        params: [{ key: "userId", label: "User ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      },
      {
        id: "tweets-update",
        title: "Update Tweet",
        method: "PATCH",
        path: "/tweets/:tweetId",
        requiresAuth: true,
        contentType: "multipart",
        params: [{ key: "tweetId", label: "Tweet ID", required: true }],
        query: [],
        body: [{ key: "content", label: "Updated content", type: "textarea", required: true }]
      },
      {
        id: "tweets-delete",
        title: "Delete Tweet",
        method: "DELETE",
        path: "/tweets/:tweetId",
        requiresAuth: true,
        params: [{ key: "tweetId", label: "Tweet ID", required: true }],
        query: [],
        body: []
      }
    ]
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    description: "Subscribe and view subscriber/channel relations.",
    endpoints: [
      {
        id: "subscriptions-toggle",
        title: "Toggle Subscription",
        method: "POST",
        path: "/subscriptions/channel/:channelId",
        requiresAuth: true,
        params: [{ key: "channelId", label: "Channel ID", required: true }],
        query: [],
        body: []
      },
      {
        id: "subscriptions-channel-list",
        title: "Get Subscribed Channels",
        method: "GET",
        path: "/subscriptions/channel/:channelId",
        requiresAuth: true,
        params: [{ key: "channelId", label: "Channel ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: [],
        warning: "Backend route/controller param naming appears mismatched in current code."
      },
      {
        id: "subscriptions-user-subscribers",
        title: "Get User Subscribers",
        method: "GET",
        path: "/subscriptions/users/:subscriberId",
        requiresAuth: true,
        params: [{ key: "subscriberId", label: "Subscriber ID", required: true }],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: [],
        warning: "Backend route/controller param naming appears mismatched in current code."
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Channel analytics for authenticated user.",
    endpoints: [
      {
        id: "dashboard-stats",
        title: "Channel Stats",
        method: "GET",
        path: "/dashboard/stats",
        requiresAuth: true,
        params: [],
        query: [],
        body: []
      },
      {
        id: "dashboard-videos",
        title: "Channel Videos",
        method: "GET",
        path: "/dashboard/videos",
        requiresAuth: true,
        params: [],
        query: [
          { key: "page", label: "Page", required: false },
          { key: "limit", label: "Limit", required: false }
        ],
        body: []
      }
    ]
  }
];

export const flattenEndpoints = endpointGroups.flatMap((group) =>
  group.endpoints.map((endpoint) => ({ ...endpoint, groupId: group.id, groupTitle: group.title }))
);
