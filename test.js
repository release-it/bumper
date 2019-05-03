const fs = require('fs');
const { EOL } = require('os');
const test = require('ava');
const mock = require('mock-fs');
const { factory, runTasks } = require('release-it/test/util');
const Plugin = require('.');

mock({
  './bower.json': JSON.stringify({ version: '1.0.0' }),
  './foo.txt': '2.0.0\n',
  './manifest.json': '{}'
});

const namespace = 'bumper';

test('should not throw', async t => {
  const options = { [namespace]: {} };
  const plugin = factory(Plugin, { namespace, options });
  await t.notThrowsAsync(runTasks(plugin));
});

test('should return latest version from JSON file', async t => {
  const options = { [namespace]: { in: './bower.json' } };
  const plugin = factory(Plugin, { namespace, options });
  const version = await plugin.getLatestVersion();
  t.is(version, '1.0.0');
});

test('should return latest version from plain text file', async t => {
  const options = { [namespace]: { in: { file: './foo.txt', type: 'text/plain' } } };
  const plugin = factory(Plugin, { namespace, options });
  const version = await plugin.getLatestVersion();
  t.is(version, '2.0.0');
});

test('should write indented JSON file', async t => {
  const options = { [namespace]: { out: './manifest.json' } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('1.2.3');
  t.is(fs.readFileSync('./manifest.json').toString(), `{${EOL}  "version": "1.2.3"${EOL}}${EOL}`);
});

test('should write new, indented JSON file', async t => {
  const options = { [namespace]: { out: ['./null.json'] } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('0.0.0');
  t.is(fs.readFileSync('./null.json').toString(), `{${EOL}  "version": "0.0.0"${EOL}}${EOL}`);
});

test('should write plain text file', async t => {
  const options = { [namespace]: { out: [{ file: './VERSION', type: 'text/plain' }] } };
  const plugin = factory(Plugin, { namespace, options });
  await plugin.bump('3.2.1');
  t.is(fs.readFileSync('./VERSION').toString(), '3.2.1');
});
