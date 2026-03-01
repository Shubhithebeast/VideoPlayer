import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    fullname: "",
    password: "",
    avatar: null,
    coverImage: null
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(loginForm);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (!registerForm.avatar) {
      setError("Avatar is required.");
      return;
    }

    setBusy(true);
    try {
      await register(registerForm);
      setMode("login");
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }));
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome</p>
        <h2>StreamX</h2>
        <p className="muted">Sign in to browse videos, upload content, comment, and manage your channel.</p>

        <div className="tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {mode === "login" ? (
          <form className="form" onSubmit={submitLogin}>
            <label>
              Email
              <input
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </label>
            <label>
              Username
              <input
                value={loginForm.username}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="or username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={submitRegister}>
            <label>
              Full name
              <input
                required
                value={registerForm.fullname}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, fullname: e.target.value }))}
              />
            </label>
            <label>
              Username
              <input
                required
                value={registerForm.username}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>
            <label>
              Avatar
              <input
                required
                type="file"
                accept="image/*"
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, avatar: e.target.files?.[0] || null }))}
              />
            </label>
            <label>
              Cover Image (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
