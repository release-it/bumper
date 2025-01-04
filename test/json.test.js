import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import {
  NAMESPACE,
  JSON_DATA,
  OLD_VERSION,
  CURRENT_VERSION,
  NEW_VERSION
} from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './bower.json': JSON_DATA,
  './foo.json': JSON_DATA,
  './manifest.json': `{}${EOL}`,
  './VERSION': `v${CURRENT_VERSION}${EOL}`,
  './VERSION-OLD': `v${OLD_VERSION}${EOL}`
});

describe('json file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: './foo.json' } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write indented', async () => {
    const options = { [NAMESPACE]: { out: './manifest.json' } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('1.2.3');
    assert.equal(readFile('./manifest.json'), `{${EOL}  "version": "1.2.3"${EOL}}${EOL}`);
  });

  it('should write new, indented', async () => {
    const options = { [NAMESPACE]: { out: ['./null.json'] } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('0.0.0');
    assert.equal(readFile('./null.json'), `{${EOL}  "version": "0.0.0"${EOL}}${EOL}`);
  });

  it('should write version at path', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './deep.json', path: 'deep.sub.version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('1.2.3');
    assert.equal(
      readFile('./deep.json'),
      `{${EOL}  "deep": {${EOL}    "sub": {${EOL}      "version": "1.2.3"${EOL}    }${EOL}  }${EOL}}${EOL}`
    );
  });

  it('should write version at multiple paths', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './multi.json',
          path: ['version', 'deep.version', 'deep.sub.version']
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await plugin.bump('1.2.3');
    assert.equal(
      readFile('./multi.json'),
      `{${EOL}  "version": "1.2.3",${EOL}  "deep": {${EOL}    "version": "1.2.3",${EOL}    "sub": {${EOL}      "version": "1.2.3"${EOL}    }${EOL}  }${EOL}}${EOL}`
    );
  });

  it('should update version with prefix', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './bower.json',
          path: 'version',
          versionPrefix: '^'
        }
      }
    };

    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./bower.json'), '{\n  "version": "^' + NEW_VERSION + '"\n}\n');
  });
});
