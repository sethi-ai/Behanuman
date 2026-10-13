import { generateKeyPairSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const target = process.argv.includes('--prod') ? ['--prod'] : [];
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const values = {
  JWT_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim().replace(/\n/g, ' '),
  JWKS: JSON.stringify({ keys: [{ ...publicKey.export({ format: 'jwk' }), use: 'sig' }] }),
};
for (const [name, value] of Object.entries(values)) {
  const result = spawnSync(process.execPath, ['node_modules/convex/bin/main.js', 'env', 'set', ...target, name], {
    input: value, encoding: 'utf8', windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Could not configure ${name}; exit ${result.status}`);
  console.log(`Configured ${name} on ${target.length ? 'production' : 'development'} (value hidden)`);
}
