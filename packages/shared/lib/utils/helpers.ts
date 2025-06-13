import { User } from '@metallichq/types';
import * as jose from 'jose';
import { randomBytes } from 'node:crypto';
import { envVars } from './env-vars.js';
import { HttpError } from './error.js';

export function now(): string {
  return new Date().toISOString();
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function toUnix(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000);
}

export function unixToISOString(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateApiKey(byteLength = 32): string {
  return `sk_${randomBytes(byteLength).toString('hex')}`;
}

export function deleted(str: string): string {
  return `deleted_${str}_${now()}`;
}

export enum Resource {
  User = 'user',
  Organization = 'org',
  OrganizationMembership = 'om',
  Subscription = 'sub',
  PaymentMethod = 'pm',
  UsageRecord = 'ur',
  Project = 'proj',
  ApiKey = 'key',
  Computer = 'com',
  ComputerEvent = 'cv',
  Template = 'temp'
}

export function generateId(resource?: Resource, byteLength = 8): string {
  const prefix = resource ? `${resource}_` : '';
  return `${prefix}${randomBytes(byteLength).toString('hex')}`;
}

export function inferOrganizationName(user: User) {
  return user.first_name ? `${user.first_name}'s Team` : undefined;
}

export async function generateHeartbeatToken(computerId: string): Promise<string> {
  return await new jose.SignJWT({ computer_id: computerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(new TextEncoder().encode(envVars.ENCRYPTION_KEY));
}

export async function verifyHeartbeatToken(token: string): Promise<string> {
  try {
    const payload = await jose.jwtVerify<{
      computer_id: string;
    }>(token, new TextEncoder().encode(envVars.ENCRYPTION_KEY), { algorithms: ['HS256'] });
    return payload.payload['computer_id'];
  } catch (err) {
    throw HttpError.unauthorized('Invalid agent token');
  }
}
