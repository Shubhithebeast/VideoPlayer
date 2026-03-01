import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setSessionTokens } from "../api";

const SESSION_KEY = "videoplayer_session_v1";

const AuthContext = createContext(null);

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const stored = safeParse(localStorage.getItem(SESSION_KEY) || "");
    if (stored) {
      setUser(stored.user || null);
      setAccessToken(stored.accessToken || "");
      setRefreshToken(stored.refreshToken || "");
      setSessionTokens({
        accessToken: stored.accessToken || "",
        refreshToken: stored.refreshToken || ""
      });
    }
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!bootstrapped) {
      return;
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user,
        accessToken,
        refreshToken
      })
    );

    setSessionTokens({ accessToken, refreshToken });
  }, [bootstrapped, user, accessToken, refreshToken]);

  const setSession = (session) => {
    setUser(session.user || null);
    setAccessToken(session.accessToken || "");
    setRefreshToken(session.refreshToken || "");
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken("");
    setRefreshToken("");
  };

  const login = async ({ email, username, password }) => {
    const formData = new FormData();
    if (email) {
      formData.append("email", email);
    }
    if (username) {
      formData.append("username", username);
    }
    formData.append("password", password);

    const result = await authApi.login(formData);
    const payload = result.data || {};

    setSession({
      user: payload.user || null,
      accessToken: payload.accessToken || "",
      refreshToken: payload.refreshToken || ""
    });

    return result;
  };

  const register = async ({ username, email, fullname, password, avatar, coverImage }) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("fullname", fullname);
    formData.append("password", password);
    formData.append("avatar", avatar);
    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    return authApi.register(formData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // clear local session anyway
    }
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      bootstrapped,
      setSession,
      clearSession,
      login,
      register,
      logout
    }),
    [user, accessToken, refreshToken, bootstrapped]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
