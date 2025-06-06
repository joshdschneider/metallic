import { ComputeProvider } from '@metallichq/providers';
import {
  captureException,
  ComputerService,
  HttpError,
  nowUnix,
  unixToISOString,
  verifyHeartbeatToken
} from '@metallichq/shared';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import * as ComputerHook from '../hooks/computer.hook.js';

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

    const parsedReq = HeartbeatRequestSchema.safeParse({
      method: req.method,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { event } = parsedReq.data.body;
    if (event === 'heartbeat') {
      await ComputerService.createComputerEvent({
        computer_id: computer.id,
        type: 'heartbeat',
        timestamp: nowUnix(),
        metadata: null
      });
    } else if (['ttl_expired', 'sigint', 'sigterm', 'sigquit'].includes(event)) {
      const t0 = nowUnix();
      await ComputeProvider.stopComputer({
        project_id: computer.project_id,
        provider_computer_id: computer.provider_id
      });

      await ComputerService.updateComputer(computer.id, {
        state: 'stopping',
        updated_at: unixToISOString(t0)
      });

      await ComputerService.createComputerEvent({
        computer_id: computer.id,
        type: 'stopping',
        timestamp: t0,
        metadata: null
      });

      ComputerHook.syncState({
        projectId: computer.project_id,
        computerId: computer.id,
        providerComputerId: computer.provider_id,
        currentState: 'stopping',
        expectedState: 'stopped'
      });

      if (['sigint', 'sigterm', 'sigquit'].includes(event)) {
        captureException(new Error(`Computer ${computer.id} received ${event} event`));
      }
    } else {
      throw new Error(`Invalid heartbeat event: ${event}`);
    }

    res.status(200).json({ result: 'ok' });
  } catch (err) {
    next(err);
  }
};
