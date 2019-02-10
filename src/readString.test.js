const readString = require('./readString');

describe('readString', () => {
  describe('singular', () => {
    it('create key and value when contains translation', () => {
      expect(readString(`a __('b') c`)).toEqual({b: [
        {fn: `__('b')`, lineNumber: 0, index: 9}],
      });
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual({});
    });

    it('create key and value when contains shorthand translation', () => {
      expect(readString('a __`b` c')).toEqual({b: [
        {fn: '__`b`', lineNumber: 0, index: 7 }],
      });
    });

    it('handles unclosed parenthesis gracefully', () => {
      expect(readString('a __(`b` c')).toEqual({});
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __(`b`) __(`b`) c')).toEqual({b: [
        {fn: '__(`b`)', lineNumber: 0, index: 9 },
        {fn: '__(`b`)', lineNumber: 0, index: 17 },
      ]});
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __(`b`)\n__(`b`) c')).toEqual({b: [
        {fn: '__(`b`)', lineNumber: 0, index: 9 },
        {fn: '__(`b`)', lineNumber: 1, index: 17 },
      ]});
    });
  });

  describe('singular with context', () => {
    it('create key and value when contains translation', () => {
      expect(readString(`a __p('b', 'c') d`)).toEqual({c: [
        {fn: `__p('b', 'c')`, lineNumber: 0, index: 15},
      ]});
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual({});
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __p(`b`, `c`) __p(`b`, `c`) c')).toEqual({c: [
        {fn: '__p(`b`, `c`)', lineNumber: 0, index: 15 },
        {fn: '__p(`b`, `c`)', lineNumber: 0, index: 29 },
      ]});
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __p(`b`, `c`)\n__p(`b`, `c`) c')).toEqual({c: [
        {fn: '__p(`b`, `c`)', lineNumber: 0, index: 15 },
        {fn: '__p(`b`, `c`)', lineNumber: 1, index: 29 },
      ]});
    });
  });

  describe('plural', () => {
    it('create key and value when contains plural translation', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 0, index: 29},
        ]
      });
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) __n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 0, index: 29 },
          {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 0, index: 57 },
        ]
      });
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1)\n__n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 0, index: 29 },
          {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 1, index: 57 },
        ]
      });
    });
  });

  describe('plural with context', () => {
    it('create key and value when contains plural translation', () => {
      expect(readString("a __np('a', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('a', '%d cat', '%d cats', 1)", lineNumber: 0, index: 35},
        ]
      });
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1) __np('b', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('b', '%d cat', '%d cats', 1)", lineNumber: 0, index: 35 },
          {fn: "__np('b', '%d cat', '%d cats', 1)", lineNumber: 0, index: 69 },
        ]
      });
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1)\n__np('b', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('b', '%d cat', '%d cats', 1)", lineNumber: 0, index: 35 },
          {fn: "__np('b', '%d cat', '%d cats', 1)", lineNumber: 1, index: 69 },
        ]
      });
    });
  });
});
