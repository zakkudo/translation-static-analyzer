class InvalidTemplateHeaderError extends Error {
  constructor(text, ...message) {
    super(...message);
    this.text = text;
  }

  /**
   * @private
   */
  toString() {
    return `InvalidTemplateHeaderError: ${this.message}`;
  }
}

module.exports = InvalidTemplateHeaderError;
