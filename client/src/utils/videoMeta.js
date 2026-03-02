export function formatDuration(valueInSeconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(valueInSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatViews(value) {
  const views = Number(value) || 0;
  if (views < 1000) {
    return `${views}`;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  })
    .format(views)
    .toUpperCase();
}
