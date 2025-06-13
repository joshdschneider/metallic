import * as ControlPlane from '@metallichq/control-plane';
import { database } from '@metallichq/database';
import { BillingService, captureException, FREE_PLAN_MAX_COMPUTE_HOURS } from '@metallichq/shared';
import {
  ComputerEventSchema,
  ComputerSchema,
  SubscriptionSchema,
  TemplateSchema,
  UsageRecordSchema
} from '@metallichq/types';
import { z } from 'zod';

const ComputersExtendedSchema = ComputerSchema.extend({
  events: z.array(ComputerEventSchema),
  usage_records: z.array(UsageRecordSchema),
  template: TemplateSchema
});

const BATCH_SIZE = Number(process.env['BILLING_BATCH_SIZE'] ?? 10) || 10;

async function runInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

async function main() {
  const organizations = await database.organization.findMany({
    where: { deleted_at: null },
    include: { projects: true, subscriptions: true }
  });

  for (const organization of organizations) {
    const subscriptions = z.array(SubscriptionSchema).parse(organization.subscriptions);
    const plan = BillingService.getPlanFromSubscriptions(subscriptions);

    for (const project of organization.projects) {
      const computersRaw = await database.computer.findMany({
        where: { project_id: project.id },
        include: { events: true, usage_records: true, template: true }
      });

      const computers = z.array(ComputersExtendedSchema).parse(computersRaw);
      await runInBatches(computers, BATCH_SIZE, (computer) =>
        BillingService.calculateAndReportUsage(organization, computer)
      );
    }

    if (plan === 'free') {
      const computeHoursThisMonth = await BillingService.countComputeHoursThisMonth(organization.id);
      if (computeHoursThisMonth > FREE_PLAN_MAX_COMPUTE_HOURS) {
        const runningComputers = await database.computer.findMany({
          where: {
            project_id: { in: organization.projects.map((p) => p.id) },
            state: { in: ['starting', 'started'] }
          }
        });

        for (const computer of runningComputers) {
          await ControlPlane.stopComputer({
            organizationId: organization.id,
            projectId: computer.project_id,
            computerId: computer.id,
            providerComputerId: computer.provider_computer_id
          });
        }
      }
    }
  }
}

main().catch((err) => captureException(err));
