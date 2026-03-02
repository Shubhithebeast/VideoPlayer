import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { extractList, videoApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatViews } from "../utils/videoMeta";

export default function YourVideosPage() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError("");

    videoApi
      .list({ userId, page: 1, limit: 100, sortBy: "createdAt", sortType: "desc" })
      .then((res) => {
        if (!mounted) {
          return;
        }
        const list = extractList(res.data, ["videos"]).map((entry) => entry.videoDetails || entry);
        setVideos(list);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load your videos");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const hasVideos = useMemo(() => videos.length > 0, [videos]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Your Videos</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading your videos...</p> : null}
      {!loading && !hasVideos ? (
        <div className="empty-state-center">
          <p>No uploaded videos found</p>
        </div>
      ) : null}

      {hasVideos ? (
        <div className="video-grid">
          {videos.map((video) => (
            <article key={video._id} className="video-card">
              <div className="video-thumb-wrap">
                <Link to={`/watch/${video._id}`}>
                  <img src={video.thumbnail} alt={video.title} />
                </Link>
                <span className="video-duration-badge">{formatDuration(video.duration)}</span>
              </div>
              <div className="video-card-body">
                <h3>{video.title}</h3>
                <small>{formatViews(video.views)} views</small>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
