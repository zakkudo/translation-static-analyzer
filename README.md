<a name="module_TranslationStaticAnalyzer"></a>

## TranslationStaticAnalyzer
A library for scanning javscript files to build translation mappings in json automatically.

<p>
<a href="https://travis-ci.org/zakkudo/translation-static-analyzer">
    <img src="https://travis-ci.org/zakkudo/translation-static-analyzer.svg?branch=master"
         alt="Build Status" /></a>
<a href="https://coveralls.io/github/zakkudo/translation-static-analyzer?branch=master">
    <img src="https://coveralls.io/repos/github/zakkudo/translation-static-analyzer/badge.svg?branch=master"
         alt="Coverage Status" /></a>
<a href="https://snyk.io/test/github/zakkudo/translation-static-analyzer">
    <img src="https://snyk.io/test/github/zakkudo/translation-static-analyzer/badge.svg"
         alt="Known Vulnerabilities"
         data-canonical-src="https://snyk.io/test/github/zakkudo/translation-static-analyzer"
         style="max-width:100%;" /></a>
</p>

Why use this?

- You no longer have to manage hierarchies of translations
- Templates are automatically generated for the translators
- The translations are noted if they are new, unused and what files
- It allows splitting the translations easily for dynamic imports to allow sliced loading
- Any string wrapped in `__()` or `__n()`, will be picked up as a translatable making usage extremely easy for developers

What does it do?

- I generates a locales directory filled with templates where the program was run, used by humans to translate
- It generates .locale directories optimized for loading in each of the directories passed to targets
- You load those translations from .locales as you need them

Install with:

```console
yarn add @zakkudo/translation-static-analyzer
```

Also consider `@zakkudo/translate-webpack-plugin` which is a wrapper for this library
for webpack and `@zakkudo/translator` for a library that can read the localization with
no fuss and apply the translations.

**Example** *(Usage for just translating everything in a project)*  
```js
const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    files: 'src/**/*.js', // Analyzes all javscript files in the src directory
    debug: true, // Enables verbose output
    locales: ['fr', 'en'], // generate a locales/fr.json as well as a locales/en.json
    target: 'src' // Each page in the folder will get it's own subset of translations
});
analyzer.update();
```
**Example** *(Usage for splitting transaltions between dynamically imported pages of a web app)*  
```js
const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    files: 'src/**/*.js', // Analyzes all javscript files in the src directory
    debug: true, // Enables verbose output
    locales: ['fr', 'en'], // generate a locales/fr.json as well as a locales/en.json
    target: 'src/pages/*' // Each page in the folder will get it's own subset of translations
});
analyzer.update();
```
**Example** *(Generated translation templates)*  
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
**Example** *(Use the translations with @zakkudo/translator)*  
```js
import Translator from '@zakkudo/translator';
import localization = from './src/.locales/ja.json'; //Generated by the analyzer

const translator = new Translator();
translator.mergeLocalization('ja', localization); //Load the localization
translator.setLocale('ja'); //Tell the translator to use it

const translated = translator.__('I love fish'); //Translate!
const translated = translator.__n('There is a duck in the pond.', 'There are %d ducks in the pond', 3); //Translate!
```

* [TranslationStaticAnalyzer](#module_TranslationStaticAnalyzer)
    * [module.exports](#exp_module_TranslationStaticAnalyzer--module.exports) ⏏
        * [new module.exports(options)](#new_module_TranslationStaticAnalyzer--module.exports_new)

<a name="exp_module_TranslationStaticAnalyzer--module.exports"></a>

### module.exports ⏏
**Kind**: Exported class  
<a name="new_module_TranslationStaticAnalyzer--module.exports_new"></a>

#### new module.exports(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | The modifiers for how the analyzer is run |
| options.files | <code>String</code> |  | A glob of the files to pull translations from |
| [options.debug] | <code>Boolean</code> | <code>false</code> | Show debugging information in the console |
| [options.locales] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | The locales to generate (eg fr, ja_JP, en) |
| options.templates | <code>String</code> |  | The location to store the translator translatable templates for each language |
| options.target | <code>String</code> |  | Where to write the final translations, which can be split between multiple directories for modularity. |

