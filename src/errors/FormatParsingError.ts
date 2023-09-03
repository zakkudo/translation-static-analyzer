class FormatParsingError extends Error {
  constructor(format, message, stack) {
    super(`Could not parse "${format}" data. "${message}"`);

    this.format = format;

    if (stack) {
      this.stack = stack;
    }
  }

  /**
   * @private
   */
  toString() {
    return `FormatParsingError: ${this.message}`;
  }
}

export default FormatParsingError;

