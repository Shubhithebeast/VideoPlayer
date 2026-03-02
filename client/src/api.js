import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let sessionAccessToken = "";
let sessionRefreshToken = "";

export function setSessionTokens({ accessToken = "", refreshToken = "" }) {
  sessionAccessToken = accessToken || "";
  sessionRefreshToken = refreshToken || "";
}

function unwrapPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload.message && typeof payload.message === "object") {
    return payload.message;
  }

  if (payload.data !== undefined) {
    return payload.data;
  }

  if (payload.message !== undefined) {
    return payload.message;
  }

  return payload;
}

async function request(method, url, options = {}, allowRefresh = true) {
  const headers = { ...(options.headers || {}) };
  if (sessionAccessToken) {
    headers.Authorization = `Bearer ${sessionAccessToken}`;
  }

  try {
    const response = await client.request({
      method,
      url,
      params: options.params,
      data: options.data,
      headers
    });

    const payload = response.data;
    return {
      raw: payload,
      data: unwrapPayload(payload),
      status: response.status
    };
  } catch (error) {
    const isUnauthorized = error?.response?.status === 401;

    if (allowRefresh && isUnauthorized) {
      try {
        const refreshed = await authApi.refresh(sessionRefreshToken);
        const nextAccessToken = refreshed.data?.accessToken || "";
        const nextRefreshToken = refreshed.data?.refreshToken || sessionRefreshToken;

        if (nextAccessToken) {
          setSessionTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken });
          return request(method, url, options, false);
        }
      } catch {
        // ignore refresh failure and throw original error
      }
    }

    throw error;
  }
}

export const authApi = {
  register(formData) {
    return request("post", "/users/register", { data: formData });
  },
  login(formData) {
    return request("post", "/users/login", { data: formData });
  },
  logout() {
    return request("post", "/users/logout");
  },
  refresh(refreshToken = "") {
    return request("post", "/users/refreshToken", { data: refreshToken ? { refreshToken } : {} }, false);
  },
  updateAccount(formData) {
    return request("post", "/users/updateAccountDetails", { data: formData });
  },
  updateAvatar(formData) {
    return request("post", "/users/avatar", { data: formData });
  },
  updateCover(formData) {
    return request("post", "/users/coverImage", { data: formData });
  },
  changePassword(formData) {
    return request("post", "/users/changePassword", { data: formData });
  }
};

export const userApi = {
  getChannelProfile(username) {
    return request("get", `/users/c/${encodeURIComponent(username)}`);
  },
  getHistory() {
    return request("get", "/users/history");
  }
};

export const videoApi = {
  list(params = {}) {
    return request("get", "/videos", { params });
  },
  getById(videoId) {
    return request("get", `/videos/${videoId}`);
  },
  publish(formData) {
    return request("post", "/videos", { data: formData });
  },
  update(videoId, formData) {
    return request("patch", `/videos/${videoId}`, { data: formData });
  },
  remove(videoId) {
    return request("delete", `/videos/${videoId}`);
  },
  togglePublish(videoId) {
    return request("patch", `/videos/toggle/publish/${videoId}`);
  }
};

export const commentApi = {
  list(videoId, params = {}) {
    return request("get", `/comments/${videoId}`, { params });
  },
  add(videoId, content) {
    const formData = new FormData();
    formData.append("content", content);
    return request("post", `/comments/${videoId}`, { data: formData });
  }
};

export const likeApi = {
  toggleVideo(videoId) {
    return request("post", `/likes/toggle/l/${videoId}`);
  },
  listVideos(params = {}) {
    return request("get", "/likes/videos", { params });
  }
};

export const subscriptionApi = {
  toggle(channelId) {
    return request("post", `/subscriptions/channel/${channelId}`);
  },
  getChannelSubscribers(channelId, params = {}) {
    return request("get", `/subscriptions/channel/${channelId}/subscribers`, { params });
  },
  getSubscribedChannels(subscriberId, params = {}) {
    return request("get", `/subscriptions/subscriber/${subscriberId}/channels`, { params });
  }
};

export const dashboardApi = {
  getStats() {
    return request("get", "/dashboard/stats");
  },
  getVideos(params = {}) {
    return request("get", "/dashboard/videos", { params });
  }
};

export const playlistApi = {
  create(formData) {
    return request("post", "/playlists", { data: formData });
  },
  getMyPlaylists(params = {}) {
    return request("get", "/playlists/me", { params });
  },
  getById(playlistId, params = {}) {
    return request("get", `/playlists/${playlistId}`, { params });
  },
  getUserPlaylists(userId, params = {}) {
    return request("get", `/playlists/user/${userId}`, { params });
  },
  addVideo(videoId, playlistId) {
    return request("patch", `/playlists/add/${videoId}/${playlistId}`);
  },
  removeVideo(videoId, playlistId) {
    return request("patch", `/playlists/remove/${videoId}/${playlistId}`);
  }
};

export function extractList(result, keys = []) {
  if (!result || typeof result !== "object") {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(result[key])) {
      return result[key];
    }
  }

  if (Array.isArray(result.docs)) {
    return result.docs;
  }

  return [];
}

export { API_BASE_URL };
