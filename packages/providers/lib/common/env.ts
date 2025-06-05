import { envVars, generateAgentToken } from '@metallichq/shared';

export interface CreateSystemEnvRequest {
  project_id: string;
  computer_id: string;
}

export async function createSystemEnv(req: CreateSystemEnvRequest): Promise<Record<string, string>> {
  const token = await generateAgentToken(req.computer_id);
  return {
    METALLIC_PROJECT_ID: req.project_id,
    METALLIC_COMPUTER_ID: req.computer_id,
    METALLIC_SERVER_URL: envVars.SERVER_URL,
    METALLIC_AGENT_TOKEN: token
  };
}
