import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <span className="brand-mark" />
          <div>
            <p className="brand-kicker">Video Platform</p>
            <h1>uTube</h1>
          </div>
        </div>

        <nav className="topnav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/upload">Upload</NavLink>
          {user?.username ? <NavLink to={`/channel/${user.username}`}>My Channel</NavLink> : null}
        </nav>

        <div className="userbox">
          <div>
            <p>{user?.fullname || user?.fullName || "Logged in"}</p>
            <small>@{user?.username || "user"}</small>
          </div>
          <button className="btn ghost" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-wrap">
        <Outlet />
      </main>
    </div>
  );
}
