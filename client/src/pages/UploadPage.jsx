import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { videoApi } from "../api";

// Possible stages the upload UI moves through:
// idle → uploading (file going to server) → processing (worker running) → done / error
const STAGE = {
  IDLE: "idle",
  UPLOADING: "uploading",   // Sending file to backend / multer
  PROCESSING: "processing", // Backend queue is working (polling for status)
  DONE: "done",
  ERROR: "error",
};

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [stage, setStage] = useState(STAGE.IDLE);
  const [progress, setProgress] = useState(0);  // 0–100, from job.progress
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef(null);  // holds the setInterval so we can clear it
  const navigate = useNavigate();

  // Clean up the polling interval if the component unmounts mid-upload
  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  const pollJobStatus = (jobId) => {
    // Poll every 2 seconds until the job is completed or failed
    pollRef.current = setInterval(async () => {
      try {
        const result = await videoApi.getJobStatus(jobId);
        const { status, progress: pct, video, reason } = result.data;

        setProgress(pct ?? 0);

        if (status === "active") {
          setStatusText(`Processing... ${pct ?? 0}%`);
        } else if (status === "waiting" || status === "delayed") {
          setStatusText("Processing...");
        } else if (status === "completed") {
          clearInterval(pollRef.current);
          setStage(STAGE.DONE);
          setProgress(100);
          setStatusText("Done! Redirecting...");
          // Navigate to the new video
          setTimeout(() => navigate(`/watch/${video?.videoId}`), 1000);
        } else if (status === "failed") {
          clearInterval(pollRef.current);
          setStage(STAGE.ERROR);
          setError(`Processing failed: ${reason || "Unknown error"}. Please try again.`);
        }
      } catch {
        // Network hiccup — don't stop polling, just wait for next tick
      }
    }, 2000);
  };

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

    setStage(STAGE.UPLOADING);
    setStatusText("Uploading file...");

    try {
      // This returns immediately with { jobId, status: 'queued' }
      const result = await videoApi.publish(formData);
      const { jobId } = result.data;

      if (!jobId) throw new Error("No job ID returned from server");

      setStage(STAGE.PROCESSING);
      setStatusText("Processing...");
      pollJobStatus(jobId);
    } catch (err) {
      setStage(STAGE.ERROR);
      setError(err?.response?.data?.message || err?.message || "Failed to upload video");
    }
  };

  const isbusy = stage === STAGE.UPLOADING || stage === STAGE.PROCESSING;

  return (
    <section className="upload-wrap">
      <article className="upload-card">
        <p className="eyebrow">Creator Studio</p>
        <h2>Upload New Video</h2>
        <p className="muted">Publish your content with optional thumbnail and metadata.</p>

        {error ? <p className="error-text">{error}</p> : null}

        {/* Progress section — shown during uploading/processing */}
        {isbusy && (
          <div className="upload-progress">
            <p className="muted">{statusText}</p>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%`, transition: "width 0.4s ease" }}
              />
            </div>
            <p className="progress-pct">{progress}%</p>
          </div>
        )}

        {!isbusy && stage !== STAGE.DONE && (
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
            <button className="btn primary" type="submit">
              Publish Video
            </button>
          </form>
        )}
      </article>
    </section>
  );
}
