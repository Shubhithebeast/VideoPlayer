import { useEffect, useRef, useState } from "react";
import { authApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, setSession, accessToken, refreshToken } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname || user?.fullName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [statusMap, setStatusMap] = useState({
    fullname: null,
    username: null,
    email: null,
    avatar: null,
    coverImage: null,
    password: null
  });
  const [busy, setBusy] = useState(false);
  const statusTimersRef = useRef({});

  const syncUser = (updated) => {
    if (!updated) {
      return;
    }
    setSession({
      user: {
        ...(user || {}),
        ...updated
      },
      accessToken,
      refreshToken
    });
  };

  useEffect(
    () => () => {
      Object.values(statusTimersRef.current).forEach((timers) => {
        if (timers?.fadeTimer) {
          clearTimeout(timers.fadeTimer);
        }
        if (timers?.clearTimer) {
          clearTimeout(timers.clearTimer);
        }
      });
    },
    []
  );

  const normalizeError = (actionKey, err) => {
    const rawMessage = err?.response?.data?.message;
    const rawText =
      typeof err?.response?.data === "string"
        ? err.response.data
        : typeof rawMessage === "string"
          ? rawMessage
          : "";

    const message = (rawText || rawMessage || err?.message || "Update failed").toLowerCase();

    if (
      actionKey === "username" &&
      (message.includes("username already") || message.includes("already in use") || message.includes("duplicate"))
    ) {
      return "Username already exists";
    }
    if (
      actionKey === "email" &&
      (message.includes("email already") || message.includes("already in use") || message.includes("duplicate"))
    ) {
      return "Email already exists";
    }

    if (typeof rawMessage === "string" && rawMessage.trim()) {
      return rawMessage;
    }
    return "Update failed";
  };

  const setActionStatus = (key, type, text) => {
    const existing = statusTimersRef.current[key];
    if (existing?.fadeTimer) {
      clearTimeout(existing.fadeTimer);
    }
    if (existing?.clearTimer) {
      clearTimeout(existing.clearTimer);
    }

    setStatusMap((prev) => ({
      ...prev,
      [key]: { type, text, fading: false }
    }));

    if (!type || !text) {
      return;
    }

    const fadeTimer = setTimeout(() => {
      setStatusMap((prev) => ({
        ...prev,
        [key]: prev[key] ? { ...prev[key], fading: true } : prev[key]
      }));
    }, 3600);

    const clearTimer = setTimeout(() => {
      setStatusMap((prev) => ({
        ...prev,
        [key]: null
      }));
    }, 4000);

    statusTimersRef.current[key] = { fadeTimer, clearTimer };
  };

  const runAction = async (actionKey, fn, successText) => {
    setBusy(true);
    setActionStatus(actionKey, null, "");
    try {
      await fn();
      setActionStatus(actionKey, "success", `✓ ${successText}`);
    } catch (err) {
      const friendlyError = normalizeError(actionKey, err);
      setActionStatus(actionKey, "error", `✕ ${friendlyError}`);
    } finally {
      setBusy(false);
    }
  };

  const updateField = async (actionKey, key, value, successText) => {
    const trimmedValue = value?.trim() || "";
    const currentFullname = (user?.fullname || user?.fullName || "").trim();
    const currentUsername = (user?.username || "").trim().toLowerCase();
    const currentEmail = (user?.email || "").trim().toLowerCase();

    if (!trimmedValue) {
      setActionStatus(actionKey, "error", `✕ ${key} cannot be empty`);
      return;
    }

    if (actionKey === "fullname" && trimmedValue === currentFullname) {
      setActionStatus("fullname", "error", "✕ Full name cannot be same as current");
      return;
    }
    if (actionKey === "username" && trimmedValue.toLowerCase() === currentUsername) {
      setActionStatus("username", "error", "✕ Username cannot be same as current");
      return;
    }
    if (actionKey === "email" && trimmedValue.toLowerCase() === currentEmail) {
      setActionStatus("email", "error", "✕ Email cannot be same as current");
      return;
    }

    await runAction(actionKey, async () => {
      const formData = new FormData();
      formData.append(key, trimmedValue);
      const result = await authApi.updateAccount(formData);
      syncUser(result.data);
    }, successText);
  };

  const onAvatarUpdate = async () => {
    if (!avatarFile) {
      setActionStatus("avatar", "error", "✕ Please select avatar file first");
      return;
    }

    await runAction("avatar", async () => {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const result = await authApi.updateAvatar(formData);
      syncUser(result.data);
      setAvatarFile(null);
    }, "Avatar updated");
  };

  const onCoverUpdate = async () => {
    if (!coverFile) {
      setActionStatus("coverImage", "error", "✕ Please select cover image file first");
      return;
    }

    await runAction("coverImage", async () => {
      const formData = new FormData();
      formData.append("coverImage", coverFile);
      const result = await authApi.updateCover(formData);
      syncUser(result.data);
      setCoverFile(null);
    }, "Cover image updated");
  };

  const onPasswordUpdate = async (event) => {
    event.preventDefault();

    const oldPass = oldPassword.trim();
    const newPass = newPassword.trim();
    if (!oldPass || !newPass) {
      setActionStatus("password", "error", "✕ Old and new password are required");
      return;
    }
    if (oldPass === newPass) {
      setActionStatus("password", "error", "✕ New password cannot be same as current");
      return;
    }

    await runAction("password", async () => {
      const formData = new FormData();
      formData.append("oldPassword", oldPass);
      formData.append("newPassword", newPass);
      await authApi.changePassword(formData);
      setOldPassword("");
      setNewPassword("");
    }, "Password updated");
  };

  return (
    <section className="settings-wrap">
      <article className="settings-card">
        <p className="eyebrow">Account</p>
        <h2>Settings</h2>
        <p className="muted">Update profile fields independently.</p>

        <div className="settings-grid2">
          <div>
            <label>
              Full name
              <input value={fullname} onChange={(e) => setFullname(e.target.value)} />
            </label>
            <div className="settings-action">
              <button className="btn primary" type="button" disabled={busy} onClick={() => updateField("fullname", "fullname", fullname, "Full name updated")}>
                Update Full Name
              </button>
              {statusMap.fullname ? (
                <span className={`status-badge ${statusMap.fullname.type} ${statusMap.fullname.fading ? "fading" : ""}`}>
                  {statusMap.fullname.text}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <label>
              Username
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <div className="settings-action">
              <button className="btn primary" type="button" disabled={busy} onClick={() => updateField("username", "username", username, "Username updated")}>
                Update Username
              </button>
              {statusMap.username ? (
                <span className={`status-badge ${statusMap.username.type} ${statusMap.username.fading ? "fading" : ""}`}>
                  {statusMap.username.text}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <div className="settings-action">
              <button className="btn primary" type="button" disabled={busy} onClick={() => updateField("email", "email", email, "Email updated")}>
                Update Email
              </button>
              {statusMap.email ? (
                <span className={`status-badge ${statusMap.email.type} ${statusMap.email.fading ? "fading" : ""}`}>
                  {statusMap.email.text}
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <label>
              Avatar
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            </label>
            <div className="settings-action">
              <button className="btn primary" type="button" disabled={busy} onClick={onAvatarUpdate}>
                Update Avatar
              </button>
              {statusMap.avatar ? (
                <span className={`status-badge ${statusMap.avatar.type} ${statusMap.avatar.fading ? "fading" : ""}`}>
                  {statusMap.avatar.text}
                </span>
              ) : null}
            </div>
            <label>
              Cover image
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            </label>
            <div className="settings-action">
              <button className="btn primary" type="button" disabled={busy} onClick={onCoverUpdate}>
                Update Cover
              </button>
              {statusMap.coverImage ? (
                <span className={`status-badge ${statusMap.coverImage.type} ${statusMap.coverImage.fading ? "fading" : ""}`}>
                  {statusMap.coverImage.text}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <form className="form" onSubmit={onPasswordUpdate}>
          <h3>Change Password</h3>
          <label>
            Old password
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </label>
          <label>
            New password
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            Update Password
          </button>
          {statusMap.password ? (
            <span className={`status-badge ${statusMap.password.type} ${statusMap.password.fading ? "fading" : ""}`}>
              {statusMap.password.text}
            </span>
          ) : null}
        </form>
      </article>
    </section>
  );
}
