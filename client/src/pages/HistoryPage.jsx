import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../api";
import { formatDuration, formatViews } from "../utils/videoMeta";

function pickOwner(video) {
  if (Array.isArray(video?.owner)) {
    return video.owner[0] || {};
  }
  return video?.owner || {};
}

export default function HistoryPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    userApi
      .getHistory()
      .then((result) => {
        if (!mounted) {
          return;
        }

        const list = Array.isArray(result.data) ? result.data : [];
        setVideos(list);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load watch history");
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
          <h2>Watch History</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading history...</p> : null}
      {!loading && !error && videos.length === 0 ? (
        <div className="empty-state-center">
          <p>No watch history found</p>
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="video-grid">
          {videos.map((video) => {
            const owner = pickOwner(video);
            return (
              <article key={video._id} className="video-card">
                <div className="video-thumb-wrap">
                  <Link to={`/watch/${video._id}`}>
                    <img src={video.thumbnail} alt={video.title} />
                  </Link>
                  <span className="video-duration-badge">{formatDuration(video.duration)}</span>
                </div>
                <div className="video-card-body">
                  <h3>{video.title}</h3>
                  <p>{owner?.username || "Unknown"}</p>
                  <small>{formatViews(video.views)} views</small>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
