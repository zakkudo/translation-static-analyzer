const escape = (text: string): string => {
  return text.replace(/&/g, "&amp;").replace(/:/g, "&colon;");
};

const toKey = (...tokens: unknown[]): string => {
  return tokens
    .filter((p) => typeof p === "string")
    .map(escape)
    .join(":");
};

export default toKey;
