import { ComputeProvider } from '@metallichq/providers';
import { captureException, ComputerService, getLogger } from '@metallichq/shared';
import { ComputerState } from '@metallichq/types';

const logger = getLogger('ComputerHook');

interface SyncStateRequest {
  projectId: string;
  computerId: string;
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
          id: req.computerId,
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

    logger.info(`Computer state sync'd to "${computer.state}"`);
  } catch (err) {
    captureException(err);
  }
};
