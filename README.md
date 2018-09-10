# @zakkudo/translation-static-analyzer

A library for scanning javscript files to build translation mappings in json automatically.

[![Build Status](https://travis-ci.org/zakkudo/translation-static-analyzer.svg?branch=master)](https://travis-ci.org/zakkudo/translation-static-analyzer)
[![Coverage Status](https://coveralls.io/repos/github/zakkudo/translation-static-analyzer/badge.svg?branch=master)](https://coveralls.io/github/zakkudo/translation-static-analyzer?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/zakkudo/translation-static-analyzer/badge.svg)](https://snyk.io/test/github/zakkudo/translation-static-analyzer)
[![Node](https://img.shields.io/node/v/@zakkudo/translation-static-analyzer.svg)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/@zakkudo/translation-static-analyzer.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Why use this?

- You no longer have to manage hierarchies of translations
- Templates are automatically generated for the translators
- The translations are noted if they are new, unused and what files
- It allows splitting the translations easily for dynamic imports to allow sliced loading
- Any string wrapped in `__()` or `__n()`, will be picked up as a
  translatable making usage extremely easy for developers

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
1. Wrap strings you want to be translated in `__('text')` or `__n('singlular', 'plural', number)` using a library like `@zakkudo/translator`
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
    // NEW
    // src/pages/AboutPage/index.js:14
    "About": "",
    // UNUSED
    "Search Page": "French translation",
    // src/pages/AboutPage/index.js:40
    "There is one user": {"one":"French translation", "other":"French translation"},
    // src/pages/AboutPage/index.js:38
    "Welcome to the about page!": "French translation"
}
```

And the optimized `src/.locales/fr.json` will look like this for use by your developers:
``` json
{
    "There is one user": {"one":"French translation", "other":"French translation"},
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

## API

<a name="module_@zakkudo/translation-static-analyzer"></a>

<a name="module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer"></a>

### @zakkudo/translation-static-analyzer~TranslationStaticAnalyzer ⏏
Class for analyzing javascript source files, extracting the translations, and converting them into
localization templates.

**Kind**: Exported class

* [~TranslationStaticAnalyzer](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer)
    * [new TranslationStaticAnalyzer(options)](#new_module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer_new)
    * [.templateDirectory](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+templateDirectory) ⇒ <code>String</code>
    * [.read([requestFiles])](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+read) ⇒ <code>Boolean</code>
    * [.write()](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+write)
    * [.update([requestFiles])](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+update)

<a name="new_module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer_new"></a>

#### new TranslationStaticAnalyzer(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | The modifiers for how the analyzer is run |
| options.files | <code>String</code> |  | A [glob pattern](https://www.npmjs.com/package/glob) of the files to pull translations from |
| [options.debug] | <code>Boolean</code> | <code>false</code> | Show debugging information in the console |
| [options.locales] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | The locales to generate (eg fr, ja_JP, en) |
| [options.templates] | <code>String</code> |  | The location to store the translator translatable templates for each language. Defaults to making a `locales` directory in the current working directory |
| [options.target] | <code>String</code> |  | Where to write the final translations, which can be split between multiple directories for modularity. If there are no targets, no `.locales` directory will be generated anywhere. |

<a name="module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+templateDirectory"></a>

#### translationStaticAnalyzer.templateDirectory ⇒ <code>String</code>
**Kind**: instance property of [<code>TranslationStaticAnalyzer</code>](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer)  
**Returns**: <code>String</code> - The path to the directory which holds
the translation templates that are dynamically updated
by code changes and should be used by translators
to add the localizations.  
<a name="module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+read"></a>

#### translationStaticAnalyzer.read([requestFiles]) ⇒ <code>Boolean</code>
Read changes from the source files and update the database stored in the current
analyzer instance. No changes will be written to the templates and all reads are
accumulative for the next write. Use the `requestFiles` option if you want to hook
this method up to a file watcher which can supply a list of files that have changed.

**Kind**: instance method of [<code>TranslationStaticAnalyzer</code>](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer)  
**Returns**: <code>Boolean</code> - True if some some of the modified files matches the
file option passed on initialization  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [requestFiles] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | A subset of files from the `options.files` glob to read or non to reread all files. Any files that are supplied to this method that are not part of the `options.files` glob are simply ignored. |

<a name="module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+write"></a>

#### translationStaticAnalyzer.write()
Write the current database to the templates and targets. This method is
useful to force an update of the targets if a
language file template in `templateDirectory` is updated without
updating a source file.

**Kind**: instance method of [<code>TranslationStaticAnalyzer</code>](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer)  
<a name="module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer+update"></a>

#### translationStaticAnalyzer.update([requestFiles])
Updates the translations to match the source files, using logic to try to reduce disk writes
if no source files changed.  This method was designed to be hooked up to a file watcher for the source
code. *There will be no changes if this method is called after there is a manual change to the translation
templates.  It only cares about source files.*

**Kind**: instance method of [<code>TranslationStaticAnalyzer</code>](#module_@zakkudo/translation-static-analyzer..TranslationStaticAnalyzer)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [requestFiles] | <code>Array.&lt;String&gt;</code> | <code>[]</code> | The files or none to update everything in the options.files glob pattern. |

