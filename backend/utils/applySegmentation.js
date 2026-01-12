const applySegmentation = (text, segments) => {
  if (typeof text !== "string" || !Array.isArray(segments)) {
    throw new Error(
      "Invalid arguments: expected text (string) and segments (array)."
    );
  }
  return segments.map((segment) => {
    const { start, end } = segment.span;

    if (start < 0 || end > text.length || start >= end) {
      throw new Error(`Invalid span range: start=${start}, end=${end}`);
    }

    return text.slice(start, end);
  });
};

export default applySegmentation;
