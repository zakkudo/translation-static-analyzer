import readString from '.';

describe('readString', () => {
  describe('singular', () => {
    it.only('create key and value when contains translation', () => {
      expect(readString(`a __('b') c`)).toEqual({b: [
        {fn: `__('b')`, index: 9, lineNumber: 0}],
      });
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual({});
    });

    it('create key and value when contains shorthand translation', () => {
      expect(readString('a __`b` c')).toEqual({b: [
        {fn: '__`b`', index: 7, lineNumber: 0 }],
      });
    });

    it('handles unclosed parenthesis gracefully', () => {
      expect(readString('a __(`b` c')).toEqual({});
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __(`b`) __(`b`) c')).toEqual({b: [
        {fn: '__(`b`)', index: 9, lineNumber: 0 },
        {fn: '__(`b`)', index: 17, lineNumber: 0 },
      ]});
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __(`b`)\n__(`b`) c')).toEqual({b: [
        {fn: '__(`b`)', index: 9, lineNumber: 0 },
        {fn: '__(`b`)', index: 17, lineNumber: 1 },
      ]});
    });
  });

  describe('singular with context', () => {
    it('create key and value when contains translation', () => {
      expect(readString(`a __p('b', 'c') d`)).toEqual({c: [
        {fn: `__p('b', 'c')`, index: 15, lineNumber: 0},
      ]});
    });

    it('adds nothing when no translation', () => {
      expect(readString(`a c`)).toEqual({});
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString('a __p(`b`, `c`) __p(`b`, `c`) c')).toEqual({c: [
        {fn: '__p(`b`, `c`)', index: 15, lineNumber: 0 },
        {fn: '__p(`b`, `c`)', index: 29, lineNumber: 0 },
      ]});
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString('a __p(`b`, `c`)\n__p(`b`, `c`) c')).toEqual({c: [
        {fn: '__p(`b`, `c`)', index: 15, lineNumber: 0 },
        {fn: '__p(`b`, `c`)', index: 29, lineNumber: 1 },
      ]});
    });
  });

  describe('plural', () => {
    it('create key and value when contains plural translation', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", index: 29, lineNumber: 0},
        ]
      });
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1) __n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", index: 29, lineNumber: 0 },
          {fn: "__n('%d cat', '%d cats', 1)", index: 57, lineNumber: 0 },
        ]
      });
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __n('%d cat', '%d cats', 1)\n__n('%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__n('%d cat', '%d cats', 1)", index: 29, lineNumber: 0 },
          {fn: "__n('%d cat', '%d cats', 1)", index: 57, lineNumber: 1 },
        ]
      });
    });
  });

  describe('plural with context', () => {
    it('create key and value when contains plural translation', () => {
      expect(readString("a __np('a', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('a', '%d cat', '%d cats', 1)", index: 35, lineNumber: 0},
        ]
      });
    });

    it('handles two duplicate translations on same line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1) __np('b', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('b', '%d cat', '%d cats', 1)", index: 35, lineNumber: 0 },
          {fn: "__np('b', '%d cat', '%d cats', 1)", index: 69, lineNumber: 0 },
        ]
      });
    });

    it('handles two duplicate translations on different line gracefully', () => {
      expect(readString("a __np('b', '%d cat', '%d cats', 1)\n__np('b', '%d cat', '%d cats', 1) c")).toEqual({
        '%d cat': [
          {fn: "__np('b', '%d cat', '%d cats', 1)", index: 35, lineNumber: 0 },
          {fn: "__np('b', '%d cat', '%d cats', 1)", index: 69, lineNumber: 1 },
        ]
      });
    });
  });
});
