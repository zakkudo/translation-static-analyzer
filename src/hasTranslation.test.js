const hasTranslation = require('./hasTranslation');

describe('hasTranslation', () => {
    it('returns true for empty object', () => {
        expect(hasTranslation({})).toBe(false);
    });

    it('returns false for empty value', () => {
        expect(hasTranslation({a: ''})).toBe(false);
    });

    it('returns true for value', () => {
        expect(hasTranslation({a: 'b'})).toBe(true);
    });

    it('returns true for deep value', () => {
        expect(hasTranslation({a: {b: 'c'}})).toBe(true);
    });

    it('returns false for emtpy deep value', () => {
        expect(hasTranslation({a: {b: ''}})).toBe(false);
    });

    it('returns false for string', () => {
        expect(hasTranslation('test text')).toBe(true);
    });

    it('returns true for plural form', () => {
        expect(hasTranslation({
            "%d %s cat": {
                "one": "%d %s cat",
                "other": "%d %s cats"
            },
        })).toEqual(true);
    });

    it('returns false for plural form when empty strings', () => {
        expect(hasTranslation({
            "%d %s cat": {
                "one": "",
                "other": ""
            },
        })).toEqual(false);
    });

    it('returns true for plural form even when one empty string', () => {
        expect(hasTranslation({
            "%d %s cat": {
                "one": "",
                "other": "%d %s cats"
            },
        })).toEqual(true);
    });
});
