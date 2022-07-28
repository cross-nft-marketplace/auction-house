export const dateFromTimestamp = (timestamp: string) =>
  new Date(parseInt(timestamp, 10) * 1000);

export const dateFormat = (timestamp: string) =>
  dateFromTimestamp(timestamp).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });