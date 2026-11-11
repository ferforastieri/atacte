import { Router } from 'express';
import { AUTO_UPDATE, BUILD_VERSION } from '../../infrastructure/config';
import { authenticateToken } from '../../middleware/auth';
import { getRedis } from '../../infrastructure/redis';
import {
  requestUpdate,
  updateBusy,
  updateCapabilities,
  updateSupported,
  type UpdateRunState,
} from '../../services/updates/updateService';

const router = Router();
const repository = 'ferforastieri/atacte';
export interface UpdateInfo { currentVersion: string; latestVersion: string | null; updateAvailable: boolean; releaseUrl: string | null; }
export interface UpdateResponse extends UpdateInfo {
  supported: boolean;
  autoUpdate: boolean;
  busy: boolean;
  state: UpdateRunState | null;
}

async function github(path: string): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000), redirect: 'error',
  });
  if (!response.ok) throw new Error('Release check unavailable');
  return await response.json() as Record<string, unknown>;
}

export async function checkUpdate(current = BUILD_VERSION, request = github): Promise<UpdateInfo> {
  const result: UpdateInfo = { currentVersion: current, latestVersion: null, updateAvailable: false, releaseUrl: null };
  if (!/^(?:[a-f0-9]{40}|v\d+\.\d+\.\d+)$/.test(current)) return result;
  const release = await request('releases/latest');
  const tag = release['tag_name'];
  if (release['draft'] || release['prerelease'] || typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) return result;
  result.latestVersion = tag;
  result.releaseUrl = `https://github.com/${repository}/releases/tag/${encodeURIComponent(tag)}`;
  if (tag === current) return result;
  const comparison = await request(`compare/${encodeURIComponent(current)}...${encodeURIComponent(tag)}`);
  result.updateAvailable = comparison['status'] === 'ahead' && typeof comparison['ahead_by'] === 'number' && comparison['ahead_by'] > 0;
  return result;
}

async function cachedUpdateInfo(): Promise<UpdateInfo> {
  const redis = await getRedis();
  const key = `atacte:update:${BUILD_VERSION}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as UpdateInfo;
  const info = await checkUpdate();
  await redis.set(key, JSON.stringify(info), { EX: 1800 });
  return info;
}

router.get('/version', (_req, res) => { res.json({ success: true, data: { version: BUILD_VERSION } }); });

router.get('/updates', authenticateToken, async (_req, res) => {
  try {
    const info = await cachedUpdateInfo();
    const data: UpdateResponse = { ...info, ...updateCapabilities() };
    res.json({ success: true, data });
  } catch {
    res.status(503).json({ success: false, message: 'Não foi possível consultar novas versões agora' });
  }
});

/**
 * The web update toast calls this as soon as a release is detected. The
 * request only reaches the host-side updater; the API container never has
 * access to Docker or the Compose files.
 */
router.post('/updates/apply', authenticateToken, async (_req, res) => {
  try {
    if (!updateSupported()) {
      res.status(503).json({ success: false, message: 'A atualização automática não está instalada neste servidor' });
      return;
    }
    if (!AUTO_UPDATE) {
      res.status(503).json({ success: false, message: 'A atualização automática está desativada neste servidor' });
      return;
    }
    if (updateBusy()) {
      res.status(409).json({ success: false, message: 'Uma atualização já está em andamento' });
      return;
    }

    const info = await cachedUpdateInfo();
    if (!info.latestVersion || !info.updateAvailable) {
      res.json({ success: true, data: { status: 'current', version: info.currentVersion } });
      return;
    }

    const result = requestUpdate(info.latestVersion);
    if (result === 'busy') {
      res.status(409).json({ success: false, message: 'Uma atualização já está em andamento' });
      return;
    }

    res.status(202).json({
      success: true,
      message: 'Atualização iniciada',
      data: { status: 'started', version: info.latestVersion },
    });
  } catch {
    res.status(503).json({ success: false, message: 'Não foi possível iniciar a atualização agora' });
  }
});

export default router;
