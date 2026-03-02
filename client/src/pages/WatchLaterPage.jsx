import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { extractList, playlistApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatViews } from "../utils/videoMeta";

export default function WatchLaterPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const playlistsRes = await playlistApi.getMyPlaylists({ page: 1, limit: 50 });
        if (!mounted) {
          return;
        }

        const playlists = extractList(playlistsRes.data, ["playlists"]);
        const watchLater = playlists.find((entry) => entry.name?.toLowerCase() === "watch later");
        if (!watchLater?._id) {
          setVideos([]);
          return;
        }

        const detailRes = await playlistApi.getById(watchLater._id, { page: 1, limit: 100 });
        if (!mounted) {
          return;
        }
        setVideos(Array.isArray(detailRes.data?.videoDetails) ? detailRes.data.videoDetails : []);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load Watch Later");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Watch Later</h2>
        </div>
      </div>

      {loading ? <p className="muted">Loading Watch Later...</p> : null}
      {!loading && videos.length === 0 ? (
        <div className="empty-state-center">
          <p>No videos in Watch Later</p>
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
              <small>{formatViews(video.views)} views</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
