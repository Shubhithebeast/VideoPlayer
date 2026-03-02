import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { extractList, subscriptionApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError("");

    subscriptionApi
      .getSubscribedChannels(userId, { page: 1, limit: 100 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        setChannels(extractList(res.data, ["subscribedChannels"]));
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load subscriptions");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Subscriptions</h2>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p className="muted">Loading subscriptions...</p> : null}
      {!loading && !error && channels.length === 0 ? (
        <div className="empty-state-center">
          <p>No subscriptions found</p>
        </div>
      ) : null}

      <div className="channel-list">
        {channels.map((entry, idx) => {
          const channel = entry.channelDetails || entry;
          return (
            <Link key={`${channel._id || channel.username}-${idx}`} className="channel-list-item" to={`/channel/${channel.username}`}>
              <img src={channel.avatar || "https://placehold.co/48x48"} alt={channel.username} />
              <div>
                <h3>{channel.fullName || channel.fullname || channel.username}</h3>
                <p>@{channel.username}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
