import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'node:os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './.foo': `path.version=${CURRENT_VERSION}${EOL}path.name=fake${EOL}`,
  './foo.ini': `path.version=${CURRENT_VERSION}${EOL}path.name=fake${EOL}`,
  './section.ini': `[db]${EOL}user=root${EOL}${EOL}[section]${EOL}version=${CURRENT_VERSION}${EOL}name=fake${EOL}`
});

describe('ini file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './.foo', type: 'text/x-properties', path: 'path.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should return latest version without defining the type', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.ini', path: 'path.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should return latest version from section', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './section.ini', path: 'section.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.ini', type: 'text/x-properties', path: 'path.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.ini'), `path.version=${NEW_VERSION}${EOL}path.name=fake${EOL}`);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.ini', path: 'path.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.ini'), `path.version=${NEW_VERSION}${EOL}path.name=fake${EOL}`);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.ini', type: 'text/x-properties', path: 'path.version' },
        out: { file: './foo.ini', type: 'text/x-properties', path: 'path.version' }
      }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.ini'), `path.version=${NEW_VERSION}${EOL}path.name=fake${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.ini', path: 'path.version' },
        out: { file: './foo.ini', path: 'path.version' }
      }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.ini'), `path.version=${NEW_VERSION}${EOL}path.name=fake${EOL}`);
  });

  it('should read/write with section', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './section.ini', path: 'section.version' },
        out: { file: './section.ini', path: 'section.version' }
      }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(
      readFile('./section.ini'),
      `[db]${EOL}user=root${EOL}${EOL}[section]${EOL}version=${NEW_VERSION}${EOL}name=fake${EOL}`
    );
  });
});
