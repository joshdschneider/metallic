import { envVars, generateHeartbeatToken } from '@metallichq/shared';

export interface CreateSystemEnvRequest {
  project_id: string;
  computer_id: string;
}

export async function createSystemEnv(req: CreateSystemEnvRequest): Promise<Record<string, string>> {
  const token = await generateHeartbeatToken(req.computer_id);
  return {
    METALLIC_PROJECT_ID: req.project_id,
    METALLIC_COMPUTER_ID: req.computer_id,
    METALLIC_HEARTBEAT_URL: `${envVars.SERVER_URL}/heartbeat`,
    METALLIC_HEARTBEAT_TOKEN: token
  };
}
