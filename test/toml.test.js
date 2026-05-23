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
  // includes another section with a "version" key with semver value
  './without_target_version.toml': `[tool.test]${EOL}[tool.ignored]${EOL}version = "${CURRENT_VERSION}"${EOL}`,
  './with_multiple_version.toml': `[tool.test]${EOL}[project]${EOL}`,
  './with_comments_and_formatting.toml': `# Lead with some comments${EOL}${EOL}[workspace]${EOL}${EOL}${EOL}[tool.test]${EOL}name    = "hello_world"${EOL}version = "${CURRENT_VERSION}"${EOL}`,
  // project version is already at NEW_VERSION and has a dependency with a version containing the CURRENT_VERSION
  './at_current_version.toml': `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}dependencies = [${EOL}  "django = 1${CURRENT_VERSION}"${EOL}]${EOL}`,
  './cargo.toml': `[workspace]${EOL}${EOL}[package]${EOL}name = "hello_world"${EOL}version = "${CURRENT_VERSION}"${EOL}authors = [ "Alice <a@example.com>", "Bob <b@example.com>" ]${EOL}${EOL}[dependencies]${EOL}time = "0.1.12"${EOL}`,
  './pyproject.toml': `[project]${EOL}name = "foo"${EOL}version = "${CURRENT_VERSION}"${EOL}authors = [{ name = "Alice", email = "a@example.com" }]${EOL}dependencies = [${EOL}  "django = 1${CURRENT_VERSION}"${EOL}]${EOL}[tool.commitizen]${EOL}version = "${CURRENT_VERSION}"${EOL}`,
});

const readFilePostBumperTasks = async (namespaceOptions) => {  
  const options = {
    [NAMESPACE]: namespaceOptions
  }

  const plugin = await factory(Bumper, { NAMESPACE, options });
  await runTasks(plugin);
  
  return readFile(namespaceOptions.out.file)
}

describe('toml file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = {
      [NAMESPACE]: { in: { file: './foo.toml', path: 'tool.test.version' } }
    };
    const plugin = await factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should add version at path when missing', async () => {
    const namespaceOptions = {
      out: {
        file: './without_target_version.toml',
        type: 'text/toml',
        path: 'tool.test.version'
      }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions)
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}[tool.ignored]${EOL}version = "${CURRENT_VERSION}"${EOL}`);
  });

  it('should update version at path', async () => {
    const namespaceOptions = {
      out: {
        file: './foo.toml',
        type: 'text/toml',
        path: 'tool.test.version'
      }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should update versions at multiple paths', async () => {
    const namespaceOptions = {
      out: {
        file: './with_multiple_version.toml',
        type: 'text/toml',
        path: ['project.version', 'tool.test.version']
      }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}[project]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should write without defining the type', async () => {
    const namespaceOptions = {
      out: { file: './foo.toml', path: 'tool.test.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write', async () => {
    const namespaceOptions = {
      in: { file: './foo.toml', type: 'application/toml', path: 'tool.test.version' },
      out: { file: './foo.toml', type: 'application/toml', path: 'tool.test.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const namespaceOptions = {
      in: { file: './foo.toml', path: 'tool.test.version' },
      out: { file: './foo.toml', path: 'tool.test.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(contents, `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}`);
  });

  it('should read/write without formatting', async () => {
    const namespaceOptions = {
      in: { file: './with_comments_and_formatting.toml', path: 'tool.test.version' },
      out: { file: './with_comments_and_formatting.toml', path: 'tool.test.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(
      contents,
      `# Lead with some comments${EOL}${EOL}[workspace]${EOL}${EOL}${EOL}[tool.test]${EOL}name    = "hello_world"${EOL}version = "${NEW_VERSION}"${EOL}`
    );
  });

  it('should noop when the target version is already at the new version', async () => {
    const namespaceOptions = {
      out: { file: './at_current_version.toml', path: 'tool.test.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(
      contents,
      `[tool.test]${EOL}version = "${NEW_VERSION}"${EOL}dependencies = [${EOL}  "django = 1${CURRENT_VERSION}"${EOL}]${EOL}`
    );
  });

  it('should handle example cargo.toml file', async () => {
    const namespaceOptions = {
      out: { file: './cargo.toml', path: 'package.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(
      contents,
      `[workspace]${EOL}${EOL}[package]${EOL}name = "hello_world"${EOL}version = "${NEW_VERSION}"${EOL}authors = [ "Alice <a@example.com>", "Bob <b@example.com>" ]${EOL}${EOL}[dependencies]${EOL}time = "0.1.12"${EOL}`
    );
  });

  it('should handle example pyproject.toml file', async () => {
    const namespaceOptions = {
      out: { file: './pyproject.toml', path: 'project.version' }
    };
    const contents = await readFilePostBumperTasks(namespaceOptions);
    assert.equal(
      contents,
      `[project]${EOL}name = "foo"${EOL}version = "${NEW_VERSION}"${EOL}authors = [{ name = "Alice", email = "a@example.com" }]${EOL}dependencies = [${EOL}  "django = 1${CURRENT_VERSION}"${EOL}]${EOL}[tool.commitizen]${EOL}version = "${CURRENT_VERSION}"${EOL}`
    );
  });
});