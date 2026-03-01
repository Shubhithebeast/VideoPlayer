import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { extractList, videoApi } from "../api";

function videoOwner(video) {
  return video?.uploadBy?.username || video?.uploadBy?.fullName || "Unknown";
}

export default function HomePage() {
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = new URLSearchParams(location.search).get("q") || "";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    videoApi
      .list({ page, limit: 12, query: query || undefined, sortBy: "createdAt", sortType: "desc" })
      .then((result) => {
        if (!mounted) {
          return;
        }
        const list = extractList(result.data, ["videos"]).map((entry) => entry.videoDetails || entry);
        setVideos(list);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to fetch videos");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [page, query]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Discover</p>
          <h2>Home Feed</h2>
          {query ? <p className="muted">Search results for "{query}"</p> : null}
        </div>
      </div>

      <div className="pager">
        <button className="btn ghost" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <span>Page {page}</span>
        <button className="btn ghost" type="button" onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading videos...</p> : null}

      <div className="video-grid">
        {videos.map((video) => (
          <article key={video._id} className="video-card">
            <Link to={`/watch/${video._id}`}>
              <img src={video.thumbnail} alt={video.title} />
            </Link>
            <div>
              <h3>{video.title}</h3>
              <p>{videoOwner(video)}</p>
              <small>
                {video.views || 0} views | {Math.round(video.duration || 0)} sec
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
