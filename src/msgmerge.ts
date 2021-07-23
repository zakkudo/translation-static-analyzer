
const ArgumentParser = require('@zakkudo/argument-parser');
const TranslationStaticAnalyzer = require('.');
const argv = process.argv.slice(2);
const path = require('path');
const chokidar = require('chokidar');

const parse = new ArgumentParser({
  name: 'update-translations',
  version: __VERSION__,
  leftover: 'source-files-glob',
  description: 'A console application for updating gettext style translations in a javscript application.',
  schema: [{
    long: 'watch',
    short: 'w',
    type: 'boolean',
    description: 'Update the translations as the files change. ctrl-c to quit.',
  }, {
    long: 'templates',
    type: 'string',
    typeName: 'path',
    description: 'The output target of the developer centric translations. A \'locale\' directory will be created in this localition.',
    default: '..'
  }, {
    long: 'target',
    type: 'string',
    typeName: 'glob',
    description: 'The output target of the developer centric translations. A \'.locale\' directory will be created in this location.',
    default: '.'
  }, {
    long: 'debug',
    type: 'boolean',
    description: 'Show debugging messages.'
  }, {
    long: 'locales',
    short: 'l',
    type: 'list',
    typeName: 'es,fr',
    description: 'The locales to generate translation templates for, comma separated.',
    default: []
  }],
});

const parsed = parse(argv)
const files = (parsed.leftover || [])[0] || '**/*.js';

const analyzer = new TranslationStaticAnalyzer({
  debug: parsed.debug,
  locales: parsed.locales,
  target: parsed.target,
  templates: parsed.templates,
  files
});

let debounceTimeout;
const filenames = new Set();

function update(filename) {
  filenames.add(filename);
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    analyzer.update(Array.from(filenames));
    filenames.clear();
  }, 100);
}

if (parsed.watch) {
  const templatesFilePattern = path.resolve(parsed.templates, 'locales', '*');

  analyzer.read();
  analyzer.write();

  chokidar.watch(files, {ignoreInitial: true})
    .on('add', update)
    .on('change', update)
    .on('unlink', update);

  chokidar.watch(templatesFilePattern, {ignoreInitial: true})
    .on('add', update)
    .on('change', update)
    .on('unlink', update);
} else {
  analyzer.read();
  analyzer.write();
}

