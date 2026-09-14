import { EOL, tmpdir } from 'node:os';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after } from 'node:test';

export function useTempFiles(files) {
  const cwd = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), 'bumper-test-'));

  after(() => {
    process.chdir(cwd);
    rmSync(directory, { recursive: true, force: true });
  });

  process.chdir(directory);
  for (const [file, contents] of Object.entries(files)) {
    writeFileSync(file, contents);
  }
}

export function nl(value) {
  return value.split(/\r\n|\r|\n/g).join(EOL);
}

export function readFile(file) {
  return nl(readFileSync(file).toString());
}
