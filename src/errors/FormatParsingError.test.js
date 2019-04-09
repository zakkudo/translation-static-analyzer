const FormatParsingError = require('./FormatParsingError');

describe('errors/FormatParsingError', () => {
  it('creates an error with a stack', () => {
    const error = new FormatParsingError('test format', 'test message', 'test stack')

    expect(error.toString()).toEqual(`FormatParsingError: Could not parse "test format" data. "test message"`);
    expect(error.stack).toEqual('test stack');
  });

  it('creates an error without a stack', () => {
    const error = new FormatParsingError('test format', 'test message')

    expect(error.toString()).toEqual(`FormatParsingError: Could not parse "test format" data. "test message"`);
    expect(error.stack).toBeTruthy();
  });
});
