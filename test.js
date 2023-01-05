import test from 'bron';
import { readFileSync } from 'fs';
import { EOL } from 'os';

import assert from 'assert';
import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from './index.js';

mock({
  './bower.json': JSON.stringify({ version: '1.0.0' }) + EOL,
  './foo.txt': `1.0.0${EOL}`,
  './foo2.txt': `1.0.0${EOL}`,
  './foo.php': `/* comments${EOL}version: v1.0.0 */ <? echo <p>hello world</p>; ?>${EOL}`,
  './manifest.json': `{}${EOL}`,
  './dryrun.json': JSON.stringify({ version: '1.0.0' }) + EOL,
  './foo.toml': `[tool.test]${EOL}version = "1.0.0"${EOL}`,
  './foo.ini': `path.version=1.0.0${EOL}path.name=fake${EOL}`,
  './VERSION': `v1.0.0${EOL}`,
  './README.md': `Release v1.0.0${EOL}`,
  './foo.yaml': `version: v1.0.0${EOL}`,
  './invalid.toml': `/# -*- some invalid toml -*-${EOL}version = "1.0.0"${EOL}`
});

const namespace = 'bumper';

const nl = value => value.split(/\r\n|\r|\n/g).join(EOL);

const readFile = file => nl(readFileSync(file).toString());

test('should not throw', async () => {
  const options = { [namespace]: {} };
  const plugin = factory(Bumper, { namespace, options });
  await assert.doesNotReject(runTasks(plugin));
});

test('should return latest version from JSON file', async () => {
  const options = { [namespace]: { in: './bower.json' } };
  const plugin = factory(Bumper, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '1.0.0');
});

test('should return latest version from plain text file', async () => {
  const options = {
    [namespace]: { in: { file: './foo.txt', type: 'text/plain' } }
  };
  const plugin = factory(Bumper, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '1.0.0');
});

test('should return latest version from plain text file (.txt)', async () => {
  const options = { [namespace]: { in: { file: './foo.txt' } } };
  const plugin = factory(Bumper, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '1.0.0');
});

test('should return latest version from YAML file', async () => {
  const options = { [namespace]: { in: './foo.yaml' } };
  const plugin = factory(Bumper, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '1.0.0');
});

test('should write indented JSON file', async () => {
  const options = { [namespace]: { out: './manifest.json' } };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('1.2.3');
  assert.equal(readFile('./manifest.json'), `{${EOL}  "version": "1.2.3"${EOL}}${EOL}`);
});

test('should write new, indented JSON file', async () => {
  const options = { [namespace]: { out: ['./null.json'] } };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('0.0.0');
  assert.equal(readFile('./null.json'), `{${EOL}  "version": "0.0.0"${EOL}}${EOL}`);
});

test('should write version at path', async () => {
  const options = {
    [namespace]: { out: { file: './deep.json', path: 'deep.sub.version' } }
  };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('1.2.3');
  assert.equal(
    readFile('./deep.json'),
    `{${EOL}  "deep": {${EOL}    "sub": {${EOL}      "version": "1.2.3"${EOL}    }${EOL}  }${EOL}}${EOL}`
  );
});

test('should write version at multiple paths', async () => {
  const options = {
    [namespace]: {
      out: {
        file: './multi.json',
        path: ['version', 'deep.version', 'deep.sub.version']
      }
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('1.2.3');
  assert.equal(
    readFile('./multi.json'),
    `{${EOL}  "version": "1.2.3",${EOL}  "deep": {${EOL}    "version": "1.2.3",${EOL}    "sub": {${EOL}      "version": "1.2.3"${EOL}    }${EOL}  }${EOL}}${EOL}`
  );
});

test('should write plain version text file', async () => {
  const options = {
    [namespace]: { out: [{ file: './VERSION-OUT', type: 'text/plain' }] }
  };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('3.2.1');
  assert.equal(readFile('./VERSION-OUT'), `3.2.1${EOL}`);
});

test('should write plain version text file (default text type)', async () => {
  const options = { [namespace]: { out: [{ file: './VERSION-OUT' }] } };
  const plugin = factory(Bumper, { namespace, options });
  await plugin.bump('3.2.1');
  assert.equal(readFile('./VERSION-OUT'), `3.2.1${EOL}`);
});

test('should write toml file', async () => {
  const options = {
    [namespace]: {
      out: {
        file: './foo.toml',
        type: 'application/toml',
        path: 'tool.test.version'
      }
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "1.0.1"${EOL}`);
});

test('should write toml file (.toml)', async () => {
  const options = {
    [namespace]: { out: { file: './foo.toml', path: 'tool.test.version' } }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.toml'), `[tool.test]${EOL}version = "1.0.1"${EOL}`);
});

test('should write ini file', async () => {
  const options = {
    [namespace]: { out: { file: './foo.ini', path: 'path.version' } }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.ini'), `path.version=1.0.1${EOL}path.name=fake${EOL}`);
});

test('should write plain text file', async () => {
  const options = {
    [namespace]: {
      in: './bower.json',
      out: { file: './foo.php', type: 'text/php' }
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.php'), `/* comments${EOL}version: v1.0.1 */ <? echo <p>hello world</p>; ?>${EOL}`);
});

test('should write YAML file', async () => {
  const options = { [namespace]: { out: { file: './foo.yaml' } } };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.yaml'), `version: 1.0.1${EOL}`);
});

test('should read/write plain text file', async () => {
  const options = {
    [namespace]: {
      in: { file: './foo.txt', type: 'text/plain' },
      out: { file: './foo.txt', type: 'text/plain' }
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.txt'), `1.0.1${EOL}`);
});

test('should read/write plain text file (.txt)', async () => {
  const options = {
    [namespace]: { in: { file: './foo.txt' }, out: { file: './foo.txt' } }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.txt'), `1.0.1${EOL}`);
});

test('should read one and write multiple files', async () => {
  const options = {
    [namespace]: { in: { file: './foo.txt' }, out: './foo*.txt' }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.txt'), `1.0.1${EOL}`);
  assert.equal(readFile('./foo2.txt'), `1.0.1${EOL}`);
});

test('should read one and write multiple files and respect prefix', async () => {
  const options = {
    [namespace]: {
      in: { file: 'VERSION', type: 'text/plain' },
      out: ['README.md', 'VERSION']
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./README.md'), `Release v1.0.1${EOL}`);
  assert.equal(readFile('./VERSION'), `v1.0.1${EOL}`);
});

test('should write various file types', async () => {
  const options = {
    [namespace]: {
      out: [{ file: './foo*.txt' }, { file: './(bower|manifest).json' }]
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.txt'), `1.0.1${EOL}`);
  assert.equal(readFile('./foo2.txt'), `1.0.1${EOL}`);
  assert.equal(readFile('./bower.json'), `{${EOL}  "version": "1.0.1"${EOL}}${EOL}`);
  assert.equal(readFile('./manifest.json'), `{${EOL}  "version": "1.0.1"${EOL}}${EOL}`);
});

test('should not write in dry run', async () => {
  const options = { [namespace]: { in: './dryrun.json' } };
  const plugin = factory(Bumper, {
    namespace,
    options,
    global: { isDryRun: true }
  });
  await plugin.bump('1.0.1');
  assert.equal(readFile('./dryrun.json'), `{"version":"1.0.0"}${EOL}`);
});

test.only('should give precedence to mime type over file extension', async () => {
  const options = {
    [namespace]: {
      out: {
        file: './invalid.toml',
        type: 'text/plain'
      }
    }
  };
  const plugin = factory(Bumper, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./invalid.toml'), `/# -*- some invalid toml -*-${EOL}version = "1.0.1"${EOL}`);
});
