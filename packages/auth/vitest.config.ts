import { nodeProject } from '@wad/config/vitest';

export default nodeProject({
  globalSetup: ['@wad/testing/global-setup'],
  hookTimeout: 120_000,
  testTimeout: 30_000,
});
