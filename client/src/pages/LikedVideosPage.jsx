import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { extractList, likeApi } from "../api";
import { formatDuration, formatViews } from "../utils/videoMeta";

export default function LikedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    likeApi
      .listVideos({ page: 1, limit: 50 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        const items = extractList(res.data, ["likedVideos"]);
        setVideos(items.map((entry) => entry.videoDetails || entry));
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load liked videos");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Liked Videos</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading liked videos...</p> : null}
      {!loading && !error && videos.length === 0 ? (
        <div className="empty-state-center">
          <p>No liked videos found</p>
        </div>
      ) : null}

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
              <p>{video?.uploadBy?.username || "Unknown"}</p>
              <small>{formatViews(video.views)} views</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
