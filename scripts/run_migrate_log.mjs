#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const out = fs.createWriteStream('tmp_migrate_log.txt');
const child = spawn(process.execPath, ['scripts/apply-fill-descriptions-verbose.mjs'], {
  env: { ...process.env, MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb' },
  stdio: ['ignore', 'pipe', 'pipe']
});
child.stdout.pipe(out);
child.stderr.pipe(out);
child.on('close', (code)=>{
  fs.appendFileSync('tmp_migrate_log.txt', '\nRETURN_CODE=' + code + '\n');
  console.log('done migrate, code=', code);
});
