import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const THEME_KEY = "streamx_theme";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [headerSearch, setHeaderSearch] = useState(new URLSearchParams(location.search).get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const onSwitchAccount = async () => {
    await logout();
    navigate("/auth");
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle("theme-dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    setMenuOpen(false);
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      navigate(`/?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/");
    }
  };

  const openFeedback = () => {
    navigate("/feedback");
    setMenuOpen(false);
  };

  const openAbout = () => {
    navigate("/about");
    setMenuOpen(false);
  };

  const openSettings = () => {
    navigate("/settings");
    setMenuOpen(false);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <span className="brand-mark" />
          <div>
            <p className="brand-kicker">Video Platform</p>
            <h1>StreamX</h1>
          </div>
        </div>

        <form className="header-search" onSubmit={onSearchSubmit}>
          <input
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search"
          />
          <button className="search-btn" type="submit" aria-label="Search">
            ??
          </button>
        </form>

        <div className="top-actions">
          <nav className="topnav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/upload">Upload</NavLink>
            <NavLink to="/history">History</NavLink>
            {user?.username ? <NavLink to={`/channel/${user.username}`}>My Channel</NavLink> : null}
          </nav>

          <div className="userbox">
            <button
              className="avatar-btn"
              type="button"
              title="Profile"
              aria-label="Profile"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <img src={user?.avatar || "https://placehold.co/40x40"} alt="profile" />
              <span className="avatar-tooltip">Profile</span>
            </button>

            {menuOpen ? (
              <div className="profile-menu">
                <div className="profile-head">
                  <p>{user?.fullname || user?.fullName || "User"}</p>
                  <small>@{user?.username || "user"}</small>
                  {user?.username ? (
                    <Link to={`/channel/${user.username}`} onClick={() => setMenuOpen(false)}>
                      View your channel
                    </Link>
                  ) : null}
                </div>

                <div className="menu-section">
                  <button type="button" onClick={onSwitchAccount}>
                    Switch account
                  </button>
                  <button type="button" onClick={onLogout}>
                    Sign out
                  </button>
                </div>

                <div className="menu-section">
                  <button type="button" onClick={toggleTheme}>
                    Theme
                  </button>
                  <button type="button" onClick={openFeedback}>
                    Feedback
                  </button>
                  <button type="button" onClick={openAbout}>
                    About
                  </button>
                  <button type="button" onClick={openSettings}>
                    Settings
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="main-wrap">
        <Outlet />
      </main>
    </div>
  );
}
