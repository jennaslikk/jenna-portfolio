import { existsSync } from 'node:fs';

// Existing shell values take priority; both supported local files stay git-ignored.
for (const file of ['.env.local', '.env']) {
 if (existsSync(file)) process.loadEnvFile(file);
}
