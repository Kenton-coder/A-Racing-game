// [版本] v0.3 | [日期] 2026-04-22 | [功能] 排行榜成績提交與查詢；對接 Google Apps Script GET API

import { LEADERBOARD } from '@/data/GameConstants';

/** 提交至排行榜的成績結構 */
export interface ScoreEntry {
  playerName:  string;
  totalMs:     number;
  bestLapMs:   number;
  totalLaps:   number;
  position:    number;
  vehicleType: string;
  mode:        string;
  date:        string;
}

/** GAS fetchScores 回傳的單筆記錄結構 */
export interface GasEntry {
  rank:                 number;
  playerName:           string;
  bestLapTimeSeconds:   number;
  bestLapTimeFormatted: string;
  finishTimeSeconds:    number;
  finishTimeFormatted:  string;
  totalLaps:            number;
  racingMode:           string;
  date:                 string;
}

/** Google Apps Script Web App 完整 URL */
const API_URL = 'https://script.google.com/macros/s/AKfycbx0z28Tx1Qar_Rs9cV_Tn7_Nsd2nBVvbcKPjOsScNeu7_YMHPvVfbVWWhg_R-XtrbpsCw/exec';

/** vehicleType enum 值 → GAS 工作表名稱 */
const VEHICLE_TO_SHEET: Record<string, string> = {
  f3:    'F3',
  gt3:   'GT3',
  sedan: 'Touring',
  bike:  'Motorcycle',
};

interface GasSubmitResponse {
  success: boolean;
  message?: string;
}

interface GasFetchResponse {
  success: boolean;
  entries?: GasEntry[];
  message?: string;
}

export class LeaderboardManager {
  /**
   * 提交成績至 GAS 後端（GET + query params）。
   * 成功後同步更新 localStorage 快取。
   * @throws HTTP 非 2xx 或 GAS 回傳 success=false 時拋出 Error
   */
  static async submitScore(entry: ScoreEntry): Promise<void> {
    const gasMode = VEHICLE_TO_SHEET[entry.vehicleType.toLowerCase()] || 'F3';

    const params = new URLSearchParams({
      action:     'submit',
      mode:       gasMode,
      name:       entry.playerName,
      bestLapSec: (entry.bestLapMs / 1000).toFixed(3),
      finishSec:  (entry.totalMs   / 1000).toFixed(3),
      laps:       String(entry.totalLaps),
      date:       entry.date,
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as GasSubmitResponse;
    if (!json.success) throw new Error(json.message ?? 'Submit failed');

    try {
      const cached = JSON.parse(
        localStorage.getItem(LEADERBOARD.CACHE_KEY) ?? '[]'
      ) as ScoreEntry[];
      cached.unshift(entry);
      localStorage.setItem(
        LEADERBOARD.CACHE_KEY,
        JSON.stringify(cached.slice(0, LEADERBOARD.MAX_ENTRIES))
      );
    } catch { /* 快取失敗不阻斷主流程 */ }
  }

  /**
   * 從 GAS 後端查詢指定賽車模式的排行榜（GET + query params）。
   * @param mode GAS 工作表名稱：'F3' | 'GT3' | 'Touring' | 'Motorcycle'
   * @returns 排行榜記錄陣列，失敗時拋出 Error
   */
  static async fetchScores(mode: string): Promise<GasEntry[]> {
    const params = new URLSearchParams({ action: 'fetch', mode });
    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json() as GasFetchResponse;
    if (!json.success) throw new Error(json.message ?? 'Fetch failed');
    return json.entries ?? [];
  }
}
