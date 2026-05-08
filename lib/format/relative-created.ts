export function formatRelativeCreated(date: Date | string | number): string {
  const created = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Created just now";
  }

  if (diffMins < 60) {
    return `Created ${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `Created ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays < 7) {
    return `Created ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  // Fallback to absolute date if older than a week
  return `Created on ${created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
