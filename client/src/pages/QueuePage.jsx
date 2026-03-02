import { Link } from "react-router-dom";
import { getQueueVideos, removeVideoFromQueue } from "../utils/queue";
import { formatDuration, formatViews } from "../utils/videoMeta";
import { useMemo, useState } from "react";

export default function QueuePage() {
  const [queue, setQueue] = useState(getQueueVideos());
  const videos = useMemo(() => (Array.isArray(queue) ? queue : []), [queue]);

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h2>Queue</h2>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state-center">
          <p>No queued videos</p>
        </div>
      ) : (
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
                <button className="btn ghost" type="button" onClick={() => setQueue(removeVideoFromQueue(video._id))}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
