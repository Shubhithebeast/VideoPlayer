import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applyThemePreference, getStoredThemePreference } from "../utils/theme";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [headerSearch, setHeaderSearch] = useState(new URLSearchParams(location.search).get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeMode, setThemeMode] = useState(getStoredThemePreference());

  const onLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const onSwitchAccount = async () => {
    await logout();
    navigate("/auth");
  };

  useEffect(() => {
    setHeaderSearch(new URLSearchParams(location.search).get("q") || "");
  }, [location.search]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if (themeMode === "system") {
        applyThemePreference("system");
      }
    };

    mediaQuery.addEventListener("change", onSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", onSystemThemeChange);
    };
  }, [themeMode]);

  const onThemeModeChange = (event) => {
    const selectedMode = applyThemePreference(event.target.value);
    setThemeMode(selectedMode);
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
        <div className="brand-wrap">
          <button className="sidebar-toggle" type="button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen((v) => !v)}>
            <span />
            <span />
            <span />
          </button>
          <div className="brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <span className="brand-mark" />
            <div>
              <p className="brand-kicker">Video Platform</p>
              <h1>StreamX</h1>
            </div>
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
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M10 4a6 6 0 1 0 3.75 10.68l4.29 4.28 1.41-1.41-4.28-4.29A6 6 0 0 0 10 4m0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8"
                fill="currentColor"
              />
            </svg>
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
                  <label className="menu-select-field" htmlFor="theme-mode-select">
                    <span>Theme</span>
                    <div className="menu-select-wrap">
                      <select id="theme-mode-select" value={themeMode} onChange={onThemeModeChange}>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </label>
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

      <div className={`layout-body ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        <aside className={`left-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
          <nav className="sidebar-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/subscriptions">Subscriptions</NavLink>
            <NavLink to="/watch-later">Watch Later</NavLink>
            <NavLink to="/playlists">Playlists</NavLink>
            <NavLink to="/queue">Queue</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/liked-videos">Liked Videos</NavLink>
            <NavLink to="/your-videos">Your Videos</NavLink>
            {user?.username ? <NavLink to={`/channel/${user.username}`}>My Channel</NavLink> : null}
          </nav>
        </aside>

        <main className="main-wrap">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
