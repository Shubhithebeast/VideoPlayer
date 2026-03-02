import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { commentApi, extractList, likeApi, subscriptionApi, userApi, videoApi } from "../api";
import { useAuth } from "../context/AuthContext";

function pickVideo(data) {
  if (data?.video) {
    return data.video;
  }
  return data;
}

function pickOwner(video) {
  if (Array.isArray(video?.uploadBy)) {
    return video.uploadBy[0] || {};
  }
  return video?.uploadBy || {};
}

export default function WatchPage() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [commentBusyId, setCommentBusyId] = useState("");
  const [error, setError] = useState("");

  const owner = useMemo(() => pickOwner(video), [video]);

  const loadComments = async () => {
    const response = await commentApi.list(videoId, { page: 1, limit: 20 });
    const list = extractList(response.data, ["docs", "comments"]);
    setComments(list);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([videoApi.getById(videoId), commentApi.list(videoId, { page: 1, limit: 20 })])
      .then(async ([videoRes, commentRes]) => {
        if (!mounted) {
          return;
        }

        const loadedVideo = pickVideo(videoRes.data);
        setVideo(loadedVideo);
        setComments(extractList(commentRes.data, ["docs", "comments"]));

        const ownerUsername = (Array.isArray(loadedVideo?.uploadBy) ? loadedVideo?.uploadBy[0] : loadedVideo?.uploadBy)?.username;
        if (ownerUsername) {
          try {
            const profileRes = await userApi.getChannelProfile(ownerUsername);
            if (mounted) {
              setChannel(profileRes.data);
            }
          } catch {
            // Ignore channel profile failure on watch page
          }
        }
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load video");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [videoId]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    setBusy(true);
    try {
      await commentApi.add(videoId, content.trim());
      setContent("");
      await loadComments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add comment");
    } finally {
      setBusy(false);
    }
  };

  const onEditComment = async (comment) => {
    const next = window.prompt("Edit comment", comment?.content || "");
    if (!next || !next.trim() || next.trim() === comment?.content) {
      return;
    }

    setCommentBusyId(comment._id);
    try {
      await commentApi.update(comment._id, next.trim());
      await loadComments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update comment");
    } finally {
      setCommentBusyId("");
    }
  };

  const onDeleteComment = async (commentId) => {
    const ok = window.confirm("Delete this comment?");
    if (!ok) {
      return;
    }

    setCommentBusyId(commentId);
    try {
      await commentApi.remove(commentId);
      await loadComments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete comment");
    } finally {
      setCommentBusyId("");
    }
  };

  const onLikeComment = async (commentId) => {
    setCommentBusyId(commentId);
    try {
      await likeApi.toggleComment(commentId);
      await loadComments();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to like comment");
    } finally {
      setCommentBusyId("");
    }
  };

  const toggleLike = async () => {
    try {
      await likeApi.toggleVideo(videoId);
      const refreshed = await videoApi.getById(videoId);
      setVideo(pickVideo(refreshed.data));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update like");
    }
  };

  const toggleSubscription = async () => {
    const channelId = channel?._id;
    if (!channelId) {
      return;
    }

    try {
      await subscriptionApi.toggle(channelId);
      const profileRes = await userApi.getChannelProfile(channel.username);
      setChannel(profileRes.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to toggle subscription");
    }
  };

  if (loading) {
    return <p className="muted">Loading watch page...</p>;
  }

  if (error && !video) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="watch-layout">
      <article className="player-card">
        <video controls className="player" src={video?.video} poster={video?.thumbnail} />
        <h2>{video?.title}</h2>
        <p className="muted">{video?.description}</p>

        <div className="meta-line">
          <span>{video?.views || 0} views</span>
          <span>{video?.likesCount || 0} likes</span>
          <span>{video?.commentsCount || 0} comments</span>
        </div>

        <div className="actions-row">
          <button className="btn primary" type="button" onClick={toggleLike}>
            Like / Unlike
          </button>
          {channel ? (
            <button className="btn ghost" type="button" onClick={toggleSubscription}>
              {channel.isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          ) : null}
          {owner?.username ? (
            <Link className="btn ghost" to={`/channel/${owner.username}`}>
              Visit Channel
            </Link>
          ) : null}
        </div>
      </article>

      <aside className="comments-card">
        <h3>Comments</h3>
        <form className="form" onSubmit={submitComment}>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment"
          />
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Posting..." : "Post Comment"}
          </button>
        </form>

        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment._id}>
              <p>{comment.content}</p>
              <small>
                @{comment?.owner?.username || "user"} | {comment?.likesCount || 0} likes
              </small>
              <div className="comment-actions">
                <button className="btn ghost" type="button" disabled={commentBusyId === comment._id} onClick={() => onLikeComment(comment._id)}>
                  Like
                </button>
                {(comment?.owner?._id || comment?.owner?.id) === userId ? (
                  <>
                    <button className="btn ghost" type="button" disabled={commentBusyId === comment._id} onClick={() => onEditComment(comment)}>
                      Edit
                    </button>
                    <button className="btn ghost" type="button" disabled={commentBusyId === comment._id} onClick={() => onDeleteComment(comment._id)}>
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}
