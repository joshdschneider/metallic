import { Prisma, PrismaClient } from '@prisma/client';

export const database = new PrismaClient();

export { Prisma };
