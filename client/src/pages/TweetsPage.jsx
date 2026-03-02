import { useEffect, useState } from "react";
import { likeApi, tweetApi, extractList } from "../api";
import { useAuth } from "../context/AuthContext";

export default function TweetsPage() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadTweets = () => {
    let mounted = true;
    if (!userId) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError("");

    tweetApi
      .listByUser(userId, { page: 1, limit: 100 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        setTweets(extractList(res.data, ["tweets"]));
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load tweets");
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
    const cleanup = loadTweets();
    return cleanup;
  }, [userId]);

  const onCreate = async (event) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await tweetApi.create(content.trim());
      setContent("");
      setStatus("Tweet posted");
      loadTweets();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not post tweet");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (tweet) => {
    const next = window.prompt("Update tweet", tweet.content || "");
    if (!next || !next.trim()) {
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await tweetApi.update(tweet._id, next.trim());
      setStatus("Tweet updated");
      loadTweets();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update tweet");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (tweetId) => {
    const ok = window.confirm("Delete this tweet?");
    if (!ok) {
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await tweetApi.remove(tweetId);
      setStatus("Tweet deleted");
      loadTweets();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not delete tweet");
    } finally {
      setBusy(false);
    }
  };

  const onLike = async (tweetId) => {
    try {
      await likeApi.toggleTweet(tweetId);
      loadTweets();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not like tweet");
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Community</p>
          <h2>My Tweets</h2>
        </div>
      </div>

      <form className="form tweet-form" onSubmit={onCreate}>
        <label>
          What's happening?
          <textarea rows={3} value={content} maxLength={280} onChange={(e) => setContent(e.target.value)} />
        </label>
        <button className="btn primary" type="submit" disabled={busy || !content.trim()}>
          Post Tweet
        </button>
      </form>

      {status ? <p className="success-text">{status}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading tweets...</p> : null}
      {!loading && tweets.length === 0 ? (
        <div className="empty-state-center">
          <p>No tweets found</p>
        </div>
      ) : null}

      <div className="tweet-list">
        {tweets.map((tweet) => (
          <article className="tweet-card" key={tweet._id}>
            <p>{tweet.content}</p>
            <small>{tweet.likesCount || 0} likes</small>
            <div className="card-actions">
              <button className="btn ghost" type="button" onClick={() => onLike(tweet._id)}>
                Like
              </button>
              <button className="btn ghost" type="button" onClick={() => onEdit(tweet)}>
                Edit
              </button>
              <button className="btn ghost" type="button" onClick={() => onDelete(tweet._id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
