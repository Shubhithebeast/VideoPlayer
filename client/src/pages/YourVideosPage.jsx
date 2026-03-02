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
  const [status, setStatus] = useState("");
  const [busyVideoId, setBusyVideoId] = useState("");

  const loadVideos = () => {
    let mounted = true;
    if (!userId) {
      setLoading(false);
      return () => {};
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
  };

  useEffect(() => {
    const cleanup = loadVideos();
    return cleanup;
  }, [userId]);

  const hasVideos = useMemo(() => videos.length > 0, [videos]);

  const onTogglePublish = async (videoId) => {
    setBusyVideoId(videoId);
    setStatus("");
    try {
      await videoApi.togglePublish(videoId);
      setStatus("Publish status updated");
      loadVideos();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update publish status");
    } finally {
      setBusyVideoId("");
    }
  };

  const onDeleteVideo = async (videoId) => {
    const ok = window.confirm("Delete this video permanently?");
    if (!ok) {
      return;
    }
    setBusyVideoId(videoId);
    setStatus("");
    try {
      await videoApi.remove(videoId);
      setStatus("Video deleted");
      loadVideos();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete video");
    } finally {
      setBusyVideoId("");
    }
  };

  const onEditVideo = async (video) => {
    const title = window.prompt("Update title", video.title || "");
    if (!title || !title.trim()) {
      return;
    }
    const description = window.prompt("Update description", video.description || "");
    if (description === null) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    setBusyVideoId(video._id);
    setStatus("");
    try {
      await videoApi.update(video._id, formData);
      setStatus("Video details updated");
      loadVideos();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update video");
    } finally {
      setBusyVideoId("");
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Your Videos</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {status ? <p className="success-text">{status}</p> : null}
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
                <div className="card-actions">
                  <button className="btn ghost" type="button" disabled={busyVideoId === video._id} onClick={() => onEditVideo(video)}>
                    Edit
                  </button>
                  <button className="btn ghost" type="button" disabled={busyVideoId === video._id} onClick={() => onTogglePublish(video._id)}>
                    {video.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button className="btn ghost" type="button" disabled={busyVideoId === video._id} onClick={() => onDeleteVideo(video._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
