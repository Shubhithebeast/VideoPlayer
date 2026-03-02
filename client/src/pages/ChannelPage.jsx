import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dashboardApi, extractList, subscriptionApi, userApi, videoApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDuration, formatViews } from "../utils/videoMeta";

export default function ChannelPage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isOwnChannel = useMemo(() => {
    return Boolean(user?._id && profile?._id && user._id.toString() === profile._id.toString());
  }, [user, profile]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    const load = async () => {
      try {
        const profileRes = await userApi.getChannelProfile(username);
        if (!mounted) {
          return;
        }

        const channelProfile = profileRes.data;
        setProfile(channelProfile);

        const videosRes = await videoApi.list({ userId: channelProfile._id, page: 1, limit: 20 });
        if (!mounted) {
          return;
        }
        setVideos(extractList(videosRes.data, ["videos"]).map((entry) => entry.videoDetails || entry));

        if (user?._id && channelProfile._id && user._id.toString() === channelProfile._id.toString()) {
          const [statsRes, subscribersRes, subscribedRes] = await Promise.all([
            dashboardApi.getStats(),
            subscriptionApi.getChannelSubscribers(channelProfile._id, { page: 1, limit: 10 }),
            subscriptionApi.getSubscribedChannels(channelProfile._id, { page: 1, limit: 10 })
          ]);

          if (!mounted) {
            return;
          }

          setStats(statsRes.data);
          setSubscribers(extractList(subscribersRes.data, ["subscribers"]));
          setSubscribedChannels(extractList(subscribedRes.data, ["subscribedChannels"]));
        } else {
          setStats(null);
          setSubscribers([]);
          setSubscribedChannels([]);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load channel");
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
  }, [username, user?._id]);

  const toggleSubscription = async () => {
    if (!profile?._id || isOwnChannel) {
      return;
    }

    try {
      await subscriptionApi.toggle(profile._id);
      const profileRes = await userApi.getChannelProfile(username);
      setProfile(profileRes.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to toggle subscription");
    }
  };

  if (loading) {
    return <p className="muted">Loading channel...</p>;
  }

  if (error && !profile) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="channel-wrap">
      <article className="channel-hero">
        <img className="cover" src={profile?.coverImage || "https://placehold.co/1200x300?text=Channel+Cover"} alt="cover" />
        <div className="channel-meta">
          <img className="avatar" src={profile?.avatar || "https://placehold.co/96x96"} alt={profile?.username} />
          <div>
            <h2>{profile?.fullName || profile?.fullname || profile?.username}</h2>
            <p className="muted">@{profile?.username}</p>
            <p className="muted">
              {profile?.subscribersCount || 0} subscribers | {profile?.channelsSubscribedToCount || 0} following
            </p>
          </div>
          {!isOwnChannel ? (
            <button className="btn primary" type="button" onClick={toggleSubscription}>
              {profile?.isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          ) : null}
        </div>
      </article>

      {stats ? (
        <section className="stats-grid">
          <article className="stat-card">
            <p>Total Videos</p>
            <h3>{stats.totalVideos || 0}</h3>
          </article>
          <article className="stat-card">
            <p>Total Views</p>
            <h3>{stats.totalViews || 0}</h3>
          </article>
          <article className="stat-card">
            <p>Total Likes</p>
            <h3>{stats.totalLikes || 0}</h3>
          </article>
          <article className="stat-card">
            <p>Total Subscribers</p>
            <h3>{stats.totalSubscribers || 0}</h3>
          </article>
        </section>
      ) : null}

      <section>
        <div className="page-head slim">
          <h3>Channel Videos</h3>
        </div>
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
                <h4>{video.title}</h4>
                <small>{formatViews(video.views)} views</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isOwnChannel ? (
        <section className="channel-relations">
          <article className="relation-card">
            <h3>Your Subscribers</h3>
            {subscribers.map((entry, idx) => {
              const detail = entry.subscriberDetails || entry;
              return (
                <p key={`${detail.username}-${idx}`}>@{detail.username || "user"}</p>
              );
            })}
          </article>
          <article className="relation-card">
            <h3>Channels You Follow</h3>
            {subscribedChannels.map((entry, idx) => {
              const detail = entry.channelDetails || entry;
              return (
                <p key={`${detail.username}-${idx}`}>@{detail.username || "channel"}</p>
              );
            })}
          </article>
        </section>
      ) : null}
    </section>
  );
}
