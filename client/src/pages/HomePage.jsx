import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { extractList, playlistApi, videoApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { addVideoToQueue } from "../utils/queue";
import { formatDuration, formatViews } from "../utils/videoMeta";

function videoOwner(video) {
  return video?.uploadBy?.username || video?.uploadBy?.fullName || "Unknown";
}

function buildVisiblePages(currentPage, totalPages) {
  const maxButtons = 10;
  const total = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(currentPage - Math.floor(maxButtons / 2), total - maxButtons + 1));
  const end = Math.min(total, start + maxButtons - 1);

  return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
}

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [openActionsFor, setOpenActionsFor] = useState("");
  const [hiddenIds, setHiddenIds] = useState([]);
  const [statusText, setStatusText] = useState("");

  const query = new URLSearchParams(location.search).get("q") || "";
  const visiblePages = useMemo(
    () => buildVisiblePages(pagination.currentPage || page, pagination.totalPages || 1),
    [pagination.currentPage, pagination.totalPages, page]
  );

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    setOpenActionsFor("");

    videoApi
      .list({ page, limit: 12, query: query || undefined, sortBy: "createdAt", sortType: "desc" })
      .then((result) => {
        if (!mounted) {
          return;
        }
        const list = extractList(result.data, ["videos"]).map((entry) => entry.videoDetails || entry);
        setVideos(list);

        const pageInfo = result.data?.pagination || {};
        setPagination({
          currentPage: pageInfo.currentPage || page,
          totalPages: Math.max(pageInfo.totalPages || 1, 1),
          hasNextPage: Boolean(pageInfo.hasNextPage),
          hasPrevPage: Boolean(pageInfo.hasPrevPage)
        });
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

  const visibleVideos = useMemo(() => videos.filter((video) => !hiddenIds.includes(video._id)), [videos, hiddenIds]);

  const getOrCreatePlaylist = async (playlistName) => {
    if (!user) {
      throw new Error("User not available");
    }

    const listRes = await playlistApi.getMyPlaylists({ page: 1, limit: 50 });
    const playlists = extractList(listRes.data, ["playlists"]);
    const existing = playlists.find((entry) => entry.name?.toLowerCase() === playlistName.toLowerCase());
    if (existing?._id) {
      return existing._id;
    }

    const formData = new FormData();
    formData.append("name", playlistName);
    formData.append("description", `${playlistName} playlist`);
    const created = await playlistApi.create(formData);
    return created.data?._id;
  };

  const onAddToQueue = (video) => {
    const result = addVideoToQueue(video);
    setOpenActionsFor("");
    setStatusText(result.added ? "Added to queue" : "Already in queue");
  };

  const onSaveWatchLater = async (videoId) => {
    try {
      const watchLaterId = await getOrCreatePlaylist("Watch Later");
      await playlistApi.addVideo(videoId, watchLaterId);
      setStatusText("Saved to Watch Later");
    } catch (err) {
      setStatusText(err?.response?.data?.message || "Could not save to Watch Later");
    } finally {
      setOpenActionsFor("");
    }
  };

  const onSaveToPlaylist = async (videoId) => {
    const requestedName = window.prompt("Enter playlist name", "My Playlist");
    if (!requestedName?.trim()) {
      return;
    }

    try {
      const playlistId = await getOrCreatePlaylist(requestedName.trim());
      await playlistApi.addVideo(videoId, playlistId);
      setStatusText(`Saved to ${requestedName.trim()}`);
    } catch (err) {
      setStatusText(err?.response?.data?.message || "Could not save to playlist");
    } finally {
      setOpenActionsFor("");
    }
  };

  const onShare = async (videoId) => {
    const watchUrl = `${window.location.origin}/watch/${videoId}`;
    try {
      await navigator.clipboard.writeText(watchUrl);
      setStatusText("Video link copied");
    } catch {
      setStatusText(watchUrl);
    } finally {
      setOpenActionsFor("");
    }
  };

  const onNotInterested = (videoId) => {
    setHiddenIds((current) => [...current, videoId]);
    setStatusText("Marked as not interested");
    setOpenActionsFor("");
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Discover</p>
          <h2>Home Feed</h2>
          {query ? <p className="muted">Search results for "{query}"</p> : null}
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {statusText ? <p className="success-text">{statusText}</p> : null}
      {loading ? <p className="muted">Loading videos...</p> : null}

      <div className="video-grid">
        {visibleVideos.map((video) => (
          <article key={video._id} className="video-card">
            <div className="video-thumb-wrap">
              <Link to={`/watch/${video._id}`}>
                <img src={video.thumbnail} alt={video.title} />
              </Link>
              <span className="video-duration-badge">{formatDuration(video.duration)}</span>
            </div>
            <div className="video-card-body">
              <div className="video-card-title-row">
                <h3>{video.title}</h3>
                <button
                  className="video-menu-toggle"
                  type="button"
                  aria-label="Video actions"
                  onClick={() => setOpenActionsFor((current) => (current === video._id ? "" : video._id))}
                >
                  ...
                </button>
              </div>
              <p>{videoOwner(video)}</p>
              <small>{formatViews(video.views)} views</small>

              {openActionsFor === video._id ? (
                <div className="video-actions-menu">
                  <button type="button" onClick={() => onAddToQueue(video)}>
                    Add to queue
                  </button>
                  <button type="button" onClick={() => onSaveWatchLater(video._id)}>
                    Save to Watch Later
                  </button>
                  <button type="button" onClick={() => onSaveToPlaylist(video._id)}>
                    Save to playlist
                  </button>
                  <button type="button" onClick={() => onShare(video._id)}>
                    Share
                  </button>
                  <button type="button" onClick={() => onNotInterested(video._id)}>
                    Not interested
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="pager pager-advanced">
        <button className="btn ghost" type="button" disabled={!pagination.hasPrevPage} onClick={() => setPage(1)}>
          {"<<"}
        </button>
        <button
          className="btn ghost"
          type="button"
          disabled={!pagination.hasPrevPage}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        {visiblePages.map((pageNo) => (
          <button
            key={pageNo}
            className={`btn ghost page-number ${pageNo === pagination.currentPage ? "active" : ""}`}
            type="button"
            onClick={() => setPage(pageNo)}
          >
            {pageNo === pagination.currentPage ? `Page ${pageNo}` : pageNo}
          </button>
        ))}
        <button
          className="btn ghost"
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
        <button
          className="btn ghost"
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() => setPage(pagination.totalPages)}
        >
          {">>"}
        </button>
      </div>
    </section>
  );
}
