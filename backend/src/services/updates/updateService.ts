import {
  accessSync,
  constants,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { AUTO_UPDATE, UPDATE_DIR } from '../../infrastructure/config';

export type UpdateRunStatus = 'running' | 'success' | 'error';

export interface UpdateRunState {
  status: UpdateRunStatus;
  version: string | null;
  updatedAt: string | null;
}

export interface UpdateCapabilities {
  supported: boolean;
  autoUpdate: boolean;
  busy: boolean;
  state: UpdateRunState | null;
}

const REQUEST_FILE = 'update.request';
const STATE_FILE = 'update-state.json';
const READY_FILE = 'updater.enabled';
const RUNNING_STATE_TTL_MS = 60 * 60 * 1000;

function stateIsRunning(state: UpdateRunState | null): boolean {
  if (state?.status !== 'running') return false;
  if (!state.updatedAt) return true;
  const startedAt = Date.parse(state.updatedAt);
  return Number.isFinite(startedAt) && Date.now() - startedAt < RUNNING_STATE_TTL_MS;
}

export function updateSupported(): boolean {
  try {
    if (!existsSync(join(UPDATE_DIR, READY_FILE))) return false;
    accessSync(UPDATE_DIR, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function readUpdateState(): UpdateRunState | null {
  try {
    const raw = readFileSync(join(UPDATE_DIR, STATE_FILE), 'utf8');
    const parsed = JSON.parse(raw) as Partial<UpdateRunState>;
    if (parsed.status !== 'running' && parsed.status !== 'success' && parsed.status !== 'error') {
      return null;
    }
    return {
      status: parsed.status,
      version: typeof parsed.version === 'string' && parsed.version ? parsed.version : null,
      updatedAt: typeof parsed.updatedAt === 'string' && parsed.updatedAt ? parsed.updatedAt : null,
    };
  } catch {
    return null;
  }
}

export function updateBusy(): boolean {
  if (existsSync(join(UPDATE_DIR, REQUEST_FILE))) return true;
  return stateIsRunning(readUpdateState());
}

export function updateCapabilities(): UpdateCapabilities {
  const state = readUpdateState();
  return {
    supported: updateSupported(),
    autoUpdate: AUTO_UPDATE,
    busy: Boolean(existsSync(join(UPDATE_DIR, REQUEST_FILE)) || stateIsRunning(state)),
    state,
  };
}

/**
 * Creates the request file the host-side updater watches. `link` makes the
 * request visible with its full content in one step and fails if another
 * client already started an update.
 */
export function requestUpdate(version: string): 'started' | 'busy' {
  mkdirSync(UPDATE_DIR, { recursive: true });

  const temporary = join(UPDATE_DIR, `.update-request.${process.pid}.${Date.now()}`);
  writeFileSync(temporary, `${version}\n`, { mode: 0o644 });

  try {
    linkSync(temporary, join(UPDATE_DIR, REQUEST_FILE));
    return 'started';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      return 'busy';
    }
    throw error;
  } finally {
    try {
      unlinkSync(temporary);
    } catch {
      // The request file is what matters; a leftover temporary is harmless.
    }
  }
}
