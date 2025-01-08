import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './foo.yaml': `version: v${CURRENT_VERSION}${EOL}`,
  './nested.yaml': `node:${EOL}  item:${EOL}    version: ${CURRENT_VERSION}${EOL}`
});

describe('yaml file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: './foo.yaml' } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = { [NAMESPACE]: { out: { file: './foo.yaml', type: 'application/yaml'} } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.yaml'), `version: ${NEW_VERSION}${EOL}`);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './nested.yaml', path: 'node.item.version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./nested.yaml'), `node:${EOL}  item:${EOL}    version: ${NEW_VERSION}${EOL}`);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './nested.yaml', type: 'application/x-yaml', path: 'node.item.version' },
        out: { file: './nested.yaml', type: 'text/yaml', path: 'node.item.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./nested.yaml'), `node:${EOL}  item:${EOL}    version: ${NEW_VERSION}${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './nested.yaml', path: 'node.item.version' },
        out: { file: './nested.yaml', path: 'node.item.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./nested.yaml'), `node:${EOL}  item:${EOL}    version: ${NEW_VERSION}${EOL}`);
  });
});
