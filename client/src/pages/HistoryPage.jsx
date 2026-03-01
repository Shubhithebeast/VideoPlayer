import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../api";

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

      <div className="video-grid">
        {videos.map((video) => {
          const owner = pickOwner(video);
          return (
            <article key={video._id} className="video-card">
              <Link to={`/watch/${video._id}`}>
                <img src={video.thumbnail} alt={video.title} />
              </Link>
              <div>
                <h3>{video.title}</h3>
                <p>{owner?.username || "Unknown"}</p>
                <small>{video.views || 0} views</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
