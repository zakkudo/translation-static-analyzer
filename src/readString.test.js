const readString = require('./readString');

describe('readString', () => {
    describe('singular', () => {
        it('create key and value when contains translation', () => {
            expect(readString(`a __('b') c`)).toEqual({b: {fn: `__('b')`, lineNumber: 0, index: 9}});
        });

        it('adds nothing when no translation', () => {
            expect(readString(`a c`)).toEqual({});
        });

        it('create key and value when contains shorthand translation', () => {
            expect(readString('a __`b` c')).toEqual({b: {fn: '__`b`', lineNumber: 0, index: 7 }});
        });

        it('handles unclosed parenthesis gracefully', () => {
            expect(readString('a __(`b` c')).toEqual({});
        });
    });

    describe('plural', () => {
        it('create key and value when contains plural translation', () => {
            expect(readString("a __n('%d cat', '%d cats', 1) c")).toEqual({
                '%d cat': {fn: "__n('%d cat', '%d cats', 1)", lineNumber: 0, index: 29}
            });
        });
    });
});
