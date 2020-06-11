const fs = require('fs');
const { EOL } = require('os');
const assert = require('assert').strict;
const test = require('bron');
const mock = require('mock-fs');
const { factory, runTasks } = require('release-it/test/util');
const Plugin = require('.');

mock({
  './bower.json': JSON.stringify({ version: '1.0.0' }),
  './foo.txt': '2.0.0\n',
  './foo.php': '/* comments\nversion: v1.0.0 */ <? echo <p>hello world</p>; ?>\n',
  './manifest.json': '{}',
  './dryrun.json': JSON.stringify({ version: '1.0.0' }),
  './foo.toml': `[tool.test]
version = "1.0.0"`,
  './foo.ini': `path.version=1.0.0\npath.name=fake`,
});

const namespace = 'bumper';

const readFile = file => fs.readFileSync(file).toString().trim();

test('should not throw', async () => {
  const options = { [namespace]: {} };
  const plugin = factory(Plugin, { namespace, options });
  await assert.doesNotReject(runTasks(plugin));
});

test('should return latest version from JSON file', async () => {
  const options = { [namespace]: { in: './bower.json' } };
  const plugin = factory(Plugin, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '1.0.0');
});

test('should return latest version from plain text file', async () => {
  const options = { [namespace]: { in: { file: './foo.txt', type: 'text/plain' } } };
  const plugin = factory(Plugin, { namespace, options });
  const version = await plugin.getLatestVersion();
  assert.equal(version, '2.0.0');
});

test('should write indented JSON file', async () => {
  const options = { [namespace]: { out: './manifest.json' } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('1.2.3');
  assert.equal(readFile('./manifest.json'), `{${EOL}  "version": "1.2.3"${EOL}}`);
});

test('should write new, indented JSON file', async () => {
  const options = { [namespace]: { out: ['./null.json'] } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('0.0.0');
  assert.equal(readFile('./null.json'), `{${EOL}  "version": "0.0.0"${EOL}}`);
});

test('should write version at path', async () => {
  const options = { [namespace]: { out: { file: './deep.json', path: 'deep.sub.version' } } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('1.2.3');
  assert.equal(readFile('./deep.json'), JSON.stringify({ deep: { sub: { version: '1.2.3' } } }, null, '  '));
});

test('should write plain version text file', async () => {
  const options = { [namespace]: { out: [{ file: './VERSION', type: 'text/plain' }] } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('3.2.1');
  assert.equal(readFile('./VERSION'), '3.2.1');
});

test('should write toml file', async () => {
  const options = { [namespace]: { out: { file: './foo.toml', type: 'toml', path: 'tool.test.version' } } };
  const plugin = factory(Plugin, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.toml'), '[tool.test]\nversion = "1.0.1"');
});

test('should write ini file', async () => {
  const options = { [namespace]: { out: { file: './foo.ini', type: 'ini', path: 'path.version' } } };
  const plugin = factory(Plugin, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.ini'), 'path.version=1.0.1\npath.name=fake');
});

test('should write plain text file', async () => {
  const options = { [namespace]: { in: './bower.json', out: { file: './foo.php', type: 'text/php' } } };
  const plugin = factory(Plugin, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.php'), '/* comments\nversion: v1.0.1 */ <? echo <p>hello world</p>; ?>');
});

test('should read/write plain text file', async () => {
  const options = {
    [namespace]: { in: { file: './foo.txt', type: 'text/plain' }, out: { file: './foo.txt', type: 'text/plain' } }
  };
  const plugin = factory(Plugin, { namespace, options });
  await runTasks(plugin);
  assert.equal(readFile('./foo.txt'), '2.0.1');
});

test('should not write in dry run', async () => {
  const options = { [namespace]: { in: './dryrun.json' } };
  const plugin = factory(Plugin, { namespace, options, global: { isDryRun: true } });
  await plugin.bump('1.0.1');
  assert.equal(readFile('./dryrun.json'), `{"version":"1.0.0"}`);
});
