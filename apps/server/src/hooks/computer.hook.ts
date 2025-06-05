import { ComputeProvider } from '@metallichq/providers';
import { captureException, ComputerService, getLogger, nowUnix } from '@metallichq/shared';
import { ComputerState } from '@metallichq/types';

const logger = getLogger('ComputerHook');

interface SyncStateRequest {
  projectId: string;
  computerId: string;
  providerComputerId: string;
  currentState: string;
  expectedState: string;
}

export const syncState = async (req: SyncStateRequest) => {
  try {
    const maxAttempts = 3;
    let attempts = 0;
    let machineInExpectedState = false;

    while (attempts < maxAttempts && !machineInExpectedState) {
      attempts++;
      try {
        await ComputeProvider.waitForState({
          project_id: req.projectId,
          provider_computer_id: req.providerComputerId,
          timeout_sec: 60,
          state: req.expectedState
        });

        machineInExpectedState = true;
      } catch (waitError) {
        if (attempts >= maxAttempts) {
          throw waitError;
        }

        logger.info(`Waiting for state attempt ${attempts}/${maxAttempts} timed out, retrying...`);
      }
    }

    const computer = await ComputerService.updateComputer(
      req.computerId,
      { state: req.expectedState as ComputerState },
      { allowUpdateDeleted: true }
    );

    await ComputerService.createComputerEvent({
      computer_id: computer.id,
      type: computer.state,
      timestamp: nowUnix(),
      metadata: null
    });

    logger.info(`Computer state sync'd to "${computer.state}"`);
  } catch (err) {
    captureException(err);
  }
};
