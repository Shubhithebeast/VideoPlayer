import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { videoApi } from "../api";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!videoFile) {
      setError("Video file is required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("video", videoFile);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    setBusy(true);
    try {
      const result = await videoApi.publish(formData);
      const publishedVideo = result.data?.video || result.data;
      if (publishedVideo?._id) {
        navigate(`/watch/${publishedVideo._id}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish video");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="upload-wrap">
      <article className="upload-card">
        <p className="eyebrow">Creator Studio</p>
        <h2>Upload New Video</h2>
        <p className="muted">Publish your content with optional thumbnail and metadata.</p>

        {error ? <p className="error-text">{error}</p> : null}

        <form className="form" onSubmit={submit}>
          <label>
            Title
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Description
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Video file
            <input required type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
          </label>
          <label>
            Thumbnail (optional)
            <input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? "Uploading..." : "Publish Video"}
          </button>
        </form>
      </article>
    </section>
  );
}
