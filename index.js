import { readFileSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import glob from 'fast-glob';
import { castArray, get, set } from 'lodash-es';
import detectIndent from 'detect-indent';
import yaml from 'js-yaml';
import toml from '@iarna/toml';
import ini from 'ini';
import semver from 'semver';
import { Plugin } from 'release-it';
import * as cheerio from 'cheerio';

const noop = Promise.resolve();
const isString = value => typeof value === 'string';

const mimeTypesMap = {
  'application/json': 'json',
  'application/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'text/yaml': 'yaml',
  'application/toml': 'toml',
  'text/toml': 'toml',
  'text/x-properties': 'ini',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/xhtml+xml': 'html',
  'text/html': 'html',
  'text/plain': 'text'
};

const extensionsMap = {
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  xml: 'xml',
  html: 'html',
  xhtml: 'html',
  txt: 'text'
};

const parseFileOption = option => {
  const file = isString(option) ? option : option.file;
  const mimeType = typeof option !== 'string' ? option.type : null;
  const path = (typeof option !== 'string' && option.path) || 'version';
  const consumeWholeFile = typeof option !== 'string' ? option.consumeWholeFile : false;
  const versionPrefix = typeof option !== 'string' ? option.versionPrefix : null;
  return { file, mimeType, path, consumeWholeFile, versionPrefix };
};

const getFileType = (file, mimeType) => {
  if (mimeType) return mimeTypesMap[mimeType] || 'text';
  const ext = file.split('.').pop();
  return extensionsMap[ext] || 'text';
};

const detectNewline = (string = '') => {
  const newlines = string.match(/(?:\r?\n)/g) || [];
  if (newlines.length === 0) return '\n';
  const crlf = newlines.filter(newline => newline === '\r\n').length;
  const lf = newlines.length - crlf;
  return crlf > lf ? '\r\n' : '\n';
};

const parse = async (data, type) => {
  switch (type) {
    case 'json':
      return JSON.parse(data);
    case 'yaml':
      return yaml.load(data);
    case 'toml': {
      return toml.parse(data.replace(/(\r\n)/g, '\n'));
    }
    case 'ini':
      return ini.parse(data);
    case 'xml':
      return cheerio.load(data, { xmlMode: true });
    case 'html':
      return cheerio.load(data);
    default: // text
      return (data || '').toString();
  }
};

class Bumper extends Plugin {
  async getLatestVersion() {
    const { in: option } = this.options;
    if (!option) return;
    const { file, mimeType, path, consumeWholeFile } = parseFileOption(option);
    if (file) {
      const type = getFileType(file, mimeType);
      let data;

      try {
        data = readFileSync(file, 'utf8');
      } catch (error) {
        data = '{}';
      }

      const parsed = await parse(data, type);

      let version = undefined;
      switch (type) {
        case 'json':
        case 'yaml':
        case 'toml':
        case 'ini':
          version = get(parsed, path);
          break;
        case 'xml':
        case 'html':
          const element = parsed(path);
          if (!element.length) {
            throw new Error(`Failed to find the element with the provided selector: ${path}`);
          }
          version = element.text();
          break;
        default: // text
          version = parsed.trim();
      }

      const parsedVersion = semver.parse(version);
      return parsedVersion ? parsedVersion.toString() : null;
    }
    return null;
  }

  async bump(version) {
    const { out } = this.options;
    const { isDryRun } = this.config;
    const { latestVersion } = this.config.getContext();
    if (!out) return;

    const expandedOptions = castArray(out).map(options => (isString(options) ? { file: options } : options));

    const options = [];
    for (const option of expandedOptions) {
      if (glob.isDynamicPattern(option.file)) {
        const files = await glob(option.file, {
          onlyFiles: true,
          unique: true
        });
        options.push(
          ...files.map(file => ({
            ...option,
            file
          }))
        );
      } else {
        options.push(option);
      }
    }

    return Promise.all(
      options.map(async out => {
        const { file, mimeType, path, consumeWholeFile, versionPrefix = '' } = parseFileOption(out);
        this.log.exec(`Writing version to ${file}`, isDryRun);
        if (isDryRun) return noop;

        const type = getFileType(file, mimeType);

        let data;

        try {
          data = readFileSync(file, 'utf8');
        } catch (error) {
          data = type === 'text' ? latestVersion : '{}';
        }

        const newline = detectNewline(data);
        const parsed = await parse(data, type);
        const indent = isString(data) ? detectIndent(data).indent || '  ' : null;

        if (typeof parsed !== 'string') {
          castArray(path).forEach(path => set(parsed, path, versionPrefix + version));
        }

        switch (type) {
          case 'json':
            return writeFileSync(file, JSON.stringify(parsed, null, indent) + '\n');
          case 'yaml':
            return writeFileSync(file, yaml.dump(parsed, { indent: indent.length }));
          case 'toml':
            var tomlContent = data;

            castArray(path).forEach(path => {
              const latestPath = path.split('.').at(-1);
              const versionMatch = new RegExp(`${latestPath}[\\W\\w]+?(${latestVersion.replaceAll('.', '\\.')})` || '');
              tomlContent = tomlContent.replace(versionMatch, (match, group1) => {
                return match.replace(group1, versionPrefix + version);
              });
            });

            return writeFileSync(file, tomlContent.replace(/(\r?\n)/g, newline));
          case 'ini':
            return writeFileSync(file, ini.encode(parsed));
          case 'xml':
          case 'html':
            const element = parsed(path);
            if (!element.length) {
              throw new Error(`Failed to find the element with the provided selector: ${path}`);
            }

            // If we just used the parsed.html() or parsed.xml() function, cheerio will modify:
            // - html doctype
            // - html head
            // - encode special characters in strings too eagerly (https://github.com/cheeriojs/cheerio/issues/4045)
            const previousContents = element.prop('outerHTML');
            element.text(version);
            const contents = data.replace(previousContents.trim(), element.prop('outerHTML').trim());
            return writeFileSync(file, contents);
          default:
            const versionMatch = new RegExp(latestVersion || '', 'g');
            const write = parsed && !consumeWholeFile ? parsed.replace(versionMatch, version) : version + EOL;
            return writeFileSync(file, write);
        }
      })
    );
  }
}

export default Bumper;
