import { envVars, generateHeartbeatToken } from '@metallichq/shared';

export interface CreateSystemEnvRequest {
  project_id: string;
  computer_id: string;
  ttl_seconds: number | null;
}

export async function createSystemEnv(req: CreateSystemEnvRequest): Promise<Record<string, string>> {
  const token = await generateHeartbeatToken(req.computer_id);

  const vars: Record<string, string> = {
    METALLIC_PROJECT_ID: req.project_id,
    METALLIC_COMPUTER_ID: req.computer_id,
    METALLIC_HEARTBEAT_URL: `${envVars.SERVER_URL}/heartbeat`,
    METALLIC_HEARTBEAT_TOKEN: token
  };

  if (req.ttl_seconds) {
    vars['METALLIC_TTL_SECONDS'] = req.ttl_seconds.toString();
  }

  return vars;
}
