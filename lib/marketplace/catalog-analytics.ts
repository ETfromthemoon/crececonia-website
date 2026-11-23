/** Finite, non-identifying dimensions for marketplace discovery events. */
export function searchLengthBucket(query: string): "1-3" | "4-8" | "9-20" | "21+" | null {
  const length = query.trim().length;
  if (length === 0) return null;
  if (length <= 3) return "1-3";
  if (length <= 8) return "4-8";
  if (length <= 20) return "9-20";
  return "21+";
}

export function catalogResultBucket(count: number): "0" | "1" | "2-5" | "6+" {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 5) return "2-5";
  return "6+";
}
