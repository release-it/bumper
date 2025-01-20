import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'node:os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, JSON_DATA, OLD_VERSION, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './bower.json': JSON_DATA,
  './foo.json': JSON_DATA,
  './foo.txt': `${CURRENT_VERSION}${EOL}`,
  './foo2.txt': `${CURRENT_VERSION}${EOL}`,
  './VERSION': `v${CURRENT_VERSION}${EOL}`,
  './VERSION-OLD': `v${OLD_VERSION}${EOL}`,
  './VERSION-OLD2': `v${OLD_VERSION}${EOL}`
});

describe('text file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.txt', type: 'text/plain' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should return latest version without defining the type', async () => {
    const options = { [NAMESPACE]: { in: { file: './foo.txt' } } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = {
      [NAMESPACE]: { out: [{ file: './VERSION-OUT', type: 'text/plain' }] }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('3.2.1');
    assert.equal(readFile('./VERSION-OUT'), `3.2.1${EOL}`);
  });

  it('should write default text type', async () => {
    const options = { [NAMESPACE]: { out: [{ file: './VERSION-OUT' }] } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('3.2.1');
    assert.equal(readFile('./VERSION-OUT'), `3.2.1${EOL}`);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.txt', type: 'text/plain' },
        out: { file: './foo.txt', type: 'text/plain' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.txt'), `${NEW_VERSION}${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.txt' }, out: { file: './foo.txt' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.txt'), `${NEW_VERSION}${EOL}`);
  });

  it('should read one and write multiple files', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.txt' }, out: './foo*.txt' }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.txt'), `${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./foo2.txt'), `${NEW_VERSION}${EOL}`);
  });

  it('should read and overwrite out-of-date, completely', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: 'VERSION', type: 'text/plain' },
        out: [
          {
            file: './VERSION-OLD',
            type: 'text/plain',
            consumeWholeFile: true
          },
          {
            file: './VERSION',
            type: 'text/plain'
          }
        ]
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./VERSION'), `v${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./VERSION-OLD'), `${NEW_VERSION}${EOL}`);
  });

  it('should read but not update out-of-date', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: 'VERSION', type: 'text/plain' },
        out: [
          {
            file: './VERSION-OLD2',
            type: 'text/plain',
            consumeWholeFile: false
          },
          {
            file: './VERSION',
            type: 'text/plain'
          }
        ]
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./VERSION'), `v${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./VERSION-OLD2'), `v${OLD_VERSION}${EOL}`);
  });

  it('should read but not update out-of-date (default implied)', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: 'VERSION', type: 'text/plain' },
        out: [
          {
            file: './VERSION-OLD2',
            type: 'text/plain'
          },
          {
            file: './VERSION',
            type: 'text/plain'
          }
        ]
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./VERSION'), `v${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./VERSION-OLD2'), `v${OLD_VERSION}${EOL}`);
  });
});
