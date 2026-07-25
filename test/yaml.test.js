import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'node:os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './comments-only.yaml': `# Version intentionally unset${EOL}`,
  './complex-key.yaml': `? [foo, bar]${EOL}: value${EOL}version: ${CURRENT_VERSION}${EOL}`,
  './empty.yaml': '',
  './foo.yaml': `version: v${CURRENT_VERSION}${EOL}`,
  './merged.yaml': `base: &base${EOL}  version: ${CURRENT_VERSION}${EOL}release:${EOL}  <<: *base${EOL}`,
  './nested.yaml': `node:${EOL}  item:${EOL}    version: ${CURRENT_VERSION}${EOL}`,
  './tagged.yaml': `released: !!timestamp 2026-07-25${EOL}payload: !!binary SGVsbG8=${EOL}flags: !!set${EOL}  ? one${EOL}ordered: !!omap${EOL}  - one: 1${EOL}pairs: !!pairs${EOL}  - one: 1${EOL}version: ${CURRENT_VERSION}${EOL}`
});

describe('yaml file', { concurrency: true }, () => {
  it('should return no version for an empty file', async () => {
    const options = { [NAMESPACE]: { in: './empty.yaml' } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, null);
  });

  it('should return no version for a comment-only file', async () => {
    const options = { [NAMESPACE]: { in: './comments-only.yaml' } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, null);
  });

  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: './foo.yaml' } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should accept complex mapping keys supported by js-yaml v4', async () => {
    const options = { [NAMESPACE]: { in: './complex-key.yaml' } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should return a version inherited through a YAML merge key', async () => {
    const options = { [NAMESPACE]: { in: { file: './merged.yaml', path: 'release.version' } } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should accept the explicit YAML tags supported by js-yaml v4', async () => {
    const options = { [NAMESPACE]: { in: './tagged.yaml' } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = { [NAMESPACE]: { out: { file: './foo.yaml', type: 'application/yaml' } } };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.yaml'), `version: ${NEW_VERSION}${EOL}`);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './nested.yaml', path: 'node.item.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
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
    const plugin = await factory(Bumper, { NAMESPACE, options });
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
    const plugin = await factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./nested.yaml'), `node:${EOL}  item:${EOL}    version: ${NEW_VERSION}${EOL}`);
  });
});
