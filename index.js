const fs = require('fs');
const util = require('util');
const { EOL } = require('os');
const glob = require('fast-glob');
const get = require('lodash.get');
const set = require('lodash.set');
const castArray = require('lodash.castarray');
const detectIndent = require('detect-indent');
const yaml = require('js-yaml');
const toml = require('@iarna/toml');
const ini = require('ini');
const { Plugin } = require('release-it');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const noop = Promise.resolve();

const parseFileOption = option => {
  const file = typeof option === 'string' ? option : option.file;
  const mimeType = typeof option !== 'string' ? option.type : null;
  const path = (typeof option !== 'string' && option.path) || 'version';
  return { file, mimeType, path };
};

const getFileType = (file, mimeType) => {
  const ext = file.split('.').pop();
  if (['application/json'].includes(mimeType) || ext === 'json') return 'json';
  if (['text/yaml', 'application/x-yaml'].includes(mimeType) || ['yml', 'yaml'].includes(ext)) return 'yaml';
  if (['application/toml', 'text/toml'].includes(mimeType) || ext === 'toml') return 'toml';
  if (['text/x-properties'].includes(mimeType) || ext === 'ini') return 'ini';
  return 'text';
};

const parse = async (data, type) => {
  switch (type) {
    case 'json':
      return JSON.parse(data);
    case 'yaml':
      return yaml.safeLoad(data);
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
      const data = await readFile(file, 'utf8').catch(() => '{}');
      const parsed = await parse(data, type);
      return typeof parsed === 'string' ? parsed.trim() : get(parsed, path);
    }
    return null;
  }

  async bump(version) {
    const { out } = this.options;
    const { isDryRun } = this.config;
    const { latestVersion } = this.config.contextOptions;
    if (!out) return;

    const expandedOptions = castArray(out).map(options => (typeof options === 'string' ? { file: options } : options));

    const options = [];
    for (const option of expandedOptions) {
      if (glob.isDynamicPattern(option.file)) {
        const files = await glob(option.file, { onlyFiles: true, unique: true });
        options.push(...files.map(file => Object.assign({}, option, { file })));
      } else options.push(option);
    }

    return Promise.all(
      options.map(async out => {
        const { file, mimeType, path } = parseFileOption(out);
        this.log.exec(`Writing version to ${file}`, isDryRun);
        if (isDryRun) return noop;

        const type = getFileType(file, mimeType);
        const data = await readFile(file, 'utf8').catch(() => (type === 'text' ? latestVersion : '{}'));
        const parsed = await parse(data, type);
        const indent = typeof data === 'string' ? detectIndent(data).indent || '  ' : null;

        if (typeof parsed !== 'string') {
          castArray(path).forEach(path => set(parsed, path, version));
        }

        switch (type) {
          case 'json':
            return writeFile(file, JSON.stringify(parsed, null, indent) + '\n');
          case 'yaml':
            return writeFile(file, yaml.safeDump(parsed, { indent: indent.length }) + '\n');
          case 'toml':
            return writeFile(file, toml.stringify(parsed));
          case 'ini':
            return writeFile(file, ini.encode(parsed));
          default:
            const versionMatch = new RegExp(latestVersion || '', 'g');
            const write = parsed ? parsed.replace(versionMatch, version) : version + EOL;
            return writeFile(file, write);
        }
      })
    );
  }
}

module.exports = Bumper;
