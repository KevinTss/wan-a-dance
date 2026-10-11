import { randomUUID } from 'node:crypto';

export const ID_PREFIXES = {
  USER: 'user',
  ACCOUNT: 'acc',
  SESSION: 'ses',
  VERIFICATION: 'ver',
  API_KEY: 'key',
  WORKSPACE: 'workspace',
  WORKSPACE_CONFIG: 'wc',
  MEMBER: 'member',
  MEMBER_STATUS_HISTORY: 'msh',
  MEMBER_DANCE_LEVEL: 'mdl',
  EVENT: 'event',
  ATTENDEE: 'attendee',
  INVITATION: 'inv',
  NOTIFICATION: 'notif',
  NOTIFICATION_PREFERENCES: 'np',
  MATERIAL: 'material',
  MATERIAL_STUDENT_SHARE: 'mss',
  PRODUCT: 'prod',
  PRICE: 'price',
  PURCHASE: 'pur',
  ENTITLEMENT_GRANT: 'grant',
  ENTITLEMENT_TRANSACTION: 'etx',
  CANCELLATION_OVERRIDE: 'cov',
  CONVERSATION: 'conv',
  MESSAGE: 'msg',
  WHATSAPP_USAGE: 'wau',
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateId(prefix: IdPrefix): string {
  return `${prefix}_${randomUUID()}`;
}

export function isValidId(id: string, prefix: IdPrefix): boolean {
  const separator = id.indexOf('_');
  if (separator === -1) return false;
  return id.slice(0, separator) === prefix && UUID_V4.test(id.slice(separator + 1));
}
