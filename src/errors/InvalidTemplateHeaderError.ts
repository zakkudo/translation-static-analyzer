class InvalidTemplateHeaderError extends Error {
  text: string;

  constructor(text: string, ...message : ConstructorParameters<ErrorConstructor>) {
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

export default InvalidTemplateHeaderError;
