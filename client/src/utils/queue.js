const QUEUE_KEY = "streamx_video_queue";

function parseQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getQueueVideos() {
  return parseQueue();
}

export function addVideoToQueue(video) {
  const list = parseQueue();
  const exists = list.some((entry) => entry._id === video?._id);
  if (exists) {
    return { added: false, queue: list };
  }

  const next = [video, ...list].slice(0, 200);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  return { added: true, queue: next };
}

export function removeVideoFromQueue(videoId) {
  const next = parseQueue().filter((entry) => entry._id !== videoId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  return next;
}

export function clearQueue() {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}
