import * as ControlPlane from '@metallichq/control-plane';
import {
  captureException,
  ComputerService,
  HttpError,
  nowUnix,
  ProjectService,
  verifyHeartbeatToken
} from '@metallichq/shared';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const HeartbeatRequestSchema = z.object({
  method: z.literal('POST'),
  body: z.object({
    event: z.enum(['heartbeat', 'shutdown', 'ttl_expired'])
  })
});

export const heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw HttpError.unauthorized('Authorization header missing');
    }

    const heartbeatToken = authHeader.split('Bearer ').pop();
    if (!heartbeatToken) {
      throw HttpError.unauthorized('Malformed authorization header');
    }

    const computerId = await verifyHeartbeatToken(heartbeatToken);
    const computer = await ComputerService.getComputerById(computerId);
    if (!computer) {
      throw HttpError.notFound('Computer not found');
    }

    const parsedReq = HeartbeatRequestSchema.safeParse({ method: req.method, body: req.body });
    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { event } = parsedReq.data.body;
    if (['sigint', 'sigterm', 'sigquit'].includes(event)) {
      captureException(new Error(`Computer ${computer.id} received ${event} event`));
    }

    if (event === 'heartbeat') {
      await ComputerService.createComputerEvent({
        computer_id: computer.id,
        type: 'heartbeat',
        timestamp: nowUnix(),
        metadata: null
      });
    } else if (['ttl_expired', 'sigint', 'sigterm', 'sigquit'].includes(event)) {
      const project = await ProjectService.getProjectById(computer.project_id);
      if (!project) {
        throw HttpError.notFound('Project not found');
      }

      await ControlPlane.stopComputer({
        organizationId: project.organization_id,
        projectId: computer.project_id,
        computerId: computer.id,
        providerComputerId: computer.provider_computer_id
      });
    } else {
      throw new Error(`Invalid heartbeat event: ${event}`);
    }

    res.status(200).json({ result: 'ok' });
  } catch (err) {
    next(err);
  }
};
