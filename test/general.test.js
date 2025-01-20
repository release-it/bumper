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
  './dryrun.json': JSON_DATA,
  './foo.json': JSON_DATA,
  './foo.txt': `${CURRENT_VERSION}${EOL}`,
  './foo2.txt': `${CURRENT_VERSION}${EOL}`,
  './manifest.json': `{}${EOL}`,
  './VERSION': `v${CURRENT_VERSION}${EOL}`,
  './VERSION-OLD': `v${OLD_VERSION}${EOL}`,
  './README.md': `Release v${CURRENT_VERSION}${EOL}`,
  './foo.php': `/* comments${EOL}version: v${CURRENT_VERSION} */ <? echo <p>hello world</p>; ?>${EOL}`,
  './invalid.toml': `/# -*- some invalid toml -*-${EOL}version = "${CURRENT_VERSION}"${EOL}`
});

describe('release-it bumper', { concurrency: true }, () => {
  it('should not throw', async () => {
    const options = { [NAMESPACE]: {} };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await assert.doesNotReject(runTasks(plugin));
  });

  it('should read one and write different', async () => {
    const options = {
      [NAMESPACE]: {
        in: './bower.json',
        out: { file: './foo.php', type: 'text/php' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(
      readFile('./foo.php'),
      `/* comments${EOL}version: v${NEW_VERSION} */ <? echo <p>hello world</p>; ?>${EOL}`
    );
  });

  it('should read one and write multiple files and respect prefix', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: 'VERSION', type: 'text/plain' },
        out: ['README.md', 'VERSION']
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./README.md'), `Release v${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./VERSION'), `v${NEW_VERSION}${EOL}`);
  });

  it('should write various file types', async () => {
    const options = {
      [NAMESPACE]: {
        out: [{ file: './foo*.txt' }, { file: './(bower|manifest).json' }]
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.txt'), `${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./foo2.txt'), `${NEW_VERSION}${EOL}`);
    assert.equal(readFile('./bower.json'), `{${EOL}  "version": "${NEW_VERSION}"${EOL}}${EOL}`);
    assert.equal(readFile('./manifest.json'), `{${EOL}  "version": "${NEW_VERSION}"${EOL}}${EOL}`);
  });

  it('should not write in dry run', async () => {
    const options = { [NAMESPACE]: { in: './dryrun.json' } };
    const plugin = factory(Bumper, {
      NAMESPACE,
      options,
      global: { isDryRun: true }
    });
    await plugin.bump(NEW_VERSION);
    assert.equal(readFile('./dryrun.json'), `{"version":"${CURRENT_VERSION}"}${EOL}`);
  });

  it('should give precedence to mime type over file extension', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './invalid.toml',
          type: 'text/plain'
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./invalid.toml'), `/# -*- some invalid toml -*-${EOL}version = "${NEW_VERSION}"${EOL}`);
  });
});
