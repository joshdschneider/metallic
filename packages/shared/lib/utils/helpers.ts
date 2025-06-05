import { User } from '@metallichq/types';
import { randomBytes } from 'node:crypto';

export function now(): string {
  return new Date().toISOString();
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
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
