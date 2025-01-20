import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'node:os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

const html = `<!DOCTYPE html>${EOL}<html lang="en">${EOL}  <head></head>${EOL}  <body>${EOL}    <div>${EOL}        <div id="version">${CURRENT_VERSION}</div>${EOL}    </div>${EOL}  </body>${EOL}</html>${EOL}`;
const updatedHTML = `<!DOCTYPE html>${EOL}<html lang="en">${EOL}  <head></head>${EOL}  <body>${EOL}    <div>${EOL}        <div id="version">${NEW_VERSION}</div>${EOL}    </div>${EOL}  </body>${EOL}</html>${EOL}`;
const xhtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"${EOL}"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">${EOL}<html xmlns="http://www.w3.org/1999/xhtml">${EOL}<head>${EOL}  <title>Title of document</title>${EOL}</head>${EOL}<body>${EOL}  <div id="version">${CURRENT_VERSION}</div>${EOL}</body>${EOL}</html>`;
const updatedXHTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"${EOL}"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">${EOL}<html xmlns="http://www.w3.org/1999/xhtml">${EOL}<head>${EOL}  <title>Title of document</title>${EOL}</head>${EOL}<body>${EOL}  <div id="version">${NEW_VERSION}</div>${EOL}</body>${EOL}</html>`;

mock({
  './foo.html': html,
  './foo.xhtml': xhtml
});

describe('html file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: { file: './foo.html', path: '#version' } } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should return latest version (XHTML)', async () => {
    const options = { [NAMESPACE]: { in: { file: './foo.xhtml', path: '#version' } } };
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
    assert.equal(readFile('./foo.html'), updatedHTML);
  });

  it('should write (XHTML)', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './foo.xhtml',
          type: 'application/xhtml+xml',
          path: '#version'
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xhtml'), updatedXHTML);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.html', path: '#version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.html'), updatedHTML);
  });

  it('should write without defining the type (XHTML)', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.xhtml', path: '#version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xhtml'), updatedXHTML);
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
    assert.equal(readFile('./foo.html'), updatedHTML);
  });

  it('should read/write (XHTML)', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.xhtml', type: 'application/xhtml+xml', path: '#version' },
        out: { file: './foo.xhtml', type: 'application/xhtml+xml', path: '#version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xhtml'), updatedXHTML);
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
    assert.equal(readFile('./foo.html'), updatedHTML);
  });

  it('should read/write without defining the type (XHTML)', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.xhtml', path: '#version' },
        out: { file: './foo.xhtml', path: '#version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xhtml'), updatedXHTML);
  });
});
