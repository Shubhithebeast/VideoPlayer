import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import WatchPage from "./pages/WatchPage";
import UploadPage from "./pages/UploadPage";
import ChannelPage from "./pages/ChannelPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import FeedbackPage from "./pages/FeedbackPage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import WatchLaterPage from "./pages/WatchLaterPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import QueuePage from "./pages/QueuePage";
import LikedVideosPage from "./pages/LikedVideosPage";
import YourVideosPage from "./pages/YourVideosPage";
import PlaylistDetailPage from "./pages/PlaylistDetailPage";
import TweetsPage from "./pages/TweetsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return <p className="app-status">Bootstrapping session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return <p className="app-status">Bootstrapping session...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/watch/:videoId" element={<WatchPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/channel/:username" element={<ChannelPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/watch-later" element={<WatchLaterPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/liked-videos" element={<LikedVideosPage />} />
        <Route path="/your-videos" element={<YourVideosPage />} />
        <Route path="/tweets" element={<TweetsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
