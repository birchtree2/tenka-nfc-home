import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// This guard must fail on the old build: the policy must precede any resource requests.
for (const file of ['index.html', 'dist/index.html']) {
  const html = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  const policy = /<meta\s+http-equiv="Content-Security-Policy"\s+content="upgrade-insecure-requests"\s*\/?>/i.exec(html);
  assert.ok(policy, `${file}: missing HTTPS upgrade policy for NetEase mobile redirects`);
  assert.ok(policy.index < html.search(/<(link|script|iframe)\b/i), `${file}: policy must precede external resources`);
  console.log(`PASS ${file}: HTTPS upgrade policy precedes external resources`);
}
