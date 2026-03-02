import { useEffect, useState } from "react";
import { playlistApi, extractList } from "../api";
import { useAuth } from "../context/AuthContext";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
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

    playlistApi
      .getMyPlaylists({ page: 1, limit: 50 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        setPlaylists(extractList(res.data, ["playlists"]));
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err?.response?.data?.message || "Failed to load playlists");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Playlists</h2>
        </div>
      </div>

      {loading ? <p className="muted">Loading playlists...</p> : null}
      {!loading && playlists.length === 0 ? (
        <div className="empty-state-center">
          <p>No playlists found</p>
        </div>
      ) : null}

      <div className="playlist-grid">
        {playlists.map((playlist) => (
          <article key={playlist._id} className="playlist-card">
            <img
              src={playlist.previewThumbnail || "https://placehold.co/640x360?text=Playlist"}
              alt={playlist.name}
            />
            <div>
              <h3>{playlist.name}</h3>
              <p>{playlist.description || "No description"}</p>
              <small>{playlist.videosCount || 0} videos</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
