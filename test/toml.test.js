import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'node:os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './foo.toml': `[tool.test]${EOL}version = "${CURRENT_VERSION}"${EOL}`,
  './cargo.toml': `[workspace]${EOL}${EOL}[package]${EOL}name = "hello_world"${EOL}version = "${CURRENT_VERSION}"${EOL}authors = [ "Alice <a@example.com>", "Bob <b@example.com>" ]${EOL}${EOL}[dependencies]${EOL}time = "0.1.12"${EOL}`,
  './pyproject.toml': `[project]${EOL}name = "foo"${EOL}version = "${CURRENT_VERSION}"${EOL}# these are authors${EOL}authors = [{ name = "Alice", email = "a@example.com" }]${EOL}`
});

describe('toml file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.toml', path: 'tool.test.version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './foo.toml',
          type: 'text/toml',
          path: 'tool.test.version'
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.toml', path: 'tool.test.version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.toml', type: 'application/toml', path: 'tool.test.version' },
        out: { file: './foo.toml', type: 'application/toml', path: 'tool.test.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.toml', path: 'tool.test.version' },
        out: { file: './foo.toml', path: 'tool.test.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write without formatting', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './cargo.toml', path: 'package.version' },
        out: { file: './cargo.toml', path: 'package.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(
      readFile('./cargo.toml'),
      `[workspace]${EOL}${EOL}[package]${EOL}name = "hello_world"${EOL}version = "${NEW_VERSION}"${EOL}authors = [ "Alice <a@example.com>", "Bob <b@example.com>" ]${EOL}${EOL}[dependencies]${EOL}time = "0.1.12"${EOL}`
    );
  });

  it('should read/write minimal changes', async () => {
    const options = {
      [NAMESPACE]: {
        out: { file: './pyproject.toml', path: 'project.version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(
      readFile('./pyproject.toml'),
      `[project]${EOL}name = "foo"${EOL}version = "${NEW_VERSION}"${EOL}# these are authors${EOL}authors = [{ name = "Alice", email = "a@example.com" }]${EOL}`
    );
  });
});
