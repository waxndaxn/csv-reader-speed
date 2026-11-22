import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { setFlagsFromString } from 'node:v8';

setFlagsFromString('--no-incremental-marking');
const moduleUrl = new URL('./solve.js', import.meta.url);
const { run } = await import(moduleUrl.href);
const inputDir = process.env.MAKEFUN_INPUT_DIR || '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const cases = JSON.parse(readFileSync(join(inputDir, 'cases.json'), 'utf8'));
const answers = [];
for (const item of cases) answers.push(run(item.input));
await mkdir(outputDir, { recursive: true });
writeFileSync(join(outputDir, 'answers.json'), JSON.stringify(answers));
