import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { playlistApi } from "../api";
import { formatDuration, formatViews } from "../utils/videoMeta";

export default function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadPlaylist = () => {
    let mounted = true;
    setLoading(true);
    setError("");

    playlistApi
      .getById(playlistId, { page: 1, limit: 200 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        setPlaylist(res.data || null);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load playlist");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    const cleanup = loadPlaylist();
    return cleanup;
  }, [playlistId]);

  const onRemoveVideo = async (videoId) => {
    const ok = window.confirm("Remove this video from playlist?");
    if (!ok) {
      return;
    }

    try {
      await playlistApi.removeVideo(videoId, playlistId);
      setStatus("Video removed from playlist");
      loadPlaylist();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Could not remove video");
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Playlist</p>
          <h2>{playlist?.name || "Playlist"}</h2>
          <p className="muted">{playlist?.description || "No description"}</p>
        </div>
      </div>

      {status ? <p className="success-text">{status}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading playlist...</p> : null}
      {!loading && !error && (!Array.isArray(playlist?.videoDetails) || playlist.videoDetails.length === 0) ? (
        <div className="empty-state-center">
          <p>No videos in this playlist</p>
        </div>
      ) : null}

      <div className="video-grid">
        {(playlist?.videoDetails || []).map((video) => (
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
              <div className="card-actions">
                <button className="btn ghost" type="button" onClick={() => onRemoveVideo(video._id)}>
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
