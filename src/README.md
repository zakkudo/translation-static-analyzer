# @zakkudo/translation-static-analyzer

A library for scanning javscript files to build translation mappings in json automatically.

[![Build Status](https://travis-ci.org/zakkudo/translation-static-analyzer.svg?branch=master)](https://travis-ci.org/zakkudo/translation-static-analyzer)
[![Coverage Status](https://coveralls.io/repos/github/zakkudo/translation-static-analyzer/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/translation-static-analyzer?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/zakkudo/translation-static-analyzer/badge.svg)](https://snyk.io/test/github/zakkudo/translation-static-analyzer)
[![Node](https://img.shields.io/node/v/@zakkudo/translation-static-analyzer.svg)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@zakkudo/translation-static-analyzer.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Why use this?

- You no longer have to manage hierarchies of translations
- Designed for architectures leveraging dynamic imports, allowing splitting of the translations based off of file structure
- Templates are automatically generated for the translators where they only need to fill in the blanks
- The translations are annoted if they are new or unused as well as the file names and line numbers of usages
- Easy auditing for missing or non-updated translation strings with never running your application or enlisting QA
- Any string wrapped in `__()` or `__n()` or `__p()` or `__np()`, will be picked up as a
  translatable making usage extremely easy for developers
- Works similarly to the venerable [gettext](https://en.wikipedia.org/wiki/Gettext).  Any translation strategies that work for that library work for this library.

## What does it do?

- It searches your source code for translatable strings and aggregates them
- It writes human-centric translation templates in json5 showing usages, new strings and no longer used strings
- It generates developer-centric optimized json templates, stripping away any unused strings and metadata

## Install

```console
# Install using npm
npm install @zakkudo/translation-static-analyzer
```

``` console
# Install using yarn
yarn add @zakkudo/translation-static-analyzer
```

## Setup
1. Wrap strings you want to be translated in `__('text')` or `__n('singlular', 'plural', number)` or `__p('context', 'text')` or `__np('context', 'singular', 'plural', number)` using a library like `@zakkudo/translator`
2. Initialize the analyzer in your build scripts similar to below.
``` javascript
const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    // Analyzes all javscript files in the src directory, which is a good initial value
    files: 'src/**/*.js',
    // Use verbose output to see what files are parsed, what keys are extracted, and where they are being written to
    debug: true,
    // You do not need to add your default language (which for most people will be English)
    locales: ['fr'],
    // Consolidate all of the optimized localizations into `src/.locale`, good as an initial configuration
    target: 'src'
});

// Use `read` and `write` to brute force updates to the translations, avoiding optimizations that reduce disk usage.

// Reads the source files that match `src/**/*.js` and parses out any translation keys, merging it into the database
analyzer.read();

// Updates the `locales` translation templates for the translators and then writes the optimized `src/.locales` templates for the developers
analyzer.write();
```
3. Add `.locales` to your `.gitignore` so it isn't commited.  It is a dynamic source file that has no value being added to a repository. Its existance in the `src` directory is simply to facilitate importing it.
4. Add `find src -name '.locales' | xargs rm -r` to your clean scripts for an easy way to remove the auto generated `src/.locales` from your source code
5. Import locales into your source code from the `src/.locales` folder so you can merge it into the lookup of `@zakkudo/translator`.  It is plain old json with the untranslated and unexisting values optimized out.
6. Have your localization team use the files from `locales` (without a period.)  It's annoted with information about new, unused, and existing usages of the translations to help them audit what needs updating.

You'll end up with a file structure similar to below.
```
File Structure
├── locales <- For your translators
│   ├── en.json
│   └── fr.json
└── src
    ├── .locales <- For your developers
    │   ├── en.json
    │   └── fr.json
    └── pages
        ├── About
        │   └── index.js
        └── Search
            └── index.js
```

Where `locales/fr.json` will look like this for use by your translators:
``` json5
{
    "About": {
        // NEW
        // src/pages/AboutPage/index.js:14
        "default": ""
    },
    "Search": {
        // UNUSED
        "default": "French translation",
        // UNUSED
        "menuitem": "French translation"
    },
    "There is one user": {
        // src/pages/AboutPage/index.js:40
        "default": {"1":"French translation", "2":"French translation"},
    },
    "Welcome to the about page!": {
        // src/pages/AboutPage/index.js:38
        "default": "French translation"
    }
}
```

And the optimized `src/.locales/fr.json` will look like this for use by your developers:
``` json
{
    "Search": {
        "default": "French translation",
        "menuitem": "French translation"
    },
    "There is one user": {"1":"French translation", "2":"French translation"},
    "Welcome to the about page!": "French translation"
}
```

Your developers will use the translation similarly to below:
``` javascript
import Translator from '@zakkudo/translator';
import fr from 'src/.locales/fr.json';
const translator = new Translator();
const {__, __n} = translator;
const language = navigator.language.split('-')[0];

translator.setLocalization('fr', fr);
translator.setLocale(language);

document.title = __('About');
document.body.innerHTML = __n('There is one user', 'There are %d users', 2);
```

## Examples

### Configure the analyzer to build a single `.locales` directory
``` javascript
const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    files: 'src/**/*.js',
    locales: ['es', 'fr'],
    target: 'src'
});
```

```
File Structure
├── locales <- For your translators. Contains translations for everything
│   ├── es.json
│   └── fr.json
└── src
    ├── Application.js
    ├── .locales <- For your developers. Contains translations for everything
    │   ├── es.json
    │   └── fr.json
    └── pages
        ├── About
        │   └── index.js
        └── Search
            └── index.js
```


### Configure the analyzer for a split `.locales` directory
``` javascript
const TranslationStaticAnalyzer = require('@zakkudo/translation-static-analyzer');
const analyzer = new TransalationStaticAnalyzer({
    files: 'src/**/*.js',
    locales: ['es', 'fr'],
    target: 'src/pages/*'
});
```

```
File Structure
├── locales <- For your translators. Contains translations for everything
│   ├── es.json
│   └── fr.json
└── src
    ├── Application.js
    └── pages
        ├── About
        │   ├── .locales <- For your developers. Contains translations for `Application.js` and `About/index.js`
        │   │   ├── es.json
        │   │   └── fr.json
        │   └── index.js
        └── Search
            ├── .locales <- For your developers. Contains translations for `Application.js` and `Search/index.js`
            │   ├── es.json
            │   └── fr.json
            └── index.js
```

## Also see

- `@zakkudo/translate-webpack-plugin` which is a wrapper for this library
for use with [webpack](https://webpack.js.org)
- `@zakkudo/translator` is a library that can read the localization with
no fuss and apply the translations.
- [Polymer 3 Starter Project](https://github.com/zakkudo/polymer-3-starter-project)
is an example project using this library.
