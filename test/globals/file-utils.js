import { EOL } from 'os';
import { readFileSync } from 'fs';

export function nl(value) {
  return value.split(/\r\n|\r|\n/g).join(EOL);
}

export function readFile(file) {
  return nl(readFileSync(file).toString());
}
