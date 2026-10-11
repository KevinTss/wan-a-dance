import { generateId, ID_PREFIXES } from '@wad/core';
import { createDb } from '../src/client.ts';

const db = createDb();
const email = 'owner@wan-a.dance';

const owner = await db.user.upsert({
  where: { email },
  update: {},
  create: {
    id: generateId(ID_PREFIXES.USER),
    email,
    emailVerified: true,
    name: 'Demo Owner',
    locale: 'en',
  },
});

console.warn(
  `Seeded ${owner.email}. Sign in with that email; the code lands in apps/web/.mailbox.`,
);
await db.$disconnect();
