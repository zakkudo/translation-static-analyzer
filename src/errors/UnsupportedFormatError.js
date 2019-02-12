class UnsupportedFormatError extends Error {
  constructor(format) {
    super(`"${format}" is not a supported format`);

    this.format = format;
  }

  /**
   * @private
   */
  toString() {
    return `UnsupportedFormatError: ${this.message}`;
  }
}

module.exports = UnsupportedFormatError;
