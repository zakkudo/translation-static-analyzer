class UnsupportedFormatError extends Error {
  format: string;

  constructor(format : string) {
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

export default UnsupportedFormatError;
