import readString from './readString';
jest.mock('./readCharacter');
import readCharacter from './readCharacter';

readCharacter.mockReturnValue({index: 0, stack: []});

describe('readString', () => {
  it('escapes from infinite loop', () => {
    const serializedState = JSON.stringify({
      index: 0,
      stack: [],
    }, null, 4);

    expect(() => readString('a')).toThrow(new Error(

      `infinite loop detected\n\n${serializedState}\n\n Problem starts here -> a`
    ));
  });
});
