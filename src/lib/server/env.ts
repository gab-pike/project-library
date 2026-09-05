import { env } from '$env/dynamic/private';

// Single source of truth for the data directory fallback — previously duplicated
// (and at risk of drifting) across db.ts, assets.ts, export.ts, and scheduler.ts.
export const DATA_DIR = env.DATA_DIR ?? './data';
