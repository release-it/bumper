import { readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import glob from 'fast-glob';
import get from 'lodash.get';
import set from 'lodash.set';
import castArray from 'lodash.castarray';
import detectIndent from 'detect-indent';
import yaml from 'js-yaml';
import toml from '@iarna/toml';
import ini from 'ini';
import semver from 'semver';
import { Plugin } from 'release-it';

const noop = Promise.resolve();
const isString = value => typeof value === 'string';

const mimeTypesMap = {
  'application/json': 'json',
  'text/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'text/toml': 'toml',
  'application/toml': 'toml',
  'text/x-properties': 'ini'
};

const extensionsMap = {
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  ini: 'ini'
};

const parseFileOption = option => {
  const file = isString(option) ? option : option.file;
  const mimeType = typeof option !== 'string' ? option.type : null;
  const path = (typeof option !== 'string' && option.path) || 'version';
  return { file, mimeType, path };
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
    default:
      return (data || '').toString();
  }
};

class Bumper extends Plugin {
  async getLatestVersion() {
    const { in: option } = this.options;
    if (!option) return;
    const { file, mimeType, path } = parseFileOption(option);
    if (file) {
      const type = getFileType(file, mimeType);
      let data;

      try {
        data = readFileSync(file, 'utf8');
      } catch (error) {
        data = '{}';
      }

      const parsed = await parse(data, type);
      const version = isString(parsed) ? parsed.trim() : get(parsed, path);
      return semver.parse(version).toString();
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
        const { file, mimeType, path } = parseFileOption(out);
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

        if (typeof parsed !== 'string') {
          castArray(path).forEach(path => set(parsed, path, version));
        }

        switch (type) {
          case 'json':
            return writeFileSync(file, JSON.stringify(parsed, null, indent) + '\n');
          case 'yaml':
            return writeFileSync(file, yaml.dump(parsed, { indent: indent.length }));
          case 'toml':
            return writeFileSync(file, toml.stringify(parsed));
          case 'ini':
            return writeFileSync(file, ini.encode(parsed));
          default:
            const versionMatch = new RegExp(latestVersion || '', 'g');
            const write = parsed ? parsed.replace(versionMatch, version) : version + EOL;
            return writeFileSync(file, write);
        }
      })
    );
  }
}

export default Bumper;
