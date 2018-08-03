# translation-static-analyzer

A library for scanning javscript files to build translation mappings in json automatically.

There are three different concepts for this library.

1) The source files which the translations are analyzed and extracted from

```bash
src/**/*.js
```

2) The intermediary translations that are meant to be edited by humanes in json5 format

```bash
locales/ja.json
```

3) The final translations which strip out untranslated strings and json5 comments and are optionally split between targets.

```bash
src/.locales/ja.json
```

Usage for just translating everything:

```js
const TranslationStaticAnalyzer = require('translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    //Analyzes all javscript files in the src directory
    files: 'src/**/*.js',
    //Enables verbose output
    debug: true,
    //generate a locales/fr.json as well as a locales/en.json
    locales: ['fr', 'en'],
    //Each page in the folder will get it's own subset of translations
    target: 'src'
});
analyzer.update();
```

------

Usage for splitting transaltions between dynamically imported pages of a web app:

```js
const TranslationStaticAnalyzer = require('translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    //Analyzes all javscript files in the src directory
    files: 'src/**/*.js',
    //Enables verbose output
    debug: true,
    //generate a locales/fr.json as well as a locales/en.json
    locales: ['fr', 'en'],
    //Each page in the folder will get it's own subset of translations
    target: 'src/pages/*'
});
analyzer.update();
```

You can incrementally update the written translation (such as for updates triggered by watch) by passing the files that changed:
analyzer.update(['/src/index.js']);

Example of translation templates:

```js
{
    // NEW
    // src/Application/pages/AboutPage/index.js:14
    "About": "",
    // UNUSED
    "This isn't used anymore": "So the text here doesn't really do anything",
    // src/Application/pages/AboutPage/index.js:38
    "Welcome to the about page!": "ようこそ"
}
```

Use the translations with a library like y18n by doing:

```js
const y18n = require('y18n')({
    updateFiles: false
});
const japanese = require('./locales/ja.json');

y18n.cache['ja'] = japanese;
y18n.setLocale('ja');

//This library will add any translations to the json using __() or __n() as the translation function.
const translated = y18n.__('to be translated');
```
