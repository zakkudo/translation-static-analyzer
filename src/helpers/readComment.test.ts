import readString from './readString';

describe('readString', () => {
  describe('singular', () => {
    it('create key and value when contains translation', () => {
      expect(readString(`a __('b') c`)).toEqual([{
        fn: `__("b")`,
        index: 9,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('key can include quotes', () => {
      expect(readString(`a __("a's") c`)).toEqual([{
        fn: `__("a's")`,
        index: 11,
        key: "a's",
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('adds multi-line block comments when directly above', () => {
      expect(readString(`/*test\ncomment*/\n__('b') c`)).toEqual([{
        comments: 'test\ncomment',
        fn: `__("b")`,
        index: 24,
        key: 'b',
        lineNumber: 2,
        number: false,
        particular: false,
      }]);
    });

    it('create key and value with outside line comments', () => {
      expect(readString(`//test comments\n__('b') c`)).toEqual([{
        comments: 'test comments',
        fn: `__("b")`,
        index: 23,
        key: 'b',
        lineNumber: 1,
        number: false,
        particular: false,
      }]);
    });

    it('adds line comments when directly above', () => {
      expect(readString(`//test comments\n__('b') c`)).toEqual([{
        comments: 'test comments',
        fn: `__("b")`,
        index: 23,
        key: 'b',
        lineNumber: 1,
        number: false,
        particular: false,
      }]);
    });

    it('doesn\'t add line comments when not directly above', () => {
      expect(readString(`//test comments\n\n__('b') c`)).toEqual([{
        fn: `__("b")`,
        index: 24,
        key: 'b',
        lineNumber: 2,
        number: false,
        particular: false,
      }]);
    });

    it('create key and value with inline comments', () => {
      expect(readString(`a __(/*test comments*/'b') c`)).toEqual([{
        comments: 'test comments',
        fn: `__("b")`,
        index: 26,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('includes the comments when on the previous line', () => {
      expect(readString(`/* comments */ a __('b') c`)).toEqual([{
        fn: `__("b")`,
        index: 24,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual([]);
    });

    it('create key and value when contains shorthand translation', () => {
      expect(readString('a __`b` c')).toEqual([{
        fn: '__("b")',
        index: 7,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('handles unclosed parenthesis gracefully', () => {
      expect(readString('a __(`b` c')).toEqual([]);
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __(`b`) __(`b`) c')).toEqual([{
        fn: '__("b")',
        index: 9,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }, {
        fn: '__("b")',
        index: 17,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }]);
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __(`b`)\n__(`b`) c')).toEqual([{
        fn: '__("b")',
        index: 9,
        key: 'b',
        lineNumber: 0,
        number: false,
        particular: false,
      }, {
        fn: '__("b")',
        index: 17,
        key: 'b',
        lineNumber: 1,
        number: false,
        particular: false,
      }]);
    });
  });

  describe('singular with context', () => {
    it('create key and value when contains translation', () => {
      expect(readString(`a __p('b', 'c') d`)).toEqual([{
        context: 'b',
        fn: '__p("b","c")',
        index: 15,
        key: 'c',
        lineNumber: 0,
        number: false,
        particular: true,
      }]);
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual([]);
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __p(`b`, `c`) __p(`b`, `c`) c')).toEqual([{
        context: 'b',
        fn: '__p("b","c")',
        index: 15,
        key: 'c',
        lineNumber: 0,
        number: false,
        particular: true,
      }, {
        context: 'b',
        fn: '__p("b","c")',
        index: 29,
        key: 'c',
        lineNumber: 0,
        number: false,
        particular: true,
      }]);
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __p(`b`, `c`)\n__p(`b`, `c`) c')).toEqual([{
        context: 'b',
        fn: '__p("b","c")',
        index: 15,
        key: 'c',
        lineNumber: 0,
        number: false,
        particular: true,
      }, {
        context: 'b',
        fn: '__p("b","c")',
        index: 29,
        key: 'c',
        lineNumber: 1,
        number: false,
        particular: true,
      }]);
    });
  });

  describe('number', () => {
    it('create key and value when contains number translation', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) c")).toEqual([{
        fn: '__n("%d cat","%d cats")',
        index: 29,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: false,
        plural: '%d cats',
      }]);
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) __n('%d cat', '%d cats', 1) c")).toEqual([{
        fn: '__n("%d cat","%d cats")',
        index: 29,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: false,
        plural: "%d cats",
      }, {
        fn: '__n("%d cat","%d cats")',
        index: 57,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: false,
        plural: "%d cats",
      }]);
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1)\n__n('%d cat', '%d cats', 1) c")).toEqual([{
        fn: '__n("%d cat","%d cats")',
        index: 29,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: false,
        plural: "%d cats",
      }, {
        fn: '__n("%d cat","%d cats")',
        index: 57,
        key: '%d cat',
        lineNumber: 1,
        number: true,
        particular: false,
        plural: "%d cats",
      }]);
    });
  });

  describe('number with context', () => {
    it('create key and value when contains number translation', () => {
      expect(readString("a __np('a', '%d cat', '%d cats', 1) c")).toEqual([{
        context: 'a',
        fn: '__np("a","%d cat","%d cats")',
        index: 35,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: true,
        plural: "%d cats",
      }]);
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1) __np('b', '%d cat', '%d cats', 1) c")).toEqual([{
        context: 'b',
        fn: '__np("b","%d cat","%d cats")',
        index: 35,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: true,
        plural: "%d cats",
      }, {
        context: 'b',
        fn: '__np("b","%d cat","%d cats")',
        index: 69,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: true,
        plural: "%d cats",
      }]);
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1)\n__np('b', '%d cat', '%d cats', 1) c")).toEqual([{
        context: 'b',
        fn: '__np("b","%d cat","%d cats")',
        index: 35,
        key: '%d cat',
        lineNumber: 0,
        number: true,
        particular: true,
        plural: "%d cats",
      }, {
        context: 'b',
        fn: '__np("b","%d cat","%d cats")',
        index: 69,
        key: '%d cat',
        lineNumber: 1,
        number: true,
        particular: true,
        plural: "%d cats",
      }]);
    });
  });
});
