/**
 * @internal
 */
function escape(text: string): string {
  return text.replace(/\\/g, "\\u{5C}").replace(/:/g, "\\u{3A}");
}

export default escape;
