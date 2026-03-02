import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { playlistApi, extractList } from "../api";
import { useAuth } from "../context/AuthContext";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const loadPlaylists = () => {
    let mounted = true;
    if (!user) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    playlistApi
      .getMyPlaylists({ page: 1, limit: 50 })
      .then((res) => {
        if (!mounted) {
          return;
        }
        setPlaylists(extractList(res.data, ["playlists"]));
      })
      .catch(() => {})
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
    const cleanup = loadPlaylists();
    return cleanup;
  }, [user]);

  const onCreatePlaylist = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("description", description.trim());

    setBusy(true);
    setStatus("");
    try {
      await playlistApi.create(formData);
      setName("");
      setDescription("");
      setStatus("Playlist created");
      loadPlaylists();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Could not create playlist");
    } finally {
      setBusy(false);
    }
  };

  const onRenamePlaylist = async (playlist) => {
    const nextName = window.prompt("Update playlist name", playlist.name || "");
    if (!nextName || !nextName.trim()) {
      return;
    }
    const nextDescription = window.prompt("Update playlist description", playlist.description || "");
    if (nextDescription === null) {
      return;
    }

    const formData = new FormData();
    formData.append("name", nextName.trim());
    formData.append("description", nextDescription.trim());

    setBusy(true);
    setStatus("");
    try {
      await playlistApi.update(playlist._id, formData);
      setStatus("Playlist updated");
      loadPlaylists();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Could not update playlist");
    } finally {
      setBusy(false);
    }
  };

  const onDeletePlaylist = async (playlistId) => {
    const ok = window.confirm("Delete this playlist?");
    if (!ok) {
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      await playlistApi.remove(playlistId);
      setStatus("Playlist deleted");
      loadPlaylists();
    } catch (err) {
      setStatus(err?.response?.data?.message || "Could not delete playlist");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Playlists</h2>
        </div>
      </div>

      <form className="form playlist-create-form" onSubmit={onCreatePlaylist}>
        <label>
          Playlist Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Playlist" />
        </label>
        <label>
          Description
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </label>
        <button className="btn primary" type="submit" disabled={busy}>
          Create Playlist
        </button>
      </form>

      {status ? <p className="success-text">{status}</p> : null}
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
              <Link to={`/playlists/${playlist._id}`}>
                <h3>{playlist.name}</h3>
              </Link>
              <p>{playlist.description || "No description"}</p>
              <small>{playlist.videosCount || 0} videos</small>
              <div className="card-actions">
                <button className="btn ghost" type="button" disabled={busy} onClick={() => onRenamePlaylist(playlist)}>
                  Edit
                </button>
                <button className="btn ghost" type="button" disabled={busy} onClick={() => onDeletePlaylist(playlist._id)}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
