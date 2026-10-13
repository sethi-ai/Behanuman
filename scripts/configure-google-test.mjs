import { readFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const project = JSON.parse(readFileSync('.vercel/project.json', 'utf8'));
if (project.projectId !== 'prj_U5L4AQoZlXRzMkepz7pzivaYN4UD') throw new Error('Unexpected test project');
if (!readFileSync('.env.local', 'utf8').includes('project: be-hanuman-test')) throw new Error('Unexpected backend');
const path = 'C:/Users/aksha/AppData/Local/Temp/be-hanuman-google-replacement.json';
const { clientId, clientSecret } = JSON.parse(readFileSync(path, 'utf8'));
if (clientId !== '335058432997-8l314k6gca76h0tkept38au0ioflg5eh.apps.googleusercontent.com' || !clientSecret?.endsWith('n3gE')) throw new Error('Unexpected credential');
for (const [name, value] of Object.entries({ AUTH_GOOGLE_ID: clientId, AUTH_GOOGLE_SECRET: clientSecret })) {
  const result = spawnSync(process.execPath, ['node_modules/convex/bin/main.js', 'env', 'set', '--prod', name], { input: value, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`Could not configure ${name}; value hidden`);
  console.log(`Configured ${name} on test backend (value hidden)`);
}
unlinkSync(path);
