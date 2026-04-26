// [版本] v0.3 | [日期] 2026-04-22 | [功能] 新增 aiVehicleClass 欄位（Issue 2）

import { RacingMode, VehicleType, AIDifficulty } from '@/data/GameConstants';

export interface RaceSetup {
  mode: RacingMode;
  vehicleType: VehicleType;
  vehicleId: string;            // 動態生成，例如 'f3_red'
  aiVehicleClass: VehicleType;
  aiCount: number;
  aiDifficulty: AIDifficulty;
  totalLaps: number;
  playerName: string;
  playerColor: string;          // 新增：玩家選擇的顏色代碼
} 

export const DEFAULT_RACE_SETUP: RaceSetup = {
  mode:           RacingMode.RACE,
  vehicleType:    VehicleType.F3,
  vehicleId:      'f3_red',
  aiVehicleClass: VehicleType.F3,
  aiCount:        3,
  aiDifficulty:   AIDifficulty.AMATEUR,
  totalLaps:      3,
  playerName:     'PLAYER',
  playerColor:    'red',
};

const SETUP_STORAGE_KEY = 'guia_race_setup_prefs';

/** 將 RaceSetup 寫入 localStorage */
export function saveRaceSetup(setup: RaceSetup): void {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
  } catch { /* 私密模式或儲存空間滿，不影響遊戲 */ }
}

/** 從 localStorage 讀取上次的 RaceSetup，若無則回傳 DEFAULT_RACE_SETUP */
export function loadRaceSetup(): RaceSetup {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RaceSetup>;
      // 合併：用預設值補齊可能遺漏的欄位（例如未來新增欄位）
      return { ...DEFAULT_RACE_SETUP, ...parsed };
    }
  } catch { /* 解析失敗，直接使用預設 */ }
  return { ...DEFAULT_RACE_SETUP };
}
