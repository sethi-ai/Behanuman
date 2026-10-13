import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
if (project.projectId !== 'prj_U5L4AQoZlXRzMkepz7pzivaYN4UD') throw Error('Release stopped: this is not the authorized Vercel test project.');
const env = readFileSync('.env.local', 'utf8');
if (!env.includes('project: be-hanuman-test')) throw Error('Release stopped: confirm the separate Convex test project in .env.local.');
for (const command of ['npm run test', 'npm run lint', 'npx tsc --noEmit', 'npx convex deploy --yes', 'npx --yes vercel@63.1.2 deploy --prod --yes --scope sethimailbox1-9537s-projects']) {
  execSync(command, { stdio: 'inherit', windowsHide: true });
}
