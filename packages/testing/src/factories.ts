import { faker } from '@faker-js/faker';
import { generateId, ID_PREFIXES } from '@wad/core';
import type { Role } from '@wad/core/authz';
import type { PrismaClient, MemberStatus } from '@wad/db';

faker.seed(20261011);

export async function createUser(
  db: PrismaClient,
  overrides: { email?: string; name?: string; locale?: string } = {},
) {
  return db.user.create({
    data: {
      id: generateId(ID_PREFIXES.USER),
      email: (overrides.email ?? faker.internet.email()).toLowerCase(),
      emailVerified: true,
      name: overrides.name ?? faker.person.fullName(),
      locale: overrides.locale ?? 'en',
    },
  });
}

export async function createWorkspace(
  db: PrismaClient,
  ownerId: string,
  overrides: { name?: string; slug?: string } = {},
) {
  const name = overrides.name ?? `${faker.location.city()} Dance School`;
  const workspace = await db.workspace.create({
    data: {
      id: generateId(ID_PREFIXES.WORKSPACE),
      name,
      slug:
        overrides.slug ??
        `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(4).toLowerCase()}`,
      createdById: ownerId,
    },
  });
  await createMember(db, {
    workspaceId: workspace.id,
    userId: ownerId,
    roles: ['OWNER'],
    status: 'ACTIVE',
    createdById: ownerId,
  });
  return workspace;
}

export async function createMember(
  db: PrismaClient,
  input: {
    workspaceId: string;
    createdById: string;
    userId?: string;
    name?: string;
    roles?: Role[];
    status?: MemberStatus;
  },
) {
  return db.member.create({
    data: {
      id: generateId(ID_PREFIXES.MEMBER),
      workspaceId: input.workspaceId,
      createdById: input.createdById,
      userId: input.userId ?? null,
      name: input.name ?? faker.person.fullName(),
      roles: input.roles ?? ['STUDENT'],
      status: input.status ?? 'ACTIVE',
    },
  });
}

export async function createWorkspaceWithOwner(db: PrismaClient) {
  const owner = await createUser(db);
  const workspace = await createWorkspace(db, owner.id);
  return { owner, workspace };
}
