import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'app/assets/IconConversa.png');
const targets = [
  join(root, 'public/IconConversa.png'),
  join(root, 'app/icon.png'),
];

mkdirSync(join(root, 'public'), { recursive: true });

for (const target of targets) {
  copyFileSync(source, target);
}

console.log('Synced IconConversa to public/ and app/icon.png');
