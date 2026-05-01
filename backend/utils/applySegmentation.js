const applySegmentation = (text, segments) => {
  if (typeof text !== "string" || !Array.isArray(segments)) {
    throw new Error(
      "Invalid arguments: expected text (string) and segments (array)."
    );
  }
  return segments.map((segment) => {
    const lines = segment.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error(`Segment ${segment.id} has no valid lines array.`);
    }

    return lines
      .map(({ start, end }) => {
        if (start < 0 || end > text.length || start >= end) {
          throw new Error(`Invalid line range: start=${start}, end=${end}`);
        }
        return text.slice(start, end);
      })
      .join("");
  });
};

export default applySegmentation;
