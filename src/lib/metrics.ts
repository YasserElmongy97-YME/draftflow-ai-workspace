export interface DocumentMetrics {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  headingCount: number;
  paragraphCount: number;
}

export function computeMetrics(content: string): DocumentMetrics {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      readingTimeMinutes: 0,
      headingCount: 0,
      paragraphCount: 0,
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

  const lines = trimmed.split(/\r?\n/);
  const headingCount = lines.filter((line) => /^#{1,6}\s+/.test(line.trim())).length;

  const blocks = trimmed
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !/^#{1,6}\s+/.test(b));

  return {
    wordCount,
    charCount,
    readingTimeMinutes,
    headingCount,
    paragraphCount: blocks.length,
  };
}
