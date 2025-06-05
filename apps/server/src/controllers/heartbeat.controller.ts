import { ComputerService, HttpError, nowUnix, verifyHeartbeatToken } from '@metallichq/shared';
import { NextFunction, Request, Response } from 'express';

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

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: 'heartbeat',
      timestamp: nowUnix(),
      metadata: null
    });

    res.status(200).json({ result: 'ok' });
  } catch (err) {
    next(err);
  }
};
