import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EOL } from 'os';

import mock from 'mock-fs';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Bumper from '../index.js';
import { NAMESPACE, CURRENT_VERSION, NEW_VERSION } from './globals/constants.js';
import { readFile } from './globals/file-utils.js';

mock({
  './foo.xml': `<project>${EOL}\t<modelVersion>4.0.0</modelVersion>${EOL}\t<groupId>com.mycompany.app</groupId>${EOL}\t<artifactId>my-app</artifactId>${EOL}\t<version>${CURRENT_VERSION}</version>${EOL}\t<dependencies>${EOL}\t\t<dependency>${EOL}\t\t\t<groupId>group-a</groupId>${EOL}\t\t\t<artifactId>artifact-a</artifactId>${EOL}\t\t\t<version>${CURRENT_VERSION}</version>${EOL}\t\t</dependency>${EOL}\t</dependencies>${EOL}</project>${EOL}`
});

describe('xml file', { concurrency: true }, () => {
  it('should return latest version', async () => {
    const options = { [NAMESPACE]: { in: { file: './foo.xml', path: 'project > version' } } };
    const plugin = factory(Bumper, { NAMESPACE, options });
    const version = await plugin.getLatestVersion();
    assert.equal(version, CURRENT_VERSION);
  });

  it('should write', async () => {
    const options = {
      [NAMESPACE]: {
        out: {
          file: './foo.xml',
          type: 'text/xml',
          path: 'project > version'
        }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xml'), `<project>${EOL}\t<modelVersion>4.0.0</modelVersion>${EOL}\t<groupId>com.mycompany.app</groupId>${EOL}\t<artifactId>my-app</artifactId>${EOL}\t<version>${NEW_VERSION}</version>${EOL}\t<dependencies>${EOL}\t\t<dependency>${EOL}\t\t\t<groupId>group-a</groupId>${EOL}\t\t\t<artifactId>artifact-a</artifactId>${EOL}\t\t\t<version>${CURRENT_VERSION}</version>${EOL}\t\t</dependency>${EOL}\t</dependencies>${EOL}</project>${EOL}`);
  });

  it('should write without defining the type', async () => {
    const options = {
      [NAMESPACE]: { out: { file: './foo.xml', path: 'project > version' } }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xml'), `<project>${EOL}\t<modelVersion>4.0.0</modelVersion>${EOL}\t<groupId>com.mycompany.app</groupId>${EOL}\t<artifactId>my-app</artifactId>${EOL}\t<version>${NEW_VERSION}</version>${EOL}\t<dependencies>${EOL}\t\t<dependency>${EOL}\t\t\t<groupId>group-a</groupId>${EOL}\t\t\t<artifactId>artifact-a</artifactId>${EOL}\t\t\t<version>${CURRENT_VERSION}</version>${EOL}\t\t</dependency>${EOL}\t</dependencies>${EOL}</project>${EOL}`);
  });

  it('should read/write', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.xml', type: 'application/xml', path: 'project > version' },
        out: { file: './foo.xml', type: 'application/xml', path: 'project > version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xml'), `<project>${EOL}\t<modelVersion>4.0.0</modelVersion>${EOL}\t<groupId>com.mycompany.app</groupId>${EOL}\t<artifactId>my-app</artifactId>${EOL}\t<version>${NEW_VERSION}</version>${EOL}\t<dependencies>${EOL}\t\t<dependency>${EOL}\t\t\t<groupId>group-a</groupId>${EOL}\t\t\t<artifactId>artifact-a</artifactId>${EOL}\t\t\t<version>${CURRENT_VERSION}</version>${EOL}\t\t</dependency>${EOL}\t</dependencies>${EOL}</project>${EOL}`);
  });

  it('should read/write without defining the type', async () => {
    const options = {
      [NAMESPACE]: {
        in: { file: './foo.xml', path: 'project > version' },
        out: { file: './foo.xml', path: 'project > version' }
      }
    };
    const plugin = factory(Bumper, { NAMESPACE, options });
    await runTasks(plugin);
    assert.equal(readFile('./foo.xml'), `<project>${EOL}\t<modelVersion>4.0.0</modelVersion>${EOL}\t<groupId>com.mycompany.app</groupId>${EOL}\t<artifactId>my-app</artifactId>${EOL}\t<version>${NEW_VERSION}</version>${EOL}\t<dependencies>${EOL}\t\t<dependency>${EOL}\t\t\t<groupId>group-a</groupId>${EOL}\t\t\t<artifactId>artifact-a</artifactId>${EOL}\t\t\t<version>${CURRENT_VERSION}</version>${EOL}\t\t</dependency>${EOL}\t</dependencies>${EOL}</project>${EOL}`);
  });
});
