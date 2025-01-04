import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

const file = `<!DOCTYPE html>${EOL}<html lang="en">${EOL}  <head></head>${EOL}  <body>${EOL}    <div>${EOL}        <div id="version">${CURRENT_VERSION}</div>${EOL}    </div>${EOL}  </body>${EOL}</html>${EOL}`;
const updatedFile = `<!DOCTYPE html>${EOL}<html lang="en">${EOL}  <head></head>${EOL}  <body>${EOL}    <div>${EOL}        <div id="version">${NEW_VERSION}</div>${EOL}    </div>${EOL}  </body>${EOL}</html>${EOL}`

mock({
  './foo.html': file
});

describe('html file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: { file: './foo.html', path: '#version' } } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './foo.html',
          type: 'text/html',
          path: '#version'
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.html'), updatedFile);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.html', path: '#version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.html'), updatedFile);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.html', type: 'text/html', path: '#version' },
        out: { file: './foo.html', type: 'text/html', path: '#version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.html'), updatedFile);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.html', path: '#version' },
        out: { file: './foo.html', path: '#version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.html'), updatedFile);
  });
});
