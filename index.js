const fs = require('fs');
const util = require('util');
const get = require('lodash.get');
const castArray = require('lodash.castarray');
const detectIndent = require('detect-indent');
const { Plugin } = require('release-it');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const parseFileOption = option => {
  const file = typeof option === 'string' ? option : option.file;
  const type = (typeof option !== 'string' && option.type) || 'application/json';
  const path = (typeof option !== 'string' && option.path) || 'version';
  return { file, type, path };
};

class Bumper extends Plugin {

  getIncrementedVersionCI() {

  }

  static disablePlugin() {
    return "version"  
  }

  async getLatestVersion() {
    const { in: _in } = this.options;
    if (!_in) return;
    const { file, type, path } = parseFileOption(_in);
    let version = null;
    if (file) {
      const data = await readFile(file);
      if (type === 'application/json') {
        const parsed = JSON.parse(data);
        version = get(parsed, path);
      } else if (type === 'text/plain') {
        version = data.toString().trim();
      }
    }
    return version;
  }

  bump(version) {
    const { out } = this.options;
    if (!out) return;
    return Promise.all(
      castArray(out).map(async out => {
        const { file, type, path } = parseFileOption(out);
        if (type === 'application/json') {
          const data = await readFile(file, 'utf8').catch(() => '{}');
          const indent = detectIndent(data).indent || '  ';
          const parsed = JSON.parse(data);
          parsed[path] = version;
          return writeFile(file, JSON.stringify(parsed, null, indent) + '\n');
        } else if (type === 'text/plain') {
          return writeFile(file, version);
        }
      })
    );
  }
}

module.exports = Bumper;
