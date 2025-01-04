import { readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import glob from 'fast-glob';
import { castArray, get, set } from 'lodash-es';
import detectIndent from 'detect-indent';
import { detectNewline } from 'detect-newline';
import yaml from 'js-yaml';
import toml from '@iarna/toml';
import ini from 'ini';
import jsdom from 'jsdom';
import serialize from 'w3c-xmlserializer';
import semver from 'semver';
import { Plugin } from 'release-it';

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
  'text/html': 'html'
};

const extensionsMap = {
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  xml: 'xml',
  html: 'html'
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

const parse = async (data, type) => {
  switch (type) {
    case 'json':
      return JSON.parse(data);
    case 'yaml':
      return yaml.load(data);
    case 'toml':
      return toml.parse(data);
    case 'ini':
      return ini.parse(data);
    case 'xml':
    case 'html':
      const dom = new jsdom.JSDOM('');
      const doc = new dom.window.DOMParser();
      return doc.parseFromString(data, 'application/xml');
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
          const element = parsed.querySelector(path);
          if (!element) {
            throw new Error(`Failed to find the element with the provided selector: ${path}`);
          }
          version = element.textContent;
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

        const parsed = await parse(data, type);
        const indent = isString(data) ? detectIndent(data).indent || '  ' : null;
        const newline = isString(data) ? detectNewline(data) || EOL : null;

        if (typeof parsed !== 'string') {
          castArray(path).forEach(path => set(parsed, path, versionPrefix + version));
        }

        switch (type) {
          case 'json':
            return writeFileSync(file, JSON.stringify(parsed, null, indent) + '\n');
          case 'yaml':
            return writeFileSync(file, yaml.dump(parsed, { indent: indent.length }));
          case 'toml':
            const tomlString = toml.stringify(parsed);
            // handle empty objects for sections
            const tomlContent = tomlString.replace(/^([a-zA-Z0-9\.\-]+) \= \{ \}/g, '[$1]');
            return writeFileSync(file, tomlContent);
          case 'ini':
            return writeFileSync(file, ini.encode(parsed));
          case 'xml':
            const xmlElement = parsed.querySelector(path);
            if (!xmlElement) {
              throw new Error(`Failed to find the element with the provided selector: ${path}`);
            }

            xmlElement.textContent = version;

            const xml = serialize(parsed);

            const CRLF = '\r\n';
            if (newline === CRLF) {
              return writeFileSync(file, xml.replace(/\n/g, CRLF) + CRLF);
            }

            return writeFileSync(file, xml + '\n');
          case 'html':
            const htmlElement = parsed.querySelector(path);
            if (!htmlElement) {
              throw new Error(`Failed to find the element with the provided selector: ${path}`);
            }

            const previousContents = htmlElement.outerHTML;
            htmlElement.textContent = version;
            const html = data.replace(previousContents.trim(), htmlElement.outerHTML.trim());
            return writeFileSync(file, html);
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
