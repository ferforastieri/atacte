import { Router } from 'express';
import { BUILD_VERSION } from '../../infrastructure/config';
import { authenticateToken } from '../../middleware/auth';
import { getRedis } from '../../infrastructure/redis';

const router = Router();
const repository = 'ferforastieri/atacte';
export interface UpdateInfo { currentVersion: string; latestVersion: string | null; updateAvailable: boolean; releaseUrl: string | null; }
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
router.get('/version', (_req, res) => { res.json({ success: true, data: { version: BUILD_VERSION } }); });
router.get('/updates', authenticateToken, async (_req, res) => {
  try {
    const redis = await getRedis();
    const key = `atacte:update:${BUILD_VERSION}`;
    const cached = await redis.get(key);
    if (cached) { res.json({ success: true, data: JSON.parse(cached) }); return; }
    const info = await checkUpdate();
    await redis.set(key, JSON.stringify(info), { EX: 1800 });
    res.json({ success: true, data: info });
  } catch {
    res.status(503).json({ success: false, message: 'Não foi possível consultar novas versões agora' });
  }
});
export default router;
