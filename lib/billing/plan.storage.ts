import {
  PLAN_STORAGE_KEY,
  ROOM_PASS_STORAGE_KEY,
} from '@/lib/billing/constants';
import type { StoredRoomPass, StoredUserPlan } from '@/lib/billing/types';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredUserPlan(): StoredUserPlan | null {
  return readJson<StoredUserPlan | null>(PLAN_STORAGE_KEY, null);
}

export function writeStoredUserPlan(plan: StoredUserPlan | null) {
  if (!plan) {
    if (typeof window !== 'undefined') localStorage.removeItem(PLAN_STORAGE_KEY);
    return;
  }
  writeJson(PLAN_STORAGE_KEY, plan);
}

export function readRoomPasses(): StoredRoomPass[] {
  return readJson<StoredRoomPass[]>(ROOM_PASS_STORAGE_KEY, []);
}

export function writeRoomPasses(passes: StoredRoomPass[]) {
  writeJson(ROOM_PASS_STORAGE_KEY, passes);
}

export function getActiveRoomPass(
  conversationId: string,
  now = Date.now()
): StoredRoomPass | null {
  const pass = readRoomPasses().find((p) => p.conversationId === conversationId);
  if (!pass) return null;
  if (Date.parse(pass.expiresAt) <= now) return null;
  return pass;
}

export function upsertRoomPass(conversationId: string, durationMinutes: number) {
  const now = Date.now();
  const expiresAt = new Date(now + durationMinutes * 60_000).toISOString();
  const next: StoredRoomPass = {
    conversationId,
    purchasedAt: new Date(now).toISOString(),
    expiresAt,
  };
  const passes = readRoomPasses().filter((p) => p.conversationId !== conversationId);
  passes.push(next);
  writeRoomPasses(passes);
  return next;
}
