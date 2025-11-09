import { getEnv } from '../src/config/env.js';
import { buildEnvStatus } from '../src/config/envStatus.js';

const env = getEnv();
const status = buildEnvStatus(env);

const checklist = status.checklist
  .map((item) => {
    const mark = item.status === 'ok' ? '✔' : '✖';
    const hint = item.status === 'ok' ? '' : ` → ${item.hint ?? ''}`;
    return `${mark} ${item.label}${hint}`;
  })
  .join('\n');

console.log('Environment checklist');
console.log('---------------------');
console.log(checklist);


